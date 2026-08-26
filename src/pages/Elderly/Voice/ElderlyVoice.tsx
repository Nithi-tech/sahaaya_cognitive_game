import { useState } from 'react';
import { useApp } from '../../../store/AppContext';
import { useTranslation } from '../../../i18n/useTranslation';
import { ElderlyNav } from '../../../components/ElderlyNav/ElderlyNav';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings } from 'lucide-react';
import { isVoiceRecognitionSupported, listenOnce, speak } from '../../../services/voiceService';
import { parseIntent, resolveIntent } from '../../../services/voiceIntents';
import { VoiceOrb, type VoiceOrbState } from '../../../components/design-system/VoiceOrb';

const SUGGESTED_PHRASES: { text: string; textAs: string; emoji: string }[] = [
  { text: 'What do I have to do today?', textAs: 'আজি মোৰ কি কৰিবলগীয়া আছে?', emoji: '📋' },
  { text: 'Who is Anjali?', textAs: 'অঞ্জলি কোন?', emoji: '👧' },
  { text: 'When should I take my medicine?', textAs: 'মই কেতিয়া ঔষধ খাব লাগিব?', emoji: '💊' },
  { text: 'What did I do this morning?', textAs: 'মই ৰাতিপুৱা কি কৰিলোঁ?', emoji: '🌅' },
  { text: 'Start my memory game', textAs: 'মোৰ স্মৃতি খেল আৰম্ভ কৰক', emoji: '🧩' },
  { text: 'Remind me to drink water', textAs: 'মোক পানী খোৱাৰ কথা মনত পেলাওক', emoji: '💧' },
];

export default function ElderlyVoice() {
  const { t, lang } = useTranslation();
  const { dailyActivities, reminders, memories } = useApp();
  const navigate = useNavigate();
  const [orbState, setOrbState] = useState<VoiceOrbState>('idle');
  const [heard, setHeard] = useState<string | null>(null);
  const [response, setResponse] = useState<string | null>(null);
  const [showResponse, setShowResponse] = useState(false);
  const voiceSupported = isVoiceRecognitionSupported();

  const respond = (transcript: string) => {
    setHeard(transcript);
    setShowResponse(false);
    setOrbState('thinking');
    const { intent, entity } = parseIntent(transcript);
    const { text, navigateTo } = resolveIntent(intent, entity, { dailyActivities, reminders, memories });
    setTimeout(() => {
      setResponse(text);
      setShowResponse(true);
      setOrbState('speaking');
      speak(text, lang, () => setOrbState('idle'));
      if (navigateTo) setTimeout(() => navigate(navigateTo), 2000);
    }, 400);
  };

  const handleMicTap = async () => {
    if (orbState !== 'idle' && orbState !== 'error') return;
    if (!voiceSupported) {
      respond(SUGGESTED_PHRASES[0].text);
      return;
    }
    setOrbState('listening');
    try {
      const transcript = await listenOnce(lang);
      respond(transcript);
    } catch {
      setResponse("I couldn't hear you clearly. Please try again or tap one of the phrases below.");
      setShowResponse(true);
      setOrbState('error');
      setTimeout(() => setOrbState('idle'), 2500);
    }
  };

  return (
    <div className="elderly-layout" style={{ paddingBottom: 90 }}>
      <div style={{
        background: 'linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)',
        padding: '20px 20px 32px', color: 'white',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <button onClick={() => navigate('/')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 99, padding: '8px 12px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600 }}>
            <ArrowLeft size={16} /> Back
          </button>
          <button onClick={() => navigate('/voice-settings')} aria-label="Voice Settings" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 99, padding: '8px 12px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600 }}>
            <Settings size={16} />
          </button>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>
          {lang === 'as' ? t('voice.title') : 'Talk to Sahaaya'}
        </h1>
        <p style={{ opacity: 0.85, fontSize: 16, marginTop: 4 }}>
          Ask me anything about your day
        </p>
      </div>

      <div style={{ padding: '20px', marginTop: -16 }}>
        {/* Voice Orb — idle / listening / thinking / speaking / error, so
            the user can always tell what Sahaaya is doing right now. */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <VoiceOrb state={orbState} onTap={handleMicTap} size={120} />
          <p style={{ fontSize: 16, fontWeight: 600, color: orbState === 'idle' ? 'var(--text-secondary)' : 'var(--color-primary)' }}>
            {orbState === 'listening' && (lang === 'as' ? 'শুনিছে...' : 'Listening...')}
            {orbState === 'thinking' && (lang === 'as' ? 'ভাবি আছোঁ...' : 'Thinking...')}
            {orbState === 'speaking' && (lang === 'as' ? 'সহায়া কৈ আছে...' : 'Sahaaya is speaking...')}
            {orbState === 'error' && (lang === 'as' ? 'শুনা নগ\'ল, আকৌ চেষ্টা কৰক' : "Didn't catch that — try again")}
            {orbState === 'idle' && (lang === 'as' ? 'কথা কবলৈ টেপ কৰক' : 'Tap to speak')}
          </p>
          {!voiceSupported && (
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center', maxWidth: 280 }}>
              Voice recognition isn't available in this browser. Tap a phrase below instead.
            </p>
          )}
        </div>

        {/* Response Box */}
        {heard && (
          <div className="card" style={{ borderRadius: 20, marginBottom: 24, border: '2px solid var(--color-primary)' }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 12, padding: '12px 16px', background: '#EAF5F3', borderRadius: '16px 16px 0 0', margin: '-20px -20px 16px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: 24 }}>🎙️</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>You asked</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>"{heard}"</div>
              </div>
            </div>
            {showResponse && response && (
              <div className="animate-fade-in">
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                  🧠 Sahaaya says
                </div>
                <p style={{ fontSize: 18, lineHeight: 1.6, color: 'var(--text-primary)', fontWeight: 500 }}>
                  {response}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Suggested Commands */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {lang === 'as' ? 'সুধি চাওক:' : 'Try asking:'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {SUGGESTED_PHRASES.map((cmd) => {
              const busy = orbState !== 'idle' && orbState !== 'error';
              return (
              <button
                key={cmd.text}
                onClick={() => respond(lang === 'as' ? cmd.textAs : cmd.text)}
                disabled={busy}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: heard === (lang === 'as' ? cmd.textAs : cmd.text) ? 'rgba(46,125,139,0.06)' : 'white',
                  border: `2px solid ${heard === (lang === 'as' ? cmd.textAs : cmd.text) ? 'var(--color-primary)' : 'var(--border-color)'}`,
                  borderRadius: 16, padding: '16px 18px',
                  cursor: busy ? 'not-allowed' : 'pointer',
                  textAlign: 'left', transition: 'all 0.2s',
                  opacity: busy ? 0.6 : 1,
                }}
              >
                <span style={{ fontSize: 28 }}>{cmd.emoji}</span>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
                    "{lang === 'as' ? cmd.textAs : cmd.text}"
                  </div>
                  {lang === 'as' && (
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{cmd.text}</div>
                  )}
                </div>
              </button>
              );
            })}
          </div>
        </div>

      </div>
      <ElderlyNav />
    </div>
  );
}
