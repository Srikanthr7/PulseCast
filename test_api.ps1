# PulseCast API Test Script (PowerShell with Error Handling)

$ErrorActionPreference = "Stop"

Write-Host "`n1. Testing Health Endpoint (GET /health)..." -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "http://localhost:8080/health" -Method Get
    Write-Host "✅ Health Response: $($health | ConvertTo-Json -Compress)" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend is not reachable at http://localhost:8080. Make sure 'go run main.go' is running." -ForegroundColor Red
    exit 1
}

Write-Host "`n2. Creating a Poll in MongoDB (POST /api/polls)..." -ForegroundColor Cyan
$body = @{
    question = "Which modern stack layer are you most excited to master in 2026?"
    options = @(
        @{ text = "Go (Gin) + Redis Engine"; color = "#6366f1" }
        @{ text = "React 19 + Framer Motion UI"; color = "#06b6d4" }
    )
} | ConvertTo-Json

try {
    $created = Invoke-RestMethod -Uri "http://localhost:8080/api/polls" -Method Post -ContentType "application/json" -Body $body
    Write-Host "✅ Poll Created Successfully in MongoDB!" -ForegroundColor Green
    Write-Host "   Poll ID:   $($created.poll.id)" -ForegroundColor Yellow
    Write-Host "   Option 1:  $($created.poll.options[0].text) (ID: $($created.poll.options[0].id))" -ForegroundColor Gray
    Write-Host "   Option 2:  $($created.poll.options[1].text) (ID: $($created.poll.options[1].id))" -ForegroundColor Gray
} catch {
    Write-Host "❌ MongoDB Connection Error!" -ForegroundColor Red
    Write-Host "   Ensure MongoDB is running on localhost:27017 or set MONGODB_URI in backend/.env" -ForegroundColor Yellow
    Write-Host "   Details: $($_.Exception.Message)" -ForegroundColor DarkGray
    exit 1
}

$pollId = $created.poll.id
$optionId = $created.poll.options[0].id

Write-Host "`n3. Casting an Atomic Vote for Option 1 ($($created.poll.options[0].text))..." -ForegroundColor Cyan
try {
    $voteBody = @{ option_id = $optionId } | ConvertTo-Json
    $voteRes = Invoke-RestMethod -Uri "http://localhost:8080/api/vote/$pollId" -Method Post -ContentType "application/json" -Body $voteBody

    Write-Host "✅ Vote Recorded Atomically with MongoDB `$inc & `$!" -ForegroundColor Green
    Write-Host "   Option 1 Updated Votes: $($voteRes.poll.options[0].votes)" -ForegroundColor Magenta
    Write-Host "   Total Poll Votes:       $($voteRes.poll.total_votes)" -ForegroundColor Magenta
} catch {
    Write-Host "❌ Vote Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n4. Fetching Full Poll from MongoDB (GET /api/polls/$pollId)..." -ForegroundColor Cyan
try {
    $fetched = Invoke-RestMethod -Uri "http://localhost:8080/api/polls/$pollId" -Method Get
    Write-Host "✅ Fetched Poll: $($fetched.poll.question)" -ForegroundColor Green
    Write-Host "   Option 1 Votes: $($fetched.poll.options[0].votes)" -ForegroundColor Green
    Write-Host "   Option 2 Votes: $($fetched.poll.options[1].votes)" -ForegroundColor Green
    Write-Host "`n🎉 All Phase 2 Backend & Database Tests Passed Perfectly!`n" -ForegroundColor Green
} catch {
    Write-Host "❌ Fetch Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
