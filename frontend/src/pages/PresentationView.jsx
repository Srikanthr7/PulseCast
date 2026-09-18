import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Share2,
  Check,
  RefreshCw,
  AlertCircle,
  Trophy,
  RotateCcw,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  Flag,
  LogOut,
  Globe,
  Hash,
  Copy,
  QrCode,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useLivePoll } from '../hooks/useLivePoll';
import { completePoll, updatePollStatus, getNetworkIP } from '../api';
import { useDeviceType } from '../hooks/useDeviceType';
import AnimatedBar from '../components/AnimatedBar';
import Leaderboard from '../components/Leaderboard';
import TypewriterText from '../components/TypewriterText';

export default function PresentationView() {
  const { id } = useParams();
  const { isMobile, isTablet, isLaptop } = useDeviceType();
  const { poll, isCompleted, voterNames, loading, error, isConnected, refetch } = useLivePoll(id);
  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [viewMode, setViewMode] = useState('live'); // 'live' | 'leaderboard'
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [showMobileQRModal, setShowMobileQRModal] = useState(false);
  const [lanIp, setLanIp] = useState('');
  const hasAutoSwitchedRef = useRef(false);

  // Fetch outbound LAN IP so phone can connect when scanning QR on localhost
  useEffect(() => {
    let isMounted = true;
    getNetworkIP().then((ip) => {
      if (isMounted && ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        setLanIp(ip);
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  // Compute the scannable vote URL directly from window.location.origin,
  // or swap localhost for the actual LAN IP for mobile phone scanners
  const voteUrl = (() => {
    if (typeof window === 'undefined') return `http://localhost:5173/vote/${id}`;
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    if (isLocalhost && lanIp) {
      const port = window.location.port ? `:${window.location.port}` : '';
      return `${window.location.protocol}//${lanIp}${port}/vote/${id}`;
    }
    return `${window.location.origin}/vote/${id}`;
  })();

  const handleCopyId = () => {
    if (navigator.clipboard && id) {
      navigator.clipboard.writeText(id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  // Automatically switch to leaderboard once when status transitions to completed
  useEffect(() => {
    if ((isCompleted || poll?.status === 'completed') && !hasAutoSwitchedRef.current) {
      hasAutoSwitchedRef.current = true;
      setViewMode('leaderboard');
    }
  }, [isCompleted, poll?.status]);

  const handleCopyUrl = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(voteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCompletePoll = async () => {
    if (!id || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    try {
      await completePoll(id);
      setViewMode('leaderboard');
      try {
        confetti({
          particleCount: 110,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#DC2626', '#2563EB', '#2B2B2B', '#EBE7DD'],
        });
      } catch (e) {
        // ignore
      }
    } catch (err) {
      console.error('Failed to complete poll:', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleResumePoll = async () => {
    if (!id || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    try {
      await updatePollStatus(id, 'active');
      setViewMode('live');
    } catch (err) {
      console.error('Failed to resume poll:', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (loading && !poll) {
    return (
      <div style={{ textAlign: 'center', padding: '120px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <RefreshCw size={36} className="animate-spin" color="#2B2B2B" />
        <h2 style={{ fontSize: '1.5rem', fontFamily: "'Special Elite', monospace" }}>
          Loading live poll presentation...
        </h2>
        <p style={{ color: '#555555' }}>Connecting to session database</p>
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', maxWidth: '500px', margin: '0 auto' }}>
        <div
          className="glass-panel"
          style={{
            padding: '36px 28px',
            border: '2px solid #2B2B2B',
            boxShadow: '6px 6px 0px rgba(43, 43, 43, 0.2)',
          }}
        >
          <div style={{
            width: '56px',
            height: '56px',
            background: 'rgba(220, 38, 38, 0.1)',
            border: '1px solid #DC2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            color: '#DC2626',
          }}>
            <AlertCircle size={32} />
          </div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '8px', fontFamily: "'Special Elite', monospace" }}>
            Session Not Found
          </h2>
          <p style={{ color: '#555555', marginBottom: '24px' }}>
            {error || `Poll session with ID ${id} was not found.`}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button onClick={refetch} className="btn-secondary" style={{ gap: '8px' }}>
              <RefreshCw size={16} />
              Retry
            </button>
            <Link to="/" className="btn-primary">
              Create New Poll
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Multi-question resolution
  const questionsList = (poll.questions && poll.questions.length > 0)
    ? poll.questions
    : [
        {
          id: poll.id,
          title: poll.question || 'Live Poll Question',
          options: poll.options || [],
        },
      ];

  const currentQIdx = Math.min(activeQuestionIdx, questionsList.length - 1);
  const currentQuestion = questionsList[currentQIdx] || questionsList[0];
  const currentOptions = currentQuestion?.options || [];

  const currentQVotes = currentOptions.reduce((sum, opt) => sum + (opt.votes || 0), 0);
  const highestVotes = Math.max(...currentOptions.map((o) => o.votes || 0), 0);

  const totalSessionVotes = questionsList.reduce(
    (acc, q) => acc + (q.options?.reduce((s, o) => s + (o.votes || 0), 0) || 0),
    0
  );

  const pollIsConcluded = isCompleted || poll.status === 'completed';

  return (
    <main
      className="presentation-main"
      style={{
        flex: 1,
        maxWidth: '1600px',
        margin: '0 auto',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        paddingBottom: isMobile ? 'calc(84px + var(--safe-bottom))' : '36px',
      }}
    >
      {/* Presentation Top Physical Paper Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: isMobile ? '16px' : '28px',
          paddingBottom: '16px',
          borderBottom: '2px dashed #2B2B2B',
          flexWrap: 'wrap',
          gap: isMobile ? '10px' : '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '16px', flexWrap: 'wrap' }}>
          {/* Status Badge */}
          {pollIsConcluded ? (
            <div className="stamp-seal">
              ★ POLL CONCLUDED ★
            </div>
          ) : isConnected ? (
            <div className="live-badge">
              <span className="live-dot" />
              {isMobile ? 'LIVE' : 'LIVE POLL • REAL-TIME RESPONSES'}
            </div>
          ) : (
            <div className="live-badge">
              <RefreshCw size={12} className="animate-spin" />
              {isMobile ? 'RECONNECTING' : 'RECONNECTING TO LIVE STREAM...'}
            </div>
          )}

          {/* View Switcher Tabs */}
          <div style={{
            display: 'inline-flex',
            background: '#FAFAFA',
            border: '1px solid #2B2B2B',
            boxShadow: '3px 3px 0px rgba(43, 43, 43, 0.15)',
            padding: '2px',
            gap: '2px',
          }}>
            <button
              type="button"
              onClick={() => setViewMode('live')}
              style={{
                padding: isMobile ? '6px 10px' : '6px 14px',
                border: viewMode === 'live' ? '1px solid #2B2B2B' : 'none',
                background: viewMode === 'live' ? '#2B2B2B' : 'transparent',
                color: viewMode === 'live' ? '#FAFAFA' : '#2B2B2B',
                fontSize: isMobile ? '0.78rem' : '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: "'Special Elite', monospace",
              }}
            >
              <BarChart2 size={14} color={viewMode === 'live' ? '#FAFAFA' : 'currentColor'} />
              {isMobile ? 'Chart' : 'Live Chart'}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('leaderboard')}
              style={{
                padding: isMobile ? '6px 10px' : '6px 14px',
                border: viewMode === 'leaderboard' ? '1px solid #2B2B2B' : 'none',
                background: viewMode === 'leaderboard' ? '#2B2B2B' : 'transparent',
                color: viewMode === 'leaderboard' ? '#FAFAFA' : '#2B2B2B',
                fontSize: isMobile ? '0.78rem' : '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: "'Special Elite', monospace",
              }}
            >
              <Trophy size={14} color={viewMode === 'leaderboard' ? '#FAFAFA' : '#DC2626'} />
              {isMobile ? `Roster (${voterNames.length || poll.voters?.length || 0})` : `Participant Guestbook (${voterNames.length || poll.voters?.length || 0})`}
            </button>
          </div>

          <span style={{ color: '#555555', fontSize: isMobile ? '0.8rem' : '0.9rem', fontFamily: 'monospace' }}>
            ID: <strong style={{ color: '#2B2B2B' }}>{poll.id}</strong>
          </span>
        </div>

        {/* Live Controls & Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '12px' }}>
          {/* Total Session Votes Counter */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#FAFAFA',
              padding: isMobile ? '6px 12px' : '8px 16px',
              border: '1px solid #2B2B2B',
              boxShadow: '4px 4px 0px rgba(43, 43, 43, 0.15)',
              color: '#2B2B2B',
              fontFamily: "'Special Elite', monospace",
            }}
          >
            <Users size={14} color="#2B2B2B" />
            <span style={{ fontSize: isMobile ? '0.82rem' : '0.95rem', fontWeight: 700 }}>
              <motion.span
                key={totalSessionVotes}
                initial={{ scale: 1.25, color: '#DC2626' }}
                animate={{ scale: 1, color: '#2B2B2B' }}
                transition={{ duration: 0.25 }}
              >
                {totalSessionVotes}
              </motion.span>{' '}
              {totalSessionVotes === 1 ? 'Vote Cast' : 'Votes Cast'}
            </span>
          </div>

          {/* Finish Poll & Show Leaderboard Button */}
          {!isMobile && (
            !pollIsConcluded ? (
              <button
                type="button"
                onClick={handleCompletePoll}
                disabled={isUpdatingStatus}
                className="btn-stamp"
                style={{
                  padding: '10px 20px',
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  gap: '8px',
                  cursor: 'pointer',
                }}
              >
                <Flag size={16} color="#FFFFFF" />
                Conclude Poll &amp; Show Leaderboard
              </button>
            ) : (
              <button
                type="button"
                onClick={handleResumePoll}
                disabled={isUpdatingStatus}
                className="btn-secondary"
                style={{
                  padding: '8px 16px',
                  fontSize: '0.85rem',
                  gap: '6px',
                }}
              >
                <RotateCcw size={14} />
                Reopen Voting
              </button>
            )
          )}

          <button
            type="button"
            onClick={refetch}
            className="btn-secondary"
            title="Refresh poll data from database"
            style={{ padding: isMobile ? '6px 10px' : '8px 12px', fontSize: '0.85rem' }}
          >
            <RefreshCw size={14} />
          </button>

          {/* Exit Presentation Button */}
          <Link
            to="/"
            className="btn-secondary"
            style={{
              padding: isMobile ? '6px 10px' : '8px 14px',
              fontSize: '0.85rem',
              gap: '6px',
              color: '#DC2626',
              borderColor: '#DC2626',
              fontWeight: 700,
            }}
            title="Exit presentation and return to dashboard"
          >
            <LogOut size={14} />
            <span className="laptop-only">Exit</span>
          </Link>
        </div>
      </div>

      {/* Main View Mode Content */}
      <AnimatePresence mode="wait">
        {viewMode === 'live' ? (
          isMobile ? (
            /* Mobile Presenter Remote Layout */
            <motion.div
              key="mobile-remote-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}
            >
              {/* Quick QR Card on Mobile */}
              <div
                className="glass-panel"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: '#FAFAFA',
                  border: '1px solid #2B2B2B',
                  boxShadow: '4px 4px 0px rgba(43, 43, 43, 0.15)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    background: '#2B2B2B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FAFAFA',
                  }}>
                    <QrCode size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#2B2B2B', fontFamily: 'monospace' }}>
                      PIN: {id}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#555555' }}>
                      Tap to display QR Code for participants
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMobileQRModal(true)}
                  className="btn-primary"
                  style={{ padding: '8px 14px', fontSize: '0.8rem', gap: '6px' }}
                >
                  <QrCode size={14} />
                  Show QR
                </button>
              </div>

              {/* Question Card & Live Animated Bars */}
              <div
                className="glass-panel"
                style={{
                  padding: '18px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  background: '#FAFAFA',
                  border: '2px solid #2B2B2B',
                  boxShadow: '6px 6px 0px rgba(43, 43, 43, 0.15)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '0.8rem',
                      color: '#2B2B2B',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      borderBottom: '1px dashed #2B2B2B',
                      paddingBottom: '2px',
                    }}
                  >
                    Question {currentQIdx + 1} of {questionsList.length}
                  </span>

                  {questionsList.length > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        disabled={currentQIdx === 0}
                        onClick={() => setActiveQuestionIdx((prev) => Math.max(0, prev - 1))}
                        className="btn-secondary"
                        style={{
                          padding: '6px 10px',
                          opacity: currentQIdx === 0 ? 0.3 : 1,
                        }}
                        title="Previous Question"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        type="button"
                        disabled={currentQIdx === questionsList.length - 1}
                        onClick={() => setActiveQuestionIdx((prev) => Math.min(questionsList.length - 1, prev + 1))}
                        className="btn-secondary"
                        style={{
                          padding: '6px 10px',
                          opacity: currentQIdx === questionsList.length - 1 ? 0.3 : 1,
                        }}
                        title="Next Question"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Direct question button switcher on mobile presenter */}
                {questionsList.length > 1 && (
                  <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {questionsList.map((_, qIdx) => (
                      <button
                        key={qIdx}
                        type="button"
                        onClick={() => setActiveQuestionIdx(qIdx)}
                        style={{
                          padding: '6px 12px',
                          background: qIdx === currentQIdx ? '#2B2B2B' : '#FAFAFA',
                          color: qIdx === currentQIdx ? '#FAFAFA' : '#2B2B2B',
                          border: '1px solid #2B2B2B',
                          boxShadow: qIdx === currentQIdx ? '2px 2px 0px rgba(43,43,43,0.25)' : 'none',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          fontFamily: "'Special Elite', monospace",
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Question #{qIdx + 1}
                      </button>
                    ))}
                  </div>
                )}

                {/* Typewriter Text for Question */}
                <TypewriterText
                  key={`mobile-q-${currentQIdx}`}
                  text={currentQuestion?.title || ''}
                  as="h2"
                  style={{
                    fontSize: '1.25rem',
                    lineHeight: 1.35,
                    fontWeight: 800,
                    color: '#2B2B2B',
                  }}
                />

                {/* Animated Bars */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
                  {currentOptions.map((option, index) => {
                    const isLeader = option.votes > 0 && option.votes === highestVotes;
                    return (
                      <AnimatedBar
                        key={option.id || index}
                        option={option}
                        totalVotes={currentQVotes}
                        isLeader={isLeader}
                        index={index}
                      />
                    );
                  })}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.8rem',
                    color: '#555555',
                    paddingTop: '10px',
                    borderTop: '1px dashed #2B2B2B',
                    marginTop: '6px',
                  }}
                >
                  <span>{currentQVotes} votes on this question</span>
                  <span style={{ color: isConnected ? '#2563EB' : '#DC2626', fontWeight: 700 }}>
                    {isConnected ? 'Sync Active' : 'Connecting...'}
                  </span>
                </div>
              </div>

              {/* Presenter Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                {pollIsConcluded ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ textAlign: 'center', padding: '6px 10px', background: 'rgba(220, 38, 38, 0.08)', border: '1px dashed #DC2626' }}>
                      <span className="stamp-seal" style={{ fontSize: '0.7rem' }}>★ POLL CONCLUDED • RESULTS FINALIZED ★</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setViewMode('leaderboard')}
                      className="btn-stamp touch-target"
                      style={{ width: '100%', padding: '12px', fontSize: '0.92rem', gap: '8px', justifyContent: 'center' }}
                    >
                      <Trophy size={16} color="#FFFFFF" />
                      View Leaderboard Podium
                    </button>
                    <button
                      type="button"
                      onClick={handleResumePoll}
                      disabled={isUpdatingStatus}
                      className="btn-secondary touch-target"
                      style={{ width: '100%', padding: '10px', fontSize: '0.85rem', gap: '6px', justifyContent: 'center' }}
                    >
                      <RotateCcw size={14} />
                      Reopen Voting
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleCompletePoll}
                    disabled={isUpdatingStatus}
                    className="btn-stamp touch-target"
                    style={{
                      width: '100%',
                      padding: '14px',
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      gap: '8px',
                    }}
                  >
                    <Flag size={18} color="#FFFFFF" />
                    Conclude Poll &amp; Show Leaderboard
                  </button>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowMobileQRModal(true)}
                    className="btn-secondary touch-target"
                    style={{ padding: '12px', fontSize: '0.85rem', gap: '6px' }}
                  >
                    <QrCode size={16} />
                    Show QR Code
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="btn-secondary touch-target"
                    style={{ padding: '12px', fontSize: '0.85rem', gap: '6px' }}
                  >
                    {copied ? <Check size={16} color="#DC2626" /> : <Share2 size={16} />}
                    {copied ? 'Link Copied!' : 'Share Link'}
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            /* Live Projector Split Screen Layout */
            <motion.div
              key="live-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="presentation-grid"
            >
              {/* Left Column: QR Code Box */}
              <div
                className="glass-panel"
                style={{
                  padding: '36px 28px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  position: 'relative',
                  background: '#FAFAFA',
                  border: '1px solid #2B2B2B',
                  boxShadow: '6px 6px 0px rgba(43, 43, 43, 0.15)',
                }}
              >
                <div
                  className="stamp-seal"
                  style={{ marginBottom: '10px', fontSize: '0.78rem' }}
                >
                  JOIN AUDIENCE
                </div>
                <h2
                  style={{
                    fontSize: '1.75rem',
                    marginBottom: '16px',
                    fontFamily: "'Special Elite', monospace",
                    color: '#2B2B2B',
                    fontWeight: 800,
                  }}
                >
                  Scan to Vote Live
                </h2>

                {/* Unique Session ID Dispatch Slip */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '20px',
                    padding: '12px 18px',
                    background: '#F4F1EA',
                    border: '1px dashed #2B2B2B',
                    maxWidth: '320px',
                    width: '100%',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '0.72rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      fontWeight: 800,
                      color: '#2B2B2B',
                    }}
                  >
                    <Hash size={13} />
                    <span>Session PIN</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                    <code
                      style={{
                        fontSize: '1.05rem',
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        color: '#2B2B2B',
                        background: '#FAFAFA',
                        padding: '4px 10px',
                        border: '1px solid #2B2B2B',
                      }}
                    >
                      {id}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopyId}
                      title="Copy Session ID"
                      style={{
                        background: copiedId ? '#DBEAFE' : '#FAFAFA',
                        border: '1px solid #2B2B2B',
                        color: copiedId ? '#2563EB' : '#2B2B2B',
                        cursor: 'pointer',
                        padding: '5px 10px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        fontFamily: "'Special Elite', monospace",
                        boxShadow: '2px 2px 0px rgba(43, 43, 43, 0.15)',
                      }}
                    >
                      {copiedId ? <Check size={13} color="#2563EB" /> : <Copy size={13} />}
                      {copiedId ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                {/* QR Code Container wrapped in Ballot White box with harsh drop shadow */}
                <div
                  className="qr-code-wrapper"
                  style={{
                    background: '#FAFAFA',
                    padding: '20px',
                    border: '1px solid #2B2B2B',
                    boxShadow: '6px 6px 0px rgba(43, 43, 43, 0.15)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                    maxWidth: '100%',
                  }}
                >
                  <QRCodeSVG
                    value={voteUrl}
                    size={210}
                    level="H"
                    includeMargin={false}
                    fgColor="#2B2B2B"
                    bgColor="#FAFAFA"
                    style={{ maxWidth: '100%', height: 'auto' }}
                  />
                </div>

                {/* Universal Network Joining Note */}
                <p
                  style={{
                    fontSize: '0.84rem',
                    color: '#555555',
                    marginBottom: '16px',
                    maxWidth: '310px',
                    lineHeight: 1.45,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <Globe size={14} style={{ color: '#2B2B2B', flexShrink: 0 }} />
                  <span>
                    <strong>Open to all devices:</strong> Scan with any smartphone camera to vote live from anywhere.
                  </span>
                </p>

                {/* Direct Link Info */}
                <div style={{ maxWidth: '320px', width: '100%' }}>
                  <p style={{ fontSize: '0.82rem', color: '#555555', marginBottom: '8px' }}>
                    Or enter URL in mobile browser:
                  </p>
                  <div
                    onClick={handleCopyUrl}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: '#F4F1EA',
                      border: '1px dashed #2B2B2B',
                      fontSize: '0.82rem',
                      color: '#2B2B2B',
                      cursor: 'pointer',
                      fontFamily: "'Special Elite', monospace",
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '8px', fontWeight: 600 }}>
                      {voteUrl}
                    </span>
                    {copied ? <Check size={16} color="#DC2626" /> : <Share2 size={16} color="#2B2B2B" />}
                  </div>
                  {copied && (
                    <span style={{ fontSize: '0.74rem', color: '#DC2626', display: 'block', marginTop: '4px', fontWeight: 700 }}>
                      Vote URL copied to clipboard!
                    </span>
                  )}
                </div>
              </div>

              {/* Right Column: Live Animated Stark Rectangles Bar Chart */}
              <div
                className="glass-panel"
                style={{
                  padding: '36px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  background: '#FAFAFA',
                  border: '1px solid #2B2B2B',
                  boxShadow: '6px 6px 0px rgba(43, 43, 43, 0.15)',
                }}
              >
                {/* Question Navigation Tabs */}
                {questionsList.length > 1 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '20px',
                      paddingBottom: '14px',
                      borderBottom: '2px dashed #2B2B2B',
                      flexWrap: 'wrap',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {questionsList.map((_, qIdx) => (
                        <button
                          key={qIdx}
                          type="button"
                          onClick={() => setActiveQuestionIdx(qIdx)}
                          style={{
                            padding: '6px 14px',
                            border: '1px solid #2B2B2B',
                            background: qIdx === currentQIdx ? '#2B2B2B' : '#FAFAFA',
                            color: qIdx === currentQIdx ? '#FAFAFA' : '#2B2B2B',
                            fontSize: '0.84rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: qIdx === currentQIdx ? '3px 3px 0px rgba(43, 43, 43, 0.25)' : 'none',
                            fontFamily: "'Special Elite', monospace",
                          }}
                        >
                          Question #{qIdx + 1}
                        </button>
                      ))}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        disabled={currentQIdx === 0}
                        onClick={() => setActiveQuestionIdx((prev) => Math.max(0, prev - 1))}
                        className="btn-secondary"
                        style={{ padding: '6px 10px', opacity: currentQIdx === 0 ? 0.4 : 1 }}
                        title="Previous Question"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        type="button"
                        disabled={currentQIdx === questionsList.length - 1}
                        onClick={() => setActiveQuestionIdx((prev) => Math.min(questionsList.length - 1, prev + 1))}
                        className="btn-secondary"
                        style={{ padding: '6px 10px', opacity: currentQIdx === questionsList.length - 1 ? 0.4 : 1 }}
                        title="Next Question"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Question Title with <TypewriterText> */}
                <div style={{ marginBottom: '28px' }}>
                  <span
                    style={{
                      fontSize: '0.85rem',
                      color: '#2B2B2B',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      display: 'block',
                      marginBottom: '8px',
                    }}
                  >
                    Question {currentQIdx + 1} of {questionsList.length}
                  </span>

                  <TypewriterText
                    key={`pres-q-${currentQIdx}`}
                    text={currentQuestion?.title || ''}
                    as="h1"
                    style={{
                      fontSize: '2.1rem',
                      lineHeight: 1.25,
                      fontWeight: 800,
                      color: '#2B2B2B',
                    }}
                  />
                </div>

                {/* Animated Options Bar Chart */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '18px',
                    flex: 1,
                    justifyContent: 'center',
                  }}
                >
                  {currentOptions.map((option, index) => {
                    const isLeader = option.votes > 0 && option.votes === highestVotes;
                    return (
                      <AnimatedBar
                        key={option.id || index}
                        option={option}
                        totalVotes={currentQVotes}
                        isLeader={isLeader}
                        index={index}
                      />
                    );
                  })}
                </div>

                {/* Presenter Finish Action Bar */}
                {pollIsConcluded ? (
                  <div
                    style={{
                      marginTop: '28px',
                      padding: '16px 20px',
                      background: 'rgba(220, 38, 38, 0.06)',
                      border: '2px dashed #DC2626',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="stamp-seal" style={{ fontSize: '0.74rem' }}>
                        ★ POLL CONCLUDED ★
                      </span>
                      <div>
                        <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#2B2B2B', fontFamily: "'Special Elite', monospace" }}>
                          Final Live Results Chart
                        </div>
                        <span style={{ fontSize: '0.8rem', color: '#555555' }}>
                          Voting has concluded. Displaying finalized responses and percentages.
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => setViewMode('leaderboard')}
                        className="btn-stamp"
                        style={{ padding: '8px 16px', fontSize: '0.84rem', gap: '6px' }}
                      >
                        <Trophy size={14} color="#FFFFFF" />
                        View Leaderboard Podium
                      </button>
                      <button
                        type="button"
                        onClick={handleResumePoll}
                        disabled={isUpdatingStatus}
                        className="btn-secondary"
                        style={{ padding: '8px 14px', fontSize: '0.84rem', gap: '6px' }}
                      >
                        <RotateCcw size={14} />
                        Reopen Voting
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      marginTop: '28px',
                      padding: '18px 24px',
                      background: '#F4F1EA',
                      border: '1px dashed #2B2B2B',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Flag size={20} color="#DC2626" />
                      <div>
                        <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#2B2B2B' }}>
                          Conclude polling session?
                        </div>
                        <span style={{ fontSize: '0.82rem', color: '#555555' }}>
                          Closes voting and displays the final presentation leaderboard
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleCompletePoll}
                      disabled={isUpdatingStatus}
                      className="btn-stamp"
                      style={{
                        padding: '12px 24px',
                        fontSize: '0.95rem',
                        fontWeight: 800,
                        gap: '8px',
                        cursor: 'pointer',
                      }}
                    >
                      <Flag size={18} color="#FFFFFF" />
                      Conclude Poll &amp; Show Leaderboard
                    </button>
                  </div>
                )}

                {/* Chart Footer Indicator */}
                <div
                  style={{
                    marginTop: '24px',
                    paddingTop: '16px',
                    borderTop: '1px dashed #2B2B2B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.84rem',
                    color: '#555555',
                    flexWrap: 'wrap',
                    gap: '10px',
                    fontFamily: "'Special Elite', monospace",
                  }}
                >
                  <span>Live responses streaming &bull; {currentQVotes} votes on this question</span>
                  <span
                    style={{
                      color: isConnected ? '#2563EB' : '#DC2626',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontWeight: 700,
                    }}
                  >
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        background: isConnected ? '#2563EB' : '#DC2626',
                        display: 'inline-block',
                      }}
                    />
                    {isConnected ? 'Live Sync Connected' : 'Sync Disconnected'}
                  </span>
                </div>
              </div>
            </motion.div>
          )
        ) : (
          /* Leaderboard Component Mount */
          <Leaderboard
            poll={poll}
            voterNames={voterNames}
            onResume={handleResumePoll}
          />
        )}
      </AnimatePresence>

      {/* Mobile QR Code Modal */}
      <AnimatePresence>
        {showMobileQRModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(43, 43, 43, 0.8)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
            onClick={() => setShowMobileQRModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel"
              style={{
                width: '100%',
                maxWidth: '380px',
                padding: '28px 24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                position: 'relative',
                background: '#FAFAFA',
                border: '2px solid #2B2B2B',
                boxShadow: '8px 8px 0px rgba(43, 43, 43, 0.3)',
              }}
            >
              <button
                type="button"
                onClick={() => setShowMobileQRModal(false)}
                style={{
                  position: 'absolute',
                  top: '14px',
                  right: '14px',
                  background: '#FAFAFA',
                  border: '1px solid #2B2B2B',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2B2B2B',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>

              <div
                className="stamp-seal"
                style={{ marginBottom: '10px', fontSize: '0.74rem' }}
              >
                LIVE ACCESS
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '16px', color: '#2B2B2B', fontFamily: "'Special Elite', monospace" }}>
                Scan to Vote Live
              </h3>

              {/* QR Code Container */}
              <div
                className="qr-code-wrapper"
                style={{
                  background: '#FAFAFA',
                  padding: '18px',
                  border: '1px solid #2B2B2B',
                  boxShadow: '6px 6px 0px rgba(43, 43, 43, 0.15)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                }}
              >
                <QRCodeSVG
                  value={voteUrl}
                  size={200}
                  level="H"
                  includeMargin={false}
                  fgColor="#2B2B2B"
                  bgColor="#FAFAFA"
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
              </div>

              {/* Session ID Pill */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px',
                  background: '#F4F1EA',
                  border: '1px dashed #2B2B2B',
                  marginBottom: '14px',
                }}
              >
                <span style={{ fontSize: '0.8rem', color: '#555555' }}>PIN:</span>
                <code style={{ fontSize: '0.95rem', fontWeight: 700, color: '#2B2B2B', fontFamily: 'monospace' }}>
                  {id}
                </code>
                <button
                  type="button"
                  onClick={handleCopyId}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: copiedId ? '#2563EB' : '#2B2B2B',
                    display: 'inline-flex',
                    padding: '2px',
                  }}
                >
                  {copiedId ? <Check size={14} color="#2563EB" /> : <Copy size={14} />}
                </button>
              </div>

              {/* Copy Vote Link */}
              <button
                type="button"
                onClick={handleCopyUrl}
                className="btn-secondary"
                style={{ width: '100%', padding: '10px', fontSize: '0.85rem', gap: '6px' }}
              >
                {copied ? <Check size={14} color="#DC2626" /> : <Share2 size={14} />}
                {copied ? 'Vote URL Copied!' : 'Copy Direct Link'}
              </button>

              <p style={{ fontSize: '0.75rem', color: '#555555', marginTop: '12px', lineHeight: 1.4 }}>
                Participants can join from any phone or browser.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
