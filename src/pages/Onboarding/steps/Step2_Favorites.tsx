import { useState } from 'react';
import type { OnboardingFavoritesSection, ThemeCategory } from '../../../types';
import {
  CATEGORY_METADATA,
  getThemeAsset,
  getThemesByCategory,
} from '../../../services/themeRegistry';

interface Props {
  saved: OnboardingFavoritesSection | null;
  onSave: (data: OnboardingFavoritesSection) => void;
  onSkip: () => void;
  saving: boolean;
}

export default function Step2_Favorites({ saved, onSave, onSkip, saving }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<ThemeCategory>(
    saved?.themePreference?.category ?? 'food',
  );
  const [selectedThemeId, setSelectedThemeId] = useState<string>(
    saved?.themePreference?.themeAssetId ?? 'food_biryani',
  );

  const activeTheme = getThemeAsset(selectedThemeId);

  const handleSelectTheme = (themeId: string) => {
    setSelectedThemeId(themeId);
  };

  const handleCategoryChange = (category: ThemeCategory) => {
    setSelectedCategory(category);
    const themes = getThemesByCategory(category);
    if (themes.length > 0 && !themes.some(t => t.id === selectedThemeId)) {
      setSelectedThemeId(themes[0].id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const theme = getThemeAsset(selectedThemeId);
    const data: OnboardingFavoritesSection = {
      ...saved,
      food: ['food', 'fruit', 'vegetable'].includes(theme.category) ? theme.label : (saved?.food || ''),
      colour: theme.primaryColor,
      music: theme.category === 'hobby' ? theme.label : (saved?.music || ''),
      place: theme.category === 'nature' ? theme.label : (saved?.place || ''),
      themePreference: {
        category: theme.category,
        subOption: theme.label,
        themeAssetId: theme.id,
      },
    };
    onSave(data);
  };

  const themesForCategory = getThemesByCategory(selectedCategory);

  return (
    <form onSubmit={handleSubmit} style={{ padding: '28px' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🎨</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>
          Personalised Theme &amp; Favourites
        </h2>
        <p style={{ color: '#666', fontSize: 14, marginTop: 6, lineHeight: 1.5 }}>
          Select what brings your elder the most joy. This customizes their app theme, colors, and comforting background prompts.
        </p>
      </div>

      {/* Category Tabs */}
      <div style={{ marginBottom: 18 }}>
        <label style={{ display: 'block', fontWeight: 700, fontSize: 13, color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          1. Choose A Favorite Theme Category
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {(Object.keys(CATEGORY_METADATA) as ThemeCategory[]).map((cat) => {
            const meta = CATEGORY_METADATA[cat];
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategoryChange(cat)}
                style={{
                  padding: '12px 14px',
                  borderRadius: 14,
                  border: `2px solid ${isSelected ? 'var(--color-primary)' : '#E2E8F0'}`,
                  background: isSelected ? 'rgba(46,125,139,0.08)' : 'white',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ fontSize: 22 }}>{meta.emoji}</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: isSelected ? 'var(--color-primary)' : '#1E293B' }}>
                    {meta.label}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-option Selection Chips with Image Thumbnails */}
      <div style={{ marginBottom: 22 }}>
        <label style={{ display: 'block', fontWeight: 700, fontSize: 13, color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          2. Select The Elder's Specific Favourite
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
          {themesForCategory.map((theme) => {
            const isSelected = selectedThemeId === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => handleSelectTheme(theme.id)}
                style={{
                  padding: '8px 10px',
                  borderRadius: 14,
                  border: `2px solid ${isSelected ? theme.primaryColor : '#E2E8F0'}`,
                  background: isSelected ? theme.cardGradient : 'white',
                  cursor: 'pointer',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.18s ease',
                  boxShadow: isSelected ? `0 6px 16px ${theme.primaryColor}33` : '0 2px 6px rgba(0,0,0,0.03)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Mini background image preview */}
                <div style={{
                  width: '100%',
                  height: 52,
                  borderRadius: 10,
                  backgroundImage: `url(${theme.imageUrl})`,
                  backgroundPosition: 'center',
                  backgroundSize: 'cover',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(0,0,0,0.25)', borderRadius: 10,
                  }} />
                  <span style={{ fontSize: 24, position: 'relative', zIndex: 1, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }}>
                    {theme.emoji}
                  </span>
                </div>
                <span style={{
                  fontSize: 13,
                  fontWeight: isSelected ? 800 : 600,
                  color: isSelected ? theme.accentColor : '#334155',
                }}>
                  {theme.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Preview of the Theme with Full Background Image */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontWeight: 700, fontSize: 12, color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Live Elder App Theme Preview
        </label>
        <div style={{
          position: 'relative',
          borderRadius: 20,
          overflow: 'hidden',
          minHeight: 150,
          border: `2px solid ${activeTheme.borderColor}`,
          boxShadow: '0 10px 26px rgba(0,0,0,0.08)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          {/* Background Image with Cover */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${activeTheme.imageUrl})`,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            filter: 'brightness(0.9)',
          }} />

          {/* Semi-transparent dark/glass gradient overlay for accessibility */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(15,23,42,0.92) 0%, rgba(15,23,42,0.65) 55%, rgba(15,23,42,0.3) 100%)',
          }} />

          {/* Content */}
          <div style={{ position: 'relative', zIndex: 1, padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 54, height: 54, borderRadius: 16,
                background: 'rgba(255,255,255,0.92)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 30, boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                flexShrink: 0,
              }}>
                {activeTheme.emoji}
              </div>
              <div style={{ flex: 1, color: 'white' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center',
                  background: `${activeTheme.primaryColor}E6`,
                  padding: '2px 8px', borderRadius: 99,
                  fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
                  letterSpacing: 0.8, color: 'white', marginBottom: 4,
                }}>
                  {CATEGORY_METADATA[activeTheme.category].label} · {activeTheme.label}
                </div>
                <div style={{ fontSize: 18, fontWeight: 900, color: 'white', textShadow: '0 2px 6px rgba(0,0,0,0.5)' }}>
                  {activeTheme.tagline}
                </div>
                <div style={{ fontSize: 12, color: '#E2E8F0', marginTop: 3, textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                  ✨ {activeTheme.ambientNote}
                </div>
              </div>
            </div>
          </div>

          <div style={{
            position: 'relative', zIndex: 1,
            padding: '10px 20px',
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            borderTop: '1px solid rgba(255,255,255,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#F1F5F9' }}>
              Primary Accent: <span style={{ color: activeTheme.primaryColor }}>{activeTheme.primaryColor}</span>
            </span>
            <span style={{
              fontSize: 11, fontWeight: 800, background: activeTheme.primaryColor,
              color: 'white', padding: '3px 10px', borderRadius: 99,
            }}>
              Active on Elder Dashboard
            </span>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          type="submit"
          disabled={saving}
          style={{
            flex: 1, padding: '14px', borderRadius: 12, border: 'none',
            background: saving ? '#B0BEC5' : `linear-gradient(135deg, ${activeTheme.primaryColor} 0%, #1565C0 100%)`,
            color: 'white', fontSize: 15, fontWeight: 800, cursor: saving ? 'default' : 'pointer',
            boxShadow: `0 4px 14px ${activeTheme.primaryColor}44`,
          }}
        >
          {saving ? 'Saving…' : 'Save Theme & Continue →'}
        </button>
        <button
          type="button"
          onClick={onSkip}
          disabled={saving}
          style={{
            padding: '14px 20px', borderRadius: 12, border: '2px solid #E0E0E0',
            background: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#888',
          }}
        >
          Skip
        </button>
      </div>
    </form>
  );
}
