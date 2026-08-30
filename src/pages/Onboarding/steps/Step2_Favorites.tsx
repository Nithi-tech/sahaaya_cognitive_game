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

      {/* Sub-option Selection Chips */}
      <div style={{ marginBottom: 22 }}>
        <label style={{ display: 'block', fontWeight: 700, fontSize: 13, color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          2. Select The Elder's Specific Favourite
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
          {themesForCategory.map((theme) => {
            const isSelected = selectedThemeId === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => handleSelectTheme(theme.id)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 12,
                  border: `2px solid ${isSelected ? theme.primaryColor : '#E2E8F0'}`,
                  background: isSelected ? theme.cardGradient : 'white',
                  cursor: 'pointer',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? `0 4px 12px ${theme.primaryColor}22` : 'none',
                }}
              >
                <span style={{ fontSize: 24 }}>{theme.emoji}</span>
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

      {/* Live Preview of the Theme */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontWeight: 700, fontSize: 12, color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Live Elder App Theme Preview
        </label>
        <div style={{
          background: activeTheme.cardGradient,
          border: `2px solid ${activeTheme.borderColor}`,
          borderRadius: 18,
          padding: '18px 20px',
          boxShadow: '0 8px 20px rgba(0,0,0,0.04)',
          position: 'relative',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 30, boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            }}>
              {activeTheme.emoji}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
                letterSpacing: 1, color: activeTheme.accentColor,
              }}>
                {CATEGORY_METADATA[activeTheme.category].label} · {activeTheme.label}
              </div>
              <div style={{ fontSize: 17, fontWeight: 900, color: '#1E293B', marginTop: 1 }}>
                {activeTheme.tagline}
              </div>
              <div style={{ fontSize: 12, color: '#475569', marginTop: 3 }}>
                ✨ {activeTheme.ambientNote}
              </div>
            </div>
          </div>

          <div style={{
            marginTop: 12, paddingTop: 10, borderTop: `1px solid ${activeTheme.borderColor}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: activeTheme.accentColor }}>
              Primary Accent: {activeTheme.primaryColor}
            </span>
            <span style={{
              fontSize: 11, fontWeight: 800, background: activeTheme.primaryColor,
              color: 'white', padding: '3px 10px', borderRadius: 99,
            }}>
              Active on Elder UI
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
