import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Trophy,
  Crown,
  Sparkles,
  User,
  Users,
  RotateCcw,
  CheckCircle2,
  Award,
  BarChart3,
  Calendar,
  LogOut,
  Medal,
  Star,
  Trash2,
  Loader2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { deletePoll } from '../api';

export default function Leaderboard({ poll, voterNames = [], onResume }) {
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);

  // Fire confetti on mount
  useEffect(() => {
    try {
      confetti({
        particleCount: 110,
        spread: 80,
        origin: { y: 0.55 },
        colors: ['#48E5C2', '#F3D3BD', '#FCFAF9', '#333333', '#5E5E5E'],
      });
    } catch (e) {
      // ignore
    }
  }, []);

  // Aggregate unique voters from voterNames prop, poll.voter_names, and poll.voters
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
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.4 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '32px', width: '100%' }}
    >
      {/* 1. Header Trophy Banner (Charcoal card with Desert Sand and Turquoise accents) */}
      <div
        className="glass-panel-glow"
        style={{
          padding: '32px 36px',
          borderRadius: '20px',
          border: '1.5px solid rgba(243, 211, 189, 0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '22px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: '#F3D3BD',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000000',
              boxShadow: '0 0 25px rgba(243, 211, 189, 0.5)',
              flexShrink: 0,
            }}
          >
            <Crown size={36} color="#000000" />
          </div>

          <div>
            <div
              style={{
                fontSize: '0.82rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                color: '#F3D3BD',
                letterSpacing: '0.08em',
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: 'var(--font-heading)',
              }}
            >
              <Trophy size={14} color="#F3D3BD" />
              Official Session Leaderboard
            </div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#FCFAF9', margin: 0, lineHeight: 1.2, fontFamily: 'var(--font-heading)' }}>
              {poll?.title || questions[0]?.title || 'Poll Session Results'}
            </h1>
            <p style={{ color: 'rgba(252, 250, 249, 0.8)', fontSize: '0.95rem', marginTop: '6px', fontFamily: 'var(--font-body)', fontWeight: 500 }}>
              Finalized &bull; <strong style={{ color: '#48E5C2' }}>{totalSessionVotes}</strong> total votes cast across {questions.length} question{questions.length > 1 ? 's' : ''} &bull; <strong style={{ color: '#F3D3BD' }}>{allVoterNames.length}</strong> registered participant{allVoterNames.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => {
              confetti({
                particleCount: 80,
                spread: 80,
                origin: { y: 0.5 },
                colors: ['#48E5C2', '#F3D3BD', '#FCFAF9', '#333333'],
              });
            }}
            className="btn-primary"
            style={{
              gap: '8px',
              padding: '11px 22px',
              fontSize: '0.92rem',
              fontWeight: 700,
              borderRadius: '16px',
            }}
          >
            <Sparkles size={16} color="#000000" />
            Celebrate
          </button>

          {onResume && (
            <button
              type="button"
              onClick={onResume}
              className="btn-secondary"
              style={{ gap: '8px', padding: '11px 20px', fontSize: '0.92rem', borderRadius: '16px' }}
            >
              <RotateCcw size={16} />
              Reopen Voting
            </button>
          )}

          <button
            type="button"
            onClick={handleDeleteSession}
            disabled={deleting}
            className="btn-secondary"
            style={{
              gap: '8px',
              padding: '11px 20px',
              fontSize: '0.92rem',
              color: '#ff6b6b',
              borderColor: 'rgba(255, 107, 107, 0.4)',
              background: 'rgba(255, 107, 107, 0.08)',
              borderRadius: '16px',
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

          <Link
            to="/"
            className="btn-secondary"
            style={{
              gap: '8px',
              padding: '11px 20px',
              fontSize: '0.92rem',
              color: '#F3D3BD',
              borderColor: 'rgba(243, 211, 189, 0.35)',
              background: '#5E5E5E',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              borderRadius: '16px',
            }}
            title="Exit presentation and return to dashboard"
          >
            <LogOut size={16} />
            Exit
          </Link>
        </div>
      </div>

      {/* 2. Styled Participant Roll Call (Highlighting Top Voters in Desert Sand against Charcoal) */}
      <div
        className="glass-panel"
        style={{
          padding: '28px 32px',
          borderRadius: '20px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '10px',
            borderBottom: '1px solid rgba(252, 250, 249, 0.14)',
            paddingBottom: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={22} color="#48E5C2" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: '#FCFAF9', fontFamily: 'var(--font-heading)' }}>
              Participating Audience ({allVoterNames.length})
            </h2>
          </div>
          <span style={{ fontSize: '0.85rem', color: 'rgba(252, 250, 249, 0.65)', fontFamily: 'var(--font-body)' }}>
            Top participants &amp; earliest voters highlighted in <strong style={{ color: '#F3D3BD' }}>Desert Sand</strong>
          </span>
        </div>

        {allVoterNames.length > 0 ? (
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {allVoterNames.map((name, idx) => {
              const isTop3 = idx < 3;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03, duration: 0.2 }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 18px',
                    borderRadius: '16px',
                    background: isTop3 ? 'rgba(243, 211, 189, 0.15)' : '#4a4a4a',
                    border: isTop3 ? '1.5px solid #F3D3BD' : '1px solid rgba(252, 250, 249, 0.16)',
                    color: isTop3 ? '#F3D3BD' : '#FCFAF9',
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    boxShadow: isTop3 ? '0 0 16px rgba(243, 211, 189, 0.3)' : '0 2px 8px rgba(0,0,0,0.2)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  <div
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '8px',
                      background: isTop3 ? '#F3D3BD' : '#5E5E5E',
                      color: isTop3 ? '#000000' : '#48E5C2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                    }}
                  >
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <span>{name}</span>
                  {isTop3 ? (
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '999px',
                        background: idx === 0 ? '#F3D3BD' : idx === 1 ? '#e2e8f0' : '#fed7aa',
                        color: '#000000',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {idx === 0 ? (
                        <Crown size={12} color="#000000" />
                      ) : (
                        <Medal size={12} color="#000000" />
                      )}
                      #{idx + 1}
                    </span>
                  ) : (
                    <CheckCircle2 size={15} color="#48E5C2" />
                  )}
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: '16px 0', color: 'rgba(252, 250, 249, 0.55)', fontStyle: 'italic', fontFamily: 'var(--font-body)' }}>
            No voter names recorded yet. Once participants submit votes with their names, they will appear here!
          </div>
        )}
      </div>

      {/* 3. Question-by-Question Final Results Breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px', color: '#FCFAF9', fontFamily: 'var(--font-heading)' }}>
          <BarChart3 size={22} color="#48E5C2" />
          Question Breakdown &amp; Winners
        </h2>

        {questions.map((q, qIdx) => {
          const qTotalVotes = q.options?.reduce((sum, opt) => sum + (opt.votes || 0), 0) || 0;
          const rankedOptions = [...(q.options || [])].sort((a, b) => (b.votes || 0) - (a.votes || 0));

          return (
            <div
              key={q.id || qIdx}
              className="glass-panel"
              style={{
                padding: '28px 32px',
                borderRadius: '20px',
              }}
            >
              {/* Question Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '20px',
                  flexWrap: 'wrap',
                  gap: '12px',
                  borderBottom: '1px solid rgba(252, 250, 249, 0.14)',
                  paddingBottom: '14px',
                }}
              >
                <div>
                  <span
                    style={{
                      background: 'rgba(72, 229, 194, 0.18)',
                      color: '#48E5C2',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      padding: '4px 12px',
                      borderRadius: '8px',
                      display: 'inline-block',
                      marginBottom: '6px',
                      fontFamily: 'var(--font-heading)',
                    }}
                  >
                    Question #{qIdx + 1}
                  </span>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 600, margin: 0, color: '#FCFAF9', fontFamily: 'var(--font-heading)' }}>
                    {q.title}
                  </h3>
                </div>

                <div style={{ fontSize: '0.9rem', color: 'rgba(252, 250, 249, 0.7)', fontFamily: 'var(--font-body)' }}>
                  <strong style={{ color: '#FCFAF9', fontSize: '1.05rem' }}>{qTotalVotes}</strong> total votes cast
                </div>
              </div>

              {/* Ranked Options for this Question */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {rankedOptions.map((opt, rankIdx) => {
                  const pct = qTotalVotes > 0 ? Math.round(((opt.votes || 0) / qTotalVotes) * 100) : 0;
                  const isWinner = rankIdx === 0 && (opt.votes || 0) > 0;

                  // Find voters for this question option
                  const optionVoters = (poll?.voters || []).filter(
                    (v) => String(v.option_id) === String(opt.id)
                  );

                  return (
                    <div
                      key={opt.id}
                      style={{
                        padding: '18px 22px',
                        borderRadius: '16px',
                        background: isWinner ? 'rgba(72, 229, 194, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        border: isWinner ? '1.5px solid rgba(72, 229, 194, 0.55)' : '1px solid rgba(255, 255, 255, 0.08)',
                        boxShadow: isWinner ? '0 0 25px rgba(72, 229, 194, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)' : '0 2px 10px rgba(0, 0, 0, 0.2)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '10px',
                          flexWrap: 'wrap',
                          gap: '8px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '28px',
                              height: '28px',
                              borderRadius: '8px',
                              background: rankIdx === 0 ? 'rgba(251, 191, 36, 0.15)' : rankIdx === 1 ? 'rgba(203, 213, 225, 0.15)' : rankIdx === 2 ? 'rgba(217, 119, 6, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                              border: rankIdx === 0 ? '1px solid rgba(251, 191, 36, 0.3)' : rankIdx === 1 ? '1px solid rgba(203, 213, 225, 0.3)' : rankIdx === 2 ? '1px solid rgba(217, 119, 6, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                            }}
                          >
                            {rankIdx === 0 ? (
                              <Trophy size={16} color="#fbbf24" />
                            ) : rankIdx === 1 ? (
                              <Medal size={16} color="#cbd5e1" />
                            ) : rankIdx === 2 ? (
                              <Medal size={16} color="#d97706" />
                            ) : (
                              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'rgba(252, 250, 249, 0.6)' }}>
                                #{rankIdx + 1}
                              </span>
                            )}
                          </span>
                          <span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#FCFAF9', fontFamily: 'var(--font-heading)' }}>
                            {opt.text}
                          </span>
                          {isWinner && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '3px 10px',
                                borderRadius: '999px',
                                background: '#F3D3BD',
                                color: '#000000',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                                fontFamily: 'var(--font-heading)',
                              }}
                            >
                              <Crown size={13} color="#000000" />
                              Winner
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: '0.9rem', color: 'rgba(252, 250, 249, 0.75)', fontFamily: 'var(--font-body)' }}>
                          <strong style={{ color: isWinner ? '#48E5C2' : '#FCFAF9', fontSize: '1.05rem', fontWeight: 700 }}>
                            {opt.votes || 0}
                          </strong>{' '}
                          {(opt.votes || 0) === 1 ? 'vote' : 'votes'} ({pct}%)
                        </div>
                      </div>

                      {/* Progress Bar (Winning bar in Turquoise #48E5C2, Runner-ups in Charcoal #5E5E5E) */}
                      <div
                        style={{
                          height: '10px',
                          borderRadius: '8px',
                          background: 'rgba(0, 0, 0, 0.3)',
                          overflow: 'hidden',
                          marginBottom: optionVoters.length > 0 ? '12px' : '0',
                        }}
                      >
                        <div
                          style={{
                            width: `${pct}%`,
                            height: '100%',
                            background: isWinner ? '#48E5C2' : '#6b6b6b',
                            borderRadius: '8px',
                            transition: 'width 0.8s ease',
                          }}
                        />
                      </div>

                      {/* Voter Names for this option */}
                      {optionVoters.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.78rem', color: 'rgba(252, 250, 249, 0.55)', fontFamily: 'var(--font-body)' }}>
                            Voted by:
                          </span>
                          {optionVoters.map((v, vIdx) => (
                            <span
                              key={vIdx}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 10px',
                                borderRadius: '8px',
                                background: 'rgba(252, 250, 249, 0.08)',
                                fontSize: '0.8rem',
                                color: '#FCFAF9',
                                fontFamily: 'var(--font-body)',
                              }}
                            >
                              <User size={11} color={isWinner ? '#48E5C2' : '#F3D3BD'} />
                              {v.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
