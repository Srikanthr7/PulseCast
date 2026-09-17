package handlers

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/pulsecast/backend/config"
	"github.com/pulsecast/backend/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var defaultColors = []string{"#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"}

// CreatePoll handles POST /api/polls with multi-question support, strict validation & creator attribution.
func CreatePoll(c *gin.Context) {
	var input models.CreatePollInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	var sanitizedQuestions []models.Question

	// Handle multi-question payload
	if len(input.Questions) > 0 {
		for qIdx, qInput := range input.Questions {
			trimmedTitle := strings.TrimSpace(qInput.Title)
			if len(trimmedTitle) < 3 || len(trimmedTitle) > 300 {
				c.JSON(http.StatusBadRequest, gin.H{
					"error": fmt.Sprintf("Question #%d title must be between 3 and 300 characters in length", qIdx+1),
				})
				return
			}

			if len(qInput.Options) < 2 || len(qInput.Options) > 4 {
				c.JSON(http.StatusBadRequest, gin.H{
					"error": fmt.Sprintf("Question #%d must have between 2 and 4 options", qIdx+1),
				})
				return
			}

			seenText := make(map[string]bool)
			var sanitizedOptions []models.Option

			for oIdx, optInput := range qInput.Options {
				trimmedText := strings.TrimSpace(optInput.Text)
				if len(trimmedText) < 1 || len(trimmedText) > 150 {
					c.JSON(http.StatusBadRequest, gin.H{
						"error": fmt.Sprintf("Question #%d, option #%d must have text between 1 and 150 characters", qIdx+1, oIdx+1),
					})
					return
				}

				lowerText := strings.ToLower(trimmedText)
				if seenText[lowerText] {
					c.JSON(http.StatusBadRequest, gin.H{
						"error": fmt.Sprintf("Question #%d has duplicate options", qIdx+1),
					})
					return
				}
				seenText[lowerText] = true

				color := strings.TrimSpace(optInput.Color)
				if color == "" {
					color = defaultColors[oIdx%len(defaultColors)]
				}

				sanitizedOptions = append(sanitizedOptions, models.Option{
					ID:    primitive.NewObjectID(),
					Text:  trimmedText,
					Votes: 0,
					Color: color,
				})
			}

			sanitizedQuestions = append(sanitizedQuestions, models.Question{
				ID:      primitive.NewObjectID(),
				Title:   trimmedTitle,
				Options: sanitizedOptions,
			})
		}
	} else {
		// Legacy single question fallback
		trimmedQuestion := strings.TrimSpace(input.Question)
		if len(trimmedQuestion) < 3 || len(trimmedQuestion) > 300 {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Poll question must be between 3 and 300 characters in length",
			})
			return
		}

		if len(input.Options) < 2 || len(input.Options) > 10 {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "A poll must have between 2 and 10 options",
			})
			return
		}

		seenText := make(map[string]bool)
		var sanitizedOptions []models.Option

		for i, optInput := range input.Options {
			trimmedText := strings.TrimSpace(optInput.Text)
			if len(trimmedText) < 1 || len(trimmedText) > 150 {
				c.JSON(http.StatusBadRequest, gin.H{
					"error": "Each option must have text between 1 and 150 characters",
				})
				return
			}

			lowerText := strings.ToLower(trimmedText)
			if seenText[lowerText] {
				c.JSON(http.StatusBadRequest, gin.H{
					"error": "Duplicate options are not allowed",
				})
				return
			}
			seenText[lowerText] = true

			color := strings.TrimSpace(optInput.Color)
			if color == "" {
				color = defaultColors[i%len(defaultColors)]
			}

			sanitizedOptions = append(sanitizedOptions, models.Option{
				ID:    primitive.NewObjectID(),
				Text:  trimmedText,
				Votes: 0,
				Color: color,
			})
		}

		sanitizedQuestions = append(sanitizedQuestions, models.Question{
			ID:      primitive.NewObjectID(),
			Title:   trimmedQuestion,
			Options: sanitizedOptions,
		})
	}

	// Extract authenticated creator ID from Gin context
	var creatorOID primitive.ObjectID
	if creatorIDVal, exists := c.Get("userID"); exists {
		if creatorIDStr, ok := creatorIDVal.(string); ok {
			creatorOID, _ = primitive.ObjectIDFromHex(creatorIDStr)
		}
	}

	title := strings.TrimSpace(input.Title)
	if title == "" && len(sanitizedQuestions) > 0 {
		title = sanitizedQuestions[0].Title
	}

	now := time.Now().UTC()
	newPoll := models.Poll{
		ID:         primitive.NewObjectID(),
		CreatorID:  creatorOID,
		Title:      title,
		Questions:  sanitizedQuestions,
		Question:   sanitizedQuestions[0].Title,
		Options:    sanitizedQuestions[0].Options,
		Voters:     []models.VoterRecord{},
		VoterNames: []string{},
		Status:     "active",
		CreatedAt:  now,
		UpdatedAt:  now,
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	collection := config.PollsCollection()
	_, err := collection.InsertOne(ctx, newPoll)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to save poll to database",
			"details": err.Error(),
		})
		return
	}

	newPoll.CalculateTotalVotes()
	c.JSON(http.StatusCreated, gin.H{
		"message": "Poll created successfully",
		"id":      newPoll.ID.Hex(),
		"_id":     newPoll.ID.Hex(),
		"poll":    newPoll,
	})
}

// BulkCreatePolls handles POST /api/polls/bulk.
// Enforces a strict maximum limit of 50 questions per request, returning HTTP 413 Payload Too Large if exceeded.
func BulkCreatePolls(c *gin.Context) {
	var input []models.CreatePollInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid JSON array payload for bulk polls. Expected an array of polls.",
			"details": err.Error(),
		})
		return
	}

	// Strict requirement: Enforce a maximum limit of 50 questions per request. Return a 413 Payload Too Large error if exceeded.
	if len(input) > 50 {
		c.JSON(http.StatusRequestEntityTooLarge, gin.H{
			"error": fmt.Sprintf("Payload Too Large: You submitted %d polls. Maximum allowed per request is 50.", len(input)),
			"count": len(input),
			"max":   50,
		})
		return
	}

	if len(input) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "No polls provided in bulk request. At least 1 question is required.",
		})
		return
	}

	// Extract authenticated creator ID from Gin context
	var creatorOID primitive.ObjectID
	if creatorIDVal, exists := c.Get("userID"); exists {
		if creatorIDStr, ok := creatorIDVal.(string); ok {
			creatorOID, _ = primitive.ObjectIDFromHex(creatorIDStr)
		}
	}

	now := time.Now().UTC()
	var newPolls []models.Poll
	var docsToInsert []interface{}
	var createdIDs []string

	for pollIdx, item := range input {
		trimmedQuestion := strings.TrimSpace(item.Question)
		if len(trimmedQuestion) < 5 || len(trimmedQuestion) > 300 {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": fmt.Sprintf("Poll #%d: Question must be between 5 and 300 characters in length", pollIdx+1),
			})
			return
		}

		if len(item.Options) < 2 || len(item.Options) > 10 {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": fmt.Sprintf("Poll #%d: Must have between 2 and 10 options", pollIdx+1),
			})
			return
		}

		seenText := make(map[string]bool)
		var sanitizedOptions []models.Option

		for i, optInput := range item.Options {
			trimmedText := strings.TrimSpace(optInput.Text)
			if len(trimmedText) < 1 || len(trimmedText) > 150 {
				c.JSON(http.StatusBadRequest, gin.H{
					"error": fmt.Sprintf("Poll #%d, Option #%d: Text must be between 1 and 150 characters", pollIdx+1, i+1),
				})
				return
			}

			lowerText := strings.ToLower(trimmedText)
			if seenText[lowerText] {
				c.JSON(http.StatusBadRequest, gin.H{
					"error": fmt.Sprintf("Poll #%d: Duplicate option '%s' is not allowed", pollIdx+1, trimmedText),
				})
				return
			}
			seenText[lowerText] = true

			color := strings.TrimSpace(optInput.Color)
			if color == "" {
				color = defaultColors[i%len(defaultColors)]
			}

			sanitizedOptions = append(sanitizedOptions, models.Option{
				ID:    primitive.NewObjectID(),
				Text:  trimmedText,
				Votes: 0,
				Color: color,
			})
		}

		pollID := primitive.NewObjectID()
		poll := models.Poll{
			ID:        pollID,
			CreatorID: creatorOID,
			Question:  trimmedQuestion,
			Options:   sanitizedOptions,
			Voters:    []models.VoterRecord{},
			Status:    "active",
			CreatedAt: now,
			UpdatedAt: now,
		}
		poll.CalculateTotalVotes()

		newPolls = append(newPolls, poll)
		docsToInsert = append(docsToInsert, poll)
		createdIDs = append(createdIDs, pollID.Hex())
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	collection := config.PollsCollection()
	_, err := collection.InsertMany(ctx, docsToInsert)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to save bulk polls to database",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":       "Bulk polls created successfully",
		"count":         len(newPolls),
		"ids":           createdIDs,
		"first_poll_id": createdIDs[0],
		"polls":         newPolls,
	})
}

// GetMyPolls returns all polls created by the logged-in creator.
func GetMyPolls(c *gin.Context) {
	creatorIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	creatorOID, err := primitive.ObjectIDFromHex(creatorIDVal.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid creator ID"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	collection := config.PollsCollection()
	findOptions := options.Find().SetSort(bson.M{"created_at": -1})
	cursor, err := collection.Find(ctx, bson.M{"creator_id": creatorOID}, findOptions)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch polls"})
		return
	}
	defer cursor.Close(ctx)

	var polls []models.Poll
	if err := cursor.All(ctx, &polls); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode polls"})
		return
	}

	if polls == nil {
		polls = []models.Poll{}
	}

	for i := range polls {
		polls[i].CalculateTotalVotes()
	}

	c.JSON(http.StatusOK, gin.H{
		"polls": polls,
	})
}

// GetPoll handles GET /api/polls/:id in a single database read query.
func GetPoll(c *gin.Context) {
	idParam := strings.TrimSpace(c.Param("id"))
	pollOID, err := primitive.ObjectIDFromHex(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid poll ID format. Must be a 24-character hexadecimal string.",
		})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	collection := config.PollsCollection()
	var poll models.Poll
	err = collection.FindOne(ctx, bson.M{"_id": pollOID}).Decode(&poll)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Poll not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to query database",
			"details": err.Error(),
		})
		return
	}

	poll.CalculateTotalVotes()
	c.JSON(http.StatusOK, gin.H{
		"poll": poll,
	})
}

// VoteOnPoll handles POST /api/vote/:id using atomic $inc, positional array filters,
// and audience voter name capture pushed to MongoDB and broadcast via Redis.
func VoteOnPoll(c *gin.Context) {
	pollIDParam := strings.TrimSpace(c.Param("id"))
	pollOID, err := primitive.ObjectIDFromHex(pollIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid poll ID format",
		})
		return
	}

	var input models.VoteInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid vote payload",
			"details": err.Error(),
		})
		return
	}

	optionOID, err := primitive.ObjectIDFromHex(strings.TrimSpace(input.OptionID))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid option ID format. Must be a 24-character hexadecimal string.",
		})
		return
	}

	voterName := strings.TrimSpace(input.VoterName)
	if voterName == "" {
		voterName = "Audience Member"
	}
	if len(voterName) > 60 {
		voterName = voterName[:60]
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	collection := config.PollsCollection()

	// Check if poll exists and whether it's already completed
	var existingPoll models.Poll
	if err := collection.FindOne(ctx, bson.M{"_id": pollOID}).Decode(&existingPoll); err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"error": "Poll not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to query poll",
			"details": err.Error(),
		})
		return
	}

	if existingPoll.Status == "completed" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "This poll has been concluded by the presenter. The leaderboard is now finalized!",
		})
		return
	}

	now := time.Now().UTC()
	var matchedQuestionID primitive.ObjectID

	// Check if question ID is provided or can be found in questions
	if input.QuestionID != "" {
		if qOID, err := primitive.ObjectIDFromHex(input.QuestionID); err == nil {
			matchedQuestionID = qOID
		}
	}
	if matchedQuestionID.IsZero() {
		for _, q := range existingPoll.Questions {
			for _, opt := range q.Options {
				if opt.ID == optionOID {
					matchedQuestionID = q.ID
					break
				}
			}
			if !matchedQuestionID.IsZero() {
				break
			}
		}
	}

	voterRecord := models.VoterRecord{
		Name:       voterName,
		QuestionID: matchedQuestionID,
		OptionID:   optionOID,
		VotedAt:    now,
	}

	var updatedPoll models.Poll

	// If poll uses multi-question structure
	if len(existingPoll.Questions) > 0 {
		filter := bson.M{"_id": pollOID}
		update := bson.M{
			"$inc":      bson.M{"questions.$[q].options.$[o].votes": 1},
			"$push":     bson.M{"voters": voterRecord},
			"$addToSet": bson.M{"voter_names": voterName},
			"$set":      bson.M{"updated_at": now},
		}

		arrayFilters := options.ArrayFilters{
			Filters: []interface{}{
				bson.M{"q.options._id": optionOID},
				bson.M{"o._id": optionOID},
			},
		}
		opts := options.FindOneAndUpdate().SetArrayFilters(arrayFilters).SetReturnDocument(options.After)
		err = collection.FindOneAndUpdate(ctx, filter, update, opts).Decode(&updatedPoll)
	}

	// Fallback for legacy single-question poll or if arrayFilter didn't match
	if len(existingPoll.Questions) == 0 || err != nil {
		filter := bson.M{
			"_id":         pollOID,
			"options._id": optionOID,
		}
		update := bson.M{
			"$inc":      bson.M{"options.$.votes": 1},
			"$push":     bson.M{"voters": voterRecord},
			"$addToSet": bson.M{"voter_names": voterName},
			"$set":      bson.M{"updated_at": now},
		}
		opts := options.FindOneAndUpdate().SetReturnDocument(options.After)
		err = collection.FindOneAndUpdate(ctx, filter, update, opts).Decode(&updatedPoll)
	}

	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Poll or specified option was not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to atomically record vote",
			"details": err.Error(),
		})
		return
	}

	updatedPoll.CalculateTotalVotes()

	voteEvent := gin.H{
		"type":        "VOTE_UPDATE",
		"action":      "VOTE_UPDATE",
		"poll_id":     pollIDParam,
		"question_id": input.QuestionID,
		"option_id":   input.OptionID,
		"voter_name":  voterName,
		"poll":        updatedPoll,
		"total_votes": updatedPoll.TotalVotes,
		"timestamp":   time.Now().UnixMilli(),
	}

	_ = config.PublishEvent(config.RedisChannelName, voteEvent)

	c.JSON(http.StatusOK, gin.H{
		"message":    "Vote recorded atomically",
		"poll":       updatedPoll,
		"voter_name": voterName,
	})
}

// CompletePoll handles POST /api/polls/:id/complete.
// Marks poll status as "completed" in MongoDB, aggregates all participating voter_names,
// and broadcasts { "action": "POLL_COMPLETED" } over Redis to all connected WebSockets.
func CompletePoll(c *gin.Context) {
	pollIDParam := strings.TrimSpace(c.Param("id"))
	pollOID, err := primitive.ObjectIDFromHex(pollIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid poll ID format"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	collection := config.PollsCollection()
	filter := bson.M{"_id": pollOID}
	update := bson.M{
		"$set": bson.M{
			"status":     "completed",
			"updated_at": time.Now().UTC(),
		},
	}

	opts := options.FindOneAndUpdate().SetReturnDocument(options.After)
	var updatedPoll models.Poll
	err = collection.FindOneAndUpdate(ctx, filter, update, opts).Decode(&updatedPoll)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"error": "Poll not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to complete poll",
			"details": err.Error(),
		})
		return
	}

	updatedPoll.CalculateTotalVotes()

	// Aggregate unique voter_names
	voterNamesSet := make(map[string]bool)
	var voterNames []string

	// From voter_names field
	for _, name := range updatedPoll.VoterNames {
		trimmed := strings.TrimSpace(name)
		if trimmed != "" && !voterNamesSet[trimmed] {
			voterNamesSet[trimmed] = true
			voterNames = append(voterNames, trimmed)
		}
	}
	// From voters array
	for _, v := range updatedPoll.Voters {
		trimmed := strings.TrimSpace(v.Name)
		if trimmed != "" && !voterNamesSet[trimmed] {
			voterNamesSet[trimmed] = true
			voterNames = append(voterNames, trimmed)
		}
	}
	if len(voterNames) == 0 {
		voterNames = []string{}
	}
	updatedPoll.VoterNames = voterNames

	// Broadcast POLL_COMPLETED over Redis to all WebSocket clients
	broadcastMsg := gin.H{
		"action":      "POLL_COMPLETED",
		"type":        "POLL_COMPLETED",
		"poll_id":     pollIDParam,
		"status":      "completed",
		"voter_names": voterNames,
		"poll":        updatedPoll,
		"total_votes": updatedPoll.TotalVotes,
		"timestamp":   time.Now().UnixMilli(),
	}

	_ = config.PublishEvent(config.RedisChannelName, broadcastMsg)

	c.JSON(http.StatusOK, gin.H{
		"message":     "Poll completed successfully",
		"status":      "completed",
		"voter_names": voterNames,
		"poll":        updatedPoll,
	})
}

// UpdatePollStatusInput defines the payload for setting poll completion status.
type UpdatePollStatusInput struct {
	Status string `json:"status" binding:"required"` // "completed" | "active"
}

// UpdatePollStatus handles POST /api/polls/:id/status to conclude a poll or reopen it.
func UpdatePollStatus(c *gin.Context) {
	pollIDParam := strings.TrimSpace(c.Param("id"))
	pollOID, err := primitive.ObjectIDFromHex(pollIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid poll ID format"})
		return
	}

	var input UpdatePollStatusInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid status payload",
			"details": err.Error(),
		})
		return
	}

	status := strings.ToLower(strings.TrimSpace(input.Status))
	if status != "completed" && status != "active" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Status must be 'completed' or 'active'"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	collection := config.PollsCollection()
	filter := bson.M{"_id": pollOID}
	update := bson.M{
		"$set": bson.M{
			"status":     status,
			"updated_at": time.Now().UTC(),
		},
	}

	opts := options.FindOneAndUpdate().SetReturnDocument(options.After)
	var updatedPoll models.Poll
	err = collection.FindOneAndUpdate(ctx, filter, update, opts).Decode(&updatedPoll)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"error": "Poll not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to update poll status",
			"details": err.Error(),
		})
		return
	}

	updatedPoll.CalculateTotalVotes()

	// Aggregate unique voter_names
	voterNamesSet := make(map[string]bool)
	var voterNames []string
	for _, name := range updatedPoll.VoterNames {
		trimmed := strings.TrimSpace(name)
		if trimmed != "" && !voterNamesSet[trimmed] {
			voterNamesSet[trimmed] = true
			voterNames = append(voterNames, trimmed)
		}
	}
	for _, v := range updatedPoll.Voters {
		trimmed := strings.TrimSpace(v.Name)
		if trimmed != "" && !voterNamesSet[trimmed] {
			voterNamesSet[trimmed] = true
			voterNames = append(voterNames, trimmed)
		}
	}
	updatedPoll.VoterNames = voterNames

	// Broadcast status update over Redis to all connected clients (Presentation & Mobile screens)
	statusEvent := gin.H{
		"action":      func() string { if status == "completed" { return "POLL_COMPLETED" } else { return "POLL_RESUMED" } }(),
		"type":        func() string { if status == "completed" { return "POLL_COMPLETED" } else { return "POLL_STATUS_UPDATE" } }(),
		"poll_id":     pollIDParam,
		"status":      status,
		"voter_names": voterNames,
		"poll":        updatedPoll,
		"total_votes": updatedPoll.TotalVotes,
		"timestamp":   time.Now().UnixMilli(),
	}
	_ = config.PublishEvent(config.RedisChannelName, statusEvent)

	c.JSON(http.StatusOK, gin.H{
		"message":     "Poll status updated successfully",
		"status":      status,
		"voter_names": voterNames,
		"poll":        updatedPoll,
	})
}

// GetLocalIP attempts to detect the host machine's local Wi-Fi/LAN IP address.
func GetLocalIP() string {
	conn, err := net.Dial("udp", "8.8.8.8:80")
	if err == nil {
		defer conn.Close()
		localAddr := conn.LocalAddr().(*net.UDPAddr)
		return localAddr.IP.String()
	}

	addrs, err := net.InterfaceAddrs()
	if err == nil {
		for _, address := range addrs {
			if ipnet, ok := address.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
				if ipnet.IP.To4() != nil {
					return ipnet.IP.String()
				}
			}
		}
	}
	return "localhost"
}

// GetNetworkIP handles GET /api/network-ip so the frontend presentation view
// can encode the machine's real LAN IP into the QR code for mobile phone scanning.
func GetNetworkIP(c *gin.Context) {
	ip := GetLocalIP()
	c.JSON(http.StatusOK, gin.H{
		"ip": ip,
	})
}

// DeletePoll handles DELETE /api/polls/:id.
// Permanently removes a finished or active poll session from MongoDB and broadcasts deletion.
func DeletePoll(c *gin.Context) {
	idParam := strings.TrimSpace(c.Param("id"))
	pollOID, err := primitive.ObjectIDFromHex(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid poll ID format. Must be a 24-character hexadecimal string.",
		})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	collection := config.PollsCollection()
	res, err := collection.DeleteOne(ctx, bson.M{"_id": pollOID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to delete poll from database",
			"details": err.Error(),
		})
		return
	}

	if res.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Poll session not found or already deleted",
		})
		return
	}

	// Publish deletion event to Redis so any open clients receive the update
	_ = config.PublishEvent(config.RedisChannelName, gin.H{
		"type":      "POLL_DELETED",
		"action":    "POLL_DELETED",
		"poll_id":   idParam,
		"timestamp": time.Now().UnixMilli(),
	})

	c.JSON(http.StatusOK, gin.H{
		"message": "Poll session deleted successfully",
		"id":      idParam,
	})
}

