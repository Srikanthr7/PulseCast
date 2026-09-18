import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Smartphone, PlusCircle, Presentation, User } from 'lucide-react';
import { getUser } from '../api';

export default function MobileBottomNav() {
  const location = useLocation();
  const [user, setUser] = useState(() => getUser());
  const [activePollId, setActivePollId] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('pulsecast_latest_poll_id') || null;
    }
    return null;
  });

  useEffect(() => {
    setUser(getUser());
    const stored = localStorage.getItem('pulsecast_latest_poll_id');
    if (stored) {
      setActivePollId(stored);
    }
  }, [location.pathname]);

  const isVote = location.pathname.startsWith('/vote');
  const isCreate = location.pathname === '/';
  const isPresent = location.pathname.startsWith('/present');

  return (
    <nav className="mobile-bottom-dock mobile-only" aria-label="Mobile Navigation">
      <Link
        to="/vote"
        className={`mobile-nav-item ${isVote ? 'active' : ''}`}
      >
        <Smartphone size={20} />
        <span>Vote</span>
      </Link>

      <Link
        to="/"
        className={`mobile-nav-item ${isCreate ? 'active' : ''}`}
      >
        <PlusCircle size={20} />
        <span>Create</span>
      </Link>

      <Link
        to={activePollId ? `/present/${activePollId}` : '/'}
        className={`mobile-nav-item ${isPresent ? 'active' : ''}`}
      >
        <Presentation size={20} />
        <span>Projector</span>
      </Link>

      <Link
        to="/"
        className="mobile-nav-item"
        style={{
          color: user ? 'var(--accent-primary)' : 'var(--text-muted)',
        }}
      >
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }}
          />
        ) : (
          <User size={20} />
        )}
        <span>{user ? user.name.split(' ')[0] : 'Account'}</span>
      </Link>
    </nav>
  );
}
