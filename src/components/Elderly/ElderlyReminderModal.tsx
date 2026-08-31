import { useState, useEffect } from 'react';
import { useApp } from '../../store/AppContext';
import { useTranslation } from '../../i18n/useTranslation';
import { getPersonalization } from '../../services/personalization';
import { resolvePatientTheme } from '../../services/themeRegistry';
import { playPersonalizedPrompt } from '../../services/voice/personalizedAudio';
import type { Reminder } from '../../types';
import { X, Volume2, CheckCircle2, Clock, Heart, Sparkles, Pill, Utensils } from 'lucide-react';

interface Props {
  reminder: Reminder | null;
  onClose: () => void;
  onCompleted?: (id: string) => void;
}

export function ElderlyReminderModal({ reminder, onClose, onCompleted }: Props) {
  const { currentPatient, updateReminderStatus } = useApp();
  const { lang } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  const personalization = getPersonalization(currentPatient);
  const favoritePerson = personalization.favoritePerson;
  const themeAsset = resolvePatientTheme(
    currentPatient?.preferences?.onboarding?.favorites?.themePreference,
    currentPatient?.preferences?.onboarding?.favorites,
  );

  const elderName = currentPatient?.name ? currentPatient.name.split(' ')[0] : '';

  if (!reminder) return null;

  const isTabletOrMedicine =
    reminder.type === 'medicine' ||
    reminder.title.toLowerCase().includes('tablet') ||
    reminder.title.toLowerCase().includes('medicine') ||
    reminder.title.toLowerCase().includes('pill') ||
    reminder.title.toLowerCase().includes('dose');

  const isFoodOrMeal =
    reminder.type === 'activity' && (
      reminder.title.toLowerCase().includes('food') ||
      reminder.title.toLowerCase().includes('meal') ||
      reminder.title.toLowerCase().includes('lunch') ||
      reminder.title.toLowerCase().includes('dinner') ||
      reminder.title.toLowerCase().includes('breakfast') ||
      reminder.title.toLowerCase().includes('eat') ||
      reminder.title.toLowerCase().includes('snack')
    );

  // Generate personalized reminder message
  let message = '';
  let speechText = '';

  if (favoritePerson) {
    if (isTabletOrMedicine) {
      message = `${elderName ? elderName + ', ' : ''}please remember to take your ${reminder.title} tablets now. Drink plenty of water with it!`;
      speechText = lang === 'as'
        ? `${elderName || ''}, আপোনাৰ ঔষধ খোৱাৰ সময় হৈছে।`
        : `Hello ${elderName || ''}! ${favoritePerson.name} is reminding you: please take your ${reminder.title} tablets now.`;
    } else if (isFoodOrMeal) {
      message = `${elderName ? elderName + ', ' : ''}it is time for your ${reminder.title}! Please enjoy a warm, healthy meal.`;
      speechText = lang === 'as'
        ? `${elderName || ''}, আহাৰ খোৱাৰ সময় হৈছে।`
        : `Hello ${elderName || ''}! Time for your ${reminder.title}! Please enjoy your meal.`;
    } else {
      message = `${elderName ? elderName + ', ' : ''}here is your gentle reminder for ${reminder.title} at ${reminder.time}.`;
      speechText = `Hello ${elderName || ''}! ${favoritePerson.name} is reminding you: ${reminder.title}.`;
    }
  } else if (themeAsset && (isFoodOrMeal || isTabletOrMedicine)) {
    if (isFoodOrMeal) {
      message = `Meal time! Time for your ${reminder.title}. Enjoy your favorite ${themeAsset.label}!`;
      speechText = `Time for ${reminder.title}! Enjoy your favorite ${themeAsset.label}.`;
    } else {
      message = `Time to take your scheduled ${reminder.title} tablets with fresh water.`;
      speechText = `Time for your ${reminder.title} tablets.`;
    }
  } else {
    // Generic natural message
    message = `Gentle reminder: It is time for your ${reminder.title} scheduled at ${reminder.time}. ${reminder.description || ''}`.trim();
    speechText = `Friendly reminder: It is time for ${reminder.title}.`;
  }

  // Speak on mount
  useEffect(() => {
    setIsPlaying(true);
    const audio = playPersonalizedPrompt({
      patient: currentPatient,
      trigger: 'reminder',
      fallbackText: speechText,
      lang,
      onStart: () => setIsPlaying(true),
      onEnd: () => setIsPlaying(false),
    });

    return () => {
      audio?.stop();
    };
  }, [reminder.id]);

  const handleReplayVoice = () => {
    setIsPlaying(true);
    playPersonalizedPrompt({
      patient: currentPatient,
      trigger: 'reminder',
      fallbackText: speechText,
      lang,
      onStart: () => setIsPlaying(true),
      onEnd: () => setIsPlaying(false),
    });
  };

  const handleMarkDone = () => {
    updateReminderStatus(reminder.id, 'completed');
    setJustCompleted(true);
    onCompleted?.(reminder.id);

    // Speak reward
    playPersonalizedPrompt({
      patient: currentPatient,
      trigger: 'reward',
      fallbackText: favoritePerson
        ? `Great job ${elderName || ''}! ${favoritePerson.name} is so happy you took care of this.`
        : 'Wonderful! Marked done.',
      lang,
    });

    setTimeout(() => {
      onClose();
    }, 1800);
  };

  const handleSnooze = () => {
    updateReminderStatus(reminder.id, 'delayed');
    onClose();
  };

  const hasPersonPhoto = Boolean(favoritePerson?.photoUrl);
  const hasFavoriteThing = Boolean(themeAsset && themeAsset.imageUrl);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(8px)',
      animation: 'fadeIn 0.2s ease-out',
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: 28,
        width: '100%',
        maxWidth: 440,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        position: 'relative',
        animation: 'scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {/* Header Ribbon */}
        <div style={{
          background: isTabletOrMedicine
            ? 'linear-gradient(135deg, #E11D48 0%, #BE123C 100%)'
            : isFoodOrMeal
            ? 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)'
            : 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
          padding: '20px 24px 18px',
          color: '#FFFFFF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '50%',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
            }}>
              {isTabletOrMedicine ? <Pill size={22} /> : isFoodOrMeal ? <Utensils size={22} /> : <Clock size={22} />}
            </div>
            <div>
              <div style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.85, fontWeight: 700 }}>
                {isTabletOrMedicine ? 'Tablet & Medicine Reminder' : isFoodOrMeal ? 'Meal & Food Reminder' : 'Daily Routine Reminder'}
              </div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
                {reminder.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              width: 34,
              height: 34,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px 22px 20px', textAlign: 'center' }}>
          {/* Priority 1: Favorite Person (Photo or Avatar) */}
          {hasPersonPhoto ? (
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 12 }}>
              <div style={{
                width: 104,
                height: 104,
                borderRadius: '50%',
                overflow: 'hidden',
                margin: '0 auto',
                border: '4px solid #F59E0B',
                boxShadow: '0 8px 24px rgba(245, 158, 11, 0.35)',
                background: '#FEF3C7',
              }}>
                <img
                  src={favoritePerson!.photoUrl!}
                  alt={favoritePerson!.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div style={{
                position: 'absolute', bottom: -2, right: -2,
                background: '#EF4444', color: 'white',
                borderRadius: '50%', width: 30, height: 30,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)', border: '2px solid white',
              }}>
                <Heart size={14} fill="white" />
              </div>
            </div>
          ) : favoritePerson ? (
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 12 }}>
              <div style={{
                width: 96,
                height: 96,
                borderRadius: '50%',
                margin: '0 auto',
                background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
                border: '4px solid #F59E0B',
                boxShadow: '0 8px 20px rgba(245, 158, 11, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 42,
              }}>
                {favoritePerson.relationship.toLowerCase().includes('granddaughter') || favoritePerson.relationship.toLowerCase().includes('daughter') ? '👧' : '👦'}
              </div>
              <div style={{
                position: 'absolute', bottom: -2, right: -2,
                background: '#EF4444', color: 'white',
                borderRadius: '50%', width: 28, height: 28,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)', border: '2px solid white',
              }}>
                <Heart size={14} fill="white" />
              </div>
            </div>
          ) : hasFavoriteThing && themeAsset.imageUrl ? (
            /* Priority 2: Favorite Thing Image (Food/Fruit/Nature) */
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 12 }}>
              <div style={{
                width: 104,
                height: 104,
                borderRadius: 22,
                overflow: 'hidden',
                margin: '0 auto',
                border: '4px solid #10B981',
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)',
              }}>
                <img
                  src={themeAsset.imageUrl}
                  alt={themeAsset.label}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div style={{
                position: 'absolute', bottom: -4, right: -4,
                background: '#10B981', color: 'white',
                borderRadius: '50%', width: 28, height: 28,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid white', fontSize: 14,
              }}>
                {themeAsset.emoji}
              </div>
            </div>
          ) : (
            /* Priority 3: Generic Natural Illustration */
            <div style={{
              width: 86,
              height: 86,
              borderRadius: '50%',
              margin: '0 auto 12px',
              background: '#F1F5F9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 42,
            }}>
              {isTabletOrMedicine ? '💊' : isFoodOrMeal ? '🍲' : '⏰'}
            </div>
          )}

          {/* Speaker Badge */}
          {favoritePerson ? (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#FEF3C7', color: '#92400E',
              padding: '4px 14px', borderRadius: 99,
              fontSize: 13, fontWeight: 800, marginBottom: 10,
            }}>
              <Sparkles size={13} /> Reminder from {favoritePerson.name} ({favoritePerson.relationship})
            </div>
          ) : hasFavoriteThing ? (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#DCFCE7', color: '#166534',
              padding: '4px 14px', borderRadius: 99,
              fontSize: 13, fontWeight: 800, marginBottom: 10,
            }}>
              {themeAsset.emoji} Favorite {themeAsset.label} Time
            </div>
          ) : (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#F1F5F9', color: '#475569',
              padding: '4px 14px', borderRadius: 99,
              fontSize: 13, fontWeight: 700, marginBottom: 10,
            }}>
              Scheduled for {reminder.time}
            </div>
          )}

          {/* Spoken Message Bubble */}
          <div style={{
            background: '#F8FAFC',
            border: '1.5px solid #E2E8F0',
            borderRadius: 18,
            padding: '16px 18px',
            marginBottom: 20,
            textAlign: 'left',
          }}>
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.5, color: '#1E293B', fontWeight: 600 }}>
              "{message}"
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <button
                onClick={handleReplayVoice}
                style={{
                  background: isPlaying ? 'var(--color-primary)' : '#E2E8F0',
                  color: isPlaying ? '#FFFFFF' : '#334155',
                  border: 'none',
                  borderRadius: 12,
                  padding: '6px 12px',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.2s ease',
                }}
              >
                <Volume2 size={15} />
                {isPlaying ? 'Speaking...' : 'Hear Voice'}
              </button>
            </div>
          </div>

          {/* Success Banner when marked completed */}
          {justCompleted ? (
            <div style={{
              background: '#DCFCE7',
              color: '#15803D',
              padding: '14px',
              borderRadius: 16,
              fontWeight: 800,
              fontSize: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              animation: 'fadeIn 0.2s ease-out',
            }}>
              <CheckCircle2 size={20} />
              {isTabletOrMedicine ? 'Tablets Taken! Great job!' : 'Marked as Done! Wonderful!'}
            </div>
          ) : (
            /* Action Buttons */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={handleMarkDone}
                className="btn btn--primary"
                style={{
                  width: '100%',
                  height: 54,
                  borderRadius: 999,
                  fontSize: 17,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: isTabletOrMedicine ? '#E11D48' : isFoodOrMeal ? '#EA580C' : 'var(--color-primary)',
                  borderColor: isTabletOrMedicine ? '#E11D48' : isFoodOrMeal ? '#EA580C' : 'var(--color-primary)',
                  boxShadow: `0 8px 18px ${isTabletOrMedicine ? '#E11D4844' : isFoodOrMeal ? '#EA580C44' : 'rgba(0,0,0,0.15)'}`,
                }}
              >
                <CheckCircle2 size={20} />
                {isTabletOrMedicine ? '✓ I Took My Tablets' : isFoodOrMeal ? '✓ I Finished My Meal' : '✓ Completed'}
              </button>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button
                  onClick={handleSnooze}
                  className="btn btn--outline"
                  style={{ height: 46, fontSize: 14, fontWeight: 700, borderRadius: 999 }}
                >
                  ⏰ In 10 Mins
                </button>
                <button
                  onClick={onClose}
                  className="btn btn--outline"
                  style={{ height: 46, fontSize: 14, fontWeight: 700, borderRadius: 999 }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
