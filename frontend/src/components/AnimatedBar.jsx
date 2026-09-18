import React from 'react';
import { motion } from 'framer-motion';

export default function AnimatedBar({
  option,
  totalVotes,
  isLeader,
  index,
}) {
  const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
  const isWinning = isLeader && totalVotes > 0;

  // Vintage Tactile Paper: Standard bars are Ink Black (#2B2B2B), winning bar is Red Stamp (#DC2626)
  const mainColor = isWinning ? '#DC2626' : '#2B2B2B';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '18px 22px',
        borderRadius: '0px',
        background: '#FAFAFA',
        border: isWinning ? '2px solid #DC2626' : '1px solid #2B2B2B',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: isWinning
          ? '6px 6px 0px rgba(220, 38, 38, 0.25)'
          : '6px 6px 0px rgba(43, 43, 43, 0.15)',
        fontFamily: "'Special Elite', monospace",
        transition: 'all 0.2s ease',
      }}
    >
      {/* Background Animated Progress Fill - Stark Rectangles */}
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{
          type: 'spring',
          stiffness: 90,
          damping: 16,
          restDelta: 0.001,
        }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          background: isWinning
            ? 'rgba(220, 38, 38, 0.18)'
            : 'rgba(43, 43, 43, 0.12)',
          borderRight: isWinning ? '4px solid #DC2626' : '4px solid #2B2B2B',
          zIndex: 0,
          borderRadius: 0,
        }}
      />

      {/* Content Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flex: 1, minWidth: '180px' }}>
          {/* Stark 90-degree Option Letter Block */}
          <span
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '0px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.92rem',
              fontWeight: 800,
              background: isWinning ? '#DC2626' : '#2B2B2B',
              color: '#FAFAFA',
              border: '1px solid #1A1A1A',
              boxShadow: '2px 2px 0px rgba(43, 43, 43, 0.2)',
              fontFamily: "'Special Elite', monospace",
              flexShrink: 0,
            }}
          >
            {String.fromCharCode(65 + index)}
          </span>

          <span
            style={{
              fontSize: '1.05rem',
              fontWeight: 700,
              color: '#2B2B2B',
              letterSpacing: '0.01em',
              fontFamily: "'Special Elite', monospace",
              wordBreak: 'break-word',
              lineHeight: 1.3,
            }}
          >
            {option.text}
          </span>

          {/* Official Red Stamp Seal for Top Choice */}
          {isWinning && (
            <motion.span
              initial={{ scale: 0.8, rotate: -6 }}
              animate={{ scale: 1, rotate: -2 }}
              className="stamp-seal"
              style={{
                fontSize: '0.72rem',
                padding: '2px 8px',
                border: '2px solid #DC2626',
                color: '#DC2626',
                background: 'rgba(220, 38, 38, 0.08)',
                letterSpacing: '0.08em',
                flexShrink: 0,
              }}
            >
              ★ TOP CHOICE ★
            </motion.span>
          )}
        </div>

        {/* Stats: Percentage & Votes Count */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexShrink: 0, marginLeft: 'auto' }}>
          <motion.span
            key={`count-${option.votes}`}
            initial={{ scale: 1.15, color: mainColor }}
            animate={{ scale: 1, color: isWinning ? '#DC2626' : '#2B2B2B' }}
            transition={{ duration: 0.25 }}
            style={{
              fontSize: '1.35rem',
              fontWeight: 800,
              fontFamily: "'Special Elite', monospace",
            }}
          >
            {percentage}%
          </motion.span>
          <span style={{ fontSize: '0.84rem', color: '#555555', fontWeight: 600 }}>
            ({option.votes} {option.votes === 1 ? 'vote' : 'votes'})
          </span>
        </div>
      </div>
    </div>
  );
}
