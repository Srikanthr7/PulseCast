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
  Radio,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { createPoll, login, signup, googleAuth, getUser, getToken, clearAuth, getMyPolls, deletePoll } from '../api';
import { useDeviceType } from '../hooks/useDeviceType';

const PALETTE = ['#48E5C2', '#F3D3BD', '#FCFAF9', '#5E5E5E'];

const isLightColor = (hex) => {
  if (!hex) return true;
  const h = hex.toLowerCase();
  if (h === '#5e5e5e' || h === '#ef4444' || h === '#333333' || h === '#2b2b2b' || h === '#444444') return false;
  return true;
};

const MULTI_QUESTION_TEMPLATES = [
  {
    name: 'Full-Stack Tech Sprint (2 Questions)',
    title: 'PulseCast Tech Sprint 2026',
    icon: Rocket,
    questions: [
      {
        title: 'Which modern tech stack layer are you most excited to master in 2026?',
        options: [
          { text: 'Go (Gin) + Redis Engine', color: '#48E5C2' },
          { text: 'React 19 + Framer Motion UI', color: '#F3D3BD' },
          { text: 'MongoDB Document Aggregation', color: '#5E5E5E' },
          { text: 'WebSockets Real-time Streaming', color: '#FCFAF9' },
        ],
      },
      {
        title: 'How do you prefer collaborating on distributed systems?',
        options: [
          { text: 'Pair programming & real-time sessions', color: '#48E5C2' },
          { text: 'Async brainstorms & thorough RFCs', color: '#F3D3BD' },
          { text: 'Deep uninterrupted solo focus', color: '#5E5E5E' },
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
          { text: '100% Solid - Zero concerns', color: '#48E5C2' },
          { text: 'Good - Minor bottlenecks', color: '#F3D3BD' },
          { text: 'Needs Improvement', color: '#5E5E5E' },
          { text: 'High Risk - Needs urgent fix', color: '#ef4444' },
        ],
      },
      {
        title: "What should be our team's primary focus for next sprint?",
        options: [
          { text: 'Frontend UX polish & micro-animations', color: '#48E5C2' },
          { text: 'Backend latency & database indexing', color: '#F3D3BD' },
          { text: 'Automated end-to-end test coverage', color: '#5E5E5E' },
        ],
      },
    ],
  },
  {
    name: 'Quick Architecture Pulse (1 Question)',
    title: 'Architecture Decision Poll',
    icon: Zap,
    questions: [
      {
        title: 'Do you approve migrating to Redis Pub/Sub for live presentation syncing?',
        options: [
          { text: 'Yes, absolutely approved', color: '#48E5C2' },
          { text: 'No, needs further architectural review', color: '#5E5E5E' },
          { text: 'Undecided / Need more benchmarks', color: '#F3D3BD' },
        ],
      },
    ],
  },
  {
    name: 'Team Social Icebreaker (2 Questions)',
    title: 'Team Social & Icebreaker',
    icon: Coffee,
    questions: [
      {
        title: 'What fuels your best engineering focus sessions?',
        options: [
          { text: 'Fresh dark roast espresso', color: '#F3D3BD' },
          { text: 'Lo-Fi / Synthwave music', color: '#48E5C2' },
          { text: 'Late night quiet hours', color: '#5E5E5E' },
          { text: 'Chilled iced water or green tea', color: '#FCFAF9' },
        ],
      },
      {
        title: 'Choose your software engineering superpower:',
        options: [
          { text: 'Zero bugs on initial release', color: '#48E5C2' },
          { text: 'Read and understand any legacy codebase in minutes', color: '#F3D3BD' },
          { text: 'Flawless distributed system architecture design', color: '#5E5E5E' },
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

  const { isMobile, isLaptop } = useDeviceType();
  const [mobileTab, setMobileTab] = useState('builder'); // 'builder' | 'sessions' | 'join'

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Handle Google OAuth ID token response from GIS
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
    const initGoogle = () => {
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
            window.google.accounts.id.renderButton(btnEl, {
              theme: 'outline',
              size: 'large',
              width: 360,
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

    initGoogle();
    if (!window.google?.accounts?.id && googleClientId) {
      intervalId = setInterval(initGoogle, 300);
      setTimeout(() => {
        if (intervalId) clearInterval(intervalId);
      }, 5000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [currentUser, googleClientId, authMode]);

  // Multi-Question Poll State (Clean blank state - presets available on demand)
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
    if (!window.confirm('Are you sure you want to delete this polling session? This action cannot be undone.')) {
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
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px', color: 'var(--accent-primary)' }} />
          <p style={{ fontSize: '0.86rem' }}>Loading sessions...</p>
        </div>
      );
    }

    if (myPolls.length === 0) {
      return (
        <div className="glass-panel" style={{ padding: isSidebar ? '22px 18px' : '32px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            You haven't created any polls yet. Design your first multi-question poll session!
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
                padding: isSidebar ? '14px 16px' : '18px 20px',
                display: 'flex',
                flexDirection: isSidebar ? 'column' : 'row',
                alignItems: isSidebar ? 'stretch' : 'center',
                justifyContent: 'space-between',
                gap: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      color: 'var(--accent-cyan)',
                      background: 'rgba(72, 229, 194, 0.12)',
                      border: '1px solid rgba(72, 229, 194, 0.3)',
                      padding: '2px 7px',
                      borderRadius: '6px',
                      fontWeight: 600,
                    }}
                  >
                    PIN: {p.id.slice(0, 8)}...
                  </span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      color: p.status === 'completed' ? '#F3D3BD' : '#48E5C2',
                      background: p.status === 'completed' ? 'rgba(243, 211, 189, 0.12)' : 'rgba(72, 229, 194, 0.12)',
                      border: `1px solid ${p.status === 'completed' ? 'rgba(243, 211, 189, 0.3)' : 'rgba(72, 229, 194, 0.3)'}`,
                      padding: '2px 7px',
                      borderRadius: '6px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}
                  >
                    {p.status === 'completed' ? 'Ended' : 'Live'}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {qCount}Q &bull; {p.total_votes || 0} votes
                  </span>
                </div>
                <h4 style={{
                  fontSize: isSidebar ? '0.96rem' : '1.08rem',
                  color: 'var(--text-primary)',
                  marginBottom: '4px',
                  lineHeight: 1.35,
                  wordBreak: 'break-word',
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
                  <Play size={13} fill="#000000" />
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
                    color: isCopied ? '#10b981' : 'var(--text-secondary)',
                    borderColor: isCopied ? '#10b981' : 'var(--border-subtle)',
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
                    color: '#ff6b6b',
                    borderColor: 'rgba(255, 107, 107, 0.3)',
                    background: 'rgba(255, 107, 107, 0.06)',
                  }}
                  title="Delete session"
                >
                  {deletingPollId === p.id ? (
                    <Loader2 size={13} className="animate-spin" />
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

  // --- Multi-Question Form Handlers ---

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

  // Dynamic Options per Question (min 2, max 4 options strictly enforced)
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

    // Filter out completely blank trailing questions if user clicked "Add Question" but left it empty
    const nonBlankQuestions = questions.filter(
      (q) => q.title.trim() !== '' || q.options.some((opt) => opt.text.trim() !== '')
    );
    const questionsToSubmit = nonBlankQuestions.length > 0 ? nonBlankQuestions : questions;

    // Validate overall poll
    if (questionsToSubmit.length === 0 || !questionsToSubmit[0].title.trim()) {
      setErrorMessage('Please enter at least one question prompt to launch your poll session.');
      return;
    }

    // Validate each question and choices
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
      // Top-level fallbacks for backward compatibility with older Go backend compile
      question: firstQ.title.trim(),
      options: firstQ.options.map((opt, i) => ({
        text: opt.text.trim() || `Option ${i + 1}`,
        color: opt.color || PALETTE[i % PALETTE.length],
      })),
      // Multi-question payload for Phase 6
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
      console.log('Submitting poll payload:', payload);
      // POST /api/polls with Bearer JWT token
      const newPoll = await createPoll(payload);
      console.log('Poll created successfully:', newPoll);
      const pollId = newPoll.id || newPoll._id;

      if (!pollId) {
        throw new Error('Server created poll but did not return an ID.');
      }

      setCreatedPoll(newPoll);
      localStorage.setItem('pulsecast_latest_poll_id', pollId);

      loadMyPolls();

      // Navigate to presentation view
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

  // --- Render Unauthenticated State: Login / Sign Up Card ---
  if (!currentUser) {
    return (
      <main
        style={{
          maxWidth: '460px',
          margin: isMobile ? '20px auto 90px' : '50px auto',
          padding: isMobile ? '0 14px' : '0 20px',
          width: '100%',
          position: 'relative',
        }}
      >
        {/* Ambient Specular Halo behind card */}
        <div
          style={{
            position: 'absolute',
            top: '25%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: isMobile ? '240px' : '320px',
            height: isMobile ? '240px' : '320px',
            background: 'radial-gradient(circle, rgba(72, 229, 194, 0.12) 0%, rgba(99, 102, 241, 0.08) 50%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(60px)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: isMobile ? '20px' : '28px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '5px 14px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(72, 229, 194, 0.08)',
                border: '1px solid rgba(72, 229, 194, 0.25)',
                color: 'var(--accent-primary)',
                fontSize: '0.8rem',
                fontWeight: 600,
                letterSpacing: '0.04em',
                marginBottom: '16px',
              }}
            >
              <ShieldCheck size={14} />
              Creator Authentication
            </div>
            <h1 style={{ fontSize: isMobile ? '1.85rem' : '2.3rem', marginBottom: '8px', letterSpacing: '-0.03em' }}>
              Creator <span className="gradient-text">Portal</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: isMobile ? '0.85rem' : '0.92rem', lineHeight: 1.5 }}>
              Sign in or create an account to design interactive multi-question polls with instant real-time presentations.
            </p>
          </div>

          {/* Auth Card with True Translucent Glass */}
          <div className="glass-panel" style={{ padding: isMobile ? '24px 18px' : '32px 28px' }}>
            {/* Segmented Tab Switcher */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '12px',
                padding: '4px',
                marginBottom: '24px',
                gap: '4px',
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
                  border: 'none',
                  borderRadius: '9px',
                  background: authMode === 'login' ? 'linear-gradient(135deg, #48E5C2 0%, #36d4b2 100%)' : 'transparent',
                  color: authMode === 'login' ? '#000000' : 'var(--text-secondary)',
                  fontWeight: authMode === 'login' ? 700 : 500,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  boxShadow: authMode === 'login' ? '0 2px 10px rgba(72, 229, 194, 0.35)' : 'none',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
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
                  border: 'none',
                  borderRadius: '9px',
                  background: authMode === 'signup' ? 'linear-gradient(135deg, #48E5C2 0%, #36d4b2 100%)' : 'transparent',
                  color: authMode === 'signup' ? '#000000' : 'var(--text-secondary)',
                  fontWeight: authMode === 'signup' ? 700 : 500,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  boxShadow: authMode === 'signup' ? '0 2px 10px rgba(72, 229, 194, 0.35)' : 'none',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                Create Account
              </button>
            </div>

            {authError && (
              <div
                style={{
                  background: 'rgba(244, 63, 94, 0.12)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: '#fda4af',
                  fontSize: '0.86rem',
                  marginBottom: '20px',
                }}
              >
                <AlertCircle size={17} color="#f43f5e" flexShrink={0} />
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
                {/* Fallback button: triggers Google prompt or shows clear configuration instructions */}
                <button
                  type="button"
                  onClick={() => {
                    if (window.google?.accounts?.id && googleClientId) {
                      window.google.accounts.id.prompt();
                    } else if (!googleClientId) {
                      setAuthError('Google Client ID is not configured yet. Set VITE_GOOGLE_CLIENT_ID in frontend/.env to enable Google OAuth.');
                    } else {
                      setAuthError('Google Identity Services is initializing. Please wait a moment and try again.');
                    }
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    padding: '11px 18px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
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

              {/* Clean Divider */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  margin: '18px 0 6px 0',
                  gap: '12px',
                }}
              >
                <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
                <span
                  style={{
                    fontSize: '0.74rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                  }}
                >
                  Or continue with email
                </span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
              </div>
            </div>

            <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {authMode === 'signup' && (
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      marginBottom: '6px',
                      color: 'var(--text-secondary)',
                      letterSpacing: '0.02em',
                    }}
                  >
                    Full Name
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Srikanth"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    marginBottom: '6px',
                    color: 'var(--text-secondary)',
                    letterSpacing: '0.02em',
                  }}
                >
                  Email Address
                </label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="creator@pulsecast.dev"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    marginBottom: '6px',
                    color: 'var(--text-secondary)',
                    letterSpacing: '0.02em',
                  }}
                >
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
                style={{ width: '100%', justifyContent: 'center', marginTop: '6px', padding: '13px' }}
              >
                {authLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : authMode === 'signup' ? (
                  'Create Creator Account'
                ) : (
                  'Sign In & Access Dashboard'
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  // --- Render Sub-Components for Laptop & Mobile Layouts ---

  const renderQuickJoinCard = () => (
    <div
      className="glass-panel"
      style={{
        padding: isMobile ? '18px 16px' : '20px 22px',
        borderRadius: '16px',
        border: '1px solid rgba(72, 229, 194, 0.25)',
        background: 'linear-gradient(135deg, rgba(72, 229, 194, 0.06) 0%, rgba(11, 15, 25, 0.6) 100%)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'rgba(72, 229, 194, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-primary)',
            flexShrink: 0,
          }}
        >
          <Smartphone size={18} />
        </div>
        <div>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#FCFAF9', marginBottom: '2px' }}>
            Audience Quick Join
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Enter presenter's Session PIN to vote:
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
        style={{ display: 'flex', gap: '8px', flexDirection: isMobile ? 'column' : 'row' }}
      >
        <input
          type="text"
          placeholder="e.g. 6aacb98f5be43c0cbaadccaa"
          value={joinSessionInput}
          onChange={(e) => setJoinSessionInput(e.target.value)}
          className="input-field"
          style={{ padding: '9px 12px', fontSize: '0.85rem', flex: 1 }}
        />
        <button
          type="submit"
          className="btn-primary"
          disabled={!joinSessionInput.trim()}
          style={{ padding: '9px 14px', fontSize: '0.85rem', whiteSpace: 'nowrap', justifyContent: 'center' }}
        >
          Join Poll
          <ArrowRight size={14} />
        </button>
      </form>
    </div>
  );

  const renderBuilderContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Success Notification */}
      {createdPoll && (
        <div
          className="glass-panel-glow"
          style={{
            padding: '20px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', color: '#10b981' }}>
            <CheckCircle2 size={20} />
            <h3 style={{ fontSize: '1.1rem', color: '#ffffff' }}>Your Polling Session Is Live!</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '14px' }}>
            Session ID: <strong style={{ color: 'var(--text-primary)' }}>{createdPoll.id}</strong> ({createdPoll.questions?.length || 1} questions).
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-primary"
              onClick={() => navigate(`/present/${createdPoll.id}`)}
              style={{ gap: '8px', padding: '9px 16px', fontSize: '0.88rem' }}
            >
              <Play size={15} fill="#000000" />
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
          </div>
        </div>
      )}

      {/* Quick Polling Templates */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isMobile ? 'flex-start' : 'flex-start',
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
            color: 'var(--accent-cyan)',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            flexShrink: 0,
          }}
        >
          <Sparkles size={14} />
          Presets:
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
                borderRadius: '10px',
                background: isSelected ? 'linear-gradient(135deg, #48E5C2 0%, #36d4b2 100%)' : 'rgba(255, 255, 255, 0.04)',
                border: isSelected ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                color: isSelected ? '#000000' : '#F8FAFC',
                fontWeight: isSelected ? 700 : 500,
                cursor: 'pointer',
                boxShadow: isSelected ? '0 2px 10px rgba(72, 229, 194, 0.35)' : 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              <IconComp size={13} />
              <span>{tmpl.name}</span>
            </button>
          );
        })}
      </div>

      {/* Main Multi-Question Poll Form */}
      <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Session / Poll Title Card */}
        <div className="glass-panel" style={{ padding: isMobile ? '18px 16px' : '24px' }}>
          <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
            Session Title
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="e.g. Sprint Retrospective & Tech Architecture 2026"
            value={pollTitle}
            onChange={(e) => setPollTitle(e.target.value)}
            style={{ fontSize: isMobile ? '0.92rem' : '1rem', padding: '11px 14px' }}
          />
        </div>

        {/* Questions Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {questions.map((q, qIdx) => (
            <div
              key={q.id || qIdx}
              className="glass-panel"
              style={{
                padding: isMobile ? '18px 16px' : '24px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                position: 'relative',
              }}
            >
              {/* Question Header & Delete */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: 'var(--accent-cyan)',
                    background: 'rgba(72, 229, 194, 0.1)',
                    padding: '3px 9px',
                    borderRadius: '7px',
                  }}
                >
                  Question {qIdx + 1} of {questions.length}
                </span>

                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(qIdx)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      color: '#f87171',
                      padding: '4px 9px',
                      borderRadius: '7px',
                      fontSize: '0.75rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={13} />
                    <span>Remove</span>
                  </button>
                )}
              </div>

              {/* Question Input */}
              <input
                type="text"
                className="input-field"
                placeholder={`Type Question ${qIdx + 1}...`}
                value={q.title}
                onChange={(e) => handleQuestionTitleChange(qIdx, e.target.value)}
                style={{ marginBottom: '14px', fontWeight: 600, fontSize: '0.94rem' }}
              />

              {/* Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                {q.options.map((opt, oIdx) => (
                  <div key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        background: opt.color || PALETTE[oIdx % PALETTE.length],
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.82rem',
                        color: isLightColor(opt.color || PALETTE[oIdx % PALETTE.length]) ? '#000000' : '#fff',
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
                      style={{ flex: 1, padding: '9px 12px', fontSize: '0.88rem' }}
                    />
                    {q.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(qIdx, oIdx)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '6px',
                        }}
                        title="Remove choice"
                      >
                        <Trash2 size={14} />
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
                  style={{
                    marginTop: '10px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: 'none',
                    border: '1px dashed var(--border-subtle)',
                    color: 'var(--accent-cyan)',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  <Plus size={13} />
                  Add Choice ({q.options.length}/4)
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add Another Question */}
        <button
          type="button"
          onClick={handleAddQuestion}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: 'rgba(72, 229, 194, 0.06)',
            border: '2px dashed rgba(72, 229, 194, 0.4)',
            color: '#48E5C2',
            padding: '13px',
            borderRadius: '14px',
            cursor: 'pointer',
            fontSize: '0.92rem',
            fontWeight: 700,
          }}
        >
          <Plus size={17} color="#48E5C2" />
          Add Another Question to Session
        </button>

        {/* Error Alert */}
        {errorMessage && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '12px',
              padding: '11px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#fca5a5',
              fontSize: '0.88rem',
            }}
          >
            <AlertCircle size={17} color="#ef4444" flexShrink={0} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Launch Button */}
        <button
          type="button"
          onClick={handlePollSubmit}
          className="btn-primary"
          disabled={isSubmitting}
          style={{
            width: '100%',
            justifyContent: 'center',
            padding: '14px',
            fontSize: '0.98rem',
            borderRadius: '14px',
            background: '#48E5C2',
            color: '#000000',
            fontWeight: 800,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
          }}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Saving Session to MongoDB...
            </>
          ) : (
            <>
              <Play size={16} fill="#000000" />
              Launch Session & Open Projector
              <ArrowRight size={17} />
            </>
          )}
        </button>
      </form>
    </div>
  );

  // --- Profile Bar Component ---
  const renderProfileBar = () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '10px 14px' : '14px 20px',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid var(--border-subtle)',
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
            borderRadius: '50%',
            background: 'var(--accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: isMobile ? '0.85rem' : '0.95rem',
            overflow: 'hidden',
            border: '1.5px solid rgba(72, 229, 194, 0.4)',
          }}
        >
          {currentUser.avatar ? (
            <img
              src={currentUser.avatar}
              alt={currentUser.name || 'Creator'}
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
          <div style={{ fontSize: isMobile ? '0.88rem' : '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Welcome, {currentUser.name}
          </div>
          <div style={{ fontSize: isMobile ? '0.74rem' : '0.8rem', color: 'var(--text-muted)' }}>
            {currentUser.email} &bull; <span style={{ color: '#10b981' }}>Verified Creator</span>
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

  // --- MOBILE LAYOUT (<768px) ---
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
            background: 'rgba(0, 0, 0, 0.45)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '4px',
            marginBottom: '18px',
            gap: '4px',
          }}
        >
          <button
            type="button"
            onClick={() => setMobileTab('builder')}
            style={{
              padding: '9px 4px',
              border: 'none',
              borderRadius: '9px',
              background: mobileTab === 'builder' ? 'linear-gradient(135deg, #48E5C2 0%, #36d4b2 100%)' : 'transparent',
              color: mobileTab === 'builder' ? '#000000' : 'var(--text-secondary)',
              fontWeight: mobileTab === 'builder' ? 700 : 500,
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              transition: 'all 0.2s ease',
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
              border: 'none',
              borderRadius: '9px',
              background: mobileTab === 'sessions' ? 'linear-gradient(135deg, #48E5C2 0%, #36d4b2 100%)' : 'transparent',
              color: mobileTab === 'sessions' ? '#000000' : 'var(--text-secondary)',
              fontWeight: mobileTab === 'sessions' ? 700 : 500,
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              transition: 'all 0.2s ease',
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
              border: 'none',
              borderRadius: '9px',
              background: mobileTab === 'join' ? 'linear-gradient(135deg, #48E5C2 0%, #36d4b2 100%)' : 'transparent',
              color: mobileTab === 'join' ? '#000000' : 'var(--text-secondary)',
              fontWeight: mobileTab === 'join' ? 700 : 500,
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              transition: 'all 0.2s ease',
            }}
          >
            <Smartphone size={13} />
            <span>Join PIN</span>
          </button>
        </div>

        {mobileTab === 'builder' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '18px' }}>
              <h2 style={{ fontSize: '1.45rem', marginBottom: '4px' }}>
                Design <span className="gradient-text">Live Poll Session</span>
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                Craft interactive questions with real-time analytics.
              </p>
            </div>
            {renderBuilderContent()}
          </div>
        )}

        {mobileTab === 'sessions' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Your Sessions ({myPolls.length})</h2>
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

  // --- LAPTOP / DESKTOP STUDIO LAYOUT (>=768px) ---
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
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '5px 14px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(99, 102, 241, 0.12)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            color: 'var(--accent-primary)',
            fontSize: '0.82rem',
            fontWeight: 600,
            marginBottom: '10px',
          }}
        >
          <ListOrdered size={14} />
          Creator Studio & Dynamic Multi-Question Suite
        </div>
        <h1 style={{ fontSize: '2.4rem', marginBottom: '8px' }}>
          Design Your <span className="gradient-text">Live Polling Session</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.96rem', maxWidth: '620px', margin: '0 auto' }}>
          Create multiple interactive questions under a single session. Presenters can cycle questions and conclude with an animated Leaderboard!
        </p>
      </div>

      {/* Studio 2-Column Grid */}
      <div className="creator-studio-layout">
        {/* Left/Main Column: Form & Questions */}
        <div>
          {renderBuilderContent()}
        </div>

        {/* Right Sidebar Column: Quick Join & Session Manager */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {renderQuickJoinCard()}

          {/* Sessions List Panel */}
          <div className="glass-panel" style={{ padding: '22px 20px', borderRadius: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={17} color="var(--accent-primary)" />
                <h3 style={{ fontSize: '1.08rem', fontWeight: 700 }}>Your Sessions ({myPolls.length})</h3>
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
