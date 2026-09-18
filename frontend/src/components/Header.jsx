import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, Presentation, PlusCircle, User, LogOut, Smartphone } from 'lucide-react';
import { getUser, clearAuth } from '../api';
import { useDeviceType } from '../hooks/useDeviceType';

export default function Header() {
  const location = useLocation();
  const { isMobile } = useDeviceType();
  const [activePollId, setActivePollId] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('pulsecast_latest_poll_id') || null;
    }
    return null;
  });
  const [user, setUser] = useState(() => getUser());

  useEffect(() => {
    setUser(getUser());

    const pathParts = location.pathname.split('/');
    if (pathParts.length > 2 && pathParts[2] && pathParts[2] !== '123') {
      setActivePollId(pathParts[2]);
      localStorage.setItem('pulsecast_latest_poll_id', pathParts[2]);
    } else {
      const stored = localStorage.getItem('pulsecast_latest_poll_id');
      if (stored) {
        setActivePollId(stored);
      }
    }
  }, [location.pathname]);

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    window.location.href = '/';
  };

  const isMobileVote = location.pathname.startsWith('/vote/');

  return (
    <header style={{
      borderBottom: '2px solid #2B2B2B',
      backgroundColor: '#FAFAFA',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: isMobile ? '8px 14px' : isMobileVote ? '10px 16px' : '12px 24px',
      boxShadow: '0 3px 0px rgba(43, 43, 43, 0.1)',
      fontFamily: "'Special Elite', monospace",
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Brand */}
        <Link to="/" style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '8px' : '10px',
          textDecoration: 'none',
          color: '#2B2B2B',
        }}>
          <div style={{
            width: isMobile ? '30px' : '36px',
            height: isMobile ? '30px' : '36px',
            background: '#2B2B2B',
            border: '1px solid #1A1A1A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '2px 2px 0px rgba(43, 43, 43, 0.2)',
          }}>
            <Activity size={isMobile ? 16 : 20} color="#FAFAFA" />
          </div>
          <div>
            <span style={{
              fontSize: isMobile ? '1.1rem' : '1.3rem',
              fontWeight: 800,
              fontFamily: "'Special Elite', monospace",
              color: '#2B2B2B',
            }}>
              PulseCast
            </span>
            <span className="stamp-seal header-live-stamp" style={{
              fontSize: isMobile ? '0.62rem' : '0.68rem',
              marginLeft: '6px',
              padding: '1px 5px',
              borderWidth: '1.5px',
            }}>
              LIVE POLL
            </span>
          </div>
        </Link>

        {/* Right Nav */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '8px' : '12px',
        }}>
          {/* Laptop Only Navigation Items */}
          <div className="laptop-only" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Join Poll link */}
            <Link
              to="/vote"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                fontSize: '0.86rem',
                fontWeight: location.pathname.startsWith('/vote') ? 800 : 700,
                textDecoration: 'none',
                color: location.pathname.startsWith('/vote') ? '#FAFAFA' : '#2B2B2B',
                background: location.pathname.startsWith('/vote') ? '#2B2B2B' : '#FAFAFA',
                border: '1px solid #2B2B2B',
                boxShadow: location.pathname.startsWith('/vote') ? '3px 3px 0px rgba(43, 43, 43, 0.3)' : '3px 3px 0px rgba(43, 43, 43, 0.15)',
                transition: 'all 0.1s ease',
              }}
            >
              <Smartphone size={15} color={location.pathname.startsWith('/vote') ? '#FAFAFA' : '#2B2B2B'} />
              <span className="nav-btn-text">Join &amp; Vote</span>
            </Link>

            {/* Creator link */}
            <Link
              to="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                fontSize: '0.86rem',
                fontWeight: location.pathname === '/' ? 800 : 700,
                textDecoration: 'none',
                color: location.pathname === '/' ? '#FAFAFA' : '#2B2B2B',
                background: location.pathname === '/' ? '#2B2B2B' : '#FAFAFA',
                border: '1px solid #2B2B2B',
                boxShadow: location.pathname === '/' ? '3px 3px 0px rgba(43, 43, 43, 0.3)' : '3px 3px 0px rgba(43, 43, 43, 0.15)',
                transition: 'all 0.1s ease',
              }}
            >
              <PlusCircle size={15} color={location.pathname === '/' ? '#FAFAFA' : '#2B2B2B'} />
              <span className="nav-btn-text">{user ? 'Create Poll' : 'Host Portal'}</span>
            </Link>

            {/* Dynamic link to presenter view */}
            {activePollId ? (
              <Link
                to={`/present/${activePollId}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  fontSize: '0.86rem',
                  fontWeight: location.pathname.startsWith('/present') ? 800 : 700,
                  textDecoration: 'none',
                  color: location.pathname.startsWith('/present') ? '#FAFAFA' : '#2B2B2B',
                  background: location.pathname.startsWith('/present') ? '#2B2B2B' : '#FAFAFA',
                  border: '1px solid #2B2B2B',
                  boxShadow: location.pathname.startsWith('/present') ? '3px 3px 0px rgba(43, 43, 43, 0.3)' : '3px 3px 0px rgba(43, 43, 43, 0.15)',
                  transition: 'all 0.1s ease',
                }}
              >
                <Presentation size={15} color={location.pathname.startsWith('/present') ? '#FAFAFA' : '#2B2B2B'} />
                <span className="nav-btn-text">Projector View</span>
              </Link>
            ) : null}
          </div>

          {/* User profile / Logout chip */}
          {user ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginLeft: isMobile ? '0' : '8px',
              paddingLeft: isMobile ? '0' : '12px',
              borderLeft: isMobile ? 'none' : '1px dashed #2B2B2B',
            }}>
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  style={{
                    width: isMobile ? '26px' : '30px',
                    height: isMobile ? '26px' : '30px',
                    border: '1px solid #2B2B2B',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <span style={{ color: '#2563EB', fontWeight: 700, fontFamily: "'Caveat', cursive", fontSize: isMobile ? '1.15rem' : '1.3rem' }}>
                  {user.name.split(' ')[0]}
                </span>
              )}
              <button
                type="button"
                onClick={handleLogout}
                title="Sign Out"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#555555',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <LogOut size={isMobile ? 14 : 15} />
              </button>
            </div>
          ) : isMobile ? (
            <Link
              to="/"
              onClick={() => {
                if (location.pathname === '/') {
                  const el = document.getElementById('auth-portal-section');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }
              }}
              style={{
                fontSize: '0.8rem',
                color: '#2B2B2B',
                fontWeight: 700,
                textDecoration: 'none',
                padding: '5px 12px',
                background: '#FAFAFA',
                border: '1px solid #2B2B2B',
                boxShadow: '2px 2px 0px rgba(43, 43, 43, 0.15)',
              }}
            >
              Sign In
            </Link>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
