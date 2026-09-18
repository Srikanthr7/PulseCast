import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Trophy,
  Sparkles,
  User,
  Users,
  RotateCcw,
  BarChart3,
  LogOut,
  Trash2,
  Loader2,
  Home,
  Award,
  Medal,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { deletePoll } from '../api';
import { useDeviceType } from '../hooks/useDeviceType';
import AnimatedBar from './AnimatedBar';
import PodiumChart from './PodiumChart';

export default function Leaderboard({ poll, voterNames = [], onResume, isVoterView = false }) {
  const navigate = useNavigate();
  const { isMobile, isTablet, isLaptop } = useDeviceType();
  const [deleting, setDeleting] = useState(false);
  const [selectedQuestionIdx, setSelectedQuestionIdx] = useState(0); // 0, 1, 2... or 'overall'
  const [viewAllQuestions, setViewAllQuestions] = useState(false);

  // Fire confetti on mount
  useEffect(() => {
    try {
      confetti({
        particleCount: 110,
        spread: 80,
        origin: { y: 0.55 },
        colors: ['#DC2626', '#2563EB', '#2B2B2B', '#EBE7DD'],
      });
    } catch (e) {
      // ignore
    }
  }, []);

  // Aggregate unique voters
  const allVoterNames = Array.from(
    new Set([
      ...(voterNames || []),
      ...(poll?.voter_names || []),
      ...(poll?.voters?.map((v) => v.name) || []),
    ].filter(Boolean))
  );

  // Normalize questions array
  const questions = (poll?.questions && poll.questions.length > 0)
    ? poll.questions
    : [
        {
          id: poll?.id,
          title: poll?.question || 'Live Poll Question',
          options: poll?.options || [],
        },
      ];

  const totalSessionVotes = questions.reduce(
    (acc, q) => acc + (q.options?.reduce((s, o) => s + (o.votes || 0), 0) || 0),
    0
  );

  // Compute all ranked options across session for the Top Choices Winner Podium Chart
  const allRankedOptions = questions
    .flatMap((q, qIdx) =>
      (q.options || []).map((opt) => ({
        ...opt,
        questionTitle: q.title,
        questionIndex: qIdx + 1,
      }))
    )
    .sort((a, b) => (b.votes || 0) - (a.votes || 0));

  const top1 = allRankedOptions[0];
  const top2 = allRankedOptions[1];
  const top3 = allRankedOptions[2];

  // Active question calculations for the Winner Podium Chart
  const isOverall = selectedQuestionIdx === 'overall';
  const activeQIdx = isOverall ? 0 : Math.min(Number(selectedQuestionIdx) || 0, Math.max(0, questions.length - 1));
  const currentActiveQ = questions[activeQIdx] || questions[0];

  const currentPodiumOptions = isOverall
    ? allRankedOptions
    : (currentActiveQ?.options || []);

  const currentPodiumTotalVotes = isOverall
    ? totalSessionVotes
    : (currentActiveQ?.options?.reduce((sum, o) => sum + (o.votes || 0), 0) || 0);

  const currentPodiumTitle = isOverall
    ? (poll?.title || 'Overall Session Top Winners')
    : currentActiveQ?.title;

  const currentPodiumBadge = isOverall
    ? 'OVERALL TOP WINNERS'
    : `QUESTION #${activeQIdx + 1} WINNER PODIUM`;

  const handleDeleteSession = async () => {
    if (!poll?.id) return;
    const sessionTitle = poll.title || questions[0]?.title || 'Poll Session';
    if (
      !window.confirm(
        `Are you sure you want to permanently delete this finished session ("${sessionTitle}")? All vote data and results will be permanently removed.`
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      await deletePoll(poll.id);
      navigate('/');
    } catch (err) {
      console.error('Failed to delete poll session:', err);
      alert(err.message || 'Failed to delete poll session.');
      setDeleting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      transition={{ duration: 0.3 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? '20px' : isTablet ? '26px' : '32px',
        width: '100%',
      }}
    >
      {/* 1. Header Certificate / Results Banner */}
      <div
        className="glass-panel"
        style={{
          padding: isMobile ? '20px 16px' : isTablet ? '26px 28px' : '32px 36px',
          background: '#FAFAFA',
          border: '2px solid #2B2B2B',
          boxShadow: '6px 6px 0px rgba(43, 43, 43, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: isMobile ? '16px' : '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '14px' : '22px' }}>
          <div
            style={{
              width: isMobile ? '48px' : '64px',
              height: isMobile ? '48px' : '64px',
              background: '#DC2626',
              border: '2px solid #2B2B2B',
              boxShadow: '3px 3px 0px rgba(43, 43, 43, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FAFAFA',
              flexShrink: 0,
            }}
          >
            <Trophy size={isMobile ? 26 : 36} color="#FAFAFA" />
          </div>

          <div>
            <div className="stamp-seal" style={{ marginBottom: '6px', fontSize: isMobile ? '0.72rem' : '0.8rem' }}>
              ★ OFFICIAL SESSION LEADERBOARD ★
            </div>
            <h1
              style={{
                fontSize: isMobile ? '1.4rem' : isTablet ? '1.8rem' : '2.1rem',
                fontWeight: 800,
                color: '#2B2B2B',
                margin: '4px 0 0',
                lineHeight: 1.2,
                fontFamily: "'Special Elite', monospace",
              }}
            >
              {poll?.title || questions[0]?.title || 'Poll Session Results'}
            </h1>
            <p
              style={{
                color: '#555555',
                fontSize: isMobile ? '0.82rem' : '0.94rem',
                marginTop: '6px',
                fontFamily: "'Special Elite', monospace",
              }}
            >
              Final Results &bull;{' '}
              <strong style={{ color: '#DC2626' }}>{totalSessionVotes}</strong> total votes cast across{' '}
              {questions.length} question{questions.length > 1 ? 's' : ''} &bull;{' '}
              <strong style={{ color: '#2563EB' }}>{allVoterNames.length}</strong> registered participant
              {allVoterNames.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
            width: isMobile ? '100%' : 'auto',
          }}
        >
          <button
            type="button"
            onClick={() => {
              confetti({
                particleCount: 80,
                spread: 80,
                origin: { y: 0.5 },
                colors: ['#DC2626', '#2563EB', '#2B2B2B', '#EBE7DD'],
              });
            }}
            className="btn-stamp"
            style={{
              gap: '6px',
              padding: isMobile ? '9px 16px' : '11px 22px',
              fontSize: isMobile ? '0.84rem' : '0.92rem',
              fontWeight: 800,
              flex: isMobile ? 1 : 'none',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={16} color="#FFFFFF" />
            Celebrate
          </button>

          {!isVoterView && onResume && (
            <button
              type="button"
              onClick={onResume}
              className="btn-secondary"
              style={{ gap: '8px', padding: '11px 20px', fontSize: '0.92rem' }}
            >
              <RotateCcw size={16} />
              Reopen Voting
            </button>
          )}

          {!isVoterView && (
            <button
              type="button"
              onClick={handleDeleteSession}
              disabled={deleting}
              className="btn-secondary"
              style={{
                gap: '8px',
                padding: '11px 20px',
                fontSize: '0.92rem',
                color: '#DC2626',
                borderColor: '#DC2626',
                cursor: deleting ? 'not-allowed' : 'pointer',
                opacity: deleting ? 0.7 : 1,
              }}
              title="Permanently delete this finished poll session"
            >
              {deleting ? (
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Trash2 size={16} />
              )}
              {deleting ? 'Deleting...' : 'Delete Session'}
            </button>
          )}

          <Link
            to="/"
            className="btn-secondary"
            style={{
              gap: '6px',
              padding: isMobile ? '9px 16px' : '11px 20px',
              fontSize: isMobile ? '0.84rem' : '0.92rem',
              flex: isMobile ? 1 : 'none',
              justifyContent: 'center',
            }}
            title="Return to home page"
          >
            {isVoterView ? <Home size={15} /> : <LogOut size={16} />}
            {isVoterView ? 'Done' : 'Exit'}
          </Link>
        </div>
      </div>

      {/* 2. Winner Podium Chart for Each Question with Switcher Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Question Switcher Buttons for the Winner Podium Chart */}
        {questions.length > 1 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              background: '#FAFAFA',
              padding: isMobile ? '10px' : '12px 16px',
              border: '2px solid #2B2B2B',
              boxShadow: '4px 4px 0px rgba(43, 43, 43, 0.15)',
              flexWrap: 'wrap',
            }}
          >
            {/* Direct Question Buttons */}
            <div
              className="horizontal-scroll-touch"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                overflowX: 'auto',
                maxWidth: '100%',
                paddingBottom: '4px',
                flex: 1,
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {questions.map((q, qIdx) => {
                const isSelected = selectedQuestionIdx === qIdx;
                const qVotes = q.options?.reduce((sum, opt) => sum + (opt.votes || 0), 0) || 0;
                return (
                  <button
                    key={q.id || qIdx}
                    type="button"
                    onClick={() => setSelectedQuestionIdx(qIdx)}
                    style={{
                      padding: isMobile ? '7px 11px' : '9px 18px',
                      background: isSelected ? '#2B2B2B' : '#FAFAFA',
                      color: isSelected ? '#FAFAFA' : '#2B2B2B',
                      border: '1px solid #2B2B2B',
                      boxShadow: isSelected ? '3px 3px 0px rgba(43, 43, 43, 0.25)' : '2px 2px 0px rgba(43, 43, 43, 0.1)',
                      fontWeight: 800,
                      fontSize: isMobile ? '0.8rem' : '0.88rem',
                      cursor: 'pointer',
                      fontFamily: "'Special Elite', monospace",
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      minHeight: isMobile ? '38px' : '42px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>Question #{qIdx + 1}</span>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        color: isSelected ? '#FAFAFA' : '#555555',
                        background: isSelected ? 'rgba(255,255,255,0.2)' : '#EBE7DD',
                        padding: '1px 5px',
                        border: isSelected ? '1px solid rgba(255,255,255,0.4)' : '1px solid #2B2B2B',
                      }}
                    >
                      {qVotes} {qVotes === 1 ? 'vote' : 'votes'}
                    </span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setSelectedQuestionIdx('overall')}
                style={{
                  padding: isMobile ? '7px 11px' : '9px 18px',
                  background: selectedQuestionIdx === 'overall' ? '#DC2626' : '#FAFAFA',
                  color: selectedQuestionIdx === 'overall' ? '#FAFAFA' : '#2B2B2B',
                  border: '1px solid #2B2B2B',
                  boxShadow: selectedQuestionIdx === 'overall' ? '3px 3px 0px rgba(220, 38, 38, 0.3)' : '2px 2px 0px rgba(43, 43, 43, 0.1)',
                  fontWeight: 800,
                  fontSize: isMobile ? '0.8rem' : '0.88rem',
                  cursor: 'pointer',
                  fontFamily: "'Special Elite', monospace",
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  minHeight: isMobile ? '38px' : '42px',
                  transition: 'all 0.15s ease',
                }}
              >
                <Trophy size={14} color={selectedQuestionIdx === 'overall' ? '#FAFAFA' : '#DC2626'} />
                <span>Overall Session Podium</span>
              </button>
            </div>

            {/* Prev / Next Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <button
                type="button"
                disabled={isOverall || activeQIdx === 0}
                onClick={() => setSelectedQuestionIdx((prev) => Math.max(0, (typeof prev === 'number' ? prev : 0) - 1))}
                className="btn-secondary"
                style={{
                  padding: isMobile ? '7px 10px' : '8px 12px',
                  fontSize: isMobile ? '0.8rem' : '0.82rem',
                  gap: '4px',
                  minHeight: isMobile ? '38px' : '42px',
                  opacity: isOverall || activeQIdx === 0 ? 0.35 : 1,
                }}
                title="Previous Question"
              >
                <ChevronLeft size={15} />
                <span>Prev</span>
              </button>
              <button
                type="button"
                disabled={isOverall || activeQIdx === questions.length - 1}
                onClick={() => setSelectedQuestionIdx((prev) => Math.min(questions.length - 1, (typeof prev === 'number' ? prev : 0) + 1))}
                className="btn-secondary"
                style={{
                  padding: isMobile ? '7px 10px' : '8px 12px',
                  fontSize: isMobile ? '0.8rem' : '0.82rem',
                  gap: '4px',
                  minHeight: isMobile ? '38px' : '42px',
                  opacity: isOverall || activeQIdx === questions.length - 1 ? 0.35 : 1,
                }}
                title="Next Question"
              >
                <span>Next</span>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* Podium Chart for the current question */}
        <PodiumChart
          questionTitle={currentPodiumTitle}
          questionIndex={isOverall ? undefined : activeQIdx}
          totalQuestions={isOverall ? undefined : questions.length}
          options={currentPodiumOptions}
          voters={poll?.voters || []}
          totalVotes={currentPodiumTotalVotes}
          isMobile={isMobile}
          isTablet={isTablet}
          badgeText={currentPodiumBadge}
        />

        {/* Bottom Switcher Navigation for the Podium Chart */}
        {questions.length > 1 && !isOverall && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 16px',
              background: '#FAFAFA',
              border: '1px solid #2B2B2B',
              boxShadow: '3px 3px 0px rgba(43, 43, 43, 0.1)',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <button
              type="button"
              disabled={activeQIdx === 0}
              onClick={() => setSelectedQuestionIdx((prev) => Math.max(0, (typeof prev === 'number' ? prev : 0) - 1))}
              className="btn-secondary"
              style={{ padding: '8px 14px', fontSize: '0.84rem', gap: '6px', opacity: activeQIdx === 0 ? 0.35 : 1 }}
            >
              <ChevronLeft size={16} />
              Prev Question Podium
            </button>

            <span style={{ fontSize: '0.84rem', color: '#555555', fontFamily: "'Special Elite', monospace" }}>
              Showing Podium Chart for Question {activeQIdx + 1} of {questions.length}
            </span>

            <button
              type="button"
              disabled={activeQIdx === questions.length - 1}
              onClick={() => setSelectedQuestionIdx((prev) => Math.min(questions.length - 1, (typeof prev === 'number' ? prev : 0) + 1))}
              className="btn-secondary"
              style={{ padding: '8px 14px', fontSize: '0.84rem', gap: '6px', opacity: activeQIdx === questions.length - 1 ? 0.35 : 1 }}
            >
              Next Question Podium
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* 3. Physical Sign-In Guestbook */}
      <div
        className="glass-panel guestbook-ledger"
        style={{
          padding: isMobile ? '24px 16px 24px 44px' : isTablet ? '28px 24px 28px 54px' : '32px 36px 36px 64px',
          background: '#FAFAFA',
          border: '2px solid #2B2B2B',
          boxShadow: '6px 6px 0px rgba(43, 43, 43, 0.15)',
          position: 'relative',
        }}
      >
        {/* Physical Red Margin Line */}
        <div className="guestbook-margin-line" style={{ left: isMobile ? '32px' : isTablet ? '40px' : '48px' }} />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '10px',
            borderBottom: '2px dashed #2B2B2B',
            paddingBottom: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={20} color="#2B2B2B" />
            <h2
              style={{
                fontSize: isMobile ? '1.18rem' : '1.4rem',
                fontWeight: 800,
                margin: 0,
                color: '#2B2B2B',
                fontFamily: "'Special Elite', monospace",
              }}
            >
              Participant Sign-In Guestbook ({allVoterNames.length})
            </h2>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#555555', fontFamily: "'Special Elite', monospace" }}>
            Recorded participant signatures
          </span>
        </div>

        {allVoterNames.length > 0 ? (
          <div
            style={{
              display: 'flex',
              gap: isMobile ? '10px 14px' : '16px 20px',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            {allVoterNames.map((name, idx) => {
              const rotation = idx % 2 === 0 ? '-2deg' : '2deg';
              const isTop3 = idx < 3;

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.02, duration: 0.2 }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '5px 12px',
                    background: '#FAFAFA',
                    border: '1px solid #2B2B2B',
                    boxShadow: '3px 3px 0px rgba(43, 43, 43, 0.15)',
                    transform: `rotate(${rotation})`,
                    transition: 'transform 0.15s ease',
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Special Elite', monospace",
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      color: isTop3 ? '#DC2626' : '#555555',
                      borderRight: '1px dashed #2B2B2B',
                      paddingRight: '6px',
                    }}
                  >
                    #{idx + 1}
                  </span>

                  {/* Render voter_names in Caveat handwriting font */}
                  <span
                    style={{
                      fontFamily: "'Caveat', cursive",
                      fontSize: isMobile ? '1.25rem' : '1.45rem',
                      fontWeight: 700,
                      color: '#2563EB',
                      letterSpacing: '0.02em',
                      lineHeight: 1,
                    }}
                  >
                    {name}
                  </span>

                  {isTop3 && (
                    <span
                      className="stamp-seal"
                      style={{
                        fontSize: '0.62rem',
                        padding: '1px 5px',
                        marginLeft: '2px',
                      }}
                    >
                      TOP
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div
            style={{
              padding: '16px 0',
              color: '#555555',
              fontStyle: 'italic',
              fontFamily: "'Special Elite', monospace",
            }}
          >
            No signatures recorded in the guestbook yet.
          </div>
        )}
      </div>

      {/* 4. Separate Question Charts with Switcher Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BarChart3 size={20} color="#2B2B2B" />
            <h2
              style={{
                fontSize: isMobile ? '1.25rem' : '1.45rem',
                fontWeight: 800,
                color: '#2B2B2B',
                fontFamily: "'Special Elite', monospace",
                margin: 0,
              }}
            >
              Question Results Charts
            </h2>
          </div>

          {/* Toggle between Separate View and All Questions View */}
          {questions.length > 1 && (
            <button
              type="button"
              onClick={() => setViewAllQuestions((prev) => !prev)}
              className="btn-secondary"
              style={{ padding: '6px 14px', fontSize: '0.82rem', gap: '6px' }}
            >
              {viewAllQuestions ? 'Switch to Separate Charts' : `View All (${questions.length}) Together`}
            </button>
          )}
        </div>

        {/* Buttons to switch between separate question charts */}
        {questions.length > 1 && !viewAllQuestions && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              background: '#FAFAFA',
              padding: isMobile ? '10px' : '12px 16px',
              border: '2px solid #2B2B2B',
              boxShadow: '4px 4px 0px rgba(43, 43, 43, 0.15)',
              flexWrap: 'wrap',
            }}
          >
            {/* Direct Question Select Buttons */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                overflowX: 'auto',
                maxWidth: '100%',
                paddingBottom: '2px',
                flex: 1,
              }}
            >
              {questions.map((q, qIdx) => {
                const isSelected = qIdx === selectedQuestionIdx;
                const qVotes = q.options?.reduce((sum, opt) => sum + (opt.votes || 0), 0) || 0;
                return (
                  <button
                    key={q.id || qIdx}
                    type="button"
                    onClick={() => setSelectedQuestionIdx(qIdx)}
                    style={{
                      padding: isMobile ? '8px 12px' : '9px 18px',
                      background: isSelected ? '#2B2B2B' : '#FAFAFA',
                      color: isSelected ? '#FAFAFA' : '#2B2B2B',
                      border: '1px solid #2B2B2B',
                      boxShadow: isSelected ? '3px 3px 0px rgba(43, 43, 43, 0.25)' : '2px 2px 0px rgba(43, 43, 43, 0.1)',
                      fontWeight: 800,
                      fontSize: isMobile ? '0.82rem' : '0.88rem',
                      cursor: 'pointer',
                      fontFamily: "'Special Elite', monospace",
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>Question #{qIdx + 1}</span>
                    <span
                      style={{
                        fontSize: '0.74rem',
                        color: isSelected ? '#FAFAFA' : '#555555',
                        background: isSelected ? 'rgba(255,255,255,0.2)' : '#EBE7DD',
                        padding: '1px 6px',
                        border: isSelected ? '1px solid rgba(255,255,255,0.4)' : '1px solid #2B2B2B',
                      }}
                    >
                      {qVotes} {qVotes === 1 ? 'vote' : 'votes'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Prev / Next Question Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                disabled={selectedQuestionIdx === 0}
                onClick={() => setSelectedQuestionIdx((prev) => Math.max(0, prev - 1))}
                className="btn-secondary"
                style={{ padding: '8px 12px', fontSize: '0.82rem', gap: '4px', opacity: selectedQuestionIdx === 0 ? 0.35 : 1 }}
                title="Previous Question"
              >
                <ChevronLeft size={16} />
                <span>Prev</span>
              </button>
              <button
                type="button"
                disabled={selectedQuestionIdx === questions.length - 1}
                onClick={() => setSelectedQuestionIdx((prev) => Math.min(questions.length - 1, prev + 1))}
                className="btn-secondary"
                style={{ padding: '8px 12px', fontSize: '0.82rem', gap: '4px', opacity: selectedQuestionIdx === questions.length - 1 ? 0.35 : 1 }}
                title="Next Question"
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Separate Question Chart(s) */}
        {(viewAllQuestions ? questions : [questions[Math.min(selectedQuestionIdx, Math.max(0, questions.length - 1))] || questions[0]]).map((q, idx) => {
          const qIdx = viewAllQuestions ? idx : Math.min(selectedQuestionIdx, Math.max(0, questions.length - 1));
          const qTotalVotes = q.options?.reduce((sum, opt) => sum + (opt.votes || 0), 0) || 0;
          const highestVotes = Math.max(...(q.options || []).map((o) => o.votes || 0), 0);
          const rankedOptions = [...(q.options || [])].sort((a, b) => (b.votes || 0) - (a.votes || 0));

          return (
            <div
              key={q.id || qIdx}
              className="glass-panel"
              style={{
                padding: isMobile ? '20px 16px' : isTablet ? '26px 24px' : '28px 32px',
                background: '#FAFAFA',
                border: '1px solid #2B2B2B',
                boxShadow: '6px 6px 0px rgba(43, 43, 43, 0.15)',
              }}
            >
              {/* Question Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '18px',
                  flexWrap: 'wrap',
                  gap: '10px',
                  borderBottom: '2px dashed #2B2B2B',
                  paddingBottom: '12px',
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
                      marginBottom: '6px',
                      fontFamily: "'Special Elite', monospace",
                    }}
                  >
                    Question #{qIdx + 1} of {questions.length}
                  </span>
                  <h3
                    style={{
                      fontSize: isMobile ? '1.18rem' : '1.35rem',
                      fontWeight: 800,
                      margin: 0,
                      color: '#2B2B2B',
                      fontFamily: "'Special Elite', monospace",
                    }}
                  >
                    {q.title}
                  </h3>
                </div>

                <div style={{ fontSize: '0.88rem', color: '#555555', fontFamily: "'Special Elite', monospace" }}>
                  <strong style={{ color: '#2B2B2B', fontSize: '1rem' }}>{qTotalVotes}</strong> total votes cast
                </div>
              </div>

              {/* Animated Live Bars for this Question */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {rankedOptions.map((opt, rankIdx) => {
                  const isLeader = opt.votes > 0 && opt.votes === highestVotes;
                  const optionVoters = (poll?.voters || []).filter(
                    (v) => String(v.option_id) === String(opt.id)
                  );

                  return (
                    <div key={opt.id || rankIdx} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <AnimatedBar
                        option={opt}
                        totalVotes={qTotalVotes}
                        isLeader={isLeader}
                        index={rankIdx}
                      />

                      {/* Voter Signatures for this option in Caveat font */}
                      {optionVoters.length > 0 && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            flexWrap: 'wrap',
                            paddingLeft: '6px',
                          }}
                        >
                          <span style={{ fontSize: '0.76rem', color: '#555555', fontFamily: "'Special Elite', monospace" }}>
                            Voted by:
                          </span>
                          {optionVoters.map((v, vIdx) => (
                            <span
                              key={vIdx}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                padding: '2px 7px',
                                background: '#F4F1EA',
                                border: '1px solid #2B2B2B',
                                fontSize: '1.08rem',
                                color: '#2563EB',
                                fontFamily: "'Caveat', cursive",
                                transform: vIdx % 2 === 0 ? 'rotate(-2deg)' : 'rotate(2deg)',
                              }}
                            >
                              <User size={10} color="#2563EB" />
                              {v.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bottom Pagination Switcher when viewing single separate chart */}
              {questions.length > 1 && !viewAllQuestions && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '22px',
                    paddingTop: '16px',
                    borderTop: '1px dashed #2B2B2B',
                    flexWrap: 'wrap',
                    gap: '10px',
                  }}
                >
                  <button
                    type="button"
                    disabled={selectedQuestionIdx === 0}
                    onClick={() => setSelectedQuestionIdx((prev) => Math.max(0, prev - 1))}
                    className="btn-secondary"
                    style={{
                      padding: '8px 14px',
                      fontSize: '0.84rem',
                      gap: '6px',
                      opacity: selectedQuestionIdx === 0 ? 0.35 : 1,
                    }}
                  >
                    <ChevronLeft size={16} />
                    Prev Question
                  </button>

                  <span style={{ fontSize: '0.84rem', color: '#555555', fontFamily: "'Special Elite', monospace" }}>
                    Showing Question {selectedQuestionIdx + 1} of {questions.length}
                  </span>

                  <button
                    type="button"
                    disabled={selectedQuestionIdx === questions.length - 1}
                    onClick={() => setSelectedQuestionIdx((prev) => Math.min(questions.length - 1, prev + 1))}
                    className="btn-secondary"
                    style={{
                      padding: '8px 14px',
                      fontSize: '0.84rem',
                      gap: '6px',
                      opacity: selectedQuestionIdx === questions.length - 1 ? 0.35 : 1,
                    }}
                  >
                    Next Question
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
