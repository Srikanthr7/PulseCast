import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import CreatorDashboard from './pages/CreatorDashboard';
import PresentationView from './pages/PresentationView';
import MobileVotingScreen from './pages/MobileVotingScreen';

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <Routes>
          <Route path="/" element={<CreatorDashboard />} />
          <Route path="/present/:id" element={<PresentationView />} />
          <Route path="/vote/:id" element={<MobileVotingScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
