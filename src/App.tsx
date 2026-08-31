import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/AuthContext';
import { AppProvider, useApp } from './store/AppContext';
import { OfflineProvider } from './store/OfflineContext';
import { useIdleAlert } from './hooks/useIdleAlert';
import { OfflineIndicator } from './components/OfflineIndicator/OfflineIndicator';
import LandingPage from './pages/Landing/LandingPage';
import OnboardingFlow from './pages/Onboarding/OnboardingFlow';
import ElderPinLogin from './pages/Onboarding/ElderPinLogin';

// Elderly pages
import ElderlyHome from './pages/Elderly/Home/ElderlyHome';
import ElderlyActivities from './pages/Elderly/Activities/ElderlyActivities';
import ElderlyGames from './pages/Elderly/Games/ElderlyGames';
import ElderlyMyDay from './pages/Elderly/MyDay/ElderlyMyDay';
import ElderlyReminders from './pages/Elderly/Reminders/ElderlyReminders';
import ElderlyVoice from './pages/Elderly/Voice/ElderlyVoice';
import ElderlyMemory from './pages/Elderly/Memory/ElderlyMemory';
import ElderlyVoiceSettings from './pages/Elderly/VoiceSettings/ElderlyVoiceSettings';
import BreathingExercise from './pages/Elderly/Relax/BreathingExercise';

// Caregiver pages
import CaregiverDashboard from './pages/Caregiver/Dashboard/CaregiverDashboard';
import CaregiverActivity from './pages/Caregiver/Activity/CaregiverActivity';
import CaregiverReminders from './pages/Caregiver/Reminders/CaregiverReminders';
import CaregiverMemory from './pages/Caregiver/Memory/CaregiverMemory';
import CaregiverAlerts from './pages/Caregiver/Alerts/CaregiverAlerts';

// Healthcare pages
import HCWPatients from './pages/Healthcare/Patients/HCWPatients';
import HCWPatientDetail from './pages/Healthcare/PatientDetail/HCWPatientDetail';
import HCWReports from './pages/Healthcare/Reports/HCWReports';

import './index.css';

function AppRoutes() {
  const { user, isRestoring } = useAuth();
  const { loading } = useApp();
  // Mounted unconditionally (before any early return) so it stays active
  // across every route the elder navigates to — see useIdleAlert.ts.
  useIdleAlert();

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
        <Route path="/" element={<ElderlyHome />} />
        <Route path="/games" element={<ElderlyGames />} />
        <Route path="/activities" element={<ElderlyActivities />} />
        <Route path="/myday" element={<ElderlyMyDay />} />
        <Route path="/reminders" element={<ElderlyReminders />} />
        <Route path="/voice" element={<ElderlyVoice />} />
        <Route path="/memory" element={<ElderlyMemory />} />
        <Route path="/voice-settings" element={<ElderlyVoiceSettings />} />
        <Route path="/relax" element={<BreathingExercise />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    );
  }

  if (user.role === 'caregiver') {
    return (
      <Routes>
        <Route path="/" element={<CaregiverDashboard />} />
        <Route path="/onboarding" element={<OnboardingFlow />} />
        <Route path="/activity" element={<CaregiverActivity />} />
        <Route path="/reminders" element={<CaregiverReminders />} />
        <Route path="/memory" element={<CaregiverMemory />} />
        <Route path="/alerts" element={<CaregiverAlerts />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    );
  }

  if (user.role === 'healthcare') {
    return (
      <Routes>
        <Route path="/" element={<HCWPatients />} />
        <Route path="/patient/:id" element={<HCWPatientDetail />} />
        <Route path="/reports" element={<HCWReports />} />
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
