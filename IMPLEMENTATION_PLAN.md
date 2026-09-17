# Implementation Plan - Phase 6: Multi-Question Builder, Fix Completion Button, and Leaderboard

We will evolve PulseCast into a full multi-question live polling platform, implement the dedicated poll completion endpoint with Redis WebSocket broadcasting, and build dynamic Leaderboard & mobile multi-question flows.

## User Review Required

> [!IMPORTANT]
> - **Poll Schema Evolution**: The MongoDB `Poll` document will now embed `questions: []Question`, where each question contains its own `options: []Option`. Full backward compatibility will be maintained so single-question reads still function.
> - **Completion Endpoint**: `POST /api/polls/:id/complete` will mark the poll as `completed`, aggregate all participating `voter_names`, and broadcast `{ "action": "POLL_COMPLETED" }` over Redis/WebSockets.
> - **Presenter View**: Clicking "Complete Poll & Show Leaderboard" calls `POST /api/polls/:id/complete`. Upon receiving `POLL_COMPLETED`, the live chart unmounts and the `Leaderboard` component mounts, displaying the full styled list of participating `voter_names`.
> - **Mobile Flow**: Mobile audience members can vote and navigate across multiple questions using "Next" / "Previous" navigation. When `POLL_COMPLETED` arrives, the mobile voting screen immediately locks and displays *"Thanks for participating!"*.

---

## Proposed Changes

### 1. Go Backend (Gin, MongoDB, Redis)

#### [backend/models/poll.go](file:///d:/PulseCast/backend/models/poll.go)
- Define `Question` struct with `ID`, `Title`, and `Options []Option`.
- Update `Poll` struct:
  - `Questions []Question` bson:"questions" json:"questions"
  - `Status string` bson:"status,omitempty" json:"status,omitempty"` ("active" | "completed")
  - `Voters []VoterRecord` bson:"voters,omitempty" json:"voters,omitempty"`
  - Update `VoterRecord` to optionally include `QuestionID primitive.ObjectID`.
  - Update `CalculateTotalVotes()` to sum votes across all questions and options.
- Update `CreateQuestionInput` and `CreatePollInput` to accept `{ title, questions: [{ title, options: [...] }] }`.
- Update `VoteInput` to accept `{ question_id, option_id, voter_name }`.

#### [backend/handlers/poll_handler.go](file:///d:/PulseCast/backend/handlers/poll_handler.go)
- **`CreatePoll`**:
  - Accepts multiple questions (each with 2 to 4 options).
  - Assigns unique `primitive.NewObjectID()` to each question and option.
  - Sets `Status: "active"`.
- **`CompletePoll` (`POST /api/polls/:id/complete`)**:
  - Updates poll `Status` to `"completed"`.
  - Aggregates all unique `voter_names` from the poll's `voters` array.
  - Publishes `{ "action": "POLL_COMPLETED", "type": "POLL_COMPLETED", "poll_id": id, "poll": updatedPoll, "voter_names": voterNames }` to Redis.
  - Returns `http.StatusOK` with `voter_names` and `poll`.
- **`VoteOnPoll`**:
  - Rejects votes if `poll.Status == "completed"`.
  - Atomically increments vote count on the target question option.
  - Appends voter record to `voters`.

#### [backend/main.go](file:///d:/PulseCast/backend/main.go)
- Register route: `api.POST("/polls/:id/complete", handlers.CompletePoll)`.

---

### 2. React Frontend

#### [frontend/src/api.js](file:///d:/PulseCast/frontend/src/api.js)
- Add `completePoll(pollId)` calling `POST /api/polls/:id/complete`.
- Update `castVote(pollId, optionId, voterName, questionId)` to include `question_id`.

#### [frontend/src/hooks/useLivePoll.js](file:///d:/PulseCast/frontend/src/hooks/useLivePoll.js)
- Listen for `data.action === 'POLL_COMPLETED' || data.type === 'POLL_COMPLETED'`.
- Store `isCompleted` and `voterNames` when received so consumers can react instantly.

#### [frontend/src/pages/CreatorDashboard.jsx](file:///d:/PulseCast/frontend/src/pages/CreatorDashboard.jsx)
- Support multiple questions:
  - Form state: `questions: [{ title, options: [{ text, color }, ...] }]`.
  - Each question has its own title input and 2–4 dynamic choice inputs.
  - "+ Add Question" button to add additional question cards.
  - Delete question button (for questions > 1).
  - Multi-question templates (e.g. Icebreaker + Tech Stack + Feedback).
- Submits `{ questions }` payload to `createPoll` and routes to `/present/:id`.

#### [frontend/src/pages/PresentationView.jsx](file:///d:/PulseCast/frontend/src/pages/PresentationView.jsx)
- Multi-Question Navigation:
  - In Live Mode, allows switching between Question 1, 2, 3... with question tabs / arrows.
- Fix Completion Button:
  - Green button calls `completePoll(id)`.
- Leaderboard Component:
  - When `POLL_COMPLETED` arrives (or `poll.status === 'completed'`), unmounts `LiveChart` and mounts `Leaderboard`.
  - Displays:
    - Ranked winner podium for each question.
    - Prominent styled list of all participating `voter_names`.
    - Confetti celebration.

#### [frontend/src/pages/MobileVotingScreen.jsx](file:///d:/PulseCast/frontend/src/pages/MobileVotingScreen.jsx)
- Multi-Question Flow:
  - Displays "Question X of Y" with a progress bar.
  - Allows navigating through questions via "Next" and "Previous" buttons.
  - Records votes per question with voter name.
- When `POLL_COMPLETED` message arrives:
  - Immediately locks the screen.
  - Displays a clean celebratory **"Thanks for participating!"** screen with their name and badge.

---

## Verification Plan

### Automated Tests
- Run `test_phase6.ps1` PowerShell script testing:
  1. Health check.
  2. Multi-question poll creation (2 questions, each with 3 options).
  3. Voting on Question 1 and Question 2 with voter names ("Alice", "Bob", "Charlie").
  4. Hitting `POST /api/polls/:id/complete`.
  5. Verifying response returns `voter_names: ["Alice", "Bob", "Charlie"]` and `status: "completed"`.
  6. Verifying voting is blocked once completed.

### Manual Testing
1. **Creator Dashboard**:
   - Create 2 questions using "+ Add Question".
   - Click "Create Live Poll & Open QR Code".
2. **Mobile Voting Screen**:
   - Join with name "Alex", vote on Question 1, click "Next", vote on Question 2.
3. **Presenter View**:
   - Switch between Question 1 and 2 live bars.
   - Click "Complete Poll & Show Leaderboard".
   - Observe LiveChart unmounts and Leaderboard mounts with voter names displayed.
   - Observe mobile screen immediately locks and displays "Thanks for participating!".
