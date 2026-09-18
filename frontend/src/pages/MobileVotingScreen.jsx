import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  CheckCircle2,
  Lock,
  AlertCircle,
  RefreshCw,
  User,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Trophy,
  PartyPopper,
  LogOut,
  Smartphone,
  Hash,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useLivePoll } from '../hooks/useLivePoll';
import { castVote } from '../api';

export default function MobileVotingScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { poll, isCompleted, loading, error, isConnected } = useLivePoll(id);
  const [inputSessionId, setInputSessionId] = useState('');

  // Audience Name Capture State - Always require name to be entered/confirmed first when opening QR link
  const [voterName, setVoterName] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('pulsecast_voter_name') || '';
    }
    return '';
  });
  const [nameInput, setNameInput] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('pulsecast_voter_name') || '';
    }
    return '';
  });
  const [nameSubmitted, setNameSubmitted] = useState(false);

  // Multi-Question Navigation State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Per-question voted choices map: { [questionId]: optionId }
  const [votedOptions, setVotedOptions] = useState(() => {
    if (typeof window !== 'undefined' && id) {
      try {
        const saved = localStorage.getItem(`pulsecast_multi_votes_${id}`);
        if (saved) return JSON.parse(saved);
        // Fallback to legacy single vote
        const single = localStorage.getItem(`pulsecast_voted_${id}`);
        if (single) return { [id]: single, default: single };
      } catch (e) {
        return {};
      }
    }
    return {};
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voteError, setVoteError] = useState(null);

  // Touch Swipe Gesture State for Mobile
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 50;

  // Name submission handler
  const handleNameSubmit = (e) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    setVoterName(trimmed);
    localStorage.setItem('pulsecast_voter_name', trimmed);
    setNameSubmitted(true);
  };

  // Resolve questions array
  const questions = (poll?.questions && poll.questions.length > 0)
    ? poll.questions
    : (poll ? [
        {
          id: poll.id || id,
          title: poll.question || 'Live Poll Question',
          options: poll.options || [],
        },
      ] : []);

  const currentQ = questions[currentQuestionIndex] || questions[0];
  const currentQId = currentQ?.id || currentQuestionIndex;
  const currentSelectedOptionId = votedOptions[currentQId];
  const hasVotedCurrent = Boolean(currentSelectedOptionId);

  // Swipe handling
  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
    if (isRightSwipe && currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  // Vote submission handler for a specific question & choice
  const handleVote = async (optionId) => {
    if (isSubmitting || hasVotedCurrent || !id || !currentQ) return;

    setVoteError(null);
    setIsSubmitting(true);

    // Optimistic UI: Immediately mark question as voted locally
    const updatedVotes = { ...votedOptions, [currentQId]: optionId };
    setVotedOptions(updatedVotes);
    localStorage.setItem(`pulsecast_multi_votes_${id}`, JSON.stringify(updatedVotes));
    localStorage.setItem(`pulsecast_voted_${id}`, optionId); // Legacy fallback

    try {
      confetti({
        particleCount: 55,
        spread: 60,
        origin: { y: 0.85 },
        colors: ['#6366f1', '#06b6d4', '#10b981', '#f59e0b'],
      });
    } catch (e) {
      // ignore
    }

    try {
      await castVote(id, optionId, voterName || 'Audience Member', currentQ.id);
      setIsSubmitting(false);

      // Auto-advance to next unanswered question after 600ms if available
      if (currentQuestionIndex < questions.length - 1) {
        setTimeout(() => {
          setCurrentQuestionIndex((prev) => prev + 1);
        }, 600);
      }
    } catch (err) {
      console.error('Vote failed:', err);
      // Rollback optimistic state
      const rollback = { ...votedOptions };
      delete rollback[currentQId];
      setVotedOptions(rollback);
      localStorage.setItem(`pulsecast_multi_votes_${id}`, JSON.stringify(rollback));
      setIsSubmitting(false);
      setVoteError(err.message || 'Vote failed to register on server. Please try again.');
    }
  };

  // Reset votes on this device for testing
  const handleResetDeviceVotes = () => {
    if (typeof window !== 'undefined' && id) {
      localStorage.removeItem(`pulsecast_multi_votes_${id}`);
      localStorage.removeItem(`pulsecast_voted_${id}`);
    }
    setVotedOptions({});
    setVoteError(null);
  };

  // If visited /vote directly without an ID parameter
  if (!id) {
    return (
      <main style={{ maxWidth: '460px', margin: '60px auto', padding: '0 20px', textAlign: 'center' }}>
        <div className="glass-panel-glow" style={{ padding: '36px 28px', borderRadius: '20px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              background: 'rgba(72, 229, 194, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px',
              color: 'var(--accent-primary)',
            }}
          >
            <Smartphone size={28} />
          </div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>
            Join Live Poll
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
            Enter the Unique Session ID from the presenter's screen to vote live from any device:
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (inputSessionId.trim()) {
                navigate(`/vote/${inputSessionId.trim()}`);
              }
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
          >
            <input
              type="text"
              placeholder="e.g. 6aacb98f5be43c0cbaadccaa"
              value={inputSessionId}
              onChange={(e) => setInputSessionId(e.target.value)}
              className="input-field"
              style={{ textAlign: 'center', fontSize: '1rem', padding: '12px 16px' }}
              autoFocus
            />
            <button
              type="submit"
              disabled={!inputSessionId.trim()}
              className="btn-primary"
              style={{ justifyContent: 'center', padding: '12px', fontSize: '1rem' }}
            >
              Join Poll
              <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </main>
    );
  }

  if (loading && !poll) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
        <RefreshCw size={32} className="animate-spin" color="var(--accent-primary)" />
        <p style={{ color: 'var(--text-secondary)' }}>Loading live poll from MongoDB...</p>
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', maxWidth: '440px', margin: '0 auto' }}>
        <div className="glass-panel" style={{ padding: '32px 24px', borderRadius: '18px' }}>
          <AlertCircle size={40} color="#ef4444" style={{ margin: '0 auto 14px' }} />
          <h2 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>Poll Not Found</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '20px' }}>
            {error || 'This live poll session could not be located. It may have expired or the ID is incorrect.'}
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (inputSessionId.trim()) {
                navigate(`/vote/${inputSessionId.trim()}`);
              }
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}
          >
            <input
              type="text"
              placeholder="Enter another Session ID..."
              value={inputSessionId}
              onChange={(e) => setInputSessionId(e.target.value)}
              className="input-field"
              style={{ textAlign: 'center', fontSize: '0.9rem', padding: '10px 14px' }}
            />
            <button
              type="submit"
              disabled={!inputSessionId.trim()}
              className="btn-primary"
              style={{ justifyContent: 'center', padding: '10px', fontSize: '0.9rem' }}
            >
              Try Session ID
              <ArrowRight size={16} />
            </button>
          </form>
          <Link to="/" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'underline' }}>
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  // --- 1. Screen Lock when POLL_COMPLETED is received ---
  const isLocked = isCompleted || poll.status === 'completed';

  if (isLocked) {
    return (
      <main
        style={{
          maxWidth: '520px',
          margin: '0 auto',
          padding: '40px 20px',
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="glass-panel-glow"
          style={{
            padding: '40px 32px',
            borderRadius: 'var(--radius-lg)',
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(99, 102, 241, 0.12) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            boxShadow: '0 0 40px rgba(16, 185, 129, 0.25)',
            width: '100%',
          }}
        >
          {/* Animated Celebration Icon */}
          <div
            style={{
              width: '76px',
              height: '76px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              color: '#ffffff',
              boxShadow: '0 0 25px rgba(16, 185, 129, 0.5)',
            }}
          >
            <PartyPopper size={40} />
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(16, 185, 129, 0.2)',
              color: '#34d399',
              fontSize: '0.8rem',
              fontWeight: 700,
              marginBottom: '12px',
            }}
          >
            <Lock size={12} />
            POLL CONCLUDED
          </div>

          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', marginBottom: '10px' }}>
            Thanks for participating!
          </h1>

          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.5, marginBottom: '24px' }}>
            The presenter has concluded this poll session. Voting is now locked, and the final leaderboard is on the main projector screen.
          </p>

          {/* Voter Attribution Badge */}
          {voterName && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid var(--border-subtle)',
                marginBottom: '24px',
                fontSize: '0.9rem',
                color: 'var(--text-primary)',
              }}
            >
              <User size={14} color="var(--accent-cyan)" />
              <span>Attributed as: <strong>{voterName}</strong></span>
              <CheckCircle2 size={14} color="#10b981" />
            </div>
          )}

          {/* Session Summary Card */}
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '18px 20px',
              textAlign: 'left',
              marginBottom: '24px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '10px' }}>
              Your Session Activity:
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              &bull; Answered {Object.keys(votedOptions).length} of {questions.length} questions
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              &bull; Session: {poll.title || poll.question || 'Live Interactive Poll'}
            </div>
          </div>

          <Link
            to={`/present/${id}`}
            className="btn-secondary"
            style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '0.95rem' }}
          >
            <Trophy size={16} color="#f59e0b" />
            View Presentation Leaderboard
          </Link>
        </motion.div>
      </main>
    );
  }

  // --- 2. Initial Name Capture Screen (If audience member hasn't set their name) ---
  if (!nameSubmitted) {
    return (
      <main style={{ maxWidth: '440px', margin: '50px auto', padding: '0 20px', width: '100%', position: 'relative' }}>
        {/* Ambient Specular Halo */}
        <div
          style={{
            position: 'absolute',
            top: '30%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '300px',
            height: '300px',
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
                width: '54px',
                height: '54px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #48E5C2 0%, #36d4b2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: '#000000',
                boxShadow: '0 0 20px rgba(72, 229, 194, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
              }}
            >
              <User size={28} color="#000000" />
            </div>
            <h1 style={{ fontSize: '1.9rem', marginBottom: '8px', letterSpacing: '-0.03em' }}>
              Welcome to the <span className="gradient-text">Live Poll</span>
            </h1>
            {poll && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 14px',
                  borderRadius: '999px',
                  background: 'rgba(72, 229, 194, 0.1)',
                  border: '1px solid rgba(72, 229, 194, 0.3)',
                  color: 'var(--accent-cyan)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  marginBottom: '10px',
                }}
              >
                Session: {poll.title || poll.question || 'Live Interactive Poll'}
              </div>
            )}
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.5 }}>
              Please enter your name to join this session and vote live:
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '30px 26px' }}>
          <form onSubmit={handleNameSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Your Name
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Alex, Sarah, DevNinja"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                maxLength={40}
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ justifyContent: 'center', padding: '12px', fontSize: '1rem' }}
            >
              Join Session &amp; Start Voting
              <ArrowRight size={18} />
            </button>
          </form>
        </div>
        </div>
      </main>
    );
  }

  // --- 3. Multi-Question Interactive Voting Screen ---
  const progressPct = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <main
      style={{
        maxWidth: '560px',
        margin: '0 auto',
        padding: '24px 20px 48px',
        width: '100%',
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Mobile Top Bar: Session Info & Name Chip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          paddingBottom: '12px',
          borderBottom: '1px solid var(--border-subtle)',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isConnected ? '#10b981' : '#f59e0b',
              boxShadow: isConnected ? '0 0 6px #10b981' : 'none',
            }}
          />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {isConnected ? 'Connected' : 'Reconnecting...'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setNameSubmitted(false)}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-full)',
              padding: '4px 10px',
              color: 'var(--text-secondary)',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
            title="Click to edit name"
          >
            <User size={12} color="var(--accent-cyan)" />
            <span>{voterName}</span>
          </button>

          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.78rem',
              color: '#f87171',
              padding: '4px 8px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              textDecoration: 'none',
              fontWeight: 500,
            }}
            title="Exit voting session"
          >
            <LogOut size={12} />
            Exit
          </Link>
        </div>
      </div>

      {/* Multi-Question Progress Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Swipe or use buttons to navigate
          </span>
        </div>

        {/* Progress Bar */}
        <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
          <motion.div
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.3 }}
            style={{
              height: '100%',
              background: 'var(--accent-gradient)',
              borderRadius: '3px',
            }}
          />
        </div>

        {/* Question Bubble Indicator Dots */}
        {questions.length > 1 && (
          <div style={{ display: 'flex', gap: '6px', marginTop: '12px', justifyContent: 'center' }}>
            {questions.map((q, idx) => {
              const isAnswered = Boolean(votedOptions[q.id || idx]);
              const isCurrent = idx === currentQuestionIndex;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentQuestionIndex(idx)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: isCurrent ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                    background: isCurrent ? 'rgba(99, 102, 241, 0.2)' : isAnswered ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    color: isCurrent ? '#ffffff' : isAnswered ? '#34d399' : 'var(--text-muted)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  title={`Go to Question ${idx + 1}`}
                >
                  {isAnswered ? <Check size={14} /> : idx + 1}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Current Question & Voting Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQId}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="glass-panel"
          style={{ padding: '28px 24px', marginBottom: '24px' }}
        >
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.35, marginBottom: '20px' }}>
            {currentQ?.title}
          </h2>

          {/* Error Message */}
          {voteError && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#fca5a5',
                fontSize: '0.85rem',
                marginBottom: '16px',
              }}
            >
              <AlertCircle size={16} color="#ef4444" />
              <span>{voteError}</span>
            </div>
          )}

          {/* Dynamic Option Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {currentQ?.options?.map((option, idx) => {
              const isSelected = String(currentSelectedOptionId) === String(option.id);
              return (
                <motion.button
                  key={option.id || idx}
                  whileHover={!hasVotedCurrent ? { scale: 1.01 } : {}}
                  whileTap={!hasVotedCurrent ? { scale: 0.95 } : {}}
                  onClick={() => handleVote(option.id)}
                  disabled={hasVotedCurrent || isSubmitting}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    borderRadius: '16px',
                    border: isSelected ? '1.5px solid #48E5C2' : '1px solid rgba(255, 255, 255, 0.08)',
                    background: isSelected ? 'linear-gradient(135deg, #48E5C2 0%, #36d4b2 100%)' : 'rgba(255, 255, 255, 0.035)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    color: isSelected ? '#000000' : '#F8FAFC',
                    cursor: hasVotedCurrent ? 'default' : 'pointer',
                    opacity: hasVotedCurrent && !isSelected ? 0.55 : 1,
                    textAlign: 'left',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: isSelected ? '0 0 25px rgba(72, 229, 194, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.3)' : '0 2px 10px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <span
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '10px',
                        background: isSelected ? '#000000' : 'rgba(255, 255, 255, 0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.9rem',
                        color: isSelected ? '#48E5C2' : '#F8FAFC',
                        border: isSelected ? 'none' : '1px solid rgba(255, 255, 255, 0.12)',
                        flexShrink: 0,
                      }}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span style={{ fontSize: '1.05rem', fontWeight: isSelected ? 700 : 600, color: isSelected ? '#000000' : '#F8FAFC' }}>
                      {option.text}
                    </span>
                  </div>

                  {isSelected && (
                    <div
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: '#000000',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#48E5C2',
                        flexShrink: 0,
                      }}
                    >
                      <Check size={16} strokeWidth={3} />
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Vote Status Indicator */}
          {hasVotedCurrent && (
            <div
              style={{
                marginTop: '18px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#34d399',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              <CheckCircle2 size={16} />
              <span>Your answer is locked and counted live on the presentation view!</span>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Question Navigation Controls (Previous / Next) */}
      {questions.length > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <button
            type="button"
            disabled={currentQuestionIndex === 0}
            onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
            className="btn-secondary"
            style={{
              padding: '10px 18px',
              fontSize: '0.9rem',
              gap: '6px',
              opacity: currentQuestionIndex === 0 ? 0.4 : 1,
            }}
          >
            <ChevronLeft size={18} />
            Previous
          </button>

          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {currentQuestionIndex + 1} / {questions.length}
          </span>

          <button
            type="button"
            disabled={currentQuestionIndex === questions.length - 1}
            onClick={() => setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))}
            className="btn-secondary"
            style={{
              padding: '10px 18px',
              fontSize: '0.9rem',
              gap: '6px',
              opacity: currentQuestionIndex === questions.length - 1 ? 0.4 : 1,
            }}
          >
            Next
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Demo testing reset button */}
      <div style={{ textAlign: 'center', marginTop: '36px' }}>
        <button
          type="button"
          onClick={handleResetDeviceVotes}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: '0.75rem',
            textDecoration: 'underline',
            cursor: 'pointer',
          }}
        >
          Reset device votes (Demo Testing)
        </button>
      </div>
    </main>
  );
}
