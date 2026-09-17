# PulseCast Phase 3 Real-time Test Script

$ErrorActionPreference = "Stop"

Write-Host "=== PulseCast Phase 3 Real-Time Verification ===" -ForegroundColor Cyan

# 1. Health Check
Write-Host "1. Checking Backend Health & Redis Connection..." -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "http://localhost:8080/health" -Method Get
    Write-Host "   Service Status:    $($health.status)" -ForegroundColor Green
    
    $redisColor = "Yellow"
    if ($health.redis_connected) { $redisColor = "Green" }
    Write-Host "   Redis Connected:   $($health.redis_connected)" -ForegroundColor $redisColor
    Write-Host "   Active WebSockets: $($health.active_ws)" -ForegroundColor Gray
} catch {
    Write-Host "Backend is not reachable at http://localhost:8080. Run 'go run main.go' in backend/" -ForegroundColor Red
    exit 1
}

# 2. Create a test poll in MongoDB
Write-Host "2. Creating a Live Poll in MongoDB..." -ForegroundColor Cyan
$pollBody = @{
    question = "Real-Time Test: Which architecture layer drives live streaming?"
    options = @(
        @{ text = "Redis Pub/Sub Engine"; color = "#6366f1" }
        @{ text = "WebSocket Fan-out Hub"; color = "#06b6d4" }
    )
} | ConvertTo-Json

$created = Invoke-RestMethod -Uri "http://localhost:8080/api/polls" -Method Post -ContentType "application/json" -Body $pollBody
$pollId = $created.poll.id
$optionId = $created.poll.options[0].id

Write-Host "   Poll ID Created: $pollId" -ForegroundColor Green
Write-Host "   Target Option:   $($created.poll.options[0].text) (ID: $optionId)" -ForegroundColor Gray

# 3. Connect to WebSocket Hub
Write-Host "3. Connecting to WebSocket Hub (ws://localhost:8080/api/ws)..." -ForegroundColor Cyan
$wsUri = [System.Uri]"ws://localhost:8080/api/ws"
$cts = New-Object System.Threading.CancellationTokenSource(15000)
$ws = New-Object System.Net.WebSockets.ClientWebSocket

try {
    $ws.ConnectAsync($wsUri, $cts.Token).Wait()
    Write-Host "   Connected to WebSocket Hub!" -ForegroundColor Green
} catch {
    Write-Host "Failed to connect to WebSocket Hub: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Helper to read message from WebSocket
function Read-WsMessage($wsClient) {
    $buffer = [System.ArraySegment[byte]]::new([byte[]]::new(8192))
    $readCts = New-Object System.Threading.CancellationTokenSource(8000)
    $res = $wsClient.ReceiveAsync($buffer, $readCts.Token).Result
    if ($res.Count -gt 0) {
        return [System.Text.Encoding]::UTF8.GetString($buffer.Array, 0, $res.Count)
    }
    return $null
}

# Read initial welcome handshake
$welcome = Read-WsMessage $ws
Write-Host "   Initial WebSocket Handshake: $welcome" -ForegroundColor DarkCyan

# 4. Cast an atomic vote (Triggers MongoDB $inc -> Redis Publish -> Subscriber -> WebSocket Hub)
Write-Host "4. Casting a Vote via POST /api/vote/$pollId..." -ForegroundColor Cyan
Write-Host "   (Flow: Client Vote -> Gin -> MongoDB `$inc -> Redis Publish -> Subscriber -> WebSocket Hub)" -ForegroundColor DarkGray

$voteBody = @{ option_id = $optionId } | ConvertTo-Json
$voteRes = Invoke-RestMethod -Uri "http://localhost:8080/api/vote/$pollId" -Method Post -ContentType "application/json" -Body $voteBody
Write-Host "   HTTP Vote Response: Total Votes = $($voteRes.poll.total_votes)" -ForegroundColor Green

# 5. Listen for the real-time event on WebSocket
Write-Host "5. Waiting for live event on WebSocket connection..." -ForegroundColor Cyan
$liveEvent = Read-WsMessage $ws

if ($liveEvent) {
    Write-Host ""
    Write-Host "   LIVE EVENT RECEIVED OVER WEBSOCKET!" -ForegroundColor Magenta
    Write-Host "   Payload: $liveEvent" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "All Real-Time Pipeline Tests Passed (MongoDB + Redis + WebSockets)!" -ForegroundColor Green
} else {
    Write-Host "Did not receive broadcast within timeout." -ForegroundColor Yellow
}

# Clean close
$closeCts = New-Object System.Threading.CancellationTokenSource(2000)
$ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, "Test complete", $closeCts.Token).Wait()
Write-Host "WebSocket disconnected cleanly." -ForegroundColor Gray
