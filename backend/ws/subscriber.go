package ws

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/pulsecast/backend/config"
)

// StartRedisSubscriber starts a background Goroutine that listens to the Redis
// live_poll_updates channel and immediately broadcasts incoming events to all
// active WebSocket clients via the GlobalHub.
func StartRedisSubscriber(ctx context.Context) {
	go func() {
		log.Printf("📡 Redis Subscriber Goroutine started for channel: '%s'", config.RedisChannelName)

		for {
			select {
			case <-ctx.Done():
				log.Println("Redis Subscriber stopped.")
				return
			default:
				if config.RedisClient == nil {
					time.Sleep(2 * time.Second)
					continue
				}

				pubsub := config.RedisClient.Subscribe(ctx, config.RedisChannelName)

				// Verify subscription
				_, err := pubsub.Receive(ctx)
				if err != nil {
					log.Printf("⚠️ Could not subscribe to Redis channel '%s' (%v). Retrying in 3s...", config.RedisChannelName, err)
					_ = pubsub.Close()
					time.Sleep(3 * time.Second)
					continue
				}

				log.Printf("✅ Actively listening for live vote events on Redis channel: '%s'", config.RedisChannelName)

				ch := pubsub.Channel()
				for msg := range ch {
					// Check if message originated from this instance; if so, skip to avoid double-broadcast
					var eventMap map[string]interface{}
					if err := json.Unmarshal([]byte(msg.Payload), &eventMap); err == nil {
						if sender, ok := eventMap["sender_instance"].(string); ok && sender == InstanceID {
							continue
						}
					}
					// Broadcast exact message from Redis to every connected WebSocket client
					GlobalHub.Broadcast([]byte(msg.Payload))
				}

				// If channel closed, close pubsub handle and retry
				_ = pubsub.Close()
				time.Sleep(1 * time.Second)
			}
		}
	}()
}
