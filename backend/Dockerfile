# --- Stage 1: Build Go Binary ---
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Install git and build essentials
RUN apk add --no-cache git ca-certificates

# Copy module files and download dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build statically compiled binary
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o pulsecast-backend main.go

# --- Stage 2: Minimal Runtime Image ---
FROM alpine:3.20

WORKDIR /app

# Install CA certificates for TLS connections (MongoDB Atlas & Upstash Redis)
RUN apk --no-cache add ca-certificates tzdata

# Copy compiled binary from builder
COPY --from=builder /app/pulsecast-backend /app/pulsecast-backend

# Expose server port (defaults to 8080 or PORT env var)
EXPOSE 8080

# Run application
CMD ["/app/pulsecast-backend"]
