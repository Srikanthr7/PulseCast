import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  WifiOff,
  Share2,
  Check,
  RefreshCw,
  AlertCircle,
  Trophy,
  RotateCcw,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Flag,
  LogOut,
  Globe,
  Edit3,
  Wifi,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useLivePoll } from '../hooks/useLivePoll';
import { completePoll, updatePollStatus, getNetworkIP } from '../api';
import AnimatedBar from '../components/AnimatedBar';
import Leaderboard from '../components/Leaderboard';

export default function PresentationView() {
  const { id } = useParams();
  const { poll, isCompleted, voterNames, loading, error, isConnected, refetch } = useLivePoll(id);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState('live'); // 'live' | 'leaderboard'
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);

  // Network IP Detection for Scannable Phone QR Codes
  const [networkHost, setNetworkHost] = useState(() => {
    if (typeof window !== 'undefined') {
      const custom = localStorage.getItem('pulsecast_custom_ip');
      if (custom) return custom;
      if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        return window.location.hostname;
      }
    }
    return '';
  });
  const [isEditingHost, setIsEditingHost] = useState(false);
  const [customHostInput, setCustomHostInput] = useState('');

  // Auto-detect outbound LAN IP on mount
  useEffect(() => {
    async function resolveIP() {
      if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        setNetworkHost(window.location.hostname);
        return;
      }
      const saved = localStorage.getItem('pulsecast_custom_ip');
      if (saved) {
        setNetworkHost(saved);
        return;
      }
      try {
        const detectedIP = await getNetworkIP();
        if (detectedIP && detectedIP !== 'localhost' && detectedIP !== '127.0.0.1') {
          setNetworkHost(detectedIP);
        }
      } catch (e) {
        // ignore
      }
    }
    resolveIP();
  }, []);

  // Compute the scannable vote URL with host IP & port
  const currentHost = networkHost || (typeof window !== 'undefined' ? window.location.hostname : 'localhost');
  const currentPort = (typeof window !== 'undefined' && window.location.port) ? window.location.port : '5173';
  const voteUrl = `http://${currentHost}:${currentPort}/vote/${id}`;

  // Automatically switch to leaderboard when status is completed or isCompleted WebSocket event arrives
  useEffect(() => {
    if (isCompleted || (poll && poll.status === 'completed')) {
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

  // Wire up the green "Complete Poll & Show Leaderboard" button to POST /api/polls/:id/complete
  const handleCompletePoll = async () => {
    if (!id || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    try {
      await completePoll(id);
      setViewMode('leaderboard');
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'],
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
        <RefreshCw size={36} className="animate-spin" color="var(--accent-primary)" />
        <h2 style={{ fontSize: '1.5rem' }}>Loading live poll from MongoDB...</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Connecting to Go backend on port 8080</p>
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', maxWidth: '500px', margin: '0 auto' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          color: '#ef4444',
        }}>
          <AlertCircle size={32} />
        </div>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>Poll Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          {error || `Poll with ID ${id} was not found in MongoDB.`}
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

  // Total session votes across all questions
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
      }}
    >
      {/* Presentation Top Banner / Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '28px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border-subtle)',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {/* Status Badge */}
          {pollIsConcluded ? (
            <div className="live-badge" style={{ background: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#fca5a5' }}>
              <Trophy size={14} color="#f59e0b" />
              POLL CONCLUDED &bull; FINAL LEADERBOARD
            </div>
          ) : isConnected ? (
            <div className="live-badge" style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.4)', color: '#34d399' }}>
              <span className="live-dot" style={{ backgroundColor: '#10b981', boxShadow: '0 0 8px #10b981' }} />
              LIVE &bull; REDIS REALTIME
            </div>
          ) : (
            <div className="live-badge" style={{ background: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.4)', color: '#fbbf24' }}>
              <WifiOff size={12} />
              RECONNECTING TO WEBSOCKET...
            </div>
          )}

          {/* View Switcher Tabs */}
          <div style={{
            display: 'inline-flex',
            background: 'rgba(0, 0, 0, 0.4)',
            borderRadius: '12px',
            padding: '4px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            gap: '4px',
          }}>
            <button
              type="button"
              onClick={() => setViewMode('live')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                background: viewMode === 'live' ? 'linear-gradient(135deg, #48E5C2 0%, #36d4b2 100%)' : 'transparent',
                color: viewMode === 'live' ? '#000000' : 'var(--text-secondary)',
                fontSize: '0.85rem',
                fontWeight: viewMode === 'live' ? 700 : 500,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: viewMode === 'live' ? '0 2px 10px rgba(72, 229, 194, 0.35)' : 'none',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <BarChart2 size={14} color={viewMode === 'live' ? '#000000' : 'currentColor'} />
              Live Chart
            </button>
            <button
              type="button"
              onClick={() => setViewMode('leaderboard')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                background: viewMode === 'leaderboard' ? 'linear-gradient(135deg, #48E5C2 0%, #36d4b2 100%)' : 'transparent',
                color: viewMode === 'leaderboard' ? '#000000' : 'var(--text-secondary)',
                fontSize: '0.85rem',
                fontWeight: viewMode === 'leaderboard' ? 700 : 500,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: viewMode === 'leaderboard' ? '0 2px 10px rgba(72, 229, 194, 0.35)' : 'none',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <Trophy size={14} color={viewMode === 'leaderboard' ? '#000000' : '#f59e0b'} />
              Leaderboard &amp; Voters ({voterNames.length || poll.voters?.length || 0})
            </button>
          </div>

          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Session ID: <strong style={{ color: 'var(--text-primary)' }}>{poll.id}</strong>
          </span>
        </div>

        {/* Live Controls & Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Total Session Votes Counter */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <Users size={16} color="var(--accent-cyan)" />
            <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>
              <motion.span
                key={totalSessionVotes}
                initial={{ scale: 1.3, color: '#06b6d4' }}
                animate={{ scale: 1, color: '#ffffff' }}
                transition={{ duration: 0.3 }}
              >
                {totalSessionVotes}
              </motion.span>{' '}
              {totalSessionVotes === 1 ? 'Total Vote' : 'Total Votes'}
            </span>
          </div>

          {/* Finish Poll & Show Leaderboard Button */}
          {!pollIsConcluded ? (
            <button
              type="button"
              onClick={handleCompletePoll}
              disabled={isUpdatingStatus}
              className="btn-primary"
              style={{
                background: '#48E5C2',
                color: '#000000',
                padding: '10px 22px',
                fontSize: '0.92rem',
                fontWeight: 800,
                gap: '8px',
                borderRadius: '16px',
                boxShadow: '0 4px 16px rgba(72, 229, 194, 0.4)',
                cursor: 'pointer',
              }}
            >
              <Flag size={16} color="#000000" />
              Finish Poll &amp; Show Leaderboard
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
          )}

          <button
            type="button"
            onClick={refetch}
            className="btn-secondary"
            title="Refresh poll data from MongoDB"
            style={{ padding: '8px 12px', fontSize: '0.85rem' }}
          >
            <RefreshCw size={14} />
          </button>

          {/* Exit Presentation Button */}
          <Link
            to="/"
            className="btn-secondary"
            style={{
              padding: '8px 14px',
              fontSize: '0.85rem',
              gap: '6px',
              color: '#f87171',
              borderColor: 'rgba(239, 68, 68, 0.4)',
              background: 'rgba(239, 68, 68, 0.08)',
              fontWeight: 600,
            }}
            title="Exit presentation and return to dashboard"
          >
            <LogOut size={14} />
            Exit
          </Link>
        </div>
      </div>

      {/* Main View Mode Content: Toggle between LiveChart and Leaderboard Component */}
      <AnimatePresence mode="wait">
        {viewMode === 'live' && !pollIsConcluded ? (
          /* Live Projector Split Screen Layout (LiveChart) */
          <motion.div
            key="live-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="presentation-grid"
          >
            {/* Left Column: Large QR Code & Join Instructions */}
            <div
              className="glass-panel-glow"
              style={{
                padding: '36px 28px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                position: 'relative',
              }}
            >
              <div
                style={{
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  fontWeight: 700,
                  color: 'var(--accent-cyan)',
                  marginBottom: '8px',
                }}
              >
                Join with your Phone
              </div>
              <h2
                style={{
                  fontSize: '1.75rem',
                  marginBottom: '16px',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                Scan to Vote Live
              </h2>

              {/* Wi-Fi Host IP Badge & Manual Override */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.78rem',
                  color: currentHost === 'localhost' || currentHost === '127.0.0.1' ? '#fbbf24' : '#34d399',
                  background: currentHost === 'localhost' || currentHost === '127.0.0.1' ? 'rgba(251, 191, 36, 0.12)' : 'rgba(52, 211, 153, 0.12)',
                  border: `1px solid ${currentHost === 'localhost' || currentHost === '127.0.0.1' ? 'rgba(251, 191, 36, 0.3)' : 'rgba(52, 211, 153, 0.3)'}`,
                  borderRadius: '999px',
                  padding: '5px 12px',
                  marginBottom: '16px',
                }}
              >
                <Wifi size={13} />
                <span>
                  {currentHost === 'localhost' || currentHost === '127.0.0.1'
                    ? 'Localhost (Enter Wi-Fi IP below to scan from phone)'
                    : `Wi-Fi Host: ${currentHost}`}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingHost(!isEditingHost);
                    setCustomHostInput(currentHost);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'inherit',
                    cursor: 'pointer',
                    padding: '0 4px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    textDecoration: 'underline',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                  title="Change IP address for phone QR scanning"
                >
                  <Edit3 size={11} style={{ marginRight: '3px' }} />
                  {isEditingHost ? 'Cancel' : 'Change'}
                </button>
              </div>

              {/* Custom IP Input Dialog */}
              {isEditingHost && (
                <div
                  style={{
                    display: 'flex',
                    gap: '6px',
                    marginBottom: '16px',
                    width: '100%',
                    maxWidth: '300px',
                  }}
                >
                  <input
                    type="text"
                    placeholder="e.g. 192.168.1.50"
                    value={customHostInput}
                    onChange={(e) => setCustomHostInput(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '7px 10px',
                      fontSize: '0.8rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(0, 0, 0, 0.6)',
                      border: '1px solid var(--border-subtle)',
                      color: '#ffffff',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customHostInput.trim()) {
                        localStorage.setItem('pulsecast_custom_ip', customHostInput.trim());
                        setNetworkHost(customHostInput.trim());
                      }
                      setIsEditingHost(false);
                    }}
                    style={{
                      padding: '7px 12px',
                      fontSize: '0.8rem',
                      background: 'var(--accent-primary)',
                      color: '#000000',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontWeight: 700,
                    }}
                  >
                    Save
                  </button>
                </div>
              )}

              {/* QR Code Container on pure Bright Snow background */}
              <div
                className="qr-code-wrapper"
                style={{
                  background: '#FCFAF9',
                  padding: '22px',
                  borderRadius: '16px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                  maxWidth: '100%',
                }}
              >
                <QRCodeSVG
                  value={voteUrl}
                  size={220}
                  level="H"
                  includeMargin={false}
                  fgColor="#000000"
                  bgColor="#FCFAF9"
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
              </div>

              {/* Wi-Fi Reminder */}
              <p
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  marginBottom: '14px',
                  maxWidth: '290px',
                  lineHeight: 1.4,
                }}
              >
                📱 <strong style={{ color: 'var(--text-secondary)' }}>Tip:</strong> Connect your phone to the same Wi-Fi network as this computer to vote.
              </p>

              {/* Direct Link Info */}
              <div style={{ maxWidth: '320px', width: '100%' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Or point your mobile browser to:
                </p>
                <div
                  onClick={handleCopyUrl}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '8px' }}>
                    {voteUrl}
                  </span>
                  {copied ? <Check size={16} color="#10b981" /> : <Share2 size={16} />}
                </div>
                {copied && (
                  <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'block', marginTop: '4px' }}>
                    Copied vote URL!
                  </span>
                )}
              </div>
            </div>

            {/* Right Column: Live Animated Spring Bar Chart */}
            <div
              className="glass-panel"
              style={{
                padding: '36px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              {/* Question Navigation Tabs (for multi-question polls) */}
              {questionsList.length > 1 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '20px',
                    paddingBottom: '14px',
                    borderBottom: '1px solid var(--border-subtle)',
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
                          borderRadius: '10px',
                          border: qIdx === currentQIdx ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid rgba(255, 255, 255, 0.08)',
                          background: qIdx === currentQIdx ? 'linear-gradient(135deg, #48E5C2 0%, #36d4b2 100%)' : 'rgba(255, 255, 255, 0.04)',
                          color: qIdx === currentQIdx ? '#000000' : 'var(--text-secondary)',
                          fontSize: '0.84rem',
                          fontWeight: qIdx === currentQIdx ? 700 : 500,
                          cursor: 'pointer',
                          boxShadow: qIdx === currentQIdx ? '0 2px 10px rgba(72, 229, 194, 0.35)' : 'none',
                          backdropFilter: 'blur(10px)',
                          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
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

              {/* Question Title */}
              <div style={{ marginBottom: '28px' }}>
                <span
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--accent-primary)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    display: 'block',
                    marginBottom: '8px',
                  }}
                >
                  Question {currentQIdx + 1} of {questionsList.length}
                </span>
                <h1
                  style={{
                    fontSize: '2.2rem',
                    lineHeight: 1.25,
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                  }}
                >
                  {currentQuestion?.title}
                </h1>
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

              {/* Presenter Finish Action Bar inside the Projector Chart Panel */}
              {!pollIsConcluded && (
                <div
                  style={{
                    marginTop: '28px',
                    padding: '18px 24px',
                    borderRadius: '16px',
                    background: 'rgba(72, 229, 194, 0.12)',
                    border: '1px solid rgba(72, 229, 194, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Flag size={20} color="#48E5C2" />
                    <div>
                      <div style={{ fontSize: '0.98rem', fontWeight: 700, color: '#FCFAF9' }}>
                        Ready to conclude this session?
                      </div>
                      <span style={{ fontSize: '0.82rem', color: 'rgba(252, 250, 249, 0.65)' }}>
                        Locks voting screens and transitions projector to the final Leaderboard
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCompletePoll}
                    disabled={isUpdatingStatus}
                    className="btn-primary"
                    style={{
                      background: '#48E5C2',
                      color: '#333333',
                      padding: '12px 24px',
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      gap: '8px',
                      borderRadius: '16px',
                      boxShadow: '0 4px 18px rgba(72, 229, 194, 0.45)',
                      cursor: 'pointer',
                    }}
                  >
                    <Flag size={18} color="#333333" />
                    Finish Session &amp; Show Leaderboard
                  </button>
                </div>
              )}

              {/* Chart Footer Indicator */}
              <div
                style={{
                  marginTop: '24px',
                  paddingTop: '20px',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <span>Live chart streaming via WebSocket &bull; {currentQVotes} votes on this question</span>
                <span style={{ color: isConnected ? '#34d399' : '#fbbf24' }}>
                  {isConnected ? '● Connected to Redis Live Stream' : '○ WebSocket Disconnected'}
                </span>
              </div>
            </div>
          </motion.div>
        ) : (
          /* Leaderboard Component Mount: Unmounts LiveChart on POLL_COMPLETED */
          <Leaderboard
            poll={poll}
            voterNames={voterNames}
            onResume={handleResumePoll}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
