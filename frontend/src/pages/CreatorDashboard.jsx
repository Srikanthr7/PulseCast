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
} from 'lucide-react';
import { createPoll, login, signup, getUser, getToken, clearAuth, getMyPolls, deletePoll } from '../api';

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
      <main style={{ maxWidth: '460px', margin: '50px auto', padding: '0 20px', width: '100%', position: 'relative' }}>
        {/* Ambient Specular Halo behind card */}
        <div
          style={{
            position: 'absolute',
            top: '25%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '320px',
            height: '320px',
            background: 'radial-gradient(circle, rgba(72, 229, 194, 0.12) 0%, rgba(99, 102, 241, 0.08) 50%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(60px)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
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
            <h1 style={{ fontSize: '2.3rem', marginBottom: '8px', letterSpacing: '-0.03em' }}>
              Creator <span className="gradient-text">Portal</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.5 }}>
              Sign in or create an account to design interactive multi-question polls with instant real-time presentations.
            </p>
          </div>

          {/* Auth Card with True Translucent Glass */}
          <div className="glass-panel" style={{ padding: '32px 28px' }}>
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

  // --- Render Authenticated State: Multi-Question Builder ---
  return (
    <main style={{ maxWidth: '840px', margin: '0 auto', padding: '40px 20px' }}>
      {/* Creator Profile Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle)',
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.95rem',
            }}
          >
            {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : <User size={18} />}
          </div>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Welcome, {currentUser.name}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {currentUser.email} &bull; <span style={{ color: '#10b981' }}>Verified Creator</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="btn-secondary"
          style={{ padding: '8px 14px', fontSize: '0.85rem', gap: '6px' }}
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>

      {/* Header Title */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(99, 102, 241, 0.12)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            color: 'var(--accent-primary)',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: '12px',
          }}
        >
          <ListOrdered size={15} />
          Multi-Question Dynamic Poll Builder
        </div>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>
          Design Your <span className="gradient-text">Live Poll Session</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '620px', margin: '0 auto' }}>
          Create multiple interactive questions under a single session. Presenters can cycle questions and conclude with an animated Leaderboard!
        </p>
      </div>

      {/* Audience Quick Join with Session ID (No Wi-Fi restrictions) */}
      <div
        className="glass-panel"
        style={{
          padding: '20px 24px',
          borderRadius: '16px',
          marginBottom: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          border: '1px solid rgba(72, 229, 194, 0.25)',
          background: 'linear-gradient(135deg, rgba(72, 229, 194, 0.06) 0%, rgba(11, 15, 25, 0.6) 100%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'rgba(72, 229, 194, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)',
              flexShrink: 0,
            }}
          >
            <Smartphone size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FCFAF9', marginBottom: '3px' }}>
              Audience Member? Join a Live Poll
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Works from any network anywhere — enter the presenter's Unique Session ID:
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
          style={{ display: 'flex', gap: '8px', flex: 1, maxWidth: '420px', minWidth: '260px' }}
        >
          <input
            type="text"
            placeholder="Paste Unique Session ID..."
            value={joinSessionInput}
            onChange={(e) => setJoinSessionInput(e.target.value)}
            className="input-field"
            style={{ padding: '9px 14px', fontSize: '0.88rem' }}
          />
          <button
            type="submit"
            className="btn-primary"
            disabled={!joinSessionInput.trim()}
            style={{ padding: '9px 18px', fontSize: '0.88rem', whiteSpace: 'nowrap' }}
          >
            Join Poll
            <ArrowRight size={15} />
          </button>
        </form>
      </div>

      {/* Success Notification */}
      {createdPoll && (
        <div
          className="glass-panel-glow"
          style={{
            padding: '24px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '28px',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', color: '#10b981' }}>
            <CheckCircle2 size={22} />
            <h3 style={{ fontSize: '1.2rem', color: '#ffffff' }}>Your Multi-Question Poll Was Created!</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
            Session ID: <strong style={{ color: 'var(--text-primary)' }}>{createdPoll.id}</strong> ({createdPoll.questions?.length || 1} questions). Routing to projector view...
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-primary"
              onClick={() => navigate(`/present/${createdPoll.id}`)}
              style={{ gap: '8px' }}
            >
              <Play size={16} />
              Open Projector View
            </button>
          </div>
        </div>
      )}

      {/* Quick Polling Templates */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          marginBottom: '28px',
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontSize: '0.88rem',
            color: 'var(--accent-cyan)',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Sparkles size={16} />
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
                fontSize: '0.84rem',
                padding: '8px 16px',
                borderRadius: '12px',
                background: isSelected ? 'linear-gradient(135deg, #48E5C2 0%, #36d4b2 100%)' : 'rgba(255, 255, 255, 0.04)',
                border: isSelected ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                color: isSelected ? '#000000' : '#F8FAFC',
                fontWeight: isSelected ? 700 : 500,
                cursor: 'pointer',
                boxShadow: isSelected ? '0 2px 12px rgba(72, 229, 194, 0.35)' : 'none',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {IconComp && <IconComp size={15} />}
              {tmpl.name}
            </button>
          );
        })}

        {(pollTitle || questions.some((q) => q.title || q.options.some((o) => o.text))) && (
          <button
            type="button"
            onClick={handleResetForm}
            className="btn-secondary"
            style={{
              fontSize: '0.82rem',
              padding: '7px 14px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 600,
            }}
            title="Reset form to a clean, blank poll"
          >
            <RotateCcw size={13} />
            Reset to Blank
          </button>
        )}
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '24px',
            color: '#fca5a5',
            fontSize: '0.95rem',
          }}
        >
          <AlertCircle size={20} color="#ef4444" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Multi-Question Form */}
      <form noValidate onSubmit={handlePollSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Session Title Card */}
        <div className="glass-panel" style={{ padding: '24px 28px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.95rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '8px',
            }}
          >
            Poll Session Title
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="e.g. Weekly Tech Sprint Poll (or pick a preset above)"
            value={pollTitle}
            onChange={(e) => setPollTitle(e.target.value)}
            style={{ fontSize: '1.05rem', fontWeight: 600 }}
          />
        </div>

        {/* Dynamic Questions List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {questions.map((q, qIdx) => (
            <div
              key={q.id || qIdx}
              className="glass-panel"
              style={{
                padding: '24px 28px',
                border: '1px solid rgba(252, 250, 249, 0.16)',
                borderRadius: '16px',
                position: 'relative',
              }}
            >
              {/* Question Card Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    style={{
                      background: '#48E5C2',
                      color: '#000000',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontFamily: 'var(--font-heading)',
                    }}
                  >
                    Question #{qIdx + 1}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'rgba(252, 250, 249, 0.65)' }}>
                    ({q.options.length} choices &bull; min 2, max 4)
                  </span>
                </div>

                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(qIdx)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.85rem',
                      padding: '4px 8px',
                      borderRadius: '4px',
                    }}
                    title="Delete Question"
                  >
                    <Trash2 size={16} />
                    <span>Delete</span>
                  </button>
                )}
              </div>

              {/* Question Title Input */}
              <div style={{ marginBottom: '18px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: '6px',
                  }}
                >
                  Question Prompt
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. What is your preferred architecture pattern?"
                  value={q.title}
                  onChange={(e) => handleQuestionTitleChange(qIdx, e.target.value)}
                />
              </div>

              {/* Dynamic Options (min 2, max 4) */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: '8px',
                  }}
                >
                  Options (Choices)
                </label>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {q.options.map((opt, oIdx) => (
                    <div key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {/* Option Letter Indicator */}
                      <span
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: opt.color || PALETTE[oIdx % PALETTE.length],
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          color: isLightColor(opt.color || PALETTE[oIdx % PALETTE.length]) ? '#000000' : '#fff',
                          flexShrink: 0,
                        }}
                      >
                        {String.fromCharCode(65 + oIdx)}
                      </span>

                      {/* Option Text Input */}
                      <input
                        type="text"
                        className="input-field"
                        placeholder={`Choice ${String.fromCharCode(65 + oIdx)}`}
                        value={opt.text}
                        onChange={(e) => handleOptionChange(qIdx, oIdx, e.target.value)}
                      />

                      {/* Remove Option Button (disabled if only 2 options) */}
                      {q.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(qIdx, oIdx)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '6px',
                            transition: 'color 0.2s ease',
                          }}
                          title="Remove option"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add Option Button (allowed up to 4 options) */}
                {q.options.length < 4 && (
                  <button
                    type="button"
                    onClick={() => handleAddOption(qIdx)}
                    style={{
                      marginTop: '12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'none',
                      border: '1px dashed var(--border-subtle)',
                      color: 'var(--accent-cyan)',
                      padding: '8px 14px',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Plus size={14} />
                    Add Choice ({q.options.length}/4)
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add Question Button */}
        <button
          type="button"
          onClick={handleAddQuestion}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: 'rgba(72, 229, 194, 0.08)',
            border: '2px dashed #48E5C2',
            color: '#48E5C2',
            padding: '16px',
            borderRadius: '16px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 700,
            fontFamily: 'var(--font-body)',
            transition: 'all 0.2s ease',
          }}
        >
          <Plus size={20} color="#48E5C2" />
          Add Another Question to Session
        </button>

        {/* Submit Button & Direct Error Alert */}
        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {errorMessage && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '16px',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: '#fca5a5',
                fontSize: '0.95rem',
              }}
            >
              <AlertCircle size={20} color="#ef4444" flexShrink={0} />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handlePollSubmit}
            className="btn-primary"
            disabled={isSubmitting}
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '16px',
              fontSize: '1.05rem',
              borderRadius: '16px',
              background: '#48E5C2',
              color: '#000000',
              fontWeight: 800,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Saving Session to MongoDB & Opening Projector...
              </>
            ) : (
              <>
                <Play size={18} fill="#000000" />
                Launch Multi-Question Poll & Open Presentation Screen
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </div>
      </form>

      {/* --- Section: Your Created Polls List --- */}
      <div style={{ marginTop: '50px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
          }}
        >
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>
            Your Poll Sessions ({myPolls.length})
          </h2>
          <button
            onClick={loadMyPolls}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          >
            Refresh List
          </button>
        </div>

        {loadingPolls && myPolls.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>Loading your polls from MongoDB...</p>
        ) : myPolls.length === 0 ? (
          <div className="glass-panel" style={{ padding: '32px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)' }}>
              You haven't created any polls yet. Build your first multi-question poll above!
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {myPolls.map((p) => {
              const qCount = p.questions?.length || (p.question ? 1 : 0);
              const displayTitle = p.title || p.question || 'Untitled Poll Session';
              return (
                <div
                  key={p.id}
                  className="glass-panel"
                  style={{
                    padding: '18px 22px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '16px',
                  }}
                >
                  <div style={{ maxWidth: '540px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--accent-cyan)',
                          background: 'rgba(72, 229, 194, 0.15)',
                          border: '1px solid rgba(72, 229, 194, 0.3)',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontWeight: 600,
                        }}
                      >
                        ID: {p.id}
                      </span>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: p.status === 'completed' ? '#F3D3BD' : '#48E5C2',
                          background: p.status === 'completed' ? 'rgba(243, 211, 189, 0.15)' : 'rgba(72, 229, 194, 0.15)',
                          border: `1px solid ${p.status === 'completed' ? 'rgba(243, 211, 189, 0.35)' : 'rgba(72, 229, 194, 0.35)'}`,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {p.status === 'completed' ? 'Finished' : 'Active'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {qCount} question{qCount > 1 ? 's' : ''} &bull; {p.total_votes || 0} votes
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '4px', wordBreak: 'break-word' }}>
                      {displayTitle}
                    </h3>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Link
                      to={`/present/${p.id}`}
                      className="btn-primary"
                      style={{ padding: '8px 16px', fontSize: '0.85rem', gap: '6px' }}
                    >
                      <Play size={14} />
                      Projector View
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDeletePoll(p.id)}
                      disabled={deletingPollId === p.id}
                      className="btn-secondary"
                      style={{
                        padding: '8px 14px',
                        fontSize: '0.85rem',
                        gap: '6px',
                        color: '#ff6b6b',
                        borderColor: 'rgba(255, 107, 107, 0.4)',
                        background: 'rgba(255, 107, 107, 0.08)',
                        cursor: deletingPollId === p.id ? 'not-allowed' : 'pointer',
                        opacity: deletingPollId === p.id ? 0.7 : 1,
                      }}
                      title="Delete this polling session"
                    >
                      {deletingPollId === p.id ? (
                        <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                      ) : (
                        <Trash2 size={14} />
                      )}
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
