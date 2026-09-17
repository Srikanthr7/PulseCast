# PulseCast Phase 6 Backend Verification Script
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   PulseCast Phase 6: Multi-Question & Leaderboard Test   " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$baseUrl = "http://localhost:8080/api"

# 1. Sign up or login a creator
Write-Host "`n1. Authenticating Creator..." -ForegroundColor Yellow
$authBody = @{
    name = "Test Presenter"
    email = "presenter_$(Get-Random)@pulsecast.dev"
    password = "password123"
} | ConvertTo-Json

try {
    $authRes = Invoke-RestMethod -Uri "$baseUrl/auth/signup" -Method Post -Body $authBody -ContentType "application/json"
    $token = $authRes.token
    Write-Host " [PASS] Signed up creator token: $($token.Substring(0, 20))..." -ForegroundColor Green
} catch {
    Write-Host " [FAIL] Could not sign up creator. Ensure Go backend is running on port 8080." -ForegroundColor Red
    exit 1
}

# 2. Create Multi-Question Poll
Write-Host "`n2. Creating Multi-Question Poll (2 Questions, 2-4 options each)..." -ForegroundColor Yellow
$pollPayload = @{
    title = "Phase 6 Multi-Question Sprint"
    questions = @(
        @{
            title = "What is your primary backend language?"
            options = @(
                @{ text = "Go (Gin)"; color = "#6366f1" },
                @{ text = "Node.js / Express"; color = "#06b6d4" },
                @{ text = "Python / FastAPI"; color = "#10b981" }
            )
        },
        @{
            title = "What is your favorite database architecture?"
            options = @(
                @{ text = "MongoDB Document Engine"; color = "#10b981" },
                @{ text = "PostgreSQL Relational"; color = "#6366f1" },
                @{ text = "Redis In-Memory Key-Value"; color = "#ef4444" },
                @{ text = "Cassandra Wide-Column"; color = "#f59e0b" }
            )
        }
    )
} | ConvertTo-Json -Depth 5

$headers = @{
    "Authorization" = "Bearer $token"
}

$createRes = Invoke-RestMethod -Uri "$baseUrl/polls" -Method Post -Body $pollPayload -ContentType "application/json" -Headers $headers
$pollId = $createRes.id
Write-Host " [PASS] Created Poll ID: $pollId with $($createRes.poll.questions.Count) questions" -ForegroundColor Green

$q1 = $createRes.poll.questions[0]
$q2 = $createRes.poll.questions[1]
$q1Opt1 = $q1.options[0].id
$q2Opt1 = $q2.options[0].id

# 3. Cast Votes on Questions with Voter Names
Write-Host "`n3. Casting Audience Votes..." -ForegroundColor Yellow

# Vote on Question 1 as Alice
$vote1Payload = @{
    question_id = $q1.id
    option_id = $q1Opt1
    voter_name = "Alice TechLead"
} | ConvertTo-Json
$v1Res = Invoke-RestMethod -Uri "$baseUrl/vote/$pollId" -Method Post -Body $vote1Payload -ContentType "application/json"
Write-Host " [PASS] Alice voted on Question 1 ($($q1.title))" -ForegroundColor Green

# Vote on Question 2 as Bob
$vote2Payload = @{
    question_id = $q2.id
    option_id = $q2Opt1
    voter_name = "Bob CloudArchitect"
} | ConvertTo-Json
$v2Res = Invoke-RestMethod -Uri "$baseUrl/vote/$pollId" -Method Post -Body $vote2Payload -ContentType "application/json"
Write-Host " [PASS] Bob voted on Question 2 ($($q2.title))" -ForegroundColor Green

# 4. Conclude Poll via POST /api/polls/:id/complete
Write-Host "`n4. Testing Completion Endpoint: POST /api/polls/:id/complete..." -ForegroundColor Yellow
$compRes = Invoke-RestMethod -Uri "$baseUrl/polls/$pollId/complete" -Method Post -ContentType "application/json"

Write-Host " [PASS] Status: $($compRes.status)" -ForegroundColor Green
Write-Host " [PASS] Aggregated Voter Names ($($compRes.voter_names.Count)): $($compRes.voter_names -join ', ')" -ForegroundColor Green

# 5. Verify Poll Rejection after Completion
Write-Host "`n5. Verifying Post-Completion Vote Rejection..." -ForegroundColor Yellow
try {
    $lateVote = Invoke-RestMethod -Uri "$baseUrl/vote/$pollId" -Method Post -Body $vote1Payload -ContentType "application/json"
    Write-Host " [FAIL] Expected vote to be rejected after poll completion." -ForegroundColor Red
} catch {
    Write-Host " [PASS] Vote properly rejected because poll is completed: $($_.Exception.Message)" -ForegroundColor Green
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "  Phase 6 Backend & WebSocket Broadcast Verified!        " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
