package config

import (
	"context"
	"crypto/tls"
	"encoding/json"
	"log"
	"os"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
)

var (
	// RedisClient is the active Redis client instance.
	RedisClient *redis.Client
	// RedisConnected flags whether Redis is currently available.
	RedisConnected bool
)

// RedisChannelName is the primary pub/sub channel for live poll events.
const RedisChannelName = "live_poll_updates"

// InitRedis initializes and tests the Redis connection with support for URL or host:port.
func InitRedis() *redis.Client {
	ctx, cancel := context.WithTimeout(context.Background(), 8*time.Second)
	defer cancel()

	redisURL := strings.TrimSpace(os.Getenv("REDIS_URL"))
	var opt *redis.Options

	if redisURL != "" {
		parsedOpt, err := redis.ParseURL(redisURL)
		if err != nil {
			log.Printf("⚠️ Invalid REDIS_URL format (%v), falling back to REDIS_ADDR", err)
		} else {
			opt = parsedOpt
		}
	}

	if opt == nil {
		addr := strings.TrimSpace(os.Getenv("REDIS_ADDR"))
		if addr == "" {
			addr = "localhost:6379"
		}
		password := os.Getenv("REDIS_PASSWORD")

		opt = &redis.Options{
			Addr:     addr,
			Password: password,
			DB:       0,
		}

		// If Upstash cloud endpoint is used via REDIS_ADDR, enable TLS automatically
		if strings.Contains(addr, "upstash.io") {
			opt.TLSConfig = &tls.Config{
				MinVersion: tls.VersionTLS12,
			}
		}
	}

	client := redis.NewClient(opt)

	// Test ping
	pong, err := client.Ping(ctx).Result()
	if err != nil {
		log.Printf("⚠️ Redis ping failed (%v). Ensure Redis is reachable at %s", err, opt.Addr)
		RedisConnected = false
	} else {
		log.Printf("✅ Redis connected successfully (%s) at %s", pong, opt.Addr)
		RedisConnected = true
	}

	RedisClient = client
	return client
}

// PublishEvent serializes any data structure to JSON and publishes it to the specified Redis channel.
func PublishEvent(channel string, payload interface{}) error {
	if RedisClient == nil {
		return nil
	}

	jsonBytes, err := json.Marshal(payload)
	if err != nil {
		log.Printf("Error marshaling Redis payload: %v", err)
		return err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	err = RedisClient.Publish(ctx, channel, jsonBytes).Err()
	if err != nil {
		log.Printf("Error publishing to Redis channel '%s': %v", channel, err)
		return err
	}

	return nil
}

// CloseRedis cleanly closes the Redis connection on shutdown.
func CloseRedis() {
	if RedisClient != nil {
		if err := RedisClient.Close(); err != nil {
			log.Printf("Error closing Redis: %v", err)
		} else {
			log.Println("Redis connection closed cleanly.")
		}
	}
}
