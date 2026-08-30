import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { useAuth } from '../../store/AuthContext';
import type { OnboardingData } from '../../types';
import Step0_PatientProfile from './steps/Step0_PatientProfile';
import Step1_People from './steps/Step1_People';
import Step2_Favorites from './steps/Step2_Favorites';
import Step3_Routine from './steps/Step3_Routine';
import Step4_Cultural from './steps/Step4_Cultural';
import Step5_Health from './steps/Step5_Health';
import Step6_Emotional from './steps/Step6_Emotional';
import Step7_Done from './steps/Step7_Done';

const STEPS = [
  { label: 'Patient Profile', icon: '👤' },
  { label: 'People', icon: '👨‍👩‍👧' },
  { label: 'Favourites', icon: '❤️' },
  { label: 'Routine', icon: '🌅' },
  { label: 'Cultural', icon: '🎨' },
  { label: 'Health', icon: '💊' },
  { label: 'Emotional', icon: '🌸' },
  { label: 'Done', icon: '✅' },
];

export default function OnboardingFlow() {
  const { currentPatient, saveOnboardingSection, markOnboardingComplete } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isNewPatient = searchParams.get('new') === 'true';

  const [step, setStep] = useState(0);
  const [pinHint, setPinHint] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // If continuing setup for an existing patient without explicitly requesting a new one, start at step 1
  useEffect(() => {
    if (!isNewPatient && currentPatient && step === 0) {
      setStep(1);
    }
  }, [currentPatient, isNewPatient]);

  const handlePatientCreated = (pin: string) => {
    setPinHint(pin);
    setStep(1);
  };

  const handleSaveSection = async (section: keyof OnboardingData, data: OnboardingData[keyof OnboardingData]) => {
    setSaving(true);
    setError('');
    try {
      await saveOnboardingSection(section, data);
      setStep((s) => s + 1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => setStep((s) => s + 1);

  const handleComplete = async () => {
    setSaving(true);
    setError('');
    try {
      await markOnboardingComplete();
      setStep(7);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const onboarding = currentPatient?.preferences?.onboarding ?? {};
  const completedSections = Object.values(onboarding).filter(Boolean).length;
  const progressPct = step === 0 ? 0 : Math.round(((step - 1) / 6) * 100);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '24px 16px',
    }}>
      {/* Brand header */}
      <div style={{ color: 'white', textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 36, marginBottom: 4 }}>🧠</div>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>Sahaaya</div>
        <div style={{ fontSize: 13, opacity: 0.7, marginTop: 2 }}>Caregiver Setup Wizard</div>
      </div>

      {/* Progress bar */}
      {step > 0 && step < 7 && (
        <div style={{ width: '100%', maxWidth: 560, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
              Step {step} of 6 — {STEPS[step].icon} {STEPS[step].label}
            </span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{progressPct}%</span>
          </div>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${progressPct}%`,
              background: 'linear-gradient(90deg, #56CCF2, #2F80ED)',
              borderRadius: 99, transition: 'width 0.4s ease',
            }} />
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {STEPS.slice(1, 7).map((s, i) => (
              <div key={s.label} style={{
                fontSize: 10, padding: '3px 8px', borderRadius: 99,
                background: i + 1 < step ? 'rgba(86,204,242,0.3)' : i + 1 === step ? 'rgba(86,204,242,0.5)' : 'rgba(255,255,255,0.08)',
                color: i + 1 <= step ? '#56CCF2' : 'rgba(255,255,255,0.4)',
                border: `1px solid ${i + 1 <= step ? 'rgba(86,204,242,0.5)' : 'rgba(255,255,255,0.1)'}`,
                fontWeight: 600,
              }}>
                {i + 1 < step ? '✓ ' : ''}{s.icon} {s.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Card container */}
      <div style={{
        width: '100%', maxWidth: 560,
        background: 'white', borderRadius: 24,
        boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
        overflow: 'hidden',
      }}>
        {error && (
          <div style={{ background: '#FFEBEE', borderBottom: '1px solid #FFCDD2', padding: '12px 24px', fontSize: 13, color: '#C62828' }}>
            ⚠️ {error}
          </div>
        )}

        {step === 0 && <Step0_PatientProfile onCreated={handlePatientCreated} />}
        {step === 1 && (
          <Step1_People
            saved={onboarding.people ?? null}
            onSave={(d) => handleSaveSection('people', d)}
            onSkip={handleSkip}
            saving={saving}
          />
        )}
        {step === 2 && (
          <Step2_Favorites
            saved={onboarding.favorites ?? null}
            onSave={(d) => handleSaveSection('favorites', d)}
            onSkip={handleSkip}
            saving={saving}
          />
        )}
        {step === 3 && (
          <Step3_Routine
            saved={onboarding.routine ?? null}
            onSave={(d) => handleSaveSection('routine', d)}
            onSkip={handleSkip}
            saving={saving}
          />
        )}
        {step === 4 && (
          <Step4_Cultural
            saved={onboarding.cultural ?? null}
            onSave={(d) => handleSaveSection('cultural', d)}
            onSkip={handleSkip}
            saving={saving}
          />
        )}
        {step === 5 && (
          <Step5_Health
            saved={onboarding.health ?? null}
            onSave={(d) => handleSaveSection('health', d)}
            onSkip={handleSkip}
            saving={saving}
          />
        )}
        {step === 6 && (
          <Step6_Emotional
            saved={onboarding.emotional ?? null}
            onSave={(d) => {
              handleSaveSection('emotional', d).then(() => handleComplete());
            }}
            onSkip={handleComplete}
            saving={saving}
          />
        )}
        {step === 7 && (
          <Step7_Done
            patientName={currentPatient?.name ?? ''}
            pin={pinHint}
            onGoToDashboard={() => navigate('/')}
          />
        )}
      </div>

      {/* Back / Exit links */}
      {step === 0 ? (
        <button
          onClick={() => navigate('/')}
          style={{
            marginTop: 16, background: 'none', border: 'none',
            color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 13,
          }}
        >
          ← Cancel & Back to Dashboard
        </button>
      ) : step < 7 ? (
        <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            style={{
              background: 'none', border: 'none',
              color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 13,
            }}
          >
            ← Back to previous step
          </button>
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none', border: 'none',
              color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 13,
            }}
          >
            Exit to Dashboard (progress saved)
          </button>
        </div>
      ) : null}

      {/* Caregiver identity footer */}
      {user && (
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 16 }}>
          Logged in as {user.name} · {completedSections} of 6 sections saved
        </div>
      )}
    </div>
  );
}
