import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, Presentation, PlusCircle, User, LogOut, Smartphone, Wifi } from 'lucide-react';
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

    // Extract poll ID from current path if on /present/:id or /vote/:id
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
      borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
      backgroundColor: 'rgba(11, 15, 25, 0.85)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: isMobile ? '8px 14px' : isMobileVote ? '10px 16px' : '12px 24px',
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
          color: '#F8FAFC',
        }}>
          <div style={{
            width: isMobile ? '30px' : '36px',
            height: isMobile ? '30px' : '36px',
            borderRadius: isMobile ? '8px' : '10px',
            background: 'linear-gradient(135deg, #48E5C2 0%, #36d4b2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(72, 229, 194, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}>
            <Activity size={isMobile ? 16 : 20} color="#000000" />
          </div>
          <div>
            <span style={{
              fontSize: isMobile ? '1.05rem' : '1.25rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              fontFamily: 'var(--font-heading)',
              color: '#F8FAFC',
            }}>
              PulseCast
            </span>
            <span style={{
              fontSize: isMobile ? '0.62rem' : '0.7rem',
              color: '#48E5C2',
              marginLeft: '5px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '1px 5px',
              borderRadius: '5px',
              background: 'rgba(72, 229, 194, 0.12)',
              border: '1px solid rgba(72, 229, 194, 0.3)',
            }}>
              LIVE
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
            {/* Join Poll link for participants */}
            <Link
              to="/vote"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '14px',
                fontSize: '0.85rem',
                fontWeight: location.pathname.startsWith('/vote') ? 700 : 500,
                textDecoration: 'none',
                color: location.pathname.startsWith('/vote') ? '#000000' : '#F8FAFC',
                background: location.pathname.startsWith('/vote') ? 'linear-gradient(135deg, #48E5C2 0%, #36d4b2 100%)' : 'rgba(255, 255, 255, 0.04)',
                border: location.pathname.startsWith('/vote') ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: location.pathname.startsWith('/vote') ? '0 2px 14px rgba(72, 229, 194, 0.35)' : 'none',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <Smartphone size={15} color={location.pathname.startsWith('/vote') ? '#000000' : '#F8FAFC'} />
              <span className="nav-btn-text">Join Poll</span>
            </Link>

            {/* Creator link */}
            <Link
              to="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '14px',
                fontSize: '0.85rem',
                fontWeight: location.pathname === '/' ? 700 : 500,
                textDecoration: 'none',
                color: location.pathname === '/' ? '#000000' : '#F8FAFC',
                background: location.pathname === '/' ? 'linear-gradient(135deg, #48E5C2 0%, #36d4b2 100%)' : 'rgba(255, 255, 255, 0.04)',
                border: location.pathname === '/' ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: location.pathname === '/' ? '0 2px 14px rgba(72, 229, 194, 0.35)' : 'none',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <PlusCircle size={15} color={location.pathname === '/' ? '#000000' : '#F8FAFC'} />
              <span className="nav-btn-text">{user ? 'Create Poll' : 'Creator Portal'}</span>
            </Link>

            {/* Dynamic link to creator's active poll */}
            {activePollId ? (
              <Link
                to={`/present/${activePollId}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '14px',
                  fontSize: '0.85rem',
                  fontWeight: location.pathname.startsWith('/present') ? 700 : 500,
                  textDecoration: 'none',
                  color: location.pathname.startsWith('/present') ? '#000000' : '#F8FAFC',
                  background: location.pathname.startsWith('/present') ? 'linear-gradient(135deg, #48E5C2 0%, #36d4b2 100%)' : 'rgba(255, 255, 255, 0.04)',
                  border: location.pathname.startsWith('/present') ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: location.pathname.startsWith('/present') ? '0 2px 14px rgba(72, 229, 194, 0.35)' : 'none',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <Presentation size={15} color={location.pathname.startsWith('/present') ? '#000000' : '#F8FAFC'} />
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
              borderLeft: isMobile ? 'none' : '1px solid var(--border-subtle)',
            }}>
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  style={{
                    width: isMobile ? '26px' : '30px',
                    height: isMobile ? '26px' : '30px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '1px solid rgba(72, 229, 194, 0.5)',
                  }}
                />
              ) : (
                <span style={{ fontSize: isMobile ? '0.78rem' : '0.85rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
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
                  color: 'var(--text-muted)',
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
              style={{
                fontSize: '0.78rem',
                color: '#48E5C2',
                fontWeight: 600,
                textDecoration: 'none',
                padding: '4px 10px',
                borderRadius: '8px',
                background: 'rgba(72, 229, 194, 0.1)',
                border: '1px solid rgba(72, 229, 194, 0.25)',
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
