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
  PlusCircle,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useDeviceType } from '../hooks/useDeviceType';

export default function LandingInfo({ authComponent, quickJoinComponent, onScrollToAuth }) {
  const { isMobile, isTablet } = useDeviceType();
  const isNarrow = isMobile || isTablet;

  // Active Get-Started Tab: 'audience' | 'host'
  const [activeTab, setActiveTab] = useState('audience');

  // Interactive Simulator State
  const [demoVotes, setDemoVotes] = useState({
    opt1: 54,
    opt2: 38,
    opt3: 29,
    opt4: 17,
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
        particleCount: isMobile ? 35 : 50,
        spread: 60,
        origin: { y: 0.75 },
        colors: ['#2563EB', '#DC2626', '#2B2B2B', '#EBE7DD'],
      });
    } catch (e) {
      // ignore
    }
  };

  const handleResetDemo = () => {
    setDemoVotes({ opt1: 54, opt2: 38, opt3: 29, opt4: 17 });
    setVotedOption(null);
    setHasSimulated(false);
  };

  const FEATURES = [
    {
      icon: Zap,
      badge: 'REAL-TIME',
      title: 'Instant Live Results',
      desc: 'Votes appear on the presentation screen the exact millisecond your audience taps their phones. Zero lag and no manual page refreshing.',
      color: '#2563EB',
    },
    {
      icon: QrCode,
      badge: 'NO APP NEEDED',
      title: 'Zero App Downloads',
      desc: 'Audience members simply point their phone camera at the screen to join. Works seamlessly on iPhone, Android, Safari, and Chrome.',
      color: '#2B2B2B',
    },
    {
      icon: Trophy,
      badge: 'ENGAGEMENT',
      title: 'Leaderboards & Confetti',
      desc: 'Turn lectures and team meetings into games! Celebrate winners with dynamic answer podiums and celebratory confetti animations.',
      color: '#DC2626',
    },
    {
      icon: Layers,
      badge: 'CLEAN LOOK',
      title: 'Clear & Distraction-Free',
      desc: 'High-contrast, vintage paper ballot aesthetic designed to be readable across a packed auditorium, lecture hall, or Zoom screen share.',
      color: '#2B2B2B',
    },
    {
      icon: Radio,
      badge: 'FLEXIBLE',
      title: 'Single Poll or Full Quiz',
      desc: 'Ask one quick icebreaker question during a presentation, or run multi-stage quiz competitions and team retrospectives with ease.',
      color: '#2563EB',
    },
    {
      icon: ShieldCheck,
      badge: 'ROCK-SOLID',
      title: 'Works on Any Wi-Fi',
      desc: 'Engineered to stay connected reliably even on crowded university networks, event hall Wi-Fi, or cellular mobile data.',
      color: '#DC2626',
    },
  ];

  const HOW_IT_WORKS = [
    {
      step: '01',
      title: '1. Type Your Question',
      desc: 'Create a single question or multi-question poll in 30 seconds. Choose 2 to 4 answer choices or use ready-made templates.',
      icon: Rocket,
    },
    {
      step: '02',
      title: '2. Audience Scans QR Code',
      desc: 'Display the auto-generated QR code on your projector or Zoom screen. Attendees join from their phone browsers without downloading any app.',
      icon: Smartphone,
    },
    {
      step: '03',
      title: '3. Watch Live Results Roll In',
      desc: 'Watch the voting bars react on screen live as hands tap screens. Conclude the poll with one click to reveal top answers and celebrate winners!',
      icon: Trophy,
    },
  ];

  const FAQS = [
    {
      q: 'Do audience members or students need to download an app or sign up?',
      a: 'Never! PulseCast works 100% inside any mobile web browser (Safari, Chrome, Firefox). Audience members just point their phone camera at the QR code on your screen to vote immediately. No accounts, passwords, or app downloads needed.',
    },
    {
      q: 'Is PulseCast really 100% free?',
      a: 'Yes, PulseCast is completely free to use with unlimited audience voters and unlimited polls.',
    },
    {
      q: 'Can I use this for remote meetings on Zoom, Google Meet, or Microsoft Teams?',
      a: 'Absolutely! Just share your browser tab displaying the Projector Screen on Zoom, Teams, or Google Meet. Remote participants scan the QR code on their screen or type the code to vote from home.',
    },
    {
      q: 'How fast do the votes show up on screen?',
      a: 'Instantly! In under 10 milliseconds, each tap on a phone is transmitted to the presenter’s projector screen so everyone watches the bars move together in real-time.',
    },
    {
      q: 'Can I save my polls for recurring team standups or lectures?',
      a: 'Yes! When you sign in as a host, all your created polls are saved in your dashboard so you can launch them again anytime with a single click.',
    },
  ];

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '1240px',
        margin: '0 auto',
        padding: isMobile ? '8px 12px 40px' : '10px 16px 60px',
        boxSizing: 'border-box',
      }}
    >
      {/* 1. HERO SECTION */}
      <section style={{ marginBottom: isMobile ? '36px' : '56px', width: '100%' }}>
        <div className="landing-hero-grid">
          {/* Left Column: Headline, Actions & Interactive Demo */}
          <div style={{ width: '100%', minWidth: 0 }}>
            {/* Header Stamp Badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: isMobile ? '12px' : '16px',
                maxWidth: '100%',
              }}
            >
              <span
                className="stamp-seal"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: isMobile ? '0.66rem' : '0.76rem',
                  padding: isMobile ? '3px 8px' : '4px 12px',
                  lineHeight: 1.3,
                  flexWrap: 'wrap',
                }}
              >
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: '#DC2626',
                    display: 'inline-block',
                    animation: 'pulse 1.8s infinite',
                    flexShrink: 0,
                  }}
                />
                LIVE AUDIENCE POLLS • LIKE KAHOOT &amp; SLIDO, BUT 100% FREE
              </span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              style={{
                fontSize: isMobile ? 'clamp(1.8rem, 6vw, 2.4rem)' : 'clamp(2.1rem, 4.5vw, 3.4rem)',
                lineHeight: 1.15,
                color: '#2B2B2B',
                marginBottom: isMobile ? '12px' : '16px',
                fontFamily: "'Special Elite', monospace",
                letterSpacing: '-0.02em',
                wordBreak: 'break-word',
              }}
            >
              Ask Questions. Get Live Votes On Screen.{' '}
              <span
                style={{
                  fontFamily: "'Caveat', cursive",
                  color: '#2563EB',
                  fontSize: isMobile ? 'clamp(2.1rem, 7vw, 3rem)' : 'clamp(2.6rem, 5.2vw, 4.2rem)',
                  display: 'inline-block',
                  transform: 'rotate(-1.5deg)',
                }}
              >
                In Real-Time.
              </span>
            </motion.h1>

            {/* Sub-headline in Plain English */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              style={{
                fontSize: isMobile ? '0.94rem' : '1.08rem',
                color: '#444444',
                lineHeight: 1.55,
                marginBottom: isMobile ? '20px' : '26px',
                maxWidth: '680px',
              }}
            >
              PulseCast lets you create instant live polls for classrooms, meetings, and conferences.
              Display the QR code on your screen, and your audience votes live using their phones — <strong>no app download or sign-up needed for voters</strong>.
            </motion.p>

            {/* GET STARTED COMPONENT (Clear dual choice: Attendee vs Host) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="glass-panel"
              style={{
                background: '#FAFAFA',
                border: '2px solid #2B2B2B',
                boxShadow: isMobile ? '4px 4px 0px rgba(43, 43, 43, 0.18)' : '6px 6px 0px rgba(43, 43, 43, 0.18)',
                padding: isMobile ? '16px 14px' : '20px 20px',
                marginBottom: isMobile ? '22px' : '28px',
                width: '100%',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
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
                    GET STARTED
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#555555', fontWeight: 600 }}>
                    What would you like to do right now?
                  </span>
                </div>
              </div>

              {/* Segmented Switcher: Vote vs Host */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  background: '#F4F1EA',
                  border: '1px solid #2B2B2B',
                  padding: '2px',
                  marginBottom: '16px',
                  gap: '2px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveTab('audience')}
                  style={{
                    padding: isMobile ? '8px 6px' : '10px 12px',
                    border: activeTab === 'audience' ? '1px solid #2B2B2B' : 'none',
                    background: activeTab === 'audience' ? '#2B2B2B' : 'transparent',
                    color: activeTab === 'audience' ? '#FAFAFA' : '#2B2B2B',
                    fontWeight: 800,
                    fontSize: isMobile ? '0.82rem' : '0.88rem',
                    cursor: 'pointer',
                    fontFamily: "'Special Elite', monospace",
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <Smartphone size={15} />
                  <span>I Want to Vote</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('host')}
                  style={{
                    padding: isMobile ? '8px 6px' : '10px 12px',
                    border: activeTab === 'host' ? '1px solid #2B2B2B' : 'none',
                    background: activeTab === 'host' ? '#2B2B2B' : 'transparent',
                    color: activeTab === 'host' ? '#FAFAFA' : '#2B2B2B',
                    fontWeight: 800,
                    fontSize: isMobile ? '0.82rem' : '0.88rem',
                    cursor: 'pointer',
                    fontFamily: "'Special Elite', monospace",
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <PlusCircle size={15} />
                  <span>I Want to Host</span>
                </button>
              </div>

              {/* Tab 1: Audience Voter Quick Join */}
              {activeTab === 'audience' && (
                <div>
                  <p style={{ fontSize: '0.84rem', color: '#555555', marginBottom: '12px', lineHeight: 1.4 }}>
                    Enter the code or PIN shown on your presenter's screen to join and vote instantly:
                  </p>
                  {quickJoinComponent}
                </div>
              )}

              {/* Tab 2: Host / Speaker Fast Start */}
              {activeTab === 'host' && (
                <div>
                  <p style={{ fontSize: '0.84rem', color: '#555555', marginBottom: '14px', lineHeight: 1.4 }}>
                    Presenting to a room, classroom, or webinar? Create your first live poll in 30 seconds:
                  </p>
                  <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={onScrollToAuth}
                      className="btn-primary"
                      style={{
                        padding: '11px 18px',
                        fontSize: '0.9rem',
                        justifyContent: 'center',
                        flex: 1,
                      }}
                    >
                      <Sparkles size={16} />
                      Sign In &amp; Create Poll
                      <ArrowRight size={15} />
                    </button>
                    <a
                      href="#live-demo"
                      className="btn-secondary"
                      style={{
                        padding: '11px 16px',
                        fontSize: '0.9rem',
                        justifyContent: 'center',
                        textDecoration: 'none',
                      }}
                    >
                      <BarChart2 size={16} />
                      Try Demo First
                    </a>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Real-time Ticker Spec Sheet */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              style={{
                background: '#FAFAFA',
                border: '1px solid #2B2B2B',
                boxShadow: isMobile ? '3px 3px 0px rgba(43, 43, 43, 0.12)' : '4px 4px 0px rgba(43, 43, 43, 0.15)',
                padding: isMobile ? '10px 12px' : '12px 16px',
                display: 'grid',
                gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, auto)',
                alignItems: 'center',
                gap: isMobile ? '10px 8px' : '16px',
                fontSize: isMobile ? '0.74rem' : '0.82rem',
                color: '#333333',
                width: '100%',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800 }}>
                <Zap size={14} color="#2563EB" flexShrink={0} />
                <span>Instant Live Sync</span>
              </div>
              {!isMobile && <span style={{ color: '#CCCCCC' }}>•</span>}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800 }}>
                <Smartphone size={14} color="#2B2B2B" flexShrink={0} />
                <span>Zero App Installs</span>
              </div>
              {!isMobile && <span style={{ color: '#CCCCCC' }}>•</span>}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800 }}>
                <QrCode size={14} color="#DC2626" flexShrink={0} />
                <span>Camera QR Scan</span>
              </div>
              {!isMobile && <span style={{ color: '#CCCCCC' }}>•</span>}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800 }}>
                <Trophy size={14} color="#F59E0B" flexShrink={0} />
                <span>Podium &amp; Confetti</span>
              </div>
            </motion.div>

            {/* INTERACTIVE DEMO SIMULATOR (Relatable, fun question!) */}
            <div id="live-demo" style={{ marginTop: isMobile ? '24px' : '36px', width: '100%' }}>
              <motion.div
                className="glass-panel"
                style={{
                  background: '#FAFAFA',
                  border: '2px solid #2B2B2B',
                  boxShadow: isMobile ? '4px 4px 0px rgba(43, 43, 43, 0.2)' : '6px 6px 0px rgba(43, 43, 43, 0.2)',
                  padding: isMobile ? '18px 14px' : '24px 22px',
                  position: 'relative',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
                whileHover={{ boxShadow: '8px 8px 0px rgba(43, 43, 43, 0.25)' }}
                transition={{ duration: 0.2 }}
              >
                {/* Header tag */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: isMobile ? 'flex-start' : 'center',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: '8px',
                    marginBottom: '14px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        background: '#2563EB',
                        color: '#FFFFFF',
                        padding: '3px 8px',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        letterSpacing: '0.05em',
                      }}
                    >
                      TRY IT RIGHT NOW
                    </span>
                    <span style={{ fontSize: isMobile ? '0.74rem' : '0.78rem', color: '#555555', fontWeight: 600 }}>
                      Tap an option below to experience voting live:
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
                        fontSize: '0.74rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        textDecoration: 'underline',
                        fontFamily: "'Special Elite', monospace",
                        padding: '2px 0',
                      }}
                    >
                      <RefreshCw size={12} />
                      Reset Demo
                    </button>
                  )}
                </div>

                <h3
                  style={{
                    fontSize: isMobile ? '1.02rem' : '1.18rem',
                    color: '#2B2B2B',
                    marginBottom: '16px',
                    fontFamily: "'Special Elite', monospace",
                    lineHeight: 1.35,
                  }}
                >
                  "What's your biggest meeting or lecture pet peeve?"
                </h3>

                {/* Demo Options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                  {[
                    { key: 'opt1', text: 'Meetings that could have easily been an email', color: '#2563EB' },
                    { key: 'opt2', text: '"Can everyone see my screen?" repeated 3 times', color: '#2B2B2B' },
                    { key: 'opt3', text: 'Awkward 30-second silence when asking for questions', color: '#DC2626' },
                    { key: 'opt4', text: 'Someone loudly typing on mechanical keys while unmuted', color: '#555555' },
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
                          padding: isMobile ? '10px 12px' : '11px 14px',
                          cursor: 'pointer',
                          position: 'relative',
                          overflow: 'hidden',
                          transition: 'all 0.15s ease',
                          fontFamily: "'Special Elite', monospace",
                          boxSizing: 'border-box',
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
                        <div
                          style={{
                            position: 'relative',
                            zIndex: 1,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '10px',
                            width: '100%',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '10px', minWidth: 0, flex: 1 }}>
                            <span
                              style={{
                                width: isMobile ? '20px' : '22px',
                                height: isMobile ? '20px' : '22px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid #2B2B2B',
                                background: isSelected ? '#2563EB' : '#FAFAFA',
                                color: isSelected ? '#FFFFFF' : '#2B2B2B',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                flexShrink: 0,
                              }}
                            >
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span
                              style={{
                                fontSize: isMobile ? '0.82rem' : '0.9rem',
                                fontWeight: isSelected ? 800 : 600,
                                color: '#2B2B2B',
                                lineHeight: 1.3,
                                wordBreak: 'break-word',
                              }}
                            >
                              {opt.text}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                            {isSelected && (
                              <span
                                style={{
                                  background: '#2563EB',
                                  color: '#FFFFFF',
                                  fontSize: '0.64rem',
                                  fontWeight: 800,
                                  padding: '2px 5px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '2px',
                                }}
                              >
                                <Check size={10} /> VOTED
                              </span>
                            )}
                            <span
                              style={{
                                fontSize: isMobile ? '0.82rem' : '0.88rem',
                                fontWeight: 800,
                                color: opt.color,
                                minWidth: '36px',
                                textAlign: 'right',
                              }}
                            >
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
                      padding: isMobile ? '10px 12px' : '10px 14px',
                      background: 'rgba(37, 99, 235, 0.08)',
                      border: '1px dashed #2563EB',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: isMobile ? '0.78rem' : '0.84rem',
                      color: '#2563EB',
                      lineHeight: 1.4,
                    }}
                  >
                    <Sparkles size={18} flexShrink={0} />
                    <span>
                      <strong>You just voted!</strong> In an active session, this bar moves live on the presenter’s projector screen in under 10 milliseconds!
                    </span>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </div>

          {/* Right Column: Embedded Host Auth Form (Sticky on Desktop, Stacked on Mobile) */}
          {authComponent && (
            <div
              id="auth-portal-section"
              style={{
                position: isNarrow ? 'relative' : 'sticky',
                top: isNarrow ? 'auto' : '80px',
                marginTop: isNarrow ? '32px' : '0',
                width: '100%',
                minWidth: 0,
              }}
            >
              {authComponent}
            </div>
          )}
        </div>
      </section>

      {/* 2. CORE CAPABILITIES (FEATURES GRID IN SIMPLE WORDS) */}
      <section style={{ marginBottom: isMobile ? '40px' : '60px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? '24px' : '32px' }}>
          <div className="stamp-seal" style={{ marginBottom: '10px', fontSize: isMobile ? '0.7rem' : '0.78rem' }}>
            WHY USE PULSECAST
          </div>
          <h2
            style={{
              fontSize: isMobile ? '1.5rem' : 'clamp(1.8rem, 3.2vw, 2.4rem)',
              color: '#2B2B2B',
              marginBottom: '10px',
              fontFamily: "'Special Elite', monospace",
            }}
          >
            Everything You Need for Live Engagement
          </h2>
          <p
            style={{
              color: '#555555',
              fontSize: isMobile ? '0.86rem' : '0.94rem',
              maxWidth: '640px',
              margin: '0 auto',
              padding: '0 8px',
            }}
          >
            Built for teachers, conference speakers, meeting leaders, and friends who want instant, reliable live polls.
          </p>
        </div>

        <div
          className="landing-features-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile
              ? '1fr'
              : isTablet
              ? 'repeat(2, 1fr)'
              : 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: isMobile ? '14px' : '20px',
            width: '100%',
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
                  boxShadow: isMobile ? '4px 4px 0px rgba(43, 43, 43, 0.18)' : '5px 5px 0px rgba(43, 43, 43, 0.18)',
                  padding: isMobile ? '18px 16px' : '24px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  position: 'relative',
                  width: '100%',
                  boxSizing: 'border-box',
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
                      flexShrink: 0,
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

                <h3 style={{ fontSize: '1.08rem', fontWeight: 800, color: '#2B2B2B', fontFamily: "'Special Elite', monospace" }}>
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

      {/* 3. HOW IT WORKS TIMELINE (3 CLEAR STEPS) */}
      <section style={{ marginBottom: isMobile ? '40px' : '60px', width: '100%' }}>
        <div
          className="glass-panel"
          style={{
            background: '#FAFAFA',
            border: '2px solid #2B2B2B',
            boxShadow: isMobile ? '4px 4px 0px rgba(43, 43, 43, 0.2)' : '8px 8px 0px rgba(43, 43, 43, 0.2)',
            padding: isMobile ? '24px 16px' : '36px 28px',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: isMobile ? '24px' : '36px' }}>
            <div className="stamp-seal" style={{ marginBottom: '10px', fontSize: isMobile ? '0.7rem' : '0.78rem' }}>
              HOW IT WORKS
            </div>
            <h2
              style={{
                fontSize: isMobile ? '1.45rem' : 'clamp(1.7rem, 3vw, 2.2rem)',
                color: '#2B2B2B',
                fontFamily: "'Special Elite', monospace",
              }}
            >
              Run a Live Poll in 3 Simple Steps
            </h2>
          </div>

          <div
            className="landing-steps-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile
                ? '1fr'
                : isTablet
                ? 'repeat(auto-fit, minmax(240px, 1fr))'
                : 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: isMobile ? '16px' : '24px',
              position: 'relative',
              width: '100%',
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
                    padding: isMobile ? '18px 16px' : '24px 20px',
                    boxShadow: '4px 4px 0px rgba(43, 43, 43, 0.12)',
                    position: 'relative',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <span
                      style={{
                        fontSize: isMobile ? '1.5rem' : '1.8rem',
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
                        width: '34px',
                        height: '34px',
                        background: '#2B2B2B',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon size={17} />
                    </div>
                  </div>

                  <h3
                    style={{
                      fontSize: '1.05rem',
                      fontWeight: 800,
                      color: '#2B2B2B',
                      marginBottom: '8px',
                      fontFamily: "'Special Elite', monospace",
                    }}
                  >
                    {step.title}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#555555', lineHeight: 1.55 }}>
                    {step.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. FREQUENTLY ASKED QUESTIONS */}
      <section style={{ marginBottom: isMobile ? '32px' : '40px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? '20px' : '28px' }}>
          <div className="stamp-seal" style={{ marginBottom: '10px', fontSize: isMobile ? '0.7rem' : '0.78rem' }}>
            QUESTIONS &amp; ANSWERS
          </div>
          <h2
            style={{
              fontSize: isMobile ? '1.4rem' : 'clamp(1.6rem, 2.8vw, 2.1rem)',
              color: '#2B2B2B',
              fontFamily: "'Special Elite', monospace",
            }}
          >
            Frequently Asked Questions
          </h2>
        </div>

        <div style={{ maxWidth: '820px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={faq.q}
                style={{
                  background: '#FAFAFA',
                  border: '1px solid #2B2B2B',
                  boxShadow: '3px 3px 0px rgba(43, 43, 43, 0.15)',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  style={{
                    width: '100%',
                    padding: isMobile ? '13px 14px' : '16px 18px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: "'Special Elite', monospace",
                    fontSize: isMobile ? '0.86rem' : '0.94rem',
                    fontWeight: 800,
                    color: '#2B2B2B',
                    gap: '10px',
                    boxSizing: 'border-box',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1, lineHeight: 1.35 }}>
                    <HelpCircle size={16} color="#2563EB" flexShrink={0} />
                    <span>{faq.q}</span>
                  </span>
                  <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </span>
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
                          padding: isMobile ? '10px 14px 14px 14px' : '0 18px 16px 44px',
                          fontSize: isMobile ? '0.84rem' : '0.88rem',
                          color: '#555555',
                          lineHeight: 1.55,
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
          paddingTop: isMobile ? '20px' : '30px',
          borderTop: '1px dashed #2B2B2B',
          color: '#777777',
          fontSize: isMobile ? '0.74rem' : '0.8rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          width: '100%',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: isMobile ? '4px 8px' : '8px',
            textAlign: 'center',
            lineHeight: 1.4,
          }}
        >
          <span>PulseCast • Free Live Audience Polling</span>
          <span>•</span>
          <span>No App Downloads Required</span>
          <span>•</span>
          <span>Open Source</span>
        </div>
        <div style={{ fontSize: isMobile ? '0.7rem' : '0.74rem', textAlign: 'center' }}>
          Designed with distraction-free vintage paper ballot styling &amp; live real-time sync.
        </div>
      </footer>
    </div>
  );
}
