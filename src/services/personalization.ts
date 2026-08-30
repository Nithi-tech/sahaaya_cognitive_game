import type { PatientProfile, OnboardingPerson } from '../types';

export interface FoodTheme {
  name: string;
  emoji: string;
  category: string;
  bgGradient: string;
  tagline: string;
  accentColor: string;
}

export interface PlaceTheme {
  name: string;
  emoji: string;
  bgGradient: string;
  ambientSoundName: string;
}

export interface PersonalizationData {
  primaryColor: string;
  headerGradient: string;
  cardBorderColor: string;
  food?: FoodTheme;
  place?: PlaceTheme;
  music?: string;
  favoritePerson?: OnboardingPerson;
  calmingPhrase?: string;
  comfortObject?: string;
}

/** Analyzes a food string and produces matching sensory theme data */
export function resolveFoodTheme(foodName?: string): FoodTheme | undefined {
  if (!foodName || !foodName.trim()) return undefined;
  const lower = foodName.toLowerCase().trim();

  if (lower.includes('biryani') || lower.includes('briyani') || lower.includes('pulao')) {
    return {
      name: foodName,
      emoji: '🍗',
      category: 'Fragrant Rice Special',
      bgGradient: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 50%, #FED7AA 100%)',
      tagline: 'Rich spices, saffron aromas, and warmth cooked with love.',
      accentColor: '#EA580C',
    };
  }
  if (lower.includes('tea') || lower.includes('chai') || lower.includes('kahwa')) {
    return {
      name: foodName,
      emoji: '🍵',
      category: 'Comfort Morning Brew',
      bgGradient: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 50%, #BBF7D0 100%)',
      tagline: 'Fresh morning aroma from the gardens of Assam.',
      accentColor: '#16A34A',
    };
  }
  if (lower.includes('fish') || lower.includes('tenga') || lower.includes('curry')) {
    return {
      name: foodName,
      emoji: '🐟',
      category: 'Traditional Curry',
      bgGradient: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 50%, #FCD34D 100%)',
      tagline: 'Delicate home-cooked flavors and comforting warmth.',
      accentColor: '#D97706',
    };
  }
  if (lower.includes('dosa') || lower.includes('idli') || lower.includes('roti') || lower.includes('paratha')) {
    return {
      name: foodName,
      emoji: '🥞',
      category: 'Golden Fresh Bread',
      bgGradient: 'linear-gradient(135deg, #FEFCE8 0%, #FEF08A 50%, #FDE047 100%)',
      tagline: 'Crisp, wholesome, and served piping hot.',
      accentColor: '#CA8A04',
    };
  }
  if (lower.includes('kheer') || lower.includes('pitha') || lower.includes('sweet') || lower.includes('halwa')) {
    return {
      name: foodName,
      emoji: '🍯',
      category: 'Festive Sweet Delight',
      bgGradient: 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 50%, #FBCFE8 100%)',
      tagline: 'Sweet childhood memories and festive family joys.',
      accentColor: '#DB2777',
    };
  }

  // Universal custom food representation
  return {
    name: foodName,
    emoji: '🍲',
    category: 'Your Special Favorite',
    bgGradient: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 50%, #FDE68A 100%)',
    tagline: `Prepared fresh today — your personal comfort food ${foodName}.`,
    accentColor: '#D97706',
  };
}

/** Resolves scenic place ambiance */
export function resolvePlaceTheme(placeName?: string): PlaceTheme | undefined {
  if (!placeName || !placeName.trim()) return undefined;
  const lower = placeName.toLowerCase().trim();

  if (lower.includes('garden') || lower.includes('park') || lower.includes('tree')) {
    return {
      name: placeName,
      emoji: '🌿',
      bgGradient: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
      ambientSoundName: 'Gentle Birds & Breeze',
    };
  }
  if (lower.includes('temple') || lower.includes('mandir') || lower.includes('namghar')) {
    return {
      name: placeName,
      emoji: '🛕',
      bgGradient: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
      ambientSoundName: 'Temple Bells & Peace',
    };
  }
  if (lower.includes('river') || lower.includes('brahmaputra') || lower.includes('lake') || lower.includes('pond')) {
    return {
      name: placeName,
      emoji: '🌊',
      bgGradient: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
      ambientSoundName: 'Flowing Water Waves',
    };
  }
  if (lower.includes('hill') || lower.includes('kaziranga') || lower.includes('mountain') || lower.includes('forest')) {
    return {
      name: placeName,
      emoji: '⛰️',
      bgGradient: 'linear-gradient(135deg, #F0FDF4 0%, #E2E8F0 100%)',
      ambientSoundName: 'Mountain Forest Wind',
    };
  }

  return {
    name: placeName,
    emoji: '🏡',
    bgGradient: 'linear-gradient(135deg, #F8FAFC 0%, #EEF2F6 100%)',
    ambientSoundName: 'Home Peace & Warmth',
  };
}

/** Resolves the chosen color into a usable primary color and gradient */
export function resolveColorTheme(colorInput?: string): { primaryColor: string; headerGradient: string } {
  if (!colorInput || !colorInput.trim()) {
    return {
      primaryColor: '#2E7D8B',
      headerGradient: 'linear-gradient(135deg, #1565C0 0%, #2E7D8B 100%)',
    };
  }

  const raw = colorInput.trim();
  // If valid hex or rgb
  if (raw.startsWith('#') || raw.startsWith('rgb')) {
    return {
      primaryColor: raw,
      headerGradient: `linear-gradient(135deg, ${raw} 0%, #1565C0 100%)`,
    };
  }

  // Named colors
  const map: Record<string, { primary: string; grad: string }> = {
    blue: { primary: '#0284C7', grad: 'linear-gradient(135deg, #0369A1 0%, #0284C7 100%)' },
    green: { primary: '#16A34A', grad: 'linear-gradient(135deg, #15803D 0%, #16A34A 100%)' },
    orange: { primary: '#EA580C', grad: 'linear-gradient(135deg, #C2410C 0%, #EA580C 100%)' },
    red: { primary: '#E11D48', grad: 'linear-gradient(135deg, #BE123C 0%, #E11D48 100%)' },
    pink: { primary: '#DB2777', grad: 'linear-gradient(135deg, #BE185D 0%, #DB2777 100%)' },
    purple: { primary: '#9333EA', grad: 'linear-gradient(135deg, #7E22CE 0%, #9333EA 100%)' },
    violet: { primary: '#7C3AED', grad: 'linear-gradient(135deg, #6D28D9 0%, #7C3AED 100%)' },
    yellow: { primary: '#CA8A04', grad: 'linear-gradient(135deg, #A16207 0%, #CA8A04 100%)' },
    teal: { primary: '#0D9488', grad: 'linear-gradient(135deg, #0F766E 0%, #0D9488 100%)' },
    gold: { primary: '#D97706', grad: 'linear-gradient(135deg, #B45309 0%, #D97706 100%)' },
  };

  const key = raw.toLowerCase();
  for (const [name, theme] of Object.entries(map)) {
    if (key.includes(name)) {
      return { primaryColor: theme.primary, headerGradient: theme.grad };
    }
  }

  return {
    primaryColor: '#2E7D8B',
    headerGradient: 'linear-gradient(135deg, #1565C0 0%, #2E7D8B 100%)',
  };
}

/** Extracts all personalized features from the current patient profile */
export function getPersonalization(patient: PatientProfile | null): PersonalizationData {
  const onboarding = patient?.preferences?.onboarding;
  const favorites = onboarding?.favorites;
  const people = onboarding?.people?.people ?? [];
  const emotional = onboarding?.emotional;

  const { primaryColor, headerGradient } = resolveColorTheme(favorites?.colour);

  // Find preferred voice persona:
  // 1. Person marked as askedForOften
  // 2. Or person who has audioClips (greeting, reminder, reward) or greetingAudioUrl
  // 3. Or first family member
  const favoritePerson =
    people.find((p) => p.askedForOften && p.name) ??
    people.find((p) => (p.audioClips?.greeting || p.audioClips?.reminder || p.audioClips?.reward || p.greetingAudioUrl) && p.name) ??
    people.find((p) => p.greetingAudioUrl && p.name) ??
    people.find((p) => p.name);

  return {
    primaryColor,
    headerGradient,
    cardBorderColor: `${primaryColor}33`,
    food: resolveFoodTheme(favorites?.food),
    place: resolvePlaceTheme(favorites?.place),
    music: favorites?.music,
    favoritePerson,
    calmingPhrase: emotional?.phrases?.[0] || emotional?.calming,
    comfortObject: emotional?.calming,
  };
}

/** Calculates estimated vocal pitch for speech synthesis based on family member relationship */
export function getPersonaPitch(person?: OnboardingPerson): number {
  if (!person) return 1.0;
  const rel = (person.relationship || '').toLowerCase();
  if (rel.includes('son') || rel.includes('brother') || rel.includes('husband') || rel.includes('father') || rel.includes('nephew')) {
    return 0.82; // deeper male voice
  }
  if (rel.includes('granddaughter') || rel.includes('grandson') || rel.includes('child')) {
    return 1.32; // youthful, cheerful tone
  }
  if (rel.includes('daughter') || rel.includes('sister') || rel.includes('wife') || rel.includes('mother') || rel.includes('niece')) {
    return 1.15; // gentle, warm female voice
  }
  return 1.0;
}
