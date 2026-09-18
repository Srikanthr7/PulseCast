import { useState, useEffect, useRef, useCallback } from 'react';
import { getPoll, WS_URL } from '../api';

/**
 * Custom React hook that fetches the initial poll from Go/MongoDB
 * and subscribes to real-time live vote broadcasts via WebSocket (driven by Redis).
 * Includes exponential backoff for reconnection resilience.
 */
export function useLivePoll(pollId) {
  const [poll, setPoll] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [voterNames, setVoterNames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const retryCountRef = useRef(0);
  const isMountedRef = useRef(true);

  // 1. Initial Data Fetch via HTTP GET /api/polls/:id
  const fetchInitialPoll = useCallback(async () => {
    if (!pollId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getPoll(pollId);
      if (isMountedRef.current && data) {
        setPoll(data);
        setIsCompleted(data.status === 'completed');
        if (data.voter_names && Array.isArray(data.voter_names)) {
          setVoterNames(data.voter_names);
        } else if (data.voters && Array.isArray(data.voters)) {
          const names = Array.from(new Set(data.voters.map(v => v.name).filter(Boolean)));
          setVoterNames(names);
        }
      }
    } catch (err) {
      if (isMountedRef.current) {
        console.error('Failed to load poll:', err);
        setError(err.message || 'Could not load poll');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [pollId]);

  useEffect(() => {
    fetchInitialPoll();
  }, [fetchInitialPoll]);

  // 2. WebSocket Connection with Exponential Backoff Resilience
  const connectWebSocket = useCallback(() => {
    if (!pollId) return;

    // Clean up existing socket if any
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (e) {
        // ignore
      }
    }

    try {
      const socket = new WebSocket(WS_URL);
      wsRef.current = socket;

      socket.onopen = () => {
        if (!isMountedRef.current) return;
        console.log(`WebSocket connected to ${WS_URL}`);
        setIsConnected(true);
        retryCountRef.current = 0; // Reset exponential backoff on successful connection
      };

      socket.onmessage = (event) => {
        if (!isMountedRef.current) return;
        try {
          const data = JSON.parse(event.data);
          const action = data.action || data.type;

          // Check if event targets this poll or is global broadcast
          const isTargetPoll = !pollId || data.poll_id === pollId || (data.poll && (data.poll.id === pollId || data.poll._id === pollId));

          if (isTargetPoll) {
            console.log('Realtime poll event received via WebSocket/Redis:', action, data);

            if (action === 'POLL_DELETED') {
              setPoll(null);
              setError('This poll session has been deleted by the creator.');
              return;
            }

            if (data.poll) {
              setPoll(data.poll);
            }

            if (action === 'POLL_COMPLETED' || data.status === 'completed' || (data.poll && data.poll.status === 'completed')) {
              setIsCompleted(true);
            } else if (action === 'POLL_RESUMED' || data.status === 'active' || (data.poll && data.poll.status === 'active')) {
              setIsCompleted(false);
            }

            if (data.voter_names && Array.isArray(data.voter_names)) {
              setVoterNames(data.voter_names);
            } else if (data.poll && data.poll.voter_names) {
              setVoterNames(data.poll.voter_names);
            }
          }
        } catch (e) {
          console.warn('Non-JSON WebSocket message received:', event.data);
        }
      };

      socket.onerror = (err) => {
        console.warn('WebSocket connection error:', err);
      };

      socket.onclose = (event) => {
        if (!isMountedRef.current) return;
        setIsConnected(false);

        // Exponential backoff calculation: 1s, 2s, 4s, 8s... capped at 20s
        const delay = Math.min(1000 * Math.pow(1.5, retryCountRef.current), 20000);
        retryCountRef.current += 1;

        console.log(`WebSocket disconnected (code: ${event.code}). Reconnecting in ${(delay / 1000).toFixed(1)}s (attempt ${retryCountRef.current})...`);

        reconnectTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            connectWebSocket();
          }
        }, delay);
      };
    } catch (err) {
      console.error('Failed to create WebSocket instance:', err);
    }
  }, [pollId]);

  useEffect(() => {
    isMountedRef.current = true;
    connectWebSocket();

    // Re-sync immediately when page becomes visible or regains focus (e.g. participant unlocks phone or switches tabs)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isMountedRef.current && pollId) {
        fetchInitialPoll();
        // If socket is disconnected, try reconnecting immediately
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          connectWebSocket();
        }
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      isMountedRef.current = false;
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectWebSocket, fetchInitialPoll, pollId]);

  // 3. Periodic Background Reconciliation Polling
  // Ensures updates never lag even if WebSocket packets are throttled by mobile OS power-saving
  useEffect(() => {
    if (!pollId || isCompleted) return;

    const pollIntervalMs = isConnected ? 3000 : 1500;
    const interval = setInterval(async () => {
      try {
        const data = await getPoll(pollId);
        if (isMountedRef.current && data) {
          setPoll(data);
          if (data.status === 'completed') {
            setIsCompleted(true);
          } else if (data.status === 'active') {
            setIsCompleted(false);
          }
          if (data.voter_names && Array.isArray(data.voter_names)) {
            setVoterNames(data.voter_names);
          }
        }
      } catch (e) {
        // quiet fallback
      }
    }, pollIntervalMs);

    return () => clearInterval(interval);
  }, [pollId, isCompleted, isConnected]);

  return {
    poll,
    setPoll,
    isCompleted,
    setIsCompleted,
    voterNames,
    loading,
    error,
    isConnected,
    refetch: fetchInitialPoll,
  };
}
