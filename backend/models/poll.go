package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Option represents a single voting choice embedded within a Poll.
// Option represents a single voting choice embedded within a Question.
type Option struct {
	ID    primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Text  string             `bson:"text" json:"text"`
	Votes int64              `bson:"votes" json:"votes"`
	Color string             `bson:"color,omitempty" json:"color,omitempty"`
}

// Question represents a single question in a multi-question poll session.
type Question struct {
	ID      primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Title   string             `bson:"title" json:"title"`
	Options []Option           `bson:"options" json:"options"`
}

// VoterRecord stores the identity and choice of an audience member who voted.
type VoterRecord struct {
	Name       string             `bson:"name" json:"name"`
	QuestionID primitive.ObjectID `bson:"question_id,omitempty" json:"question_id,omitempty"`
	OptionID   primitive.ObjectID `bson:"option_id" json:"option_id"`
	VotedAt    time.Time          `bson:"voted_at" json:"voted_at"`
}

// Poll represents the complete live poll session document in MongoDB.
type Poll struct {
	ID         primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	CreatorID  primitive.ObjectID `bson:"creator_id,omitempty" json:"creator_id,omitempty"`
	Title      string             `bson:"title,omitempty" json:"title,omitempty"`
	Questions  []Question         `bson:"questions,omitempty" json:"questions,omitempty"`
	Question   string             `bson:"question,omitempty" json:"question,omitempty"`       // Fallback for single question
	Options    []Option           `bson:"options,omitempty" json:"options,omitempty"`         // Fallback for single question
	Voters     []VoterRecord      `bson:"voters,omitempty" json:"voters,omitempty"`
	VoterNames []string           `bson:"voter_names,omitempty" json:"voter_names,omitempty"`
	Status     string             `bson:"status,omitempty" json:"status,omitempty"`           // "active" | "completed"
	TotalVotes int64              `bson:"-" json:"total_votes"`
	CreatedAt  time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt  time.Time          `bson:"updated_at" json:"updated_at"`
}

// CalculateTotalVotes aggregates the votes across all questions and options.
func (p *Poll) CalculateTotalVotes() {
	var total int64

	// Aggregate from questions array if present
	if len(p.Questions) > 0 {
		for _, q := range p.Questions {
			for _, opt := range q.Options {
				total += opt.Votes
			}
		}
		// If legacy fields are empty, sync from first question for backward compatibility
		if p.Question == "" && len(p.Questions) > 0 {
			p.Question = p.Questions[0].Title
		}
		if len(p.Options) == 0 && len(p.Questions) > 0 {
			p.Options = p.Questions[0].Options
		}
	} else {
		// Legacy single question fallback
		for _, opt := range p.Options {
			total += opt.Votes
		}
		if len(p.Questions) == 0 && p.Question != "" {
			p.Questions = []Question{
				{
					ID:      p.ID,
					Title:   p.Question,
					Options: p.Options,
				},
			}
		}
	}

	p.TotalVotes = total

	// Collect unique voter names if not already populated
	if len(p.VoterNames) == 0 && len(p.Voters) > 0 {
		seen := make(map[string]bool)
		for _, v := range p.Voters {
			if v.Name != "" && !seen[v.Name] {
				seen[v.Name] = true
				p.VoterNames = append(p.VoterNames, v.Name)
			}
		}
	}
}

// CreateOptionInput defines the payload for an option when creating a question.
type CreateOptionInput struct {
	Text  string `json:"text" binding:"required"`
	Color string `json:"color,omitempty"`
}

// CreateQuestionInput defines the payload for a single question in multi-question mode.
type CreateQuestionInput struct {
	Title   string              `json:"title" binding:"required"`
	Options []CreateOptionInput `json:"options" binding:"required"`
}

// CreatePollInput defines the payload received when creating a new poll session.
type CreatePollInput struct {
	Title     string                `json:"title,omitempty"`
	Question  string                `json:"question,omitempty"`       // Optional for single-question fallback
	Options   []CreateOptionInput   `json:"options,omitempty"`        // Optional for single-question fallback
	Questions []CreateQuestionInput `json:"questions,omitempty"`      // Array of questions for multi-question mode
}

// VoteInput defines the payload when casting a vote, including optional question ID and voter name.
type VoteInput struct {
	QuestionID string `json:"question_id,omitempty"`
	OptionID   string `json:"option_id" binding:"required"`
	VoterName  string `json:"voter_name,omitempty"`
}
