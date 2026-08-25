import { useState } from 'react';
import { useApp } from '../../../store/AppContext';
import { useTranslation } from '../../../i18n/useTranslation';
import { ElderlyNav } from '../../../components/ElderlyNav/ElderlyNav';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mic, MicOff, Settings } from 'lucide-react';
import { isVoiceRecognitionSupported, listenOnce, speak } from '../../../services/voiceService';
import { parseIntent, resolveIntent } from '../../../services/voiceIntents';

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
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState<string | null>(null);
  const [response, setResponse] = useState<string | null>(null);
  const [showResponse, setShowResponse] = useState(false);
  const voiceSupported = isVoiceRecognitionSupported();

  const respond = (transcript: string) => {
    setHeard(transcript);
    setShowResponse(false);
    const { intent, entity } = parseIntent(transcript);
    const { text, navigateTo } = resolveIntent(intent, entity, { dailyActivities, reminders, memories });
    setTimeout(() => {
      setResponse(text);
      setShowResponse(true);
      speak(text, lang);
      if (navigateTo) setTimeout(() => navigate(navigateTo), 2000);
    }, 400);
  };

  const handleMicTap = async () => {
    if (listening) return;
    if (!voiceSupported) {
      respond(SUGGESTED_PHRASES[0].text);
      return;
    }
    setListening(true);
    try {
      const transcript = await listenOnce(lang);
      respond(transcript);
    } catch {
      setResponse("I couldn't hear you clearly. Please try again or tap one of the phrases below.");
      setShowResponse(true);
    } finally {
      setListening(false);
    }
  };

  return (
    <div className="elderly-layout" style={{ paddingBottom: 90 }}>
      <div style={{
        background: 'linear-gradient(135deg, #1A237E 0%, var(--color-primary) 100%)',
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
        {/* Voice Button */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <button
            className={`voice-button ${listening ? 'voice-button--listening' : ''}`}
            onClick={handleMicTap}
            style={{ width: 120, height: 120 }}
          >
            {listening ? <MicOff size={52} /> : <Mic size={52} />}
          </button>
          <p style={{ fontSize: 16, fontWeight: 600, color: listening ? 'var(--color-primary)' : 'var(--text-secondary)' }}>
            {listening
              ? (lang === 'as' ? 'শুনিছে...' : 'Listening...')
              : (lang === 'as' ? 'কথা কবলৈ টেপ কৰক' : 'Tap to speak')
            }
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
            <div style={{ display: 'flex', gap: 10, marginBottom: 12, padding: '12px 16px', background: '#F0F8F5', borderRadius: '16px 16px 0 0', margin: '-20px -20px 16px', borderBottom: '1px solid var(--border-color)' }}>
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
            {SUGGESTED_PHRASES.map((cmd) => (
              <button
                key={cmd.text}
                onClick={() => respond(lang === 'as' ? cmd.textAs : cmd.text)}
                disabled={listening}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: heard === (lang === 'as' ? cmd.textAs : cmd.text) ? 'rgba(46,125,139,0.06)' : 'white',
                  border: `2px solid ${heard === (lang === 'as' ? cmd.textAs : cmd.text) ? 'var(--color-primary)' : 'var(--border-color)'}`,
                  borderRadius: 16, padding: '16px 18px',
                  cursor: listening ? 'not-allowed' : 'pointer',
                  textAlign: 'left', transition: 'all 0.2s',
                  opacity: listening ? 0.6 : 1,
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
            ))}
          </div>
        </div>

        {/* Architecture note */}
        <div style={{
          background: '#F8FAFB', borderRadius: 12, padding: '12px 16px',
          fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.5,
          border: '1px solid var(--border-color)',
        }}>
          <strong>🔧 Architecture Note:</strong> Uses your browser's built-in speech recognition and
          answers from your real daily schedule, reminders, and memories — not scripted text.
          Swappable for Whisper, Bhashini, or AI4Bharat for broader Assamese ASR coverage.
        </div>
      </div>
      <ElderlyNav />
    </div>
  );
}
