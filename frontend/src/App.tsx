import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { MainLayout } from './components/layout/MainLayout';
import { Overview } from './pages/Overview';
import { Detection } from './pages/Detection';
import { NetworkView } from './pages/NetworkView';
import { Prediction } from './pages/Prediction';
import { Defense } from './pages/Defense';
import { History } from './pages/History';
import { System } from './pages/System';
import { BackendProvider } from './services/BackendContext';

export const App: React.FC = () => {
  return (
    <BackendProvider>
      <BrowserRouter>
        <Routes>
          {/* 1. Full-Viewport Cinematic Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* 2. Operational Console Layout (Modules 1 through 6) */}
          <Route element={<MainLayout />}>
            <Route path="/console" element={<Overview />} />
            <Route path="/overview" element={<Overview />} />
            <Route path="/detection" element={<Detection />} />
            <Route path="/detect" element={<Detection />} />
            <Route path="/network" element={<NetworkView />} />
            <Route path="/prediction" element={<Prediction />} />
            <Route path="/defense" element={<Defense />} />
            <Route path="/incidents" element={<History />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<System />} />
            <Route path="/system" element={<System />} />
            {/* Catch-all redirect to Landing */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </BackendProvider>
  );
};

export default App;
