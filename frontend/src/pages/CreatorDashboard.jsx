import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Sparkles,
  ArrowRight,
  Play,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogOut,
  ShieldCheck,
  User,
  ListOrdered,
  RotateCcw,
  Rocket,
  Target,
  Zap,
  Coffee,
  Smartphone,
  Layers,
  Copy,
} from 'lucide-react';
import { createPoll, login, signup, googleAuth, getUser, getToken, clearAuth, getMyPolls, deletePoll } from '../api';
import { useDeviceType } from '../hooks/useDeviceType';
import LandingInfo from '../components/LandingInfo';

const PALETTE = ['#2B2B2B', '#2563EB', '#DC2626', '#555555'];

const MULTI_QUESTION_TEMPLATES = [
  {
    name: 'Tech Sprint Poll (2 Questions)',
    title: 'PulseCast Tech Sprint 2026',
    icon: Rocket,
    questions: [
      {
        title: 'Which modern tech stack layer are you most excited to master in 2026?',
        options: [
          { text: 'Go (Gin) + Redis Engine', color: '#2B2B2B' },
          { text: 'React + Framer Motion UI', color: '#2563EB' },
          { text: 'MongoDB Document Aggregation', color: '#DC2626' },
          { text: 'WebSockets Real-time Streaming', color: '#555555' },
        ],
      },
      {
        title: 'How do you prefer collaborating on distributed systems?',
        options: [
          { text: 'Pair programming & real-time sessions', color: '#2B2B2B' },
          { text: 'Async brainstorms & thorough RFCs', color: '#2563EB' },
          { text: 'Deep uninterrupted solo focus', color: '#DC2626' },
        ],
      },
    ],
  },
  {
    name: 'Team Retrospective (2 Questions)',
    title: 'Sprint Retrospective & Health Check',
    icon: Target,
    questions: [
      {
        title: 'How confident are you in our current release pipeline?',
        options: [
          { text: '100% Solid - Zero concerns', color: '#2563EB' },
          { text: 'Good - Minor bottlenecks', color: '#2B2B2B' },
          { text: 'Needs Improvement', color: '#DC2626' },
          { text: 'High Risk - Needs urgent fix', color: '#555555' },
        ],
      },
      {
        title: "What should be our team's primary focus for next sprint?",
        options: [
          { text: 'Frontend UX polish & micro-animations', color: '#2B2B2B' },
          { text: 'Backend latency & database indexing', color: '#2563EB' },
          { text: 'Automated end-to-end test coverage', color: '#DC2626' },
        ],
      },
    ],
  },
  {
    name: 'Architecture Pulse (1 Question)',
    title: 'Architecture Decision Poll',
    icon: Zap,
    questions: [
      {
        title: 'Do you approve migrating to Redis Pub/Sub for live presentation syncing?',
        options: [
          { text: 'Yes, absolutely approved', color: '#2563EB' },
          { text: 'No, needs further architectural review', color: '#DC2626' },
          { text: 'Undecided / Need more benchmarks', color: '#2B2B2B' },
        ],
      },
    ],
  },
  {
    name: 'Team Standup Check (2 Questions)',
    title: 'Daily Standup Pulse',
    icon: Coffee,
    questions: [
      {
        title: "What is your energy level heading into today's sprint?",
        options: [
          { text: 'Fully Charged & Ready', color: '#2563EB' },
          { text: 'Steady & Focused', color: '#2B2B2B' },
          { text: 'Need more coffee first', color: '#DC2626' },
        ],
      },
      {
        title: 'What would make today a massive win for you?',
        options: [
          { text: 'Zero bugs on initial release', color: '#2563EB' },
          { text: 'Merging my core pull request', color: '#2B2B2B' },
          { text: 'Learning something completely new', color: '#DC2626' },
        ],
      },
    ],
  },
];

export default function CreatorDashboard() {
  const navigate = useNavigate();

  // Auth State
  const [currentUser, setCurrentUser] = useState(() => getUser());
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [joinSessionInput, setJoinSessionInput] = useState('');

  const { isMobile } = useDeviceType();
  const [mobileTab, setMobileTab] = useState('builder'); // 'builder' | 'sessions' | 'join'

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Handle Google OAuth ID token response
  const handleGoogleSuccess = async (response) => {
    if (!response || !response.credential) {
      setAuthError('Google sign in did not return valid credentials. Please try again.');
      return;
    }
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await googleAuth(response.credential);
      setCurrentUser(res.user);
      loadMyPolls();
    } catch (err) {
      console.error('Google auth error:', err);
      setAuthError(err.message || 'Google authentication failed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Initialize Google Identity Services (GIS)
  useEffect(() => {
    if (currentUser) return;

    let intervalId = null;
    const renderGoogleBtn = () => {
      if (window.google?.accounts?.id && googleClientId) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleSuccess,
            auto_select: false,
          });

          const btnEl = document.getElementById('google-signin-btn-container');
          if (btnEl) {
            btnEl.innerHTML = '';
            const containerWidth = btnEl.parentElement?.clientWidth || window.innerWidth || 360;
            const targetWidth = Math.min(Math.max(Math.floor(containerWidth - 16), 220), 380);
            window.google.accounts.id.renderButton(btnEl, {
              theme: 'outline',
              size: 'large',
              width: targetWidth,
              text: 'continue_with',
              shape: 'rectangular',
              logo_alignment: 'left',
            });
          }
          if (intervalId) clearInterval(intervalId);
        } catch (e) {
          console.warn('GIS init error:', e);
        }
      }
    };

    renderGoogleBtn();
    if (!window.google?.accounts?.id && googleClientId) {
      intervalId = setInterval(renderGoogleBtn, 300);
      setTimeout(() => {
        if (intervalId) clearInterval(intervalId);
      }, 5000);
    }

    const handleResize = () => {
      renderGoogleBtn();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (intervalId) clearInterval(intervalId);
      window.removeEventListener('resize', handleResize);
    };
  }, [currentUser, googleClientId, authMode]);

  // Multi-Question Poll State
  const [pollTitle, setPollTitle] = useState('');
  const [questions, setQuestions] = useState([
    {
      id: 1,
      title: '',
      options: [
        { text: '', color: PALETTE[0] },
        { text: '', color: PALETTE[1] },
      ],
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdPoll, setCreatedPoll] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // My Polls List
  const [myPolls, setMyPolls] = useState([]);
  const [loadingPolls, setLoadingPolls] = useState(false);

  const loadMyPolls = async () => {
    if (!getToken()) return;
    setLoadingPolls(true);
    try {
      const polls = await getMyPolls();
      setMyPolls(polls);
    } catch (err) {
      console.warn('Could not load user polls:', err);
    } finally {
      setLoadingPolls(false);
    }
  };

  useEffect(() => {
    const user = getUser();
    setCurrentUser(user);
    if (user) {
      loadMyPolls();
    }
  }, []);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      if (authMode === 'signup') {
        const res = await signup(authName, authEmail, authPassword);
        setCurrentUser(res.user);
        loadMyPolls();
      } else {
        const res = await login(authEmail, authPassword);
        setCurrentUser(res.user);
        loadMyPolls();
      }
    } catch (err) {
      console.error('Auth error:', err);
      setAuthError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    setCurrentUser(null);
    setCreatedPoll(null);
    setMyPolls([]);
  };

  const [deletingPollId, setDeletingPollId] = useState(null);

  const handleDeletePoll = async (pollId) => {
    if (!window.confirm('Are you sure you want to permanently delete this polling session? This action cannot be undone.')) {
      return;
    }
    setDeletingPollId(pollId);
    try {
      await deletePoll(pollId);
      setMyPolls((prev) => prev.filter((p) => p.id !== pollId));
      if (createdPoll && createdPoll.id === pollId) {
        setCreatedPoll(null);
      }
    } catch (err) {
      alert(err.message || 'Failed to delete poll session');
    } finally {
      setDeletingPollId(null);
    }
  };

  const [copiedPollId, setCopiedPollId] = useState(null);

  const handleCopyVoteLink = (pollId) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${origin}/vote/${pollId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedPollId(pollId);
      setTimeout(() => setCopiedPollId(null), 2000);
    }
  };

  const renderPollSessionsList = (isSidebar = false) => {
    if (loadingPolls && myPolls.length === 0) {
      return (
        <div style={{ padding: '24px', textAlign: 'center', color: '#555555' }}>
          <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px', color: '#2B2B2B' }} />
          <p style={{ fontSize: '0.86rem', fontFamily: "'Special Elite', monospace" }}>Loading sessions...</p>
        </div>
      );
    }

    if (myPolls.length === 0) {
      return (
        <div className="glass-panel" style={{ padding: isSidebar ? '22px 18px' : '32px', textAlign: 'center' }}>
          <p style={{ color: '#555555', fontSize: '0.88rem', fontFamily: "'Special Elite', monospace" }}>
            No polling sessions recorded yet. Fill out the form above to launch your first session!
          </p>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: isSidebar ? '12px' : '14px' }}>
        {myPolls.map((p) => {
          const qCount = p.questions?.length || (p.question ? 1 : 0);
          const displayTitle = p.title || p.question || 'Untitled Poll Session';
          const isCopied = copiedPollId === p.id;
          return (
            <div
              key={p.id}
              className="glass-panel"
              style={{
                background: '#FAFAFA',
                border: '1px solid #2B2B2B',
                boxShadow: '4px 4px 0px rgba(43, 43, 43, 0.15)',
                padding: isSidebar ? '14px 16px' : '18px 20px',
                display: 'flex',
                flexDirection: isSidebar ? 'column' : 'row',
                alignItems: isSidebar ? 'stretch' : 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      color: '#2B2B2B',
                      background: '#F4F1EA',
                      border: '1px solid #2B2B2B',
                      padding: '2px 7px',
                      fontWeight: 700,
                      fontFamily: 'monospace',
                    }}
                  >
                    PIN: {p.id.slice(0, 8)}...
                  </span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      color: p.status === 'completed' ? '#DC2626' : '#2B2B2B',
                      background: p.status === 'completed' ? 'rgba(220, 38, 38, 0.1)' : '#F4F1EA',
                      border: `1px solid ${p.status === 'completed' ? '#DC2626' : '#2B2B2B'}`,
                      padding: '2px 7px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                    }}
                  >
                    {p.status === 'completed' ? 'Ended' : 'Live'}
                  </span>
                  <span style={{ fontSize: '0.74rem', color: '#555555' }}>
                    {qCount}Q &bull; {p.total_votes || 0} votes
                  </span>
                </div>
                <h4 style={{
                  fontSize: isSidebar ? '0.96rem' : '1.08rem',
                  color: '#2B2B2B',
                  fontWeight: 800,
                  marginBottom: '4px',
                  lineHeight: 1.35,
                  wordBreak: 'break-word',
                  fontFamily: "'Special Elite', monospace",
                }}>
                  {displayTitle}
                </h4>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginTop: isSidebar ? '6px' : '0' }}>
                <Link
                  to={`/present/${p.id}`}
                  className="btn-primary"
                  style={{
                    padding: isSidebar ? '7px 12px' : '8px 16px',
                    fontSize: isSidebar ? '0.8rem' : '0.85rem',
                    gap: '5px',
                    flex: isSidebar ? 1 : 'none',
                    justifyContent: 'center',
                  }}
                >
                  <Play size={13} fill="#FAFAFA" />
                  Project
                </Link>
                <button
                  type="button"
                  onClick={() => handleCopyVoteLink(p.id)}
                  className="btn-secondary"
                  style={{
                    padding: isSidebar ? '7px 10px' : '8px 12px',
                    fontSize: isSidebar ? '0.8rem' : '0.85rem',
                    gap: '5px',
                    color: isCopied ? '#2563EB' : '#2B2B2B',
                  }}
                  title="Copy direct voting link to clipboard"
                >
                  <Copy size={13} />
                  <span>{isCopied ? 'Copied!' : 'Link'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeletePoll(p.id)}
                  disabled={deletingPollId === p.id}
                  className="btn-secondary"
                  style={{
                    padding: isSidebar ? '7px 10px' : '8px 12px',
                    fontSize: isSidebar ? '0.8rem' : '0.85rem',
                    color: '#DC2626',
                    borderColor: '#DC2626',
                  }}
                  title="Delete this session"
                >
                  {deletingPollId === p.id ? (
                    <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <Trash2 size={13} />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Multi-Question Form Handlers
  const handleAddQuestion = () => {
    const newId = Date.now();
    setQuestions([
      ...questions,
      {
        id: newId,
        title: '',
        options: [
          { text: '', color: PALETTE[0] },
          { text: '', color: PALETTE[1] },
        ],
      },
    ]);
  };

  const handleRemoveQuestion = (qIndex) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, idx) => idx !== qIndex));
  };

  const handleQuestionTitleChange = (qIndex, value) => {
    const updated = [...questions];
    updated[qIndex].title = value;
    setQuestions(updated);
  };

  const handleAddOption = (qIndex) => {
    const q = questions[qIndex];
    if (q.options.length >= 4) return;
    const nextColor = PALETTE[q.options.length % PALETTE.length];
    const updated = [...questions];
    updated[qIndex].options = [...q.options, { text: '', color: nextColor }];
    setQuestions(updated);
  };

  const handleRemoveOption = (qIndex, oIndex) => {
    const q = questions[qIndex];
    if (q.options.length <= 2) return;
    const updated = [...questions];
    updated[qIndex].options = q.options.filter((_, idx) => idx !== oIndex);
    setQuestions(updated);
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex].text = value;
    setQuestions(updated);
  };

  const handleApplyPreset = (template) => {
    setPollTitle(template.title || template.name);
    setQuestions(
      template.questions.map((q, idx) => ({
        id: Date.now() + idx,
        title: q.title,
        options: q.options.map((opt) => ({ text: opt.text, color: opt.color })),
      }))
    );
    setErrorMessage(null);
  };

  const handleResetForm = () => {
    setPollTitle('');
    setQuestions([
      {
        id: Date.now(),
        title: '',
        options: [
          { text: '', color: PALETTE[0] },
          { text: '', color: PALETTE[1] },
        ],
      },
    ]);
    setErrorMessage(null);
  };

  const handlePollSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setErrorMessage(null);

    const nonBlankQuestions = questions.filter(
      (q) => q.title.trim() !== '' || q.options.some((opt) => opt.text.trim() !== '')
    );
    const questionsToSubmit = nonBlankQuestions.length > 0 ? nonBlankQuestions : questions;

    if (questionsToSubmit.length === 0 || !questionsToSubmit[0].title.trim()) {
      setErrorMessage('Please enter at least one question prompt to launch your poll session.');
      return;
    }

    for (let i = 0; i < questionsToSubmit.length; i++) {
      const q = questionsToSubmit[i];
      const trimmedTitle = q.title.trim();
      if (trimmedTitle.length < 3) {
        setErrorMessage(`Question #${i + 1} prompt must be at least 3 characters long.`);
        return;
      }

      if (q.options.length < 2 || q.options.length > 4) {
        setErrorMessage(`Question #${i + 1} must have between 2 and 4 choices.`);
        return;
      }

      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].text.trim()) {
          setErrorMessage(`Question #${i + 1}, choice #${j + 1} cannot be blank.`);
          return;
        }
      }
    }

    const firstQ = questionsToSubmit[0];
    const payload = {
      title: pollTitle.trim() || firstQ.title.trim(),
      question: firstQ.title.trim(),
      options: firstQ.options.map((opt, i) => ({
        text: opt.text.trim() || `Option ${i + 1}`,
        color: opt.color || PALETTE[i % PALETTE.length],
      })),
      questions: questionsToSubmit.map((q) => ({
        title: q.title.trim(),
        options: q.options.map((opt, i) => ({
          text: opt.text.trim() || `Option ${i + 1}`,
          color: opt.color || PALETTE[i % PALETTE.length],
        })),
      })),
    };

    setIsSubmitting(true);
    try {
      const newPoll = await createPoll(payload);
      const pollId = newPoll.id || newPoll._id;

      if (!pollId) {
        throw new Error('Server created poll but did not return an ID.');
      }

      setCreatedPoll(newPoll);
      localStorage.setItem('pulsecast_latest_poll_id', pollId);
      loadMyPolls();
      handleResetForm();
      navigate(`/present/${pollId}`);
    } catch (err) {
      console.error('Failed to create poll session:', err);
      if (err.message && (err.message.includes('Authentication required') || err.message.includes('401'))) {
        handleLogout();
        setAuthError('Your session has expired. Please log in again.');
      } else {
        setErrorMessage(err.message || 'Could not save poll. Ensure Go backend is running.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Audience Quick Join Sub-Component
  const renderQuickJoinCard = () => (
    <div
      className="glass-panel"
      style={{
        padding: isMobile ? '16px 14px' : '20px 22px',
        background: '#FAFAFA',
        border: '1px solid #2B2B2B',
        boxShadow: isMobile ? '3px 3px 0px rgba(43, 43, 43, 0.15)' : '4px 4px 0px rgba(43, 43, 43, 0.15)',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <div
          style={{
            width: isMobile ? '32px' : '36px',
            height: isMobile ? '32px' : '36px',
            background: '#2B2B2B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FAFAFA',
            flexShrink: 0,
          }}
        >
          <Smartphone size={isMobile ? 16 : 18} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h3 style={{ fontSize: isMobile ? '0.92rem' : '0.98rem', fontWeight: 800, color: '#2B2B2B', marginBottom: '2px', fontFamily: "'Special Elite', monospace" }}>
            Audience Quick Join
          </h3>
          <p style={{ fontSize: isMobile ? '0.74rem' : '0.78rem', color: '#555555' }}>
            Enter presenter's session PIN to vote:
          </p>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (joinSessionInput.trim()) {
            navigate(`/vote/${joinSessionInput.trim()}`);
          }
        }}
        style={{ display: 'flex', gap: '8px', flexDirection: isMobile ? 'column' : 'row', width: '100%' }}
      >
        <input
          type="text"
          placeholder="e.g. 6aacb98f5be43c0cbaadccaa"
          value={joinSessionInput}
          onChange={(e) => setJoinSessionInput(e.target.value)}
          className="input-field"
          style={{ padding: isMobile ? '10px 12px' : '9px 12px', fontSize: '0.85rem', flex: 1, width: '100%' }}
        />
        <button
          type="submit"
          className="btn-primary"
          disabled={!joinSessionInput.trim()}
          style={{ padding: isMobile ? '10px 14px' : '9px 14px', fontSize: '0.85rem', whiteSpace: 'nowrap', justifyContent: 'center', width: isMobile ? '100%' : 'auto' }}
        >
          Join Poll
          <ArrowRight size={14} />
        </button>
      </form>
    </div>
  );

  // Auth Card Sub-Component for Landing Page
  const renderAuthCard = () => (
    <div
      className="glass-panel"
      style={{
        background: '#FAFAFA',
        border: '2px solid #2B2B2B',
        boxShadow: isMobile ? '4px 4px 0px rgba(43, 43, 43, 0.2)' : '8px 8px 0px rgba(43, 43, 43, 0.2)',
        padding: isMobile ? '20px 16px' : '32px 26px',
        position: 'relative',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div className="stamp-seal" style={{ marginBottom: '10px', fontSize: isMobile ? '0.7rem' : '0.78rem' }}>
          CREATOR &amp; HOST PORTAL
        </div>
        <h2 style={{ fontSize: isMobile ? '1.5rem' : '2.1rem', marginBottom: '8px', color: '#2B2B2B', fontFamily: "'Special Elite', monospace" }}>
          Host Portal &amp; Studio
        </h2>
        <p style={{ color: '#555555', fontSize: isMobile ? '0.82rem' : '0.88rem', lineHeight: 1.45 }}>
          Sign in or register your host account to design and present interactive multi-question polls.
        </p>
      </div>

      {/* Segmented Tab Switcher */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: '#F4F1EA',
          border: '1px solid #2B2B2B',
          padding: '2px',
          marginBottom: '20px',
          gap: '2px',
        }}
      >
        <button
          type="button"
          onClick={() => {
            setAuthMode('login');
            setAuthError(null);
          }}
          style={{
            padding: '9px',
            border: authMode === 'login' ? '1px solid #2B2B2B' : 'none',
            background: authMode === 'login' ? '#2B2B2B' : 'transparent',
            color: authMode === 'login' ? '#FAFAFA' : '#2B2B2B',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            fontFamily: "'Special Elite', monospace",
          }}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            setAuthMode('signup');
            setAuthError(null);
          }}
          style={{
            padding: '9px',
            border: authMode === 'signup' ? '1px solid #2B2B2B' : 'none',
            background: authMode === 'signup' ? '#2B2B2B' : 'transparent',
            color: authMode === 'signup' ? '#FAFAFA' : '#2B2B2B',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            fontFamily: "'Special Elite', monospace",
          }}
        >
          Create Account
        </button>
      </div>

      {authError && (
        <div
          style={{
            background: 'rgba(220, 38, 38, 0.08)',
            border: '1px solid #DC2626',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#DC2626',
            fontSize: '0.86rem',
            marginBottom: '18px',
            fontFamily: "'Special Elite', monospace",
          }}
        >
          <AlertCircle size={17} color="#DC2626" flexShrink={0} />
          <span>{authError}</span>
        </div>
      )}

      {/* Google OAuth Login Option */}
      <div style={{ marginBottom: '18px' }}>
        <div
          id="google-signin-btn-container"
          style={{
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
            minHeight: '44px',
          }}
        >
          <button
            type="button"
            onClick={() => {
              if (window.google?.accounts?.id && googleClientId) {
                window.google.accounts.id.prompt();
              } else if (!googleClientId) {
                setAuthError('Google Client ID is not configured yet. Set VITE_GOOGLE_CLIENT_ID in frontend/.env.');
              } else {
                setAuthError('Google Identity Services is initializing. Please try again.');
              }
            }}
            className="btn-secondary"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '11px',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            margin: '16px 0 6px 0',
            gap: '12px',
          }}
        >
          <div style={{ flex: 1, borderBottom: '1px dashed #2B2B2B' }} />
          <span style={{ fontSize: '0.74rem', color: '#555555', fontFamily: "'Special Elite', monospace" }}>
            Or sign in with email
          </span>
          <div style={{ flex: 1, borderBottom: '1px dashed #2B2B2B' }} />
        </div>
      </div>

      <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {authMode === 'signup' && (
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, marginBottom: '5px', color: '#2B2B2B' }}>
              Full Name
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Alex, Sarah, Prof. Miller"
              value={authName}
              onChange={(e) => setAuthName(e.target.value)}
              required
            />
          </div>
        )}

        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, marginBottom: '5px', color: '#2B2B2B' }}>
            Email Address
          </label>
          <input
            type="email"
            className="input-field"
            placeholder="host@pulsecast.dev"
            value={authEmail}
            onChange={(e) => setAuthEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, marginBottom: '5px', color: '#2B2B2B' }}>
            Password (min 6 characters)
          </label>
          <input
            type="password"
            className="input-field"
            placeholder="••••••••"
            value={authPassword}
            onChange={(e) => setAuthPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={authLoading}
          style={{ width: '100%', justifyContent: 'center', marginTop: '6px', padding: '12px' }}
        >
          {authLoading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : authMode === 'signup' ? (
            'Create Host Account'
          ) : (
            'Sign In & Access Studio'
          )}
        </button>
      </form>
    </div>
  );

  // Unauthenticated Landing Page State
  if (!currentUser) {
    return (
      <main style={{ width: '100%', minHeight: '100vh', padding: isMobile ? '8px 0 calc(80px + var(--safe-bottom))' : '24px 0 60px', overflowX: 'hidden' }}>
        <LandingInfo
          authComponent={renderAuthCard()}
          quickJoinComponent={renderQuickJoinCard()}
          onScrollToAuth={() => {
            const el = document.getElementById('auth-portal-section');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }}
        />
      </main>
    );
  }

  const renderBuilderContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Success Notification */}
      {createdPoll && (
        <div
          className="glass-panel"
          style={{
            padding: '20px',
            background: '#F4F1EA',
            border: '2px solid #2B2B2B',
            boxShadow: '6px 6px 0px rgba(43, 43, 43, 0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span className="stamp-seal" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
              POLL LIVE
            </span>
            <h3 style={{ fontSize: '1.15rem', color: '#2B2B2B', fontFamily: "'Special Elite', monospace" }}>
              Your Polling Session Is Live!
            </h3>
          </div>
          <p style={{ color: '#555555', fontSize: '0.88rem', marginBottom: '14px' }}>
            Session ID: <strong style={{ color: '#2B2B2B', fontFamily: 'monospace' }}>{createdPoll.id}</strong> ({createdPoll.questions?.length || 1} questions).
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-primary"
              onClick={() => navigate(`/present/${createdPoll.id}`)}
              style={{ gap: '8px', padding: '9px 16px', fontSize: '0.88rem' }}
            >
              <Play size={15} fill="#FAFAFA" />
              Open Projector View
            </button>
            <button
              type="button"
              onClick={() => handleCopyVoteLink(createdPoll.id)}
              className="btn-secondary"
              style={{ gap: '6px', padding: '9px 14px', fontSize: '0.88rem' }}
            >
              <Copy size={15} />
              {copiedPollId === createdPoll.id ? 'Copied Link!' : 'Copy Audience Link'}
            </button>
            <button
              type="button"
              onClick={() => {
                setCreatedPoll(null);
                handleResetForm();
              }}
              className="btn-secondary"
              style={{ gap: '6px', padding: '9px 14px', fontSize: '0.88rem' }}
            >
              <Plus size={15} />
              Start New Polling Session
            </button>
          </div>
        </div>
      )}

      {/* Preset Polls Toolbar */}
      <div
        className="horizontal-scroll-touch"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: isMobile ? 'auto' : 'visible',
          paddingBottom: isMobile ? '6px' : '0',
          WebkitOverflowScrolling: 'touch',
          flexWrap: isMobile ? 'nowrap' : 'wrap',
        }}
      >
        <span
          style={{
            fontSize: '0.82rem',
            color: '#2B2B2B',
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            flexShrink: 0,
            fontFamily: "'Special Elite', monospace",
          }}
        >
          <Sparkles size={14} color="#DC2626" />
          Poll Presets:
        </span>
        {MULTI_QUESTION_TEMPLATES.map((tmpl, idx) => {
          const isSelected = pollTitle === (tmpl.title || tmpl.name);
          const IconComp = tmpl.icon;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(tmpl)}
              className="btn-secondary"
              style={{
                fontSize: '0.8rem',
                padding: '6px 12px',
                background: isSelected ? '#2B2B2B' : '#FAFAFA',
                color: isSelected ? '#FAFAFA' : '#2B2B2B',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              <IconComp size={13} color={isSelected ? '#FAFAFA' : '#2B2B2B'} />
              <span>{tmpl.name}</span>
            </button>
          );
        })}

        {(Boolean(pollTitle) || questions.some((q) => q.title.trim() || q.options.some((o) => o.text.trim()))) && (
          <button
            type="button"
            onClick={handleResetForm}
            className="btn-secondary"
            style={{
              fontSize: '0.8rem',
              padding: '6px 12px',
              color: '#DC2626',
              borderColor: '#DC2626',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
            title="Clear preset data"
          >
            <RotateCcw size={13} />
            <span>Clear Preset</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleResetForm}
          className="btn-secondary"
          style={{
            fontSize: '0.8rem',
            padding: '6px 12px',
            gap: '5px',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
          title="Start fresh with a blank polling session"
        >
          <Plus size={13} />
          <span>New Blank Session</span>
        </button>
      </div>

      {/* Main Creation Form: Styled like a physical clipboard */}
      <div className="clipboard-container" style={{ padding: isMobile ? '36px 16px 20px' : '44px 28px 28px' }}>
        {/* Physical Top Metal Clip */}
        <div className="clipboard-clip" title="Poll Clipboard" />

        <div style={{ textAlign: 'center', marginBottom: '24px', borderBottom: '2px dashed #2B2B2B', paddingBottom: '16px' }}>
          <div className="stamp-seal" style={{ marginBottom: '8px', fontSize: '0.78rem' }}>
            LIVE POLL BUILDER
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#2B2B2B', fontFamily: "'Special Elite', monospace" }}>
            Interactive Session Builder
          </h2>
          <p style={{ color: '#555555', fontSize: '0.88rem' }}>
            Draft your poll questions below. Multiple questions are separated by dashed boundaries.
          </p>
        </div>

        <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Session Title Field */}
          <div style={{ paddingBottom: '18px', borderBottom: '2px dashed #2B2B2B' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 800, color: '#2B2B2B' }}>
                Session Title
              </label>
              <button
                type="button"
                onClick={handleResetForm}
                className="btn-secondary"
                style={{ padding: '3px 8px', fontSize: '0.72rem', gap: '4px' }}
                title="Reset form"
              >
                <RotateCcw size={11} />
                Reset
              </button>
            </div>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Sprint Retrospective & Architecture Review 2026"
              value={pollTitle}
              onChange={(e) => setPollTitle(e.target.value)}
              style={{ fontSize: isMobile ? '0.95rem' : '1.05rem', padding: '12px 14px' }}
            />
          </div>

          {/* Questions List */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {questions.map((q, qIdx) => (
              <div
                key={q.id || qIdx}
                style={{
                  paddingBottom: '24px',
                  marginBottom: '24px',
                  borderBottom: '2px dashed #2B2B2B',
                  position: 'relative',
                }}
              >
                {/* Question Header & Delete */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      color: '#FAFAFA',
                      background: '#2B2B2B',
                      padding: '3px 10px',
                    }}
                  >
                    Question #{qIdx + 1} of {questions.length}
                  </span>

                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(qIdx)}
                      className="btn-secondary"
                      style={{
                        color: '#DC2626',
                        borderColor: '#DC2626',
                        padding: '4px 9px',
                        fontSize: '0.75rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Trash2 size={13} />
                      <span>Remove Question</span>
                    </button>
                  )}
                </div>

                {/* Question Prompt Input */}
                <input
                  type="text"
                  className="input-field"
                  placeholder={`Enter question #${qIdx + 1} prompt...`}
                  value={q.title}
                  onChange={(e) => handleQuestionTitleChange(qIdx, e.target.value)}
                  style={{ marginBottom: '16px', fontWeight: 700, fontSize: '1rem' }}
                />

                {/* Choices */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {q.options.map((opt, oIdx) => (
                    <div key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          width: '30px',
                          height: '30px',
                          background: '#EBE7DD',
                          border: '1px solid #2B2B2B',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          color: '#2B2B2B',
                          flexShrink: 0,
                        }}
                      >
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <input
                        type="text"
                        className="input-field"
                        placeholder={`Choice ${String.fromCharCode(65 + oIdx)}`}
                        value={opt.text}
                        onChange={(e) => handleOptionChange(qIdx, oIdx, e.target.value)}
                        style={{ flex: 1, padding: '9px 12px', fontSize: '0.9rem' }}
                      />
                      {q.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(qIdx, oIdx)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#888888',
                            cursor: 'pointer',
                            padding: '6px',
                          }}
                          title="Remove choice"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add Choice */}
                {q.options.length < 4 && (
                  <button
                    type="button"
                    onClick={() => handleAddOption(qIdx)}
                    className="btn-secondary"
                    style={{
                      marginTop: '12px',
                      fontSize: '0.8rem',
                      padding: '6px 12px',
                      border: '1px dashed #2B2B2B',
                      background: '#FAFAFA',
                    }}
                  >
                    <Plus size={13} />
                    Add Choice ({q.options.length}/4)
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add Another Question Button */}
          <button
            type="button"
            onClick={handleAddQuestion}
            className="btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '14px',
              border: '2px dashed #2B2B2B',
              fontSize: '0.95rem',
              fontWeight: 800,
            }}
          >
            <Plus size={18} color="#2B2B2B" />
            Add Another Question to Session
          </button>

          {errorMessage && (
            <div
              style={{
                background: 'rgba(220, 38, 38, 0.08)',
                border: '1px solid #DC2626',
                padding: '11px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: '#DC2626',
                fontSize: '0.88rem',
              }}
            >
              <AlertCircle size={17} color="#DC2626" flexShrink={0} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Launch Button */}
          <button
            type="button"
            onClick={handlePollSubmit}
            className="btn-stamp"
            disabled={isSubmitting}
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '15px',
              fontSize: '1rem',
              fontWeight: 800,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Saving Session to Database...
              </>
            ) : (
              <>
                <Play size={16} fill="#FFFFFF" />
                Launch Session &amp; Open Projector
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );

  // Profile Bar
  const renderProfileBar = () => (
    <div
      className="glass-panel"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '12px 14px' : '14px 20px',
        background: '#FAFAFA',
        border: '1px solid #2B2B2B',
        boxShadow: '4px 4px 0px rgba(43, 43, 43, 0.15)',
        marginBottom: isMobile ? '18px' : '28px',
        flexWrap: 'wrap',
        gap: '10px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: isMobile ? '32px' : '38px',
            height: isMobile ? '32px' : '38px',
            background: '#2B2B2B',
            border: '1px solid #1A1A1A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FAFAFA',
            fontWeight: 800,
            fontSize: isMobile ? '0.85rem' : '0.95rem',
            overflow: 'hidden',
          }}
        >
          {currentUser.avatar ? (
            <img
              src={currentUser.avatar}
              alt={currentUser.name || 'Host'}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : currentUser.name ? (
            currentUser.name.charAt(0).toUpperCase()
          ) : (
            <User size={16} />
          )}
        </div>
        <div>
          <div style={{ fontSize: isMobile ? '0.88rem' : '0.96rem', fontWeight: 800, color: '#2B2B2B' }}>
            Host: {currentUser.name}
          </div>
          <div style={{ fontSize: isMobile ? '0.74rem' : '0.8rem', color: '#555555' }}>
            {currentUser.email} &bull; <span style={{ color: '#2563EB', fontWeight: 700 }}>Verified Host</span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleLogout}
        className="btn-secondary"
        style={{ padding: isMobile ? '6px 10px' : '8px 14px', fontSize: isMobile ? '0.78rem' : '0.85rem', gap: '5px' }}
      >
        <LogOut size={13} />
        Sign Out
      </button>
    </div>
  );

  // MOBILE LAYOUT
  if (isMobile) {
    return (
      <main
        style={{
          maxWidth: '100%',
          margin: '0 auto',
          padding: '14px 14px calc(80px + var(--safe-bottom))',
          width: '100%',
        }}
      >
        {renderProfileBar()}

        {/* Segmented Mobile Tab Switcher */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            background: '#F4F1EA',
            border: '1px solid #2B2B2B',
            padding: '2px',
            marginBottom: '18px',
            gap: '2px',
          }}
        >
          <button
            type="button"
            onClick={() => setMobileTab('builder')}
            style={{
              padding: '9px 4px',
              border: mobileTab === 'builder' ? '1px solid #2B2B2B' : 'none',
              background: mobileTab === 'builder' ? '#2B2B2B' : 'transparent',
              color: mobileTab === 'builder' ? '#FAFAFA' : '#2B2B2B',
              fontWeight: 800,
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              fontFamily: "'Special Elite', monospace",
            }}
          >
            <Rocket size={13} />
            <span>Builder</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('sessions')}
            style={{
              padding: '9px 4px',
              border: mobileTab === 'sessions' ? '1px solid #2B2B2B' : 'none',
              background: mobileTab === 'sessions' ? '#2B2B2B' : 'transparent',
              color: mobileTab === 'sessions' ? '#FAFAFA' : '#2B2B2B',
              fontWeight: 800,
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              fontFamily: "'Special Elite', monospace",
            }}
          >
            <ListOrdered size={13} />
            <span>Polls ({myPolls.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('join')}
            style={{
              padding: '9px 4px',
              border: mobileTab === 'join' ? '1px solid #2B2B2B' : 'none',
              background: mobileTab === 'join' ? '#2B2B2B' : 'transparent',
              color: mobileTab === 'join' ? '#FAFAFA' : '#2B2B2B',
              fontWeight: 800,
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              fontFamily: "'Special Elite', monospace",
            }}
          >
            <Smartphone size={13} />
            <span>Join PIN</span>
          </button>
        </div>

        {mobileTab === 'builder' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '18px' }}>
              <h2 style={{ fontSize: '1.45rem', marginBottom: '4px', fontFamily: "'Special Elite', monospace" }}>
                Design Live Poll Session
              </h2>
              <p style={{ color: '#555555', fontSize: '0.82rem' }}>
                Draft questions on the clipboard with physical paper styling.
              </p>
            </div>
            {renderBuilderContent()}
          </div>
        )}

        {mobileTab === 'sessions' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: "'Special Elite', monospace" }}>
                Your Sessions ({myPolls.length})
              </h2>
              <button
                onClick={loadMyPolls}
                className="btn-secondary"
                style={{ padding: '5px 10px', fontSize: '0.78rem' }}
              >
                Refresh
              </button>
            </div>
            {renderPollSessionsList(false)}
          </div>
        )}

        {mobileTab === 'join' && (
          <div>
            {renderQuickJoinCard()}
          </div>
        )}
      </main>
    );
  }

  // LAPTOP STUDIO LAYOUT
  return (
    <main
      style={{
        maxWidth: '1360px',
        margin: '0 auto',
        padding: '36px 28px',
        width: '100%',
      }}
    >
      {renderProfileBar()}

      {/* Header Title */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div className="stamp-seal" style={{ marginBottom: '10px' }}>
          INTERACTIVE POLLING STUDIO
        </div>
        <h1 style={{ fontSize: '2.4rem', marginBottom: '8px', color: '#2B2B2B', fontFamily: "'Special Elite', monospace" }}>
          Design Your Live Polling Session
        </h1>
        <p style={{ color: '#555555', fontSize: '0.96rem', maxWidth: '620px', margin: '0 auto' }}>
          Create interactive multi-question polls for classrooms, meetings, workshops, and events with instant real-time presentations.
        </p>
      </div>

      {/* Studio 2-Column Grid */}
      <div className="creator-studio-layout">
        {/* Left Column: Official Clipboard Form */}
        <div>
          {renderBuilderContent()}
        </div>

        {/* Right Sidebar: Quick Join & Session Ledger */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {renderQuickJoinCard()}

          {/* Sessions Ledger Panel */}
          <div
            className="glass-panel"
            style={{
              padding: '22px 20px',
              background: '#FAFAFA',
              border: '1px solid #2B2B2B',
              boxShadow: '6px 6px 0px rgba(43, 43, 43, 0.15)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={17} color="#2B2B2B" />
                <h3 style={{ fontSize: '1.08rem', fontWeight: 800, fontFamily: "'Special Elite', monospace" }}>
                  Your Sessions ({myPolls.length})
                </h3>
              </div>
              <button
                onClick={loadMyPolls}
                className="btn-secondary"
                style={{ padding: '5px 10px', fontSize: '0.78rem' }}
              >
                Refresh
              </button>
            </div>
            {renderPollSessionsList(true)}
          </div>
        </div>
      </div>
    </main>
  );
}
