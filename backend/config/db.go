package config

import (
	"context"
	"log"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/mongo/readpref"
)

var (
	// MongoClient is the active MongoDB client instance.
	MongoClient *mongo.Client
	// DB is the selected database instance.
	DB *mongo.Database
)

// ConnectDB establishes a connection to MongoDB with timeout and ping checks.
func ConnectDB() *mongo.Database {
	mongoURI := os.Getenv("MONGODB_URI")
	if mongoURI == "" {
		mongoURI = "mongodb://localhost:27017"
	}

	dbName := os.Getenv("DB_NAME")
	if dbName == "" {
		dbName = "pulsecast"
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	clientOptions := options.Client().ApplyURI(mongoURI)
	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		log.Fatalf("❌ Failed to connect to MongoDB: %v", err)
	}

	// Ping database to verify connection
	if err := client.Ping(ctx, readpref.Primary()); err != nil {
		log.Printf("⚠️ Warning: MongoDB ping failed (%v). Ensure MongoDB is running at %s", err, mongoURI)
	} else {
		log.Printf("✅ MongoDB connected successfully to database: %s", dbName)
	}

	MongoClient = client
	DB = client.Database(dbName)
	return DB
}

// GetCollection returns a handle to a MongoDB collection.
func GetCollection(collectionName string) *mongo.Collection {
	if DB == nil {
		ConnectDB()
	}
	return DB.Collection(collectionName)
}

// PollsCollection returns the collection handle for polls.
func PollsCollection() *mongo.Collection {
	return GetCollection("polls")
}

// UsersCollection returns the collection handle for creators.
func UsersCollection() *mongo.Collection {
	return GetCollection("users")
}

// CloseDB cleanly disconnects from MongoDB upon shutdown.
func CloseDB() {
	if MongoClient != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := MongoClient.Disconnect(ctx); err != nil {
			log.Printf("Error disconnecting MongoDB: %v", err)
		} else {
			log.Println("MongoDB connection closed cleanly.")
		}
	}
}
