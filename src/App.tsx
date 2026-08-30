import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/AuthContext';
import { AppProvider, useApp } from './store/AppContext';
import { OfflineProvider } from './store/OfflineContext';
import { OfflineIndicator } from './components/OfflineIndicator/OfflineIndicator';
import LandingPage from './pages/Landing/LandingPage';
import OnboardingFlow from './pages/Onboarding/OnboardingFlow';
import ElderPinLogin from './pages/Onboarding/ElderPinLogin';

import ElderlyDashboard from './pages/Elderly/Dashboard/ElderlyDashboard';
import CaregiverDashboard from './pages/Caregiver/Dashboard/CaregiverDashboard';
import HealthcareDashboard from './pages/Healthcare/Dashboard/HealthcareDashboard';

import './index.css';

function AppRoutes() {
  const { user, isRestoring } = useAuth();
  const { loading } = useApp();

  if (isRestoring) return null;
  if (!user) return <LandingPage />;
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: 18, color: 'var(--text-tertiary)' }}>
        Loading your Sahaaya experience…
      </div>
    );
  }

  if (user.role === 'elderly') {
    return (
      <Routes>
        <Route path="/" element={<ElderlyDashboard />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    );
  }

  if (user.role === 'caregiver') {
    return (
      <Routes>
        <Route path="/" element={<CaregiverDashboard />} />
        <Route path="/onboarding" element={<OnboardingFlow />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    );
  }

  if (user.role === 'healthcare') {
    return (
      <Routes>
        <Route path="/" element={<HealthcareDashboard />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    );
  }

  return <Navigate to="/" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <OfflineProvider>
          {/* /pin-login is public — rendered before AppProvider so it never
              needs a patient context. It manually handles its own auth. */}
          <Routes>
            <Route path="/pin-login" element={<ElderPinLogin />} />
            <Route
              path="*"
              element={
                <AppProvider>
                  <OfflineIndicator />
                  <AppRoutes />
                </AppProvider>
              }
            />
          </Routes>
        </OfflineProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
