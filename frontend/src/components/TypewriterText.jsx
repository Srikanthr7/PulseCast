import React from 'react';
import { motion } from 'framer-motion';

export default function TypewriterText({
  text = '',
  as: Component = 'h1',
  className = '',
  style = {},
  cursor = true,
}) {
  const characters = Array.from(text || '');

  const containerVariants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  // Instant strike like a real mechanical typewriter
  const letterVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0,
      },
    },
  };

  const cursorVariants = {
    blink: {
      opacity: [1, 0, 1],
      transition: {
        duration: 0.8,
        repeat: Infinity,
        ease: 'linear',
      },
    },
  };

  return (
    <Component
      className={className}
      style={{
        fontFamily: "'Special Elite', monospace",
        margin: 0,
        display: 'inline-block',
        ...style,
      }}
    >
      <motion.span
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ display: 'inline' }}
      >
        {characters.map((char, index) => (
          <motion.span key={`${char}-${index}`} variants={letterVariants}>
            {char}
          </motion.span>
        ))}
      </motion.span>
      {cursor && (
        <motion.span
          variants={cursorVariants}
          animate="blink"
          style={{
            display: 'inline-block',
            marginLeft: '2px',
            color: 'inherit',
            fontWeight: 'normal',
            userSelect: 'none',
          }}
          aria-hidden="true"
        >
          ▋
        </motion.span>
      )}
    </Component>
  );
}
