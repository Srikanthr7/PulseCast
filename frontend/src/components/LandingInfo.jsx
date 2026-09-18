import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Smartphone,
  Trophy,
  Layers,
  Clock,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Check,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  BarChart2,
  Users,
  QrCode,
  Radio,
  Target,
  Rocket,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function LandingInfo({ authComponent, quickJoinComponent, onScrollToAuth }) {
  // Interactive Simulator State
  const [demoVotes, setDemoVotes] = useState({
    opt1: 42,
    opt2: 28,
    opt3: 19,
    opt4: 11,
  });
  const [votedOption, setVotedOption] = useState(null);
  const [hasSimulated, setHasSimulated] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const totalDemoVotes = Object.values(demoVotes).reduce((a, b) => a + b, 0);

  const handleSimulateVote = (optKey) => {
    if (votedOption === optKey) return;
    setDemoVotes((prev) => ({
      ...prev,
      [optKey]: prev[optKey] + 1,
    }));
    setVotedOption(optKey);
    setHasSimulated(true);

    try {
      confetti({
        particleCount: 45,
        spread: 55,
        origin: { y: 0.75 },
        colors: ['#2563EB', '#DC2626', '#2B2B2B', '#EBE7DD'],
      });
    } catch (e) {
      // ignore
    }
  };

  const handleResetDemo = () => {
    setDemoVotes({ opt1: 42, opt2: 28, opt3: 19, opt4: 11 });
    setVotedOption(null);
    setHasSimulated(false);
  };

  const FEATURES = [
    {
      icon: Zap,
      badge: 'SPEED',
      title: 'Sub-10ms Real-Time Sync',
      desc: 'Engineered with a high-throughput Go (Gin) engine and non-blocking WebSockets. Votes cast on smartphones instantly animate the host’s presentation screen with zero lag.',
      color: '#2563EB',
    },
    {
      icon: QrCode,
      badge: 'FRICTIONLESS',
      title: 'Zero-Install QR Scan',
      desc: 'Room participants simply point their camera at the presentation screen or type the 6-character Session PIN. No mobile app downloads and no mandatory accounts.',
      color: '#2B2B2B',
    },
    {
      icon: Trophy,
      badge: 'ENGAGEMENT',
      title: 'Live Leaderboards & Podium',
      desc: 'Track participation and crown quiz champions. Automatic score calculation, voter name attribution, and celebratory confetti animations finalize each session.',
      color: '#DC2626',
    },
    {
      icon: Layers,
      badge: 'AESTHETICS',
      title: 'Tactile Brutalist Paper',
      desc: 'Inspired by authentic physical paper ballots with natural paper grain, typewriter monospace typography (Special Elite), 90° sharp borders, and ink rubber stamps.',
      color: '#2B2B2B',
    },
    {
      icon: Radio,
      badge: 'SEQUENCING',
      title: 'Multi-Question Sequencer',
      desc: 'Build multi-stage interactive journeys. Choose from pre-loaded tech sprint, architecture pulse, or retrospective templates, or craft custom questions.',
      color: '#2563EB',
    },
    {
      icon: ShieldCheck,
      badge: 'RELIABILITY',
      title: 'Dual-Sync Architecture',
      desc: 'Direct in-memory WebSocket broadcasting paired with automated background polling and Redis pub/sub. If Wi-Fi flinches, live sync automatically heals itself.',
      color: '#DC2626',
    },
  ];

  const HOW_IT_WORKS = [
    {
      step: '01',
      title: 'Host Creates Session',
      desc: 'Draft single or multi-question polls in seconds using quick presets or your own prompts. Set 2 to 4 distinct voting choices.',
      icon: Rocket,
    },
    {
      step: '02',
      title: 'Audience Scans & Connects',
      desc: 'Display the auto-generated Wi-Fi QR code or Session PIN on your conference projector or laptop. Audience members join directly from mobile browsers.',
      icon: Smartphone,
    },
    {
      step: '03',
      title: 'Live Stream & Final Podium',
      desc: 'Watch the voting bars react live to audience votes. Conclude the poll with one click to trigger confetti and reveal top choices on the leaderboard.',
      icon: Trophy,
    },
  ];

  const FAQS = [
    {
      q: 'Do audience members need to download an app or create an account?',
      a: 'Never. PulseCast works 100% inside any modern mobile browser (Safari, Chrome, Firefox). Audience members just scan the host’s QR code or enter the session PIN to vote immediately.',
    },
    {
      q: 'How fast is the live synchronization between phone and laptop?',
      a: 'Votes are processed by the Go backend via atomic MongoDB operations and pushed over in-memory WebSockets in under 10 milliseconds. Host projector bars update instantly as hands tap screens.',
    },
    {
      q: 'Can this be run on local Wi-Fi without an active internet connection?',
      a: 'Yes! PulseCast automatically resolves the presenter laptop’s local Wi-Fi LAN IP (e.g. 192.168.x.x) and bakes it into the QR code, allowing direct local device-to-device communication on the same network.',
    },
    {
      q: 'Can I reuse or save templates for recurring team standups or lectures?',
      a: 'Yes! PulseCast includes built-in multi-question presets for Tech Sprints, Team Retrospectives, Architecture Pulses, and Daily Standups that you can load and customize with one click.',
    },
  ];

  return (
    <div style={{ width: '100%', maxWidth: '1240px', margin: '0 auto', padding: '10px 16px 60px' }}>
      {/* 1. HERO SECTION */}
      <section style={{ marginBottom: '60px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: authComponent ? 'minmax(0, 1.25fr) minmax(320px, 460px)' : '1fr',
            gap: '32px',
            alignItems: 'start',
          }}
        >
          {/* Left Column: Headline & Interactive Demo */}
          <div>
            {/* Header Stamp Badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}
            >
              <span className="stamp-seal" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#DC2626',
                    display: 'inline-block',
                    animation: 'pulse 1.8s infinite',
                  }}
                />
                EST. 2026 • LIVE AUDIENCE ENGAGEMENT SYSTEM
              </span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              style={{
                fontSize: 'clamp(2.1rem, 4.5vw, 3.4rem)',
                lineHeight: 1.12,
                color: '#2B2B2B',
                marginBottom: '16px',
                fontFamily: "'Special Elite', monospace",
                letterSpacing: '-0.02em',
              }}
            >
              Turn Presentations Into{' '}
              <span
                style={{
                  fontFamily: "'Caveat', cursive",
                  color: '#2563EB',
                  fontSize: 'clamp(2.6rem, 5.2vw, 4.2rem)',
                  display: 'inline-block',
                  transform: 'rotate(-1.5deg)',
                }}
              >
                Live Conversations.
              </span>
            </motion.h1>

            {/* Sub-headline */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              style={{
                fontSize: '1.05rem',
                color: '#444444',
                lineHeight: 1.6,
                marginBottom: '26px',
                maxWidth: '680px',
              }}
            >
              PulseCast combines the tactile charm of physical paper ballots with ultra-fast Go + WebSocket live streaming.
              Connect classrooms, sprint retrospectives, and conferences in seconds with <strong>zero participant app downloads</strong>.
            </motion.p>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '32px' }}
            >
              <button
                type="button"
                onClick={onScrollToAuth}
                className="btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 22px',
                  fontSize: '0.96rem',
                }}
              >
                <Sparkles size={18} />
                Launch Live Session
                <ArrowRight size={16} />
              </button>
              <a
                href="#live-demo"
                className="btn-secondary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  fontSize: '0.96rem',
                  textDecoration: 'none',
                }}
              >
                <BarChart2 size={18} />
                Try Interactive Demo
              </a>
            </motion.div>

            {/* Real-time Ticker Ribbon */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              style={{
                background: '#FAFAFA',
                border: '1px solid #2B2B2B',
                boxShadow: '4px 4px 0px rgba(43, 43, 43, 0.15)',
                padding: '12px 16px',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '16px',
                fontSize: '0.82rem',
                color: '#333333',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800 }}>
                <Zap size={14} color="#2563EB" />
                <span>&lt; 10ms Concurrency</span>
              </div>
              <span style={{ color: '#CCCCCC' }}>•</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800 }}>
                <Smartphone size={14} color="#2B2B2B" />
                <span>Zero App Installs</span>
              </div>
              <span style={{ color: '#CCCCCC' }}>•</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800 }}>
                <QrCode size={14} color="#DC2626" />
                <span>LAN QR Dynamic Connect</span>
              </div>
              <span style={{ color: '#CCCCCC' }}>•</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800 }}>
                <Trophy size={14} color="#F59E0B" />
                <span>Live Podium &amp; Confetti</span>
              </div>
            </motion.div>

            {/* INTERACTIVE DEMO SIMULATOR */}
            <div id="live-demo" style={{ marginTop: '36px' }}>
              <motion.div
                className="glass-panel"
                style={{
                  background: '#FAFAFA',
                  border: '2px solid #2B2B2B',
                  boxShadow: '6px 6px 0px rgba(43, 43, 43, 0.2)',
                  padding: '24px 22px',
                  position: 'relative',
                }}
                whileHover={{ boxShadow: '8px 8px 0px rgba(43, 43, 43, 0.25)' }}
                transition={{ duration: 0.2 }}
              >
                {/* Header tag */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        background: '#2B2B2B',
                        color: '#FAFAFA',
                        padding: '3px 8px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        letterSpacing: '0.05em',
                      }}
                    >
                      INTERACTIVE DEMO
                    </span>
                    <span style={{ fontSize: '0.76rem', color: '#666666' }}>
                      Click any choice to simulate live voting:
                    </span>
                  </div>
                  {hasSimulated && (
                    <button
                      type="button"
                      onClick={handleResetDemo}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#666666',
                        fontSize: '0.76rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        textDecoration: 'underline',
                        fontFamily: "'Special Elite', monospace",
                      }}
                    >
                      <RefreshCw size={12} />
                      Reset Demo
                    </button>
                  )}
                </div>

                <h3
                  style={{
                    fontSize: '1.16rem',
                    color: '#2B2B2B',
                    marginBottom: '18px',
                    fontFamily: "'Special Elite', monospace",
                  }}
                >
                  "What capability makes an audience poll most captivating?"
                </h3>

                {/* Demo Options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { key: 'opt1', text: 'Sub-10ms Live Bar Updates on Screen', color: '#2563EB' },
                    { key: 'opt2', text: 'Instant QR Code Scan (Zero App Install)', color: '#2B2B2B' },
                    { key: 'opt3', text: 'Live Leaderboard Podium & Winner Confetti', color: '#DC2626' },
                    { key: 'opt4', text: 'Physical Vintage Ballot Paper Aesthetic', color: '#555555' },
                  ].map((opt, idx) => {
                    const votes = demoVotes[opt.key];
                    const pct = Math.round((votes / totalDemoVotes) * 100);
                    const isSelected = votedOption === opt.key;

                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => handleSimulateVote(opt.key)}
                        style={{
                          display: 'block',
                          width: '100%',
                          textAlign: 'left',
                          background: isSelected ? '#DBEAFE' : '#FFFFFF',
                          border: isSelected ? '2px solid #2563EB' : '1px solid #2B2B2B',
                          boxShadow: isSelected ? '3px 3px 0px #2563EB' : '2px 2px 0px rgba(43,43,43,0.15)',
                          padding: '10px 14px',
                          cursor: 'pointer',
                          position: 'relative',
                          overflow: 'hidden',
                          transition: 'all 0.15s ease',
                          fontFamily: "'Special Elite', monospace",
                        }}
                      >
                        {/* Background Progress Bar */}
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            bottom: 0,
                            background: isSelected ? 'rgba(37, 99, 235, 0.16)' : 'rgba(43, 43, 43, 0.06)',
                            zIndex: 0,
                          }}
                        />

                        {/* Content */}
                        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span
                              style={{
                                width: '22px',
                                height: '22px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid #2B2B2B',
                                background: isSelected ? '#2563EB' : '#FAFAFA',
                                color: isSelected ? '#FFFFFF' : '#2B2B2B',
                                fontSize: '0.78rem',
                                fontWeight: 800,
                              }}
                            >
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span style={{ fontSize: '0.9rem', fontWeight: isSelected ? 800 : 600, color: '#2B2B2B' }}>
                              {opt.text}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {isSelected && (
                              <span
                                style={{
                                  background: '#2563EB',
                                  color: '#FFFFFF',
                                  fontSize: '0.68rem',
                                  fontWeight: 800,
                                  padding: '2px 6px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                }}
                              >
                                <Check size={11} /> VOTED
                              </span>
                            )}
                            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: opt.color, minWidth: '42px', textAlign: 'right' }}>
                              {pct}%
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Simulation Feedback Alert */}
                {hasSimulated && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      marginTop: '14px',
                      padding: '8px 12px',
                      background: 'rgba(37, 99, 235, 0.08)',
                      border: '1px dashed #2563EB',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.8rem',
                      color: '#2563EB',
                    }}
                  >
                    <Sparkles size={14} flexShrink={0} />
                    <span>
                      <strong>Instant Sync Simulated:</strong> In an active session, this vote broadcasts to the presenter screen in &lt; 10ms!
                    </span>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </div>

          {/* Right Column: Embedded Auth Form & Quick Join (Sticky on Desktop) */}
          {authComponent && (
            <div id="auth-portal-section" style={{ position: 'sticky', top: '80px' }}>
              {authComponent}
              {quickJoinComponent && (
                <div style={{ marginTop: '20px' }}>
                  {quickJoinComponent}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 2. CORE CAPABILITIES (FEATURES GRID) */}
      <section style={{ marginBottom: '60px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div className="stamp-seal" style={{ marginBottom: '10px' }}>
            CAPABILITIES &amp; SPECIFICATIONS
          </div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3.2vw, 2.4rem)', color: '#2B2B2B', marginBottom: '10px', fontFamily: "'Special Elite', monospace" }}>
            Why Presenters Choose PulseCast
          </h2>
          <p style={{ color: '#555555', fontSize: '0.94rem', maxWidth: '640px', margin: '0 auto' }}>
            Built for universities, high-growth startups, engineering conferences, and agile teams who demand reliability and tactile elegance.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '20px',
          }}
        >
          {FEATURES.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                whileHover={{ y: -4, boxShadow: '8px 8px 0px rgba(43, 43, 43, 0.25)' }}
                className="glass-panel"
                style={{
                  background: '#FAFAFA',
                  border: '2px solid #2B2B2B',
                  boxShadow: '5px 5px 0px rgba(43, 43, 43, 0.18)',
                  padding: '24px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      background: feat.color,
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid #2B2B2B',
                    }}
                  >
                    <Icon size={20} />
                  </div>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      border: '1px solid #2B2B2B',
                      padding: '2px 6px',
                      background: '#F4F1EA',
                      color: '#2B2B2B',
                    }}
                  >
                    {feat.badge}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#2B2B2B', fontFamily: "'Special Elite', monospace" }}>
                  {feat.title}
                </h3>
                <p style={{ fontSize: '0.86rem', color: '#555555', lineHeight: 1.55 }}>
                  {feat.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 3. HOW IT WORKS TIMELINE */}
      <section style={{ marginBottom: '60px' }}>
        <div
          className="glass-panel"
          style={{
            background: '#FAFAFA',
            border: '2px solid #2B2B2B',
            boxShadow: '8px 8px 0px rgba(43, 43, 43, 0.2)',
            padding: '36px 28px',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <div className="stamp-seal" style={{ marginBottom: '10px' }}>
              THREE SIMPLE STEPS
            </div>
            <h2 style={{ fontSize: 'clamp(1.7rem, 3vw, 2.2rem)', color: '#2B2B2B', fontFamily: "'Special Elite', monospace" }}>
              How a Live Session Runs
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px',
              position: 'relative',
            }}
          >
            {HOW_IT_WORKS.map((step, idx) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.12 }}
                  style={{
                    border: '1px solid #2B2B2B',
                    background: '#FFFFFF',
                    padding: '24px 20px',
                    boxShadow: '4px 4px 0px rgba(43, 43, 43, 0.12)',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span
                      style={{
                        fontSize: '1.8rem',
                        fontWeight: 900,
                        color: '#DC2626',
                        fontFamily: "'Special Elite', monospace",
                        lineHeight: 1,
                      }}
                    >
                      {step.step}
                    </span>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        background: '#2B2B2B',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon size={18} />
                    </div>
                  </div>

                  <h3 style={{ fontSize: '1.08rem', fontWeight: 800, color: '#2B2B2B', marginBottom: '8px', fontFamily: "'Special Elite', monospace" }}>
                    {step.title}
                  </h3>
                  <p style={{ fontSize: '0.86rem', color: '#555555', lineHeight: 1.55 }}>
                    {step.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. FREQUENTLY ASKED QUESTIONS */}
      <section style={{ marginBottom: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div className="stamp-seal" style={{ marginBottom: '10px' }}>
            QUESTIONS &amp; ANSWERS
          </div>
          <h2 style={{ fontSize: 'clamp(1.6rem, 2.8vw, 2.1rem)', color: '#2B2B2B', fontFamily: "'Special Elite', monospace" }}>
            Frequently Asked Questions
          </h2>
        </div>

        <div style={{ maxWidth: '820px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={faq.q}
                style={{
                  background: '#FAFAFA',
                  border: '1px solid #2B2B2B',
                  boxShadow: '3px 3px 0px rgba(43, 43, 43, 0.15)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  style={{
                    width: '100%',
                    padding: '16px 18px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: "'Special Elite', monospace",
                    fontSize: '0.94rem',
                    fontWeight: 800,
                    color: '#2B2B2B',
                    gap: '12px',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <HelpCircle size={16} color="#2563EB" flexShrink={0} />
                    {faq.q}
                  </span>
                  {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div
                        style={{
                          padding: '0 18px 16px 44px',
                          fontSize: '0.88rem',
                          color: '#555555',
                          lineHeight: 1.6,
                          borderTop: '1px dashed #E0DDD5',
                        }}
                      >
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. FOOTER NOTATION */}
      <footer
        style={{
          textAlign: 'center',
          paddingTop: '30px',
          borderTop: '1px dashed #2B2B2B',
          color: '#777777',
          fontSize: '0.8rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>PulseCast Live Audience Polling Engine</span>
          <span>•</span>
          <span>Go + MongoDB + Redis + WebSockets</span>
          <span>•</span>
          <span>MIT Open License</span>
        </div>
        <div style={{ fontSize: '0.74rem' }}>
          Designed with tactile vintage ballot paper textures &amp; brutalist 90-degree lines.
        </div>
      </footer>
    </div>
  );
}
