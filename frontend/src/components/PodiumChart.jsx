import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Award, User } from 'lucide-react';

export default function PodiumChart({
  questionTitle,
  questionIndex,
  totalQuestions,
  options = [],
  voters = [],
  totalVotes = 0,
  isMobile = false,
  isTablet = false,
  badgeText = 'QUESTION WINNER PODIUM',
}) {
  // Sort options by votes descending
  const sortedOptions = [...options].sort((a, b) => (b.votes || 0) - (a.votes || 0));
  const top1 = sortedOptions[0];
  const top2 = sortedOptions[1];
  const top3 = sortedOptions[2];
  const runnersUp = sortedOptions.slice(3);

  const getOptionVoters = (optionId) => {
    if (!voters || !optionId) return [];
    return voters.filter((v) => String(v.option_id) === String(optionId));
  };

  const getPercentage = (votes) => {
    if (!totalVotes || totalVotes <= 0) return 0;
    return Math.round(((votes || 0) / totalVotes) * 100);
  };

  return (
    <div
      className="glass-panel"
      style={{
        padding: isMobile ? '20px 16px' : isTablet ? '26px 24px' : '32px 34px',
        background: '#FAFAFA',
        border: '2px solid #2B2B2B',
        boxShadow: '6px 6px 0px rgba(43, 43, 43, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        gap: '22px',
      }}
    >
      {/* Podium Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '2px dashed #2B2B2B',
          paddingBottom: '14px',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <span
              className="stamp-seal"
              style={{
                fontSize: isMobile ? '0.7rem' : '0.76rem',
                padding: '2px 8px',
              }}
            >
              ★ {badgeText} ★
            </span>
            {questionIndex !== undefined && totalQuestions !== undefined && (
              <span
                style={{
                  background: '#2B2B2B',
                  color: '#FAFAFA',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  fontFamily: "'Special Elite', monospace",
                }}
              >
                Question #{questionIndex + 1} of {totalQuestions}
              </span>
            )}
          </div>

          <h3
            style={{
              fontSize: isMobile ? '1.2rem' : isTablet ? '1.38rem' : '1.5rem',
              fontWeight: 800,
              margin: '4px 0 0',
              color: '#2B2B2B',
              fontFamily: "'Special Elite', monospace",
              lineHeight: 1.25,
            }}
          >
            {questionTitle || 'Question Results'}
          </h3>
        </div>

        <div style={{ fontSize: '0.88rem', color: '#555555', fontFamily: "'Special Elite', monospace" }}>
          <strong style={{ color: '#2B2B2B', fontSize: '1.05rem' }}>{totalVotes}</strong> total votes cast
        </div>
      </div>

      {/* Podium Pillars Container */}
      {top1 ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            gap: isMobile ? '8px' : isTablet ? '16px' : '24px',
            paddingTop: '16px',
            minHeight: isMobile ? '230px' : '280px',
          }}
        >
          {/* 2nd Place Pillar (Left) */}
          {top2 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flex: '1 1 0',
                minWidth: 0,
                maxWidth: isMobile ? '31%' : isTablet ? '180px' : '220px',
              }}
            >
              <div
                style={{
                  textAlign: 'center',
                  marginBottom: '8px',
                  width: '100%',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: isMobile ? '24px' : '32px',
                    height: isMobile ? '24px' : '32px',
                    background: '#2B2B2B',
                    color: '#FAFAFA',
                    fontSize: isMobile ? '0.75rem' : '0.88rem',
                    fontWeight: 800,
                    border: '1px solid #1A1A1A',
                    marginBottom: '4px',
                  }}
                >
                  #2
                </span>
                <div
                  style={{
                    fontSize: isMobile ? '0.74rem' : '0.92rem',
                    fontWeight: 700,
                    color: '#2B2B2B',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: 1.25,
                    wordBreak: 'break-word',
                    height: isMobile ? '2.5em' : '2.6em',
                    maxWidth: '100%',
                  }}
                  title={top2.text}
                >
                  {top2.text}
                </div>
                <div style={{ fontSize: isMobile ? '0.68rem' : '0.78rem', color: '#555555', marginTop: '2px', whiteSpace: 'nowrap' }}>
                  <strong>{top2.votes || 0}</strong> ({getPercentage(top2.votes)}%)
                </div>
              </div>

              <motion.div
                initial={{ height: 0 }}
                animate={{ height: isMobile ? '80px' : isTablet ? '105px' : '135px' }}
                transition={{ duration: 0.5, delay: 0.1 }}
                style={{
                  width: '100%',
                  background: '#2B2B2B',
                  border: '2px solid #1A1A1A',
                  boxShadow: '4px 4px 0px rgba(43, 43, 43, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FAFAFA',
                  fontSize: isMobile ? '1.05rem' : '1.55rem',
                  fontWeight: 800,
                  fontFamily: "'Special Elite', monospace",
                }}
              >
                2nd
              </motion.div>
            </div>
          ) : (
            <div style={{ flex: '1 1 0', minWidth: 0, maxWidth: isMobile ? '31%' : isTablet ? '180px' : '220px' }} />
          )}

          {/* 1st Place Pillar (Center - Tallest & Red Stamp) */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flex: '1.15 1 0',
              minWidth: 0,
              maxWidth: isMobile ? '36%' : isTablet ? '200px' : '250px',
            }}
          >
            <div
              style={{
                textAlign: 'center',
                marginBottom: '8px',
                width: '100%',
              }}
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: isMobile ? '28px' : '36px',
                    height: isMobile ? '28px' : '36px',
                    background: '#DC2626',
                    color: '#FAFAFA',
                    fontSize: isMobile ? '0.8rem' : '0.98rem',
                    fontWeight: 800,
                    border: '2px solid #2B2B2B',
                    boxShadow: '2px 2px 0px rgba(43, 43, 43, 0.2)',
                  }}
                >
                  #1
                </span>
                <Trophy size={isMobile ? 16 : 22} color="#DC2626" />
              </div>
              <div
                style={{
                  fontSize: isMobile ? '0.8rem' : '1rem',
                  fontWeight: 800,
                  color: '#DC2626',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  lineHeight: 1.25,
                  wordBreak: 'break-word',
                  height: isMobile ? '2.5em' : '2.6em',
                  maxWidth: '100%',
                }}
                title={top1.text}
              >
                {top1.text}
              </div>
              <div style={{ fontSize: isMobile ? '0.72rem' : '0.82rem', color: '#2B2B2B', marginTop: '2px', whiteSpace: 'nowrap' }}>
                <strong style={{ color: '#DC2626' }}>{top1.votes || 0}</strong> ({getPercentage(top1.votes)}%)
              </div>
            </div>

            <motion.div
              initial={{ height: 0 }}
              animate={{ height: isMobile ? '120px' : isTablet ? '155px' : '190px' }}
              transition={{ duration: 0.5 }}
              style={{
                width: '100%',
                background: '#DC2626',
                border: '2px solid #2B2B2B',
                boxShadow: '6px 6px 0px rgba(220, 38, 38, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FAFAFA',
                fontSize: isMobile ? '1.25rem' : '1.85rem',
                fontWeight: 800,
                fontFamily: "'Special Elite', monospace",
                gap: '4px',
              }}
            >
              <span>1st</span>
              <span
                className="stamp-seal"
                style={{
                  fontSize: isMobile ? '0.52rem' : '0.65rem',
                  padding: '1px 5px',
                  color: '#FAFAFA',
                  borderColor: '#FAFAFA',
                  background: 'transparent',
                }}
              >
                WINNER
              </span>
            </motion.div>
          </div>

          {/* 3rd Place Pillar (Right) */}
          {top3 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flex: '1 1 0',
                minWidth: 0,
                maxWidth: isMobile ? '31%' : isTablet ? '180px' : '220px',
              }}
            >
              <div
                style={{
                  textAlign: 'center',
                  marginBottom: '8px',
                  width: '100%',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: isMobile ? '24px' : '32px',
                    height: isMobile ? '24px' : '32px',
                    background: '#555555',
                    color: '#FAFAFA',
                    fontSize: isMobile ? '0.75rem' : '0.88rem',
                    fontWeight: 800,
                    border: '1px solid #1A1A1A',
                    marginBottom: '4px',
                  }}
                >
                  #3
                </span>
                <div
                  style={{
                    fontSize: isMobile ? '0.74rem' : '0.92rem',
                    fontWeight: 700,
                    color: '#2B2B2B',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: 1.25,
                    wordBreak: 'break-word',
                    height: isMobile ? '2.5em' : '2.6em',
                    maxWidth: '100%',
                  }}
                  title={top3.text}
                >
                  {top3.text}
                </div>
                <div style={{ fontSize: isMobile ? '0.68rem' : '0.78rem', color: '#555555', marginTop: '2px', whiteSpace: 'nowrap' }}>
                  <strong>{top3.votes || 0}</strong> ({getPercentage(top3.votes)}%)
                </div>
              </div>

              <motion.div
                initial={{ height: 0 }}
                animate={{ height: isMobile ? '55px' : isTablet ? '75px' : '100px' }}
                transition={{ duration: 0.5, delay: 0.2 }}
                style={{
                  width: '100%',
                  background: '#EBE7DD',
                  border: '2px solid #2B2B2B',
                  boxShadow: '4px 4px 0px rgba(43, 43, 43, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2B2B2B',
                  fontSize: isMobile ? '0.95rem' : '1.35rem',
                  fontWeight: 800,
                  fontFamily: "'Special Elite', monospace",
                }}
              >
                3rd
              </motion.div>
            </div>
          ) : (
            <div style={{ flex: '1 1 0', minWidth: 0, maxWidth: isMobile ? '31%' : isTablet ? '180px' : '220px' }} />
          )}
        </div>
      ) : (
        <div style={{ padding: '24px 0', textAlign: 'center', color: '#555555', fontStyle: 'italic', fontFamily: "'Special Elite', monospace" }}>
          No options found for this question.
        </div>
      )}

      {/* Runners-Up Options (4th, 5th, etc.) */}
      {runnersUp.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '10px', borderTop: '1px dashed #2B2B2B' }}>
          <span style={{ fontSize: '0.78rem', color: '#555555', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'Special Elite', monospace" }}>
            Other Ranked Choices:
          </span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {runnersUp.map((opt, rIdx) => (
              <div
                key={opt.id || rIdx}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: isMobile ? '5px 10px' : '6px 12px',
                  background: '#FAFAFA',
                  border: '1px solid #2B2B2B',
                  boxShadow: '2px 2px 0px rgba(43, 43, 43, 0.1)',
                  fontSize: isMobile ? '0.78rem' : '0.84rem',
                  fontFamily: "'Special Elite', monospace",
                  maxWidth: '100%',
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ fontWeight: 800, color: '#555555' }}>#{rIdx + 4}</span>
                <span style={{ fontWeight: 700, color: '#2B2B2B', wordBreak: 'break-word' }}>{opt.text}</span>
                <span style={{ color: '#555555', fontSize: isMobile ? '0.7rem' : '0.76rem' }}>({opt.votes || 0} votes &bull; {getPercentage(opt.votes)}%)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Participant Signatures for this Question */}
      {voters && voters.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '10px', borderTop: '1px dashed #2B2B2B' }}>
          <span style={{ fontSize: '0.78rem', color: '#555555', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'Special Elite', monospace" }}>
            Participant Signatures for This Question:
          </span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            {sortedOptions.map((opt) => {
              const optVoters = getOptionVoters(opt.id);
              if (optVoters.length === 0) return null;
              return optVoters.map((v, vIdx) => (
                <span
                  key={`${opt.id}-${vIdx}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    background: '#F4F1EA',
                    border: '1px solid #2B2B2B',
                    fontSize: '1.1rem',
                    color: '#2563EB',
                    fontFamily: "'Caveat', cursive",
                    transform: vIdx % 2 === 0 ? 'rotate(-2deg)' : 'rotate(2deg)',
                  }}
                  title={`Voted for: ${opt.text}`}
                >
                  <User size={11} color="#2563EB" />
                  {v.name}
                  <span style={{ fontSize: '0.65rem', color: '#555555', fontFamily: "'Special Elite', monospace", marginLeft: '2px' }}>
                    ({opt.text})
                  </span>
                </span>
              ));
            })}
          </div>
        </div>
      )}
    </div>
  );
}
