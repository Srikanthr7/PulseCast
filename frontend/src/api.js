// PulseCast API & Authentication Client
// Handles authentication tokens, dynamic IP resolution, MongoDB queries, and voting.

export const getHost = () => {
  if (typeof window !== 'undefined' && window.location) {
    return window.location.hostname || 'localhost';
  }
  return 'localhost';
};

// Target Go backend on custom production URL or local host on port 8080
const customApi = import.meta.env?.VITE_API_URL;
const customWs = import.meta.env?.VITE_WS_URL;

export const API_BASE = customApi
  ? customApi.replace(/\/$/, '')
  : (typeof window !== 'undefined'
      ? `http://${getHost()}:8080/api`
      : 'http://localhost:8080/api');

export const WS_URL = customWs
  ? customWs
  : (typeof window !== 'undefined'
      ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${getHost()}:8080/api/ws`
      : 'ws://localhost:8080/api/ws');

// Safe JSON parser helper to prevent crashes on non-JSON responses
async function parseResponse(response, defaultError) {
  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    data = { error: text.trim() || `${defaultError} (${response.status})` };
  }

  if (!response.ok) {
    throw new Error(data.error || data.message || data.details || `${defaultError} (${response.status})`);
  }

  return data;
}

// --- Auth Token Management ---

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('pulsecast_token');
}

export function getUser() {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('pulsecast_user');
  try {
    return user ? JSON.parse(user) : null;
  } catch (e) {
    return null;
  }
}

export function setAuth(token, user) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('pulsecast_token', token);
  localStorage.setItem('pulsecast_user', JSON.stringify(user));
}

export function clearAuth() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('pulsecast_token');
  localStorage.removeItem('pulsecast_user');
}

// --- Creator Auth API ---

/**
 * Registers a new poll creator account.
 */
export async function signup(name, email, password) {
  const response = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });

  const data = await parseResponse(response, 'Failed to create creator account');
  setAuth(data.token, data.user);
  return data;
}

/**
 * Logs in an existing creator and stores the JWT.
 */
export async function login(email, password) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await parseResponse(response, 'Invalid email or password');
  setAuth(data.token, data.user);
  return data;
}

// --- Poll & Voting API ---

/**
 * Creates a new poll in MongoDB.
 * Protected by AuthMiddleware: requires Authorization: Bearer <token>.
 */
export async function createPoll(pollData) {
  const token = getToken();
  if (!token) {
    throw new Error('Authentication required. Please log in to create a poll.');
  }

  const response = await fetch(`${API_BASE}/polls`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(pollData),
  });

  const data = await parseResponse(response, 'Failed to create poll');
  const poll = data.poll || data;
  if (!poll.id && (data.id || data._id)) {
    poll.id = data.id || data._id;
  }
  return poll;
}

/**
 * Bulk creates polls from an array of poll definitions.
 * Protected by AuthMiddleware: requires Authorization: Bearer <token>.
 * Enforces maximum 50 questions per request.
 */
export async function bulkCreatePolls(pollsArray) {
  const token = getToken();
  if (!token) {
    throw new Error('Authentication required. Please log in to upload polls.');
  }

  if (!Array.isArray(pollsArray)) {
    throw new Error('Bulk upload expects a JSON array of polls.');
  }

  if (pollsArray.length === 0) {
    throw new Error('The JSON file contains no polls.');
  }

  if (pollsArray.length > 50) {
    throw new Error(`Payload Too Large: ${pollsArray.length} polls found. Maximum 50 questions allowed per request.`);
  }

  const response = await fetch(`${API_BASE}/polls/bulk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(pollsArray),
  });

  const data = await parseResponse(response, 'Failed to bulk create polls');
  return data;
}

/**
 * Fetches all polls created by the logged-in user.
 */
export async function getMyPolls() {
  const token = getToken();
  if (!token) return [];

  const response = await fetch(`${API_BASE}/polls/my`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await parseResponse(response, 'Failed to fetch your polls');
  return data.polls || [];
}

/**
 * Fetches a poll and its embedded options by ID in a single query.
 */
export async function getPoll(pollId) {
  const response = await fetch(`${API_BASE}/polls/${pollId}`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });

  const data = await parseResponse(response, 'Poll not found');
  return data.poll;
}

/**
 * Submits an audience vote with optional voter name and question ID,
 * saved atomically via MongoDB $inc & $push.
 */
export async function castVote(pollId, optionId, voterName, questionId) {
  const response = await fetch(`${API_BASE}/vote/${pollId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      option_id: optionId,
      question_id: questionId || undefined,
      voter_name: voterName || 'Audience Member',
    }),
  });

  const data = await parseResponse(response, 'Failed to cast vote');
  return data.poll;
}

/**
 * Concludes a poll and transitions it to completed, returning all participating voter names.
 * Emits { "action": "POLL_COMPLETED" } over Redis to all WebSockets.
 */
export async function completePoll(pollId) {
  const response = await fetch(`${API_BASE}/polls/${pollId}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await parseResponse(response, 'Failed to complete poll');
  return data;
}

/**
 * Updates poll status (e.g. 'completed' to conclude and reveal leaderboard, or 'active' to resume).
 */
export async function updatePollStatus(pollId, status) {
  const response = await fetch(`${API_BASE}/polls/${pollId}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });

  const data = await parseResponse(response, 'Failed to update poll status');
  return data.poll;
}

/**
 * Deletes a poll session by ID from MongoDB.
 */
export async function deletePoll(pollId) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}/polls/${pollId}`, {
    method: 'DELETE',
    headers,
  });

  const data = await parseResponse(response, 'Failed to delete poll session');
  return data;
}

/**
 * Fetches the local outbound network IP address from the Go backend,
 * allowing QR codes to encode the real Wi-Fi IP instead of 'localhost'.
 */
export async function getNetworkIP() {
  try {
    const response = await fetch(`${API_BASE}/network-ip`);
    if (response.ok) {
      const data = await response.json();
      return data.ip || 'localhost';
    }
  } catch (e) {
    // ignore
  }
  return 'localhost';
}
