import { useEffect, type ReactNode } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { useApp } from '../../store/AppContext';
import { getPersonalization } from '../../services/personalization';
import { resolvePatientTheme } from '../../services/themeRegistry';
import { playPersonalizedPrompt } from '../../services/voice/personalizedAudio';
import type { CognitiveGameResult } from '../../games/types';
import { Heart, Trophy } from 'lucide-react';

interface Action {
  label: ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'outline';
}

interface Props {
  result: CognitiveGameResult;
  difficultyReason: string;
  primaryAction: Action;
  secondaryAction?: Action;
}

interface ThemeVisuals {
  isFamily: boolean;
  backgroundImage: string;
  mascotImage?: string;
  photoUrl?: string | null;
  badgeEmoji: string;
  headline: string;
  cardTag: string;
  quote: string;
  themeColor: string;
  praiseText: string;
}

export function GameResultScreen({ result, difficultyReason, primaryAction, secondaryAction }: Props) {
  const { lang } = useTranslation();
  const { currentPatient } = useApp();
  const improved = result.accuracy >= 80;

  const personalization = getPersonalization(currentPatient);
  const favoritePerson = personalization.favoritePerson;
  const themeAsset = resolvePatientTheme(
    currentPatient?.preferences?.onboarding?.favorites?.themePreference,
    currentPatient?.preferences?.onboarding?.favorites,
  );

  const elderName = currentPatient?.name ? currentPatient.name.split(' ')[0] : 'Maya';
  const hasFamily = Boolean(favoritePerson && favoritePerson.name);

  // Extract explicit onboarding favorites
  const onboardingFavs = currentPatient?.preferences?.onboarding?.favorites;
  const directFood = onboardingFavs?.food?.trim();
  const directPlace = onboardingFavs?.place?.trim();
  const directMusic = onboardingFavs?.music?.trim();
  const directThemeOption = onboardingFavs?.themePreference?.subOption?.trim();
  const directComfort = (currentPatient?.preferences?.onboarding?.emotional?.calming || '').trim();

  // Resolve visuals according to user requirements:
  // 1. If family member exists -> show family member with golden medallion + heart badge and family atmosphere!
  // 2. If NO family member -> show elder's favorite thing (Mango, Tea, Biryani, Banana, etc.) with real photographic background!
  let visuals: ThemeVisuals;

  if (hasFamily) {
    const famName = favoritePerson!.callsBy || favoritePerson!.name;
    const hasPhoto = Boolean(favoritePerson!.photoUrl);
    visuals = {
      isFamily: true,
      backgroundImage: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1600&q=80',
      mascotImage: hasPhoto ? undefined : '/themes/mascot_family.jpg',
      photoUrl: favoritePerson!.photoUrl,
      badgeEmoji: '❤️',
      headline: `Well done, ${elderName}!`,
      cardTag: `❤️ From Your Beloved ${famName} ❤️`,
      quote: `"${favoritePerson!.name} is cheering for you: 'I am so proud of you, ${elderName}! Let's keep going!'"`,
      themeColor: '#EA580C',
      praiseText: lang === 'as'
        ? `বৰ ভাল কাম ${elderName}! খেলখন সম্পূৰ্ণ কৰিলা!`
        : `Well done ${elderName}! ${favoritePerson!.name} is so proud of you for completing this!`,
    };
  } else {
    const rawFavorite = directFood || directThemeOption || (themeAsset && themeAsset.id !== 'default' ? themeAsset.label : '') || directPlace || directMusic || directComfort || 'Mango';
    const lower = rawFavorite.toLowerCase();

    if (lower.includes('mango')) {
      visuals = {
        isFamily: false,
        backgroundImage: '/themes/bg_mango.jpg',
        mascotImage: '/themes/mascot_mango.jpg',
        badgeEmoji: '🥭',
        headline: `Well done, ${elderName}!`,
        cardTag: '🥭 From Your Favourite Mango 🥭',
        quote: `"Sweet work, ${elderName}! You're doing amazing! Let's keep going!"`,
        themeColor: '#F59E0B',
        praiseText: lang === 'as'
          ? `বৰ ভাল কাম ${elderName}! খেলখন সম্পূৰ্ণ কৰিলা! আমৰ দৰেই মিঠা কাম!`
          : `Well done ${elderName}! Sweet work, just like your favourite mango!`,
      };
    } else if (lower.includes('tea') || lower.includes('chai')) {
      visuals = {
        isFamily: false,
        backgroundImage: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=1600&q=80',
        mascotImage: '/themes/mascot_tea.jpg',
        badgeEmoji: '🍵',
        headline: `Well done, ${elderName}!`,
        cardTag: '🍵 From Your Favourite Assam Tea 🍵',
        quote: `"As refreshing as a hot cup of tea! Splendid job, ${elderName}! Let's keep going!"`,
        themeColor: '#16A34A',
        praiseText: lang === 'as'
          ? `বৰ ভাল কাম ${elderName}! চাহৰ দৰেই সতেজ অনুভৱ!`
          : `Well done ${elderName}! Refreshing victory, just like a warm cup of Assam tea!`,
      };
    } else if (lower.includes('biryani') || lower.includes('pulao') || lower.includes('curry') || lower.includes('rice')) {
      visuals = {
        isFamily: false,
        backgroundImage: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=1600&q=80',
        mascotImage: '/themes/mascot_biryani.jpg',
        badgeEmoji: '🍗',
        headline: `Well done, ${elderName}!`,
        cardTag: '🍗 From Your Favourite Biryani 🍗',
        quote: `"Full of flavor and joy! Fantastic work, ${elderName}! Let's keep going!"`,
        themeColor: '#EA580C',
        praiseText: lang === 'as'
          ? `বৰ ভাল কাম ${elderName}! খেলখন সম্পূৰ্ণ কৰিলা!`
          : `Well done ${elderName}! Delicious achievement, full of celebration!`,
      };
    } else if (lower.includes('banana')) {
      visuals = {
        isFamily: false,
        backgroundImage: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=1600&q=80',
        mascotImage: '/themes/mascot_banana.jpg',
        badgeEmoji: '🍌',
        headline: `Well done, ${elderName}!`,
        cardTag: '🍌 From Your Favourite Banana 🍌',
        quote: `"Sunny and sweet achievement! Keep up the brilliant spirit, ${elderName}!"`,
        themeColor: '#EAB308',
        praiseText: lang === 'as'
          ? `বৰ ভাল কাম ${elderName}! কলাৰ দৰেই মিঠা!`
          : `Well done ${elderName}! Sunny and sweet work!`,
      };
    } else if (lower.includes('flower') || lower.includes('garden')) {
      visuals = {
        isFamily: false,
        backgroundImage: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=1600&q=80',
        badgeEmoji: '🌸',
        headline: `Well done, ${elderName}!`,
        cardTag: '🌸 From Your Favourite Flower Garden 🌸',
        quote: `"Blooming with success! Wonderful effort, ${elderName}! Let's keep going!"`,
        themeColor: '#E11D48',
        praiseText: lang === 'as'
          ? `বৰ ভাল কাম ${elderName}! ফুলৰ বাগিচাৰ দৰেই সুন্দৰ!`
          : `Well done ${elderName}! Blooming with success!`,
      };
    } else if (lower.includes('river') || lower.includes('water')) {
      visuals = {
        isFamily: false,
        backgroundImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
        badgeEmoji: '🌊',
        headline: `Well done, ${elderName}!`,
        cardTag: '🌊 From Your Favourite Brahmaputra River 🌊',
        quote: `"Flowing with calm brilliance! Great victory, ${elderName}!"`,
        themeColor: '#0891B2',
        praiseText: `Well done ${elderName}! Flowing with calm brilliance!`,
      };
    } else {
      const asset = themeAsset && themeAsset.id !== 'default' ? themeAsset : null;
      const label = asset ? asset.label : rawFavorite;
      const emoji = asset ? asset.emoji : '🌸';
      const bg = (asset && asset.imageUrl) ? asset.imageUrl : '/themes/bg_mango.jpg';
      const color = asset ? asset.primaryColor : '#F59E0B';

      visuals = {
        isFamily: false,
        backgroundImage: bg,
        badgeEmoji: emoji,
        headline: `Well done, ${elderName}!`,
        cardTag: `${emoji} From Your Favourite ${label} ${emoji}`,
        quote: `"From your favourite ${label}: Fantastic job, ${elderName}! You're shining today!"`,
        themeColor: color,
        praiseText: `Well done ${elderName}! You completed your game! Enjoy your favorite ${label}!`,
      };
    }
  }

  // Speak celebratory reward in the loved one's companion voice on completion
  useEffect(() => {
    try {
      const audioPrompt = playPersonalizedPrompt({
        patient: currentPatient,
        trigger: 'reward',
        fallbackText: visuals.praiseText,
        lang,
      });

      return () => {
        try {
          audioPrompt?.stop();
        } catch {
          /* ignore */
        }
      };
    } catch (err) {
      console.error('[GameResultScreen] Error playing praise audio:', err);
    }
  }, [currentPatient, visuals.praiseText, lang]);

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        padding: '10px 14px 20px',
        backgroundColor: '#F5E6C8',
        backgroundImage: `url(${visuals.backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Dark overlay to make card readable */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.32) 100%)',
        pointerEvents: 'none',
      }} />

      {/* Floating Card */}
      <div style={{
        maxWidth: 360,
        width: '100%',
        margin: '0 auto',
        textAlign: 'center',
        background: 'rgba(255, 253, 247, 0.97)',
        borderRadius: 26,
        padding: '18px 16px 16px',
        boxShadow: '0 16px 44px rgba(0, 0, 0, 0.28)',
        border: '1px solid rgba(255, 255, 255, 0.8)',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Top Mascot / Avatar Badge */}
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: 4 }}>
          {improved && (
            <div className="confetti-burst">
              {['🎉', '⭐', '🎊', '✨', '🌟', '🎈'].map((e, i) => (
                <span key={i} className="confetti-piece" style={{ ['--i' as string]: i }}>{e}</span>
              ))}
            </div>
          )}

          {/* Medallion Display */}
          {visuals.photoUrl ? (
            /* Family custom photo */
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <div style={{
                width: 88,
                height: 88,
                borderRadius: '50%',
                margin: '0 auto',
                background: 'radial-gradient(circle at 35% 30%, #FEF08A 0%, #FDE047 50%, #EAB308 100%)',
                border: '4px solid #F59E0B',
                boxShadow: '0 8px 24px rgba(245, 158, 11, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}>
                <img
                  src={visuals.photoUrl}
                  alt={visuals.headline}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                background: '#EF4444',
                color: 'white',
                borderRadius: '50%',
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2.5px solid #FFFFFF',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
              }}>
                <Heart size={14} fill="white" />
              </div>
            </div>
          ) : visuals.mascotImage ? (
            /* 3D Mascot Medallion */
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <img
                src={visuals.mascotImage}
                alt={visuals.cardTag}
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  filter: 'drop-shadow(0 8px 18px rgba(217, 119, 6, 0.35))',
                }}
              />
            </div>
          ) : (
            /* Emoji Medallion */
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <div style={{
                width: 88,
                height: 88,
                borderRadius: '50%',
                margin: '0 auto',
                background: 'radial-gradient(circle at 35% 30%, #FEF08A 0%, #FDE047 50%, #EAB308 100%)',
                border: '4px solid #F59E0B',
                boxShadow: '0 8px 24px rgba(245, 158, 11, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <span style={{ fontSize: 44, lineHeight: 1, filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.15))' }}>
                  {visuals.badgeEmoji}
                </span>
              </div>
              <div style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                background: '#EF4444',
                color: 'white',
                borderRadius: '50%',
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2.5px solid #FFFFFF',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
              }}>
                <Heart size={14} fill="white" />
              </div>
            </div>
          )}
        </div>

        {/* Headline */}
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1E293B', margin: '4px 0 4px' }}>
          {visuals.headline}
        </h2>

        {/* Green pill tag */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          background: '#DCFCE7',
          color: '#15803D',
          padding: '3px 12px',
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 700,
          marginBottom: 10,
        }}>
          <Trophy size={13} /> Completed Successfully!
        </div>

        {/* Personalized Encouragement Quote Card */}
        <div style={{
          background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
          border: '1.5px solid #FCD34D',
          borderRadius: 14,
          padding: '8px 12px',
          marginBottom: 10,
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: 12,
            fontWeight: 800,
            color: '#92400E',
            marginBottom: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
          }}>
            {visuals.cardTag}
          </div>
          <p style={{
            margin: 0,
            fontSize: 12.5,
            color: '#78350F',
            fontWeight: 600,
            fontStyle: 'italic',
            lineHeight: 1.4,
          }}>
            {visuals.quote}
          </p>
        </div>

        {/* Stats Card */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 16,
          marginBottom: 12,
          padding: '10px 12px',
          border: '1.5px solid #E2E8F0',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 8 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#0284C7' }}>{result.accuracy}%</div>
              <div style={{ fontSize: 9, color: '#64748B', fontWeight: 700, letterSpacing: '0.04em' }}>ACCURACY</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#D97706' }}>{result.mistakes}</div>
              <div style={{ fontSize: 9, color: '#64748B', fontWeight: 700, letterSpacing: '0.04em' }}>MISTAKES</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#16A34A' }}>
                {Math.round(result.responseTime)}s
              </div>
              <div style={{ fontSize: 9, color: '#64748B', fontWeight: 700, letterSpacing: '0.04em' }}>TIME</div>
            </div>
          </div>

          <div style={{
            background: '#F8FAFC',
            borderRadius: 12,
            padding: '8px 10px',
            fontSize: 11.5,
            color: '#475569',
            lineHeight: 1.4,
            textAlign: 'left',
            border: '1px solid #EEF2F6',
          }}>
            <div style={{ fontWeight: 700, marginBottom: 3, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 5 }}>
              🤖 AI Adjustment
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5 }}>
              <span>✅</span>
              <span>{difficultyReason}</span>
            </div>
          </div>
        </div>

        {/* Buttons matching screenshot */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={primaryAction.onClick}
            style={{
              height: 46,
              fontSize: 17,
              borderRadius: 24,
              fontWeight: 800,
              color: '#FFFFFF',
              background: visuals.themeColor,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: `0 8px 20px ${visuals.themeColor}55`,
              transition: 'transform 0.15s ease',
            }}
          >
            {primaryAction.label}
          </button>
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              style={{
                height: 40,
                fontSize: 15,
                borderRadius: 24,
                fontWeight: 700,
                background: 'transparent',
                border: `2px solid ${visuals.themeColor}`,
                color: visuals.themeColor,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
