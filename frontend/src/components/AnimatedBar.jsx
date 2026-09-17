import React from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';

export default function AnimatedBar({
  option,
  totalVotes,
  isLeader,
  index,
}) {
  const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
  const isWinning = isLeader && totalVotes > 0;

  // Bespoke Color Styling: Winning bar is Turquoise (#48E5C2), runner-ups are Charcoal (#5E5E5E)
  const barColor = isWinning ? '#48E5C2' : '#5E5E5E';
  const barBg = isWinning ? 'rgba(72, 229, 194, 0.12)' : '#444444';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '18px 22px',
        borderRadius: '16px',
        background: isWinning ? 'rgba(72, 229, 194, 0.08)' : 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: isWinning ? '1px solid rgba(72, 229, 194, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'border-color 0.3s ease, background 0.3s ease, box-shadow 0.3s ease',
        boxShadow: isWinning ? '0 0 25px rgba(72, 229, 194, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)' : '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      }}
    >
      {/* Background Animated Progress Fill */}
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{
          type: 'spring',
          stiffness: 100,
          damping: 18,
          restDelta: 0.001,
        }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          background: isWinning
            ? 'linear-gradient(90deg, rgba(72, 229, 194, 0.15) 0%, rgba(72, 229, 194, 0.38) 100%)'
            : 'linear-gradient(90deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.07) 100%)',
          borderRight: isWinning ? '3px solid #48E5C2' : '2px solid rgba(255, 255, 255, 0.2)',
          zIndex: 0,
        }}
      />

      {/* Content Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.88rem',
              fontWeight: 800,
              background: isWinning ? '#48E5C2' : 'rgba(255, 255, 255, 0.06)',
              color: isWinning ? '#000000' : '#F8FAFC',
              boxShadow: isWinning ? '0 0 12px rgba(72, 229, 194, 0.5)' : 'none',
              border: isWinning ? 'none' : '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            {String.fromCharCode(65 + index)}
          </span>
          <span
            style={{
              fontSize: '1.15rem',
              fontWeight: 600,
              color: '#FCFAF9',
              letterSpacing: '-0.01em',
              fontFamily: 'var(--font-heading)',
            }}
          >
            {option.text}
          </span>
          {isWinning && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 10px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(243, 211, 189, 0.2)',
                border: '1px solid #F3D3BD',
                color: '#F3D3BD',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              <Trophy size={12} />
              Highest Voted
            </motion.span>
          )}
        </div>

        {/* Stats: Percentage & Votes Count */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
          <motion.span
            key={`count-${option.votes}`}
            initial={{ scale: 1.2, color: barColor }}
            animate={{ scale: 1, color: isWinning ? '#48E5C2' : '#FCFAF9' }}
            transition={{ duration: 0.3 }}
            style={{
              fontSize: '1.45rem',
              fontWeight: 800,
              fontFamily: 'var(--font-heading)',
            }}
          >
            {percentage}%
          </motion.span>
          <span style={{ fontSize: '0.9rem', color: 'rgba(252, 250, 249, 0.65)', fontWeight: 500 }}>
            ({option.votes} {option.votes === 1 ? 'vote' : 'votes'})
          </span>
        </div>
      </div>
    </div>
  );
}
