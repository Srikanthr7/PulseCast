import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  RefreshCw,
  User,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Smartphone,
  Hash,
  Keyboard,
  Monitor,
  BarChart2,
  Trophy,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useLivePoll } from '../hooks/useLivePoll';
import { useDeviceType } from '../hooks/useDeviceType';
import { castVote } from '../api';
import TypewriterText from '../components/TypewriterText';
import Leaderboard from '../components/Leaderboard';
import AnimatedBar from '../components/AnimatedBar';
import PodiumChart from '../components/PodiumChart';

export default function MobileVotingScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isMobile, isTablet, isLaptop } = useDeviceType();
  const { poll, isCompleted, voterNames, loading, error, isConnected, refetch } = useLivePoll(id);
  const [inputSessionId, setInputSessionId] = useState('');
  const [completedTab, setCompletedTab] = useState('leaderboard'); // 'leaderboard' | 'chart'
  const [completedQuestionIdx, setCompletedQuestionIdx] = useState(0);
  const [showActiveQuestionChart, setShowActiveQuestionChart] = useState(false);

  // Audience Name Capture State
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
  const [nameSubmitted, setNameSubmitted] = useState(() => {
    if (typeof window !== 'undefined' && id) {
      const savedVotes = localStorage.getItem(`pulsecast_multi_votes_${id}`) || localStorage.getItem(`pulsecast_voted_${id}`);
      const savedName = localStorage.getItem('pulsecast_voter_name');
      if (savedVotes && savedName) return true;
    }
    return false;
  });

  // Multi-Question Navigation State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Per-question voted choices map: { [questionId]: optionId }
  const [votedOptions, setVotedOptions] = useState(() => {
    if (typeof window !== 'undefined' && id) {
      try {
        const saved = localStorage.getItem(`pulsecast_multi_votes_${id}`);
        if (saved) return JSON.parse(saved);
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
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = () => {
    if (navigator.clipboard && typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Touch Swipe Gesture State
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
  const isLocked = Boolean(isCompleted || poll?.status === 'completed');
  const currentQVotes = currentQ?.options?.reduce((sum, opt) => sum + (opt.votes || 0), 0) || 0;
  const currentHighestVotes = Math.max(...(currentQ?.options || []).map((o) => o.votes || 0), 0);

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

  // Vote submission handler
  const handleVote = async (optionId) => {
    if (isSubmitting || hasVotedCurrent || !id || !currentQ) return;

    setVoteError(null);
    setIsSubmitting(true);

    const updatedVotes = { ...votedOptions, [currentQId]: optionId };
    setVotedOptions(updatedVotes);
    localStorage.setItem(`pulsecast_multi_votes_${id}`, JSON.stringify(updatedVotes));
    localStorage.setItem(`pulsecast_voted_${id}`, optionId);

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.85 },
        colors: ['#2563EB', '#DC2626', '#2B2B2B', '#EBE7DD'],
      });
    } catch (e) {
      // ignore
    }

    try {
      await castVote(id, optionId, voterName || 'Audience Member', currentQ.id);
      setIsSubmitting(false);
      if (typeof refetch === 'function') {
        refetch();
      }

      if (currentQuestionIndex < questions.length - 1) {
        setTimeout(() => {
          setCurrentQuestionIndex((prev) => prev + 1);
        }, 700);
      }
    } catch (err) {
      console.error('Vote failed:', err);
      const rollback = { ...votedOptions };
      delete rollback[currentQId];
      setVotedOptions(rollback);
      localStorage.setItem(`pulsecast_multi_votes_${id}`, JSON.stringify(rollback));
      setIsSubmitting(false);
      setVoteError(err.message || 'Vote failed to register. Please try again.');
    }
  };

  const handleResetDeviceVotes = () => {
    if (typeof window !== 'undefined' && id) {
      localStorage.removeItem(`pulsecast_multi_votes_${id}`);
      localStorage.removeItem(`pulsecast_voted_${id}`);
    }
    setVotedOptions({});
    setVoteError(null);
  };

  // Desktop keyboard voting shortcuts
  useEffect(() => {
    if (!isLaptop || !currentQ || hasVotedCurrent || !nameSubmitted || isLocked) return;

    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target?.tagName)) return;

      const key = e.key.toUpperCase();
      let selectedIdx = -1;

      if (['1', '2', '3', '4'].includes(e.key)) {
        selectedIdx = parseInt(e.key, 10) - 1;
      } else if (['A', 'B', 'C', 'D'].includes(key)) {
        selectedIdx = key.charCodeAt(0) - 65;
      }

      if (selectedIdx >= 0 && selectedIdx < (currentQ.options?.length || 0)) {
        const option = currentQ.options[selectedIdx];
        if (option && option.id) {
          handleVote(option.id);
        }
      } else if (e.key === 'ArrowRight' && currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
      } else if (e.key === 'ArrowLeft' && currentQuestionIndex > 0) {
        setCurrentQuestionIndex((prev) => prev - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLaptop, currentQ, hasVotedCurrent, nameSubmitted, isLocked, currentQuestionIndex, questions.length]);

  // If visited /vote directly without an ID parameter
  if (!id) {
    return (
      <main style={{ maxWidth: '480px', margin: isMobile ? '30px auto' : '60px auto', padding: '0 20px', textAlign: 'center' }}>
        <div
          className="glass-panel"
          style={{
            padding: isMobile ? '26px 20px' : '36px 28px',
            border: '2px solid #2B2B2B',
            boxShadow: '6px 6px 0px rgba(43, 43, 43, 0.2)',
            background: '#FAFAFA',
          }}
        >
          <div className="stamp-seal" style={{ marginBottom: '16px' }}>
            JOIN LIVE POLL
          </div>
          <h1 style={{ fontSize: isMobile ? '1.5rem' : '1.8rem', marginBottom: '8px', fontFamily: "'Special Elite', monospace" }}>
            Enter Poll Code
          </h1>
          <p style={{ color: '#555555', fontSize: isMobile ? '0.86rem' : '0.92rem', marginBottom: '24px', lineHeight: 1.5 }}>
            Enter the code or PIN shown on your presenter's screen to vote live:
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              let val = inputSessionId.trim();
              if (val.includes('/vote/')) {
                val = val.split('/vote/')[1];
              }
              if (val) {
                navigate(`/vote/${val}`);
              }
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
          >
            <input
              type="text"
              placeholder="e.g. 6a1b2c (or paste link)"
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
              Join &amp; Vote Now
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
        <RefreshCw size={32} className="animate-spin" color="#2B2B2B" />
        <p style={{ color: '#555555', fontFamily: "'Special Elite', monospace" }}>
          Loading live poll session...
        </p>
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', maxWidth: '460px', margin: '0 auto' }}>
        <div
          className="glass-panel"
          style={{
            padding: '32px 24px',
            border: '2px solid #2B2B2B',
            boxShadow: '6px 6px 0px rgba(43, 43, 43, 0.2)',
          }}
        >
          <AlertCircle size={40} color="#DC2626" style={{ margin: '0 auto 14px' }} />
          <h2 style={{ fontSize: '1.4rem', marginBottom: '8px', fontFamily: "'Special Elite', monospace" }}>
            Poll Session Not Found
          </h2>
          <p style={{ color: '#555555', fontSize: '0.88rem', marginBottom: '20px' }}>
            {error || 'This live poll session could not be located. Please check the session ID.'}
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
              Verify Session ID
              <ArrowRight size={16} />
            </button>
          </form>
          <Link to="/" style={{ color: '#2B2B2B', fontSize: '0.85rem', textDecoration: 'underline' }}>
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  // --- 1. When Poll Is Concluded: Render Leaderboard & Live Results Chart on Mobile ---
  if (isLocked) {
    const mergedVoterNames = Array.from(
      new Set([
        ...(voterNames || []),
        ...(poll?.voter_names || []),
        ...(poll?.voters?.map((v) => v.name) || []),
        voterName,
      ].filter(Boolean))
    );

    const safeCompletedQIdx = Math.min(completedQuestionIdx, Math.max(0, questions.length - 1));
    const activeCompletedQ = questions[safeCompletedQIdx] || questions[0];
    const completedQVotes = activeCompletedQ?.options?.reduce((sum, opt) => sum + (opt.votes || 0), 0) || 0;
    const completedHighestVotes = Math.max(...(activeCompletedQ?.options || []).map((o) => o.votes || 0), 0);
    const userVoteForCompletedQ = votedOptions[activeCompletedQ?.id || safeCompletedQIdx];

    return (
      <main
        style={{
          maxWidth: isLaptop ? '1120px' : isTablet ? '840px' : '680px',
          margin: '0 auto',
          padding: isMobile ? '16px 14px calc(84px + var(--safe-bottom))' : '36px 24px',
          width: '100%',
        }}
      >
        {/* Segmented Top View Toggle: Leaderboard Chart vs Live Results Chart */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '20px',
            background: '#FAFAFA',
            padding: '6px',
            border: '2px solid #2B2B2B',
            boxShadow: '4px 4px 0px rgba(43, 43, 43, 0.15)',
          }}
        >
          <button
            type="button"
            onClick={() => setCompletedTab('leaderboard')}
            style={{
              flex: 1,
              padding: isMobile ? '10px 8px' : '11px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: completedTab === 'leaderboard' ? '#2B2B2B' : 'transparent',
              color: completedTab === 'leaderboard' ? '#FAFAFA' : '#2B2B2B',
              border: completedTab === 'leaderboard' ? '1px solid #1A1A1A' : 'none',
              fontWeight: 800,
              fontSize: isMobile ? '0.82rem' : '0.94rem',
              cursor: 'pointer',
              fontFamily: "'Special Elite', monospace",
              transition: 'all 0.15s ease',
            }}
          >
            <Trophy size={16} color={completedTab === 'leaderboard' ? '#FAFAFA' : '#DC2626'} />
            Leaderboard Chart
          </button>

          <button
            type="button"
            onClick={() => setCompletedTab('chart')}
            style={{
              flex: 1,
              padding: isMobile ? '10px 8px' : '11px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: completedTab === 'chart' ? '#2B2B2B' : 'transparent',
              color: completedTab === 'chart' ? '#FAFAFA' : '#2B2B2B',
              border: completedTab === 'chart' ? '1px solid #1A1A1A' : 'none',
              fontWeight: 800,
              fontSize: isMobile ? '0.82rem' : '0.94rem',
              cursor: 'pointer',
              fontFamily: "'Special Elite', monospace",
              transition: 'all 0.15s ease',
            }}
          >
            <BarChart2 size={16} color={completedTab === 'chart' ? '#FAFAFA' : '#2563EB'} />
            Live Results Chart
          </button>
        </div>

        {completedTab === 'leaderboard' ? (
          <Leaderboard
            poll={poll}
            voterNames={mergedVoterNames}
            isVoterView={true}
          />
        ) : (
          /* Live Results Chart View after Poll Completion */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Poll Status Banner */}
            <div
              className="glass-panel"
              style={{
                padding: isMobile ? '18px 16px' : '24px 28px',
                background: '#FAFAFA',
                border: '2px solid #2B2B2B',
                boxShadow: '6px 6px 0px rgba(43, 43, 43, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div>
                <div className="stamp-seal" style={{ marginBottom: '6px', fontSize: '0.72rem' }}>
                  ★ POLL CONCLUDED • FINAL RESULTS ★
                </div>
                <h1
                  style={{
                    fontSize: isMobile ? '1.35rem' : '1.8rem',
                    fontWeight: 800,
                    color: '#2B2B2B',
                    margin: 0,
                    fontFamily: "'Special Elite', monospace",
                  }}
                >
                  Live Results Chart
                </h1>
                <p style={{ color: '#555555', fontSize: '0.84rem', margin: '4px 0 0', fontFamily: "'Special Elite', monospace" }}>
                  Displaying final verified results for each question.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    confetti({
                      particleCount: 60,
                      spread: 70,
                      origin: { y: 0.6 },
                      colors: ['#2563EB', '#DC2626', '#2B2B2B'],
                    });
                  }}
                  className="btn-stamp"
                  style={{ padding: '8px 14px', fontSize: '0.84rem', gap: '6px' }}
                >
                  <Sparkles size={14} color="#FFFFFF" />
                  Celebrate
                </button>
                <Link
                  to="/"
                  className="btn-secondary"
                  style={{ padding: '8px 14px', fontSize: '0.84rem', gap: '4px' }}
                >
                  Done
                </Link>
              </div>
            </div>

            {/* Multi-Question Selector Tabs */}
            {questions.length > 1 && (
              <div
                className="horizontal-scroll-touch"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  overflowX: 'auto',
                  paddingBottom: '6px',
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                {questions.map((q, qIdx) => (
                  <button
                    key={q.id || qIdx}
                    type="button"
                    onClick={() => setCompletedQuestionIdx(qIdx)}
                    style={{
                      padding: isMobile ? '7px 12px' : '8px 16px',
                      background: qIdx === safeCompletedQIdx ? '#2B2B2B' : '#FAFAFA',
                      color: qIdx === safeCompletedQIdx ? '#FAFAFA' : '#2B2B2B',
                      border: '1px solid #2B2B2B',
                      boxShadow: qIdx === safeCompletedQIdx ? '3px 3px 0px rgba(43, 43, 43, 0.25)' : 'none',
                      fontWeight: 800,
                      fontSize: isMobile ? '0.8rem' : '0.84rem',
                      cursor: 'pointer',
                      fontFamily: "'Special Elite', monospace",
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      minHeight: isMobile ? '38px' : '42px',
                    }}
                  >
                    Question #{qIdx + 1}
                  </button>
                ))}
              </div>
            )}

            {/* Question Winner Podium Chart */}
            <PodiumChart
              questionTitle={activeCompletedQ?.title}
              questionIndex={safeCompletedQIdx}
              totalQuestions={questions.length}
              options={activeCompletedQ?.options || []}
              voters={poll?.voters || []}
              totalVotes={completedQVotes}
              isMobile={isMobile}
              isTablet={isTablet}
              badgeText={`QUESTION #${safeCompletedQIdx + 1} PODIUM`}
            />

            {/* Active Question Option Details Card */}
            <div
              className="glass-panel"
              style={{
                padding: isMobile ? '20px 16px' : '28px 30px',
                background: '#FAFAFA',
                border: '2px solid #2B2B2B',
                boxShadow: '6px 6px 0px rgba(43, 43, 43, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '2px dashed #2B2B2B',
                  paddingBottom: '12px',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div>
                  <span
                    style={{
                      background: '#2B2B2B',
                      color: '#FAFAFA',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      display: 'inline-block',
                      marginBottom: '4px',
                      fontFamily: "'Special Elite', monospace",
                    }}
                  >
                    Question {safeCompletedQIdx + 1} of {questions.length}
                  </span>
                  <h3
                    style={{
                      fontSize: isMobile ? '1.18rem' : '1.38rem',
                      fontWeight: 800,
                      margin: 0,
                      color: '#2B2B2B',
                      fontFamily: "'Special Elite', monospace",
                    }}
                  >
                    {activeCompletedQ?.title}
                  </h3>
                </div>

                <div style={{ fontSize: '0.88rem', color: '#555555', fontFamily: "'Special Elite', monospace" }}>
                  <strong style={{ color: '#2B2B2B', fontSize: '1rem' }}>{completedQVotes}</strong> total votes
                </div>
              </div>

              {/* Animated Bars for each option */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {activeCompletedQ?.options?.map((option, idx) => {
                  const isLeader = option.votes > 0 && option.votes === completedHighestVotes;
                  const isVoterPick = String(userVoteForCompletedQ) === String(option.id);

                  return (
                    <div key={option.id || idx} style={{ position: 'relative' }}>
                      <AnimatedBar
                        option={option}
                        totalVotes={completedQVotes}
                        isLeader={isLeader}
                        index={idx}
                      />
                      {isVoterPick && (
                        <div
                          style={{
                            marginTop: '4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            background: '#DBEAFE',
                            border: '1px solid #2563EB',
                            color: '#2563EB',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            fontFamily: "'Special Elite', monospace",
                          }}
                        >
                          <CheckCircle2 size={12} color="#2563EB" />
                          <span>YOUR VOTE WAS RECORDED HERE</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Navigation buttons between questions */}
              {questions.length > 1 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '12px',
                    borderTop: '1px dashed #2B2B2B',
                  }}
                >
                  <button
                    type="button"
                    disabled={safeCompletedQIdx === 0}
                    onClick={() => setCompletedQuestionIdx((prev) => Math.max(0, prev - 1))}
                    className="btn-secondary"
                    style={{ padding: '8px 14px', fontSize: '0.84rem', opacity: safeCompletedQIdx === 0 ? 0.4 : 1 }}
                  >
                    &larr; Prev Question
                  </button>
                  <span style={{ fontSize: '0.8rem', color: '#555555' }}>
                    {safeCompletedQIdx + 1} / {questions.length}
                  </span>
                  <button
                    type="button"
                    disabled={safeCompletedQIdx === questions.length - 1}
                    onClick={() => setCompletedQuestionIdx((prev) => Math.min(questions.length - 1, prev + 1))}
                    className="btn-secondary"
                    style={{ padding: '8px 14px', fontSize: '0.84rem', opacity: safeCompletedQIdx === questions.length - 1 ? 0.4 : 1 }}
                  >
                    Next Question &rarr;
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    );
  }

  // --- 2. Initial Name Capture Screen: Audience Sign-In Slip ---
  if (!nameSubmitted) {
    return (
      <main style={{ maxWidth: '460px', margin: '50px auto', padding: '0 20px', width: '100%' }}>
        <div
          className="glass-panel"
          style={{
            background: '#FAFAFA',
            border: '2px solid #2B2B2B',
            boxShadow: '8px 8px 0px rgba(43, 43, 43, 0.2)',
            padding: '32px 28px',
            position: 'relative',
          }}
        >
          {/* Stamped Header */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div className="stamp-seal" style={{ marginBottom: '12px' }}>
              AUDIENCE SIGN-IN
            </div>
            <h1
              style={{
                fontSize: '1.9rem',
                marginBottom: '8px',
                color: '#2B2B2B',
                fontFamily: "'Special Elite', monospace",
              }}
            >
              Enter Your Name
            </h1>
            {poll && (
              <div
                style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  background: '#F4F1EA',
                  border: '1px dashed #2B2B2B',
                  color: '#2B2B2B',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  marginBottom: '12px',
                }}
              >
                Session: {poll.title || poll.question || 'Live Poll'}
              </div>
            )}
            <p style={{ color: '#555555', fontSize: '0.9rem', lineHeight: 1.45 }}>
              Enter your name below to participate and cast your votes in this session:
            </p>
          </div>

          <form onSubmit={handleNameSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  marginBottom: '6px',
                  color: '#2B2B2B',
                  fontFamily: "'Special Elite', monospace",
                  textTransform: 'uppercase',
                }}
              >
                Your Name / Signature
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Alex Henderson, Sarah, DevNinja"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                maxLength={40}
                required
                autoFocus
                style={{
                  fontFamily: nameInput ? "'Caveat', cursive" : "'Special Elite', monospace",
                  fontSize: nameInput ? '1.35rem' : '16px',
                  color: '#2563EB',
                }}
              />
              <span style={{ fontSize: '0.74rem', color: '#666666', marginTop: '4px', display: 'block' }}>
                Your name will appear as a handwritten signature on the presentation guestbook.
              </span>
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ justifyContent: 'center', padding: '12px', fontSize: '1rem' }}
            >
              Join Session &amp; Vote
              <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </main>
    );
  }

  // --- 3. Multi-Question Interactive Voting Screen ---
  const progressPct = ((currentQuestionIndex + 1) / questions.length) * 100;

  const renderVotingControls = () => (
    <div>
      {/* Top Session Info Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          paddingBottom: '12px',
          borderBottom: '2px dashed #2B2B2B',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              backgroundColor: isConnected ? '#2563EB' : '#DC2626',
            }}
          />
          <span style={{ fontSize: '0.82rem', color: '#2B2B2B', fontWeight: 700 }}>
            {isConnected ? 'LIVE SYNC: CONNECTED' : 'LIVE SYNC: RECONNECTING...'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setNameSubmitted(false)}
            style={{
              background: '#FAFAFA',
              border: '1px solid #2B2B2B',
              boxShadow: '2px 2px 0px rgba(43, 43, 43, 0.15)',
              padding: '4px 12px',
              color: '#2563EB',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontWeight: 700,
              fontFamily: "'Caveat', cursive",
            }}
            title="Click to change your name"
          >
            <User size={12} color="#2563EB" />
            <span style={{ fontSize: '1.15rem' }}>{voterName}</span>
          </button>

          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.78rem',
              color: '#DC2626',
              padding: '4px 10px',
              background: '#FAFAFA',
              border: '1px solid #DC2626',
              textDecoration: 'none',
              fontWeight: 700,
              boxShadow: '2px 2px 0px rgba(220, 38, 38, 0.15)',
            }}
            title="Exit voting session"
          >
            <LogOut size={12} />
            Exit
          </Link>
        </div>
      </div>

      {/* Multi-Question Progress Header */}
      <div style={{ marginBottom: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span
            style={{
              fontSize: '0.88rem',
              fontWeight: 800,
              color: '#2B2B2B',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <span style={{ fontSize: '0.78rem', color: '#555555' }}>
            {isMobile ? 'Swipe or tap buttons' : 'Use keyboard [1-4] or arrows'}
          </span>
        </div>

        {/* Stark 90-degree Progress Bar */}
        <div style={{ height: '8px', background: '#EBE7DD', border: '1px solid #2B2B2B', overflow: 'hidden' }}>
          <motion.div
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.2 }}
            style={{
              height: '100%',
              background: '#2B2B2B',
            }}
          />
        </div>

        {/* Question Selector Squares */}
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
                    border: isCurrent ? '2px solid #2B2B2B' : '1px solid #2B2B2B',
                    background: isCurrent ? '#2B2B2B' : isAnswered ? '#DBEAFE' : '#FAFAFA',
                    color: isCurrent ? '#FAFAFA' : isAnswered ? '#2563EB' : '#2B2B2B',
                    boxShadow: isCurrent ? '3px 3px 0px rgba(43, 43, 43, 0.25)' : '2px 2px 0px rgba(43, 43, 43, 0.1)',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontFamily: "'Special Elite', monospace",
                  }}
                  title={`Go to Question ${idx + 1}`}
                >
                  {isAnswered && !isCurrent ? (
                    <span style={{ fontFamily: "'Caveat', cursive", fontSize: '1.25rem', fontWeight: 700 }}>✗</span>
                  ) : (
                    idx + 1
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Current Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQId}
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -15 }}
          transition={{ duration: 0.2 }}
          className="glass-panel"
          style={{
            background: '#FAFAFA',
            border: '2px solid #2B2B2B',
            boxShadow: '6px 6px 0px rgba(43, 43, 43, 0.2)',
            padding: isMobile ? '22px 18px' : '28px 24px',
            marginBottom: '24px',
          }}
        >
          {/* Question Title with Typewriter effect */}
          <div style={{ marginBottom: '20px' }}>
            <TypewriterText
              key={`q-text-${currentQId}`}
              text={currentQ?.title || ''}
              as="h2"
              style={{
                fontSize: isMobile ? '1.25rem' : '1.45rem',
                fontWeight: 800,
                color: '#2B2B2B',
                lineHeight: 1.35,
              }}
            />
          </div>

          {/* Error Message */}
          {voteError && (
            <div
              style={{
                background: 'rgba(220, 38, 38, 0.08)',
                border: '1px solid #DC2626',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#DC2626',
                fontSize: '0.85rem',
                marginBottom: '16px',
              }}
            >
              <AlertCircle size={16} color="#DC2626" />
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
                  whileHover={!hasVotedCurrent ? { x: 2 } : {}}
                  whileTap={!hasVotedCurrent ? { x: 1, y: 1 } : {}}
                  onClick={() => handleVote(option.id)}
                  disabled={hasVotedCurrent || isSubmitting}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: isMobile ? '14px 16px' : '16px 20px',
                    border: isSelected ? '2px solid #2563EB' : '1px solid #2B2B2B',
                    background: isSelected ? '#DBEAFE' : '#FAFAFA',
                    color: isSelected ? '#2563EB' : '#2B2B2B',
                    cursor: hasVotedCurrent ? 'default' : 'pointer',
                    opacity: hasVotedCurrent && !isSelected ? 0.6 : 1,
                    textAlign: 'left',
                    transition: 'background-color 0.2s ease, border-color 0.2s ease',
                    boxShadow: isSelected
                      ? '4px 4px 0px rgba(37, 99, 235, 0.3)'
                      : '4px 4px 0px rgba(43, 43, 43, 0.15)',
                    fontFamily: "'Special Elite', monospace",
                    borderRadius: 0,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                    {/* Stark Letter Indicator */}
                    <span
                      style={{
                        width: '32px',
                        height: '32px',
                        background: isSelected ? '#2563EB' : '#EBE7DD',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.9rem',
                        color: isSelected ? '#FAFAFA' : '#2B2B2B',
                        border: '1px solid #2B2B2B',
                        flexShrink: 0,
                      }}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>

                    <span
                      style={{
                        fontSize: isMobile ? '1rem' : '1.1rem',
                        fontWeight: 700,
                        color: isSelected ? '#2563EB' : '#2B2B2B',
                      }}
                    >
                      {option.text}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {!isMobile && (
                      <span
                        style={{
                          fontSize: '0.74rem',
                          color: '#555555',
                          border: '1px solid #2B2B2B',
                          background: '#FAFAFA',
                          padding: '2px 6px',
                        }}
                      >
                        [{idx + 1}]
                      </span>
                    )}

                    {/* Animated Handwritten "X" Scaling in */}
                    {isSelected && (
                      <motion.span
                        initial={{ scale: 0, rotate: -25 }}
                        animate={{ scale: 1, rotate: -6 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 18 }}
                        style={{
                          fontFamily: "'Caveat', cursive",
                          fontSize: '2.2rem',
                          fontWeight: 700,
                          color: '#2563EB',
                          lineHeight: 0.8,
                          display: 'inline-block',
                        }}
                        aria-label="Marked X"
                      >
                        X
                      </motion.span>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Vote Confirmation Stamped Tag */}
          {hasVotedCurrent && (
            <div
              style={{
                marginTop: '18px',
                padding: '10px 14px',
                border: '1px dashed #2B2B2B',
                background: '#F4F1EA',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: '#2B2B2B',
                fontSize: '0.85rem',
                fontFamily: "'Special Elite', monospace",
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="stamp-seal" style={{ fontSize: '0.7rem', padding: '1px 6px' }}>
                  RECORDED
                </span>
                <span>Vote registered live on presentation</span>
              </div>
              <span style={{ fontFamily: "'Caveat', cursive", fontSize: '1.25rem', color: '#2563EB', fontWeight: 700 }}>
                {voterName}
              </span>
            </div>
          )}

          {/* Active Question Live Results Chart Toggle */}
          {hasVotedCurrent && (
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowActiveQuestionChart((prev) => !prev)}
                className="btn-secondary"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  border: '1px solid #2563EB',
                  color: '#2563EB',
                  background: '#FAFAFA',
                  boxShadow: '3px 3px 0px rgba(37, 99, 235, 0.15)',
                }}
              >
                <BarChart2 size={15} color="#2563EB" />
                {showActiveQuestionChart ? 'Hide Live Results Chart' : '📊 View Live Results Chart for this Question'}
              </button>

              {showActiveQuestionChart && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    padding: '14px',
                    background: '#F4F1EA',
                    border: '1px dashed #2B2B2B',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.78rem',
                      color: '#555555',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      borderBottom: '1px dashed #2B2B2B',
                      paddingBottom: '8px',
                    }}
                  >
                    <span>Incoming Live Results ({currentQVotes} votes)</span>
                    <span style={{ color: isConnected ? '#2563EB' : '#DC2626' }}>
                      {isConnected ? '● Sync Active' : '○ Connecting...'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {currentQ?.options?.map((option, idx) => {
                      const isLeader = option.votes > 0 && option.votes === currentHighestVotes;
                      const isSelected = String(currentSelectedOptionId) === String(option.id);

                      return (
                        <div key={option.id || idx} style={{ position: 'relative' }}>
                          <AnimatedBar
                            option={option}
                            totalVotes={currentQVotes}
                            isLeader={isLeader}
                            index={idx}
                          />
                          {isSelected && (
                            <div
                              style={{
                                marginTop: '4px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '2px 8px',
                                background: '#DBEAFE',
                                border: '1px solid #2563EB',
                                color: '#2563EB',
                                fontSize: '0.74rem',
                                fontWeight: 800,
                                fontFamily: "'Special Elite', monospace",
                              }}
                            >
                              <CheckCircle2 size={12} color="#2563EB" />
                              <span>YOUR CURRENT CHOICE</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Question Navigation Controls */}
      {questions.length > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginTop: '16px' }}>
          <button
            type="button"
            disabled={currentQuestionIndex === 0}
            onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
            className="btn-secondary"
            style={{
              padding: isMobile ? '8px 12px' : '9px 16px',
              fontSize: isMobile ? '0.82rem' : '0.88rem',
              gap: '6px',
              minHeight: '42px',
              opacity: currentQuestionIndex === 0 ? 0.35 : 1,
            }}
          >
            <ChevronLeft size={16} />
            <span>Prev</span>
          </button>

          <span style={{ fontSize: isMobile ? '0.8rem' : '0.86rem', color: '#555555', fontFamily: "'Special Elite', monospace", textAlign: 'center' }}>
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>

          <button
            type="button"
            disabled={currentQuestionIndex === questions.length - 1}
            onClick={() => setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))}
            className="btn-secondary"
            style={{
              padding: isMobile ? '8px 12px' : '9px 16px',
              fontSize: isMobile ? '0.82rem' : '0.88rem',
              gap: '6px',
              minHeight: '42px',
              opacity: currentQuestionIndex === questions.length - 1 ? 0.35 : 1,
            }}
          >
            <span>Next</span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <main
      style={{
        maxWidth: isLaptop ? '1120px' : '580px',
        margin: '0 auto',
        padding: isMobile ? '16px 14px calc(84px + var(--safe-bottom))' : '36px 24px',
        width: '100%',
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {!isMobile ? (
        // LAPTOP / DESKTOP KIOSK STATION LAYOUT
        <div className="kiosk-desktop-card">
          <div>{renderVotingControls()}</div>

          {/* Desktop Sidebar: Session Details in Paper Style */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Session Info Panel */}
            <div
              className="glass-panel"
              style={{
                background: '#FAFAFA',
                border: '1px solid #2B2B2B',
                boxShadow: '6px 6px 0px rgba(43, 43, 43, 0.15)',
                padding: '22px 20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Hash size={16} color="#2B2B2B" />
                  <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#2B2B2B' }}>Session PIN</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="btn-secondary"
                  style={{ padding: '4px 8px', fontSize: '0.74rem' }}
                >
                  {copiedLink ? 'Copied!' : 'Copy Link'}
                </button>
              </div>

              <div style={{ fontSize: '0.86rem', color: '#555555', marginBottom: '8px' }}>
                Session ID: <strong style={{ color: '#2B2B2B', fontFamily: 'monospace' }}>{id}</strong>
              </div>

              <div style={{ fontSize: '0.86rem', color: '#555555', marginBottom: '14px' }}>
                Participant:{' '}
                <strong style={{ fontFamily: "'Caveat', cursive", fontSize: '1.25rem', color: '#2563EB' }}>
                  {voterName || 'Audience Member'}
                </strong>
              </div>

              <div style={{ height: '1px', borderBottom: '1px dashed #2B2B2B', margin: '12px 0' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2B2B2B', fontSize: '0.8rem' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    backgroundColor: isConnected ? '#2563EB' : '#DC2626',
                  }}
                />
                <span>{isConnected ? 'Real-Time Sync Active' : 'Connecting to Server...'}</span>
              </div>
            </div>

            {/* Keyboard Shortcuts Helper */}
            <div
              className="glass-panel"
              style={{
                background: '#FAFAFA',
                border: '1px solid #2B2B2B',
                boxShadow: '6px 6px 0px rgba(43, 43, 43, 0.15)',
                padding: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Keyboard size={16} color="#2B2B2B" />
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#2B2B2B' }}>
                  Keyboard Shortcuts
                </span>
              </div>
              <ul style={{ fontSize: '0.82rem', color: '#555555', lineHeight: 1.6, paddingLeft: '18px', margin: 0 }}>
                <li>Press <strong>[1]</strong>, <strong>[2]</strong>, <strong>[3]</strong>, or <strong>[4]</strong> to vote</li>
                <li>Press <strong>[←]</strong> or <strong>[→]</strong> keys to navigate questions</li>
              </ul>
            </div>

            {/* Projector View Link */}
            <Link
              to={`/present/${id}`}
              className="btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                fontSize: '0.88rem',
              }}
            >
              <Monitor size={15} color="#2B2B2B" />
              <span>Open Projector View</span>
            </Link>
          </div>
        </div>
      ) : (
        renderVotingControls()
      )}
    </main>
  );
}
