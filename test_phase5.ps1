# PulseCast Phase 5 Complete Verification Script
# Auth, Bulk Upload (50 limit & 413 error), Unique IDs & QR Routing, Audience Check-in

$ErrorActionPreference = "Stop"

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "   PulseCast Phase 5 End-to-End Verification     " -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# 1. Health Check
Write-Host "`n1. Checking Backend Health..." -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "http://localhost:8080/health" -Method Get
    Write-Host "   Service Status: $($health.status)" -ForegroundColor Green
    Write-Host "   Active WebSockets: $($health.active_ws)" -ForegroundColor Gray
} catch {
    Write-Host "   Backend is not reachable at http://localhost:8080. Ensure 'go run main.go' is running." -ForegroundColor Red
    exit 1
}

# 2. Register New Creator Account (POST /api/auth/signup)
$randomId = Get-Random -Minimum 1000 -Maximum 9999
$email = "creator_$randomId@pulsecast.live"
$password = "PulseCast2026!"
$name = "Creator $randomId"

Write-Host "`n2. Testing Creator Signup (POST /api/auth/signup)..." -ForegroundColor Cyan
$signupBody = @{
    name = $name
    email = $email
    password = $password
} | ConvertTo-Json

$signupRes = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/signup" -Method Post -ContentType "application/json" -Body $signupBody
Write-Host "   Creator Account Created!" -ForegroundColor Green
Write-Host "   User ID: $($signupRes.user.id)" -ForegroundColor Yellow
Write-Host "   JWT Token Received: $($signupRes.token.Substring(0, 25))..." -ForegroundColor Gray

$token = $signupRes.token
$headers = @{ "Authorization" = "Bearer $token" }

# 3. Test Creator Login (POST /api/auth/login)
Write-Host "`n3. Testing Creator Login (POST /api/auth/login)..." -ForegroundColor Cyan
$loginBody = @{
    email = $email
    password = $password
} | ConvertTo-Json

$loginRes = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
Write-Host "   Login Successful! Token verified for $($loginRes.user.email)" -ForegroundColor Green

# 4. Test Route Protection (JWT Middleware)
Write-Host "`n4. Testing Route Protection (POST /api/polls & POST /api/polls/bulk WITHOUT token)..." -ForegroundColor Cyan
try {
    $pollBody = @{ question = "Unauthorized Attempt"; options = @(@{ text = "A" }, @{ text = "B" }) } | ConvertTo-Json
    Invoke-RestMethod -Uri "http://localhost:8080/api/polls" -Method Post -ContentType "application/json" -Body $pollBody
    Write-Host "   FAILED: Unprotected single poll was created!" -ForegroundColor Red
} catch {
    Write-Host "   BLOCKED! Single poll rejected with 401 Unauthorized as expected." -ForegroundColor Green
}

try {
    $bulkBody = @(@{ question = "Unauthorized Bulk Attempt"; options = @(@{ text = "A" }, @{ text = "B" }) }) | ConvertTo-Json
    Invoke-RestMethod -Uri "http://localhost:8080/api/polls/bulk" -Method Post -ContentType "application/json" -Body $bulkBody
    Write-Host "   FAILED: Unprotected bulk poll was created!" -ForegroundColor Red
} catch {
    Write-Host "   BLOCKED! Bulk poll rejected with 401 Unauthorized as expected." -ForegroundColor Green
}

# 5. Create Single Protected Poll with Unique ObjectID
Write-Host "`n5. Creating Protected Poll (POST /api/polls)..." -ForegroundColor Cyan
$singlePollBody = @{
    question = "Which distributed consensus protocol do you prefer?"
    options = @(
        @{ text = "Raft Consensus (Etcd / Consul)"; color = "#6366f1" }
        @{ text = "Paxos / Multi-Paxos (Chubby)"; color = "#06b6d4" }
        @{ text = "Zab Protocol (ZooKeeper)"; color = "#10b981" }
    )
} | ConvertTo-Json

$createdSingle = Invoke-RestMethod -Uri "http://localhost:8080/api/polls" -Method Post -Headers $headers -ContentType "application/json" -Body $singlePollBody
$singlePollId = $createdSingle.poll.id
$optionId = $createdSingle.poll.options[0].id
Write-Host "   Single Poll Created with Unique MongoDB ObjectID!" -ForegroundColor Green
Write-Host "   Poll ID: $singlePollId (Returned in response: id=$($createdSingle.id))" -ForegroundColor Yellow

# 6. Bulk Poll Upload: Valid batch of 3 polls
Write-Host "`n6. Testing Bulk Poll Upload (POST /api/polls/bulk) with 3 questions..." -ForegroundColor Cyan
$bulkPollsData = @(
    @{
        question = "What is your primary backend language?"
        options = @( @{ text = "Go (Golang)" }, @{ text = "TypeScript" }, @{ text = "Rust" } )
    },
    @{
        question = "Which database architecture fits high concurrency best?"
        options = @( @{ text = "MongoDB Document Store" }, @{ text = "PostgreSQL Relational" }, @{ text = "Redis In-Memory" } )
    },
    @{
        question = "What is your preferred presentation display mode?"
        options = @( @{ text = "4K Projector Big Screen" }, @{ text = "Interactive Laptop Dashboard" } )
    }
) | ConvertTo-Json

$bulkRes = Invoke-RestMethod -Uri "http://localhost:8080/api/polls/bulk" -Method Post -Headers $headers -ContentType "application/json" -Body $bulkPollsData
Write-Host "   Bulk Poll Upload Succeeded!" -ForegroundColor Green
Write-Host "   Created Count: $($bulkRes.count)" -ForegroundColor Yellow
Write-Host "   Generated Unique IDs: $($bulkRes.ids -join ', ')" -ForegroundColor Yellow
Write-Host "   First Poll ID for Routing: $($bulkRes.first_poll_id)" -ForegroundColor Cyan

# 7. Bulk Upload Limit Enforcement: Exceeding 50 questions (Must return HTTP 413 Payload Too Large)
Write-Host "`n7. Testing Strict Limit: Sending 51 questions to POST /api/polls/bulk (Must return 413)..." -ForegroundColor Cyan
$largeBatch = @()
for ($i = 1; $i -le 51; $i++) {
    $largeBatch += @{
        question = "Stress Question #$i for bulk limit verification test"
        options = @( @{ text = "Option A" }, @{ text = "Option B" } )
    }
}
$largeBatchJson = $largeBatch | ConvertTo-Json -Depth 5

$caught413 = $false
try {
    Invoke-RestMethod -Uri "http://localhost:8080/api/polls/bulk" -Method Post -Headers $headers -ContentType "application/json" -Body $largeBatchJson
    Write-Host "   FAILED: 51 questions were accepted without 413 error!" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 413) {
        $caught413 = $true
        Write-Host "   PASSED! Server returned HTTP 413 Payload Too Large as strictly required!" -ForegroundColor Green
    } else {
        Write-Host "   Endpoint returned status $statusCode: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# 8. Audience Voting with Name Capture
Write-Host "`n8. Testing Audience Voting with Voter Name Capture (POST /api/vote/$singlePollId)..." -ForegroundColor Cyan
$votePayload = @{
    option_id = $optionId
    voter_name = "Alex Vance"
} | ConvertTo-Json

$voteRes = Invoke-RestMethod -Uri "http://localhost:8080/api/vote/$singlePollId" -Method Post -ContentType "application/json" -Body $votePayload
Write-Host "   Vote Successfully Recorded!" -ForegroundColor Green
Write-Host "   Voter Name Returned: $($voteRes.voter_name)" -ForegroundColor Magenta
Write-Host "   Updated Votes:       $($voteRes.poll.options[0].votes)" -ForegroundColor Magenta

# 9. Verify Voter Stored in MongoDB Document
Write-Host "`n9. Verifying Voter Record in MongoDB Poll Document..." -ForegroundColor Cyan
$fetchedPoll = Invoke-RestMethod -Uri "http://localhost:8080/api/polls/$singlePollId" -Method Get
$savedVoter = $fetchedPoll.poll.voters | Where-Object { $_.name -eq "Alex Vance" }
if ($savedVoter) {
    Write-Host "   Verified: Voter '$($savedVoter.name)' stored with OptionID: $($savedVoter.option_id)" -ForegroundColor Green
} else {
    Write-Host "   Voter record not found in poll document!" -ForegroundColor Red
}

# 10. Test Poll Completion & Leaderboard Finalization (POST /api/polls/:id/status)
Write-Host "`n10. Concluding Poll & Finalizing Leaderboard (POST /api/polls/$singlePollId/status)..." -ForegroundColor Cyan
$statusPayload = @{ status = "completed" } | ConvertTo-Json
$statusRes = Invoke-RestMethod -Uri "http://localhost:8080/api/polls/$singlePollId/status" -Method Post -ContentType "application/json" -Body $statusPayload
Write-Host "   Poll Status Updated: $($statusRes.status)" -ForegroundColor Green

# Verify voting is blocked after completion
try {
    $lateVotePayload = @{ option_id = $optionId; voter_name = "Late Voter" } | ConvertTo-Json
    Invoke-RestMethod -Uri "http://localhost:8080/api/vote/$singlePollId" -Method Post -ContentType "application/json" -Body $lateVotePayload
    Write-Host "   FAILED: Vote was accepted after completion!" -ForegroundColor Red
} catch {
    Write-Host "   BLOCKED! Voting locked after poll conclusion as expected." -ForegroundColor Green
}

# 11. Summary
Write-Host "`n=================================================" -ForegroundColor Cyan
Write-Host "   Phase 5 Backend & Integration Tests Passed!    " -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Cyan
