import type { ThemeCategory, ThemePreference } from '../types';

export interface ThemeAsset {
  id: string;
  category: ThemeCategory;
  label: string;
  emoji: string;
  imageUrl?: string;
  primaryColor: string;
  headerGradient: string;
  cardGradient: string;
  borderColor: string;
  accentColor: string;
  tagline: string;
  ambientNote: string;
}

export const CATEGORY_METADATA: Record<ThemeCategory, { label: string; emoji: string; description: string }> = {
  food: {
    label: 'Comfort Food',
    emoji: '🍲',
    description: 'Favorite culinary flavors, fragrant aromas, and home recipes.',
  },
  festival: {
    label: 'Festivals & Culture',
    emoji: '🪔',
    description: 'Cherished celebrations, music, and traditional memories.',
  },
  nature: {
    label: 'Nature & Scenery',
    emoji: '🌿',
    description: 'Peaceful natural landscapes, flowers, rivers, and wildlife.',
  },
  hobby: {
    label: 'Hobbies & Passions',
    emoji: '🎨',
    description: 'Lifelong interests, crafts, sports, and creative joyful activities.',
  },
  fruit: {
    label: 'Favourite Fruits',
    emoji: '🍎',
    description: 'Sweet, juicy fruits that bring back happy memories.',
  },
  vegetable: {
    label: 'Favourite Vegetables',
    emoji: '🥦',
    description: 'Home-grown vegetables and garden-fresh flavours.',
  },
};

export const THEME_REGISTRY: Record<string, ThemeAsset> = {
  // --- FOOD ---
  'food_biryani': {
    id: 'food_biryani',
    category: 'food',
    label: 'Biryani',
    emoji: '🍗',
    imageUrl: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=1200&q=80',
    primaryColor: '#EA580C',
    headerGradient: 'linear-gradient(135deg, rgba(194, 65, 12, 0.88) 0%, rgba(234, 88, 12, 0.92) 100%)',
    cardGradient: 'linear-gradient(135deg, rgba(255, 247, 237, 0.96) 0%, rgba(254, 215, 170, 0.92) 100%)',
    borderColor: '#FDBA74',
    accentColor: '#C2410C',
    tagline: 'Fragrant saffron spices & rich culinary celebrations',
    ambientNote: 'Warm slow-cooked rice aroma and festive family joy',
  },
  'food_payesh': {
    id: 'food_payesh',
    category: 'food',
    label: 'Payesh / Kheer',
    emoji: '🍯',
    imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=1200&q=80',
    primaryColor: '#DB2777',
    headerGradient: 'linear-gradient(135deg, rgba(190, 24, 93, 0.88) 0%, rgba(219, 39, 119, 0.92) 100%)',
    cardGradient: 'linear-gradient(135deg, rgba(253, 242, 248, 0.96) 0%, rgba(251, 207, 232, 0.92) 100%)',
    borderColor: '#F9A8D4',
    accentColor: '#9D174D',
    tagline: 'Sweet milk rice, cardamom warmth & festive blessings',
    ambientNote: 'Comforting sweetness of childhood traditions',
  },
  'food_idli': {
    id: 'food_idli',
    category: 'food',
    label: 'Idli & Dosa',
    emoji: '🥞',
    imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=1200&q=80',
    primaryColor: '#CA8A04',
    headerGradient: 'linear-gradient(135deg, rgba(161, 98, 7, 0.88) 0%, rgba(202, 138, 4, 0.92) 100%)',
    cardGradient: 'linear-gradient(135deg, rgba(254, 252, 232, 0.96) 0%, rgba(253, 224, 71, 0.92) 100%)',
    borderColor: '#FACC15',
    accentColor: '#854D0E',
    tagline: 'Golden griddle crispness, coconut chutney & fresh warmth',
    ambientNote: 'Piping hot breakfast moments with family',
  },
  'food_momos': {
    id: 'food_momos',
    category: 'food',
    label: 'Momos',
    emoji: '🥟',
    imageUrl: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1200&q=80',
    primaryColor: '#0D9488',
    headerGradient: 'linear-gradient(135deg, rgba(15, 118, 110, 0.88) 0%, rgba(13, 148, 136, 0.92) 100%)',
    cardGradient: 'linear-gradient(135deg, rgba(240, 253, 250, 0.96) 0%, rgba(153, 246, 228, 0.92) 100%)',
    borderColor: '#5EEAD4',
    accentColor: '#115E59',
    tagline: 'Steaming Himalayan dumplings & fiery spicy chutney',
    ambientNote: 'Cozy mountain warmth and sharing with friends',
  },
  'food_pitha': {
    id: 'food_pitha',
    category: 'food',
    label: 'Assam Pitha',
    emoji: '🥮',
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1200&q=80',
    primaryColor: '#D97706',
    headerGradient: 'linear-gradient(135deg, rgba(180, 83, 9, 0.88) 0%, rgba(217, 119, 6, 0.92) 100%)',
    cardGradient: 'linear-gradient(135deg, rgba(255, 251, 235, 0.96) 0%, rgba(253, 230, 138, 0.92) 100%)',
    borderColor: '#FCD34D',
    accentColor: '#92400E',
    tagline: 'Traditional sesame, coconut & jaggery rice rolls',
    ambientNote: 'Bihu harvest festival sweetness and heritage',
  },
  'food_assam_tea': {
    id: 'food_assam_tea',
    category: 'food',
    label: 'Assam Tea',
    emoji: '🍵',
    imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=1200&q=80',
    primaryColor: '#16A34A',
    headerGradient: 'linear-gradient(135deg, rgba(21, 128, 61, 0.88) 0%, rgba(22, 163, 74, 0.92) 100%)',
    cardGradient: 'linear-gradient(135deg, rgba(240, 253, 244, 0.96) 0%, rgba(187, 247, 208, 0.92) 100%)',
    borderColor: '#86EFAC',
    accentColor: '#166534',
    tagline: 'Rich morning brew from the lush tea gardens of Assam',
    ambientNote: 'Fresh morning breeze and soothing cup of chai',
  },

  // --- FESTIVALS ---
  'festival_bihu': {
    id: 'festival_bihu',
    category: 'festival',
    label: 'Rongali Bihu',
    emoji: '🪘',
    imageUrl: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1200&q=80',
    primaryColor: '#DC2626',
    headerGradient: 'linear-gradient(135deg, rgba(153, 27, 27, 0.88) 0%, rgba(220, 38, 38, 0.92) 100%)',
    cardGradient: 'linear-gradient(135deg, rgba(254, 242, 242, 0.96) 0%, rgba(254, 202, 202, 0.92) 100%)',
    borderColor: '#FCA5A5',
    accentColor: '#7F1D1D',
    tagline: 'Springtime dance, Dhol beats & woven red Gamusa traditions',
    ambientNote: 'Rhythm of the dhol and joyful Assamese folk song',
  },
  'festival_durga_puja': {
    id: 'festival_durga_puja',
    category: 'festival',
    label: 'Durga Puja',
    emoji: '🪔',
    imageUrl: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=1200&q=80',
    primaryColor: '#BE123C',
    headerGradient: 'linear-gradient(135deg, rgba(159, 18, 57, 0.88) 0%, rgba(190, 18, 60, 0.92) 100%)',
    cardGradient: 'linear-gradient(135deg, rgba(255, 241, 242, 0.96) 0%, rgba(254, 205, 211, 0.92) 100%)',
    borderColor: '#FDA4AF',
    accentColor: '#881337',
    tagline: 'Dhaak drums, sacred incense & grand autumn pandal celebrations',
    ambientNote: 'Vibrant evening lights and blessings with loved ones',
  },
  'festival_diwali': {
    id: 'festival_diwali',
    category: 'festival',
    label: 'Diwali',
    emoji: '✨',
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1200&q=80',
    primaryColor: '#B45309',
    headerGradient: 'linear-gradient(135deg, rgba(120, 53, 15, 0.88) 0%, rgba(180, 83, 9, 0.92) 100%)',
    cardGradient: 'linear-gradient(135deg, rgba(255, 251, 235, 0.96) 0%, rgba(253, 230, 138, 0.92) 100%)',
    borderColor: '#FCD34D',
    accentColor: '#78350F',
    tagline: 'Golden glowing diyas, rangoli designs & festival of lights',
    ambientNote: 'Bright clay oil lamps illuminating the peaceful night',
  },
  'festival_christmas': {
    id: 'festival_christmas',
    category: 'festival',
    label: 'Christmas',
    emoji: '🎄',
    imageUrl: 'https://images.unsplash.com/photo-1543258103-a62bdc069871?auto=format&fit=crop&w=1200&q=80',
    primaryColor: '#15803D',
    headerGradient: 'linear-gradient(135deg, rgba(20, 83, 45, 0.88) 0%, rgba(21, 128, 61, 0.92) 100%)',
    cardGradient: 'linear-gradient(135deg, rgba(240, 253, 244, 0.96) 0%, rgba(187, 247, 208, 0.92) 100%)',
    borderColor: '#86EFAC',
    accentColor: '#14532D',
    tagline: 'Festive evergreen pine, carols & warm family gatherings',
    ambientNote: 'Winter peace, joyful songs and holiday cake',
  },

  // --- NATURE ---
  'nature_flowers': {
    id: 'nature_flowers',
    category: 'nature',
    label: 'Flower Garden',
    emoji: '🌸',
    imageUrl: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=1200&q=80',
    primaryColor: '#E11D48',
    headerGradient: 'linear-gradient(135deg, rgba(190, 18, 60, 0.88) 0%, rgba(225, 29, 72, 0.92) 100%)',
    cardGradient: 'linear-gradient(135deg, rgba(255, 241, 242, 0.96) 0%, rgba(254, 205, 211, 0.92) 100%)',
    borderColor: '#FDA4AF',
    accentColor: '#9F1239',
    tagline: 'Blooming marigolds, roses, orchids & fragrant garden walks',
    ambientNote: 'Morning birdsong and delicate floral fragrance',
  },
  'nature_birds': {
    id: 'nature_birds',
    category: 'nature',
    label: 'Birds & Wildlife',
    emoji: '🦜',
    imageUrl: 'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=1200&q=80',
    primaryColor: '#0284C7',
    headerGradient: 'linear-gradient(135deg, rgba(3, 105, 161, 0.88) 0%, rgba(2, 132, 199, 0.92) 100%)',
    cardGradient: 'linear-gradient(135deg, rgba(240, 249, 255, 0.96) 0%, rgba(186, 230, 253, 0.92) 100%)',
    borderColor: '#7DD3FC',
    accentColor: '#075985',
    tagline: 'Graceful flight of hornbills, kingfishers & singing birds',
    ambientNote: 'Gentle chirping and peaceful blue open skies',
  },
  'nature_mountains': {
    id: 'nature_mountains',
    category: 'nature',
    label: 'Misty Mountains',
    emoji: '⛰️',
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
    primaryColor: '#475569',
    headerGradient: 'linear-gradient(135deg, rgba(51, 65, 85, 0.88) 0%, rgba(71, 85, 105, 0.92) 100%)',
    cardGradient: 'linear-gradient(135deg, rgba(248, 250, 252, 0.96) 0%, rgba(226, 232, 240, 0.92) 100%)',
    borderColor: '#CBD5E1',
    accentColor: '#1E293B',
    tagline: 'Serene mountain ridges, misty pine forests & calm air',
    ambientNote: 'Crisp mountain breezes and timeless stillness',
  },
  'nature_rivers': {
    id: 'nature_rivers',
    category: 'nature',
    label: 'Brahmaputra River',
    emoji: '🌊',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    primaryColor: '#0891B2',
    headerGradient: 'linear-gradient(135deg, rgba(14, 116, 144, 0.88) 0%, rgba(8, 145, 178, 0.92) 100%)',
    cardGradient: 'linear-gradient(135deg, rgba(236, 254, 255, 0.96) 0%, rgba(165, 243, 252, 0.92) 100%)',
    borderColor: '#67E8F9',
    accentColor: '#155E75',
    tagline: 'Mighty flowing waters, golden sunsets & gentle rippling waves',
    ambientNote: 'Soothing river current and cooling evening breeze',
  },

  // --- HOBBIES ---
  'hobby_music': {
    id: 'hobby_music',
    category: 'hobby',
    label: 'Classical Music',
    emoji: '🎶',
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
    primaryColor: '#7C3AED',
    headerGradient: 'linear-gradient(135deg, rgba(109, 40, 217, 0.88) 0%, rgba(124, 58, 237, 0.92) 100%)',
    cardGradient: 'linear-gradient(135deg, rgba(250, 245, 255, 0.96) 0%, rgba(233, 213, 255, 0.92) 100%)',
    borderColor: '#D8B4FE',
    accentColor: '#5B21B6',
    tagline: 'Soulful flute melodies, sitar ragas & devotional bhajans',
    ambientNote: 'Harmonious melodies that soothe the heart and mind',
  },
  'hobby_farming': {
    id: 'hobby_farming',
    category: 'hobby',
    label: 'Farming & Agriculture',
    emoji: '🌾',
    imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
    primaryColor: '#65A30D',
    headerGradient: 'linear-gradient(135deg, rgba(77, 124, 15, 0.88) 0%, rgba(101, 163, 13, 0.92) 100%)',
    cardGradient: 'linear-gradient(135deg, rgba(247, 254, 231, 0.96) 0%, rgba(217, 249, 157, 0.92) 100%)',
    borderColor: '#BEF264',
    accentColor: '#365314',
    tagline: 'Golden paddy fields, fresh harvest earth & agrarian heritage',
    ambientNote: 'Rich green fields swaying gently in the afternoon sun',
  },
  'hobby_weaving': {
    id: 'hobby_weaving',
    category: 'hobby',
    label: 'Weaving & Handloom',
    emoji: '🧵',
    imageUrl: 'https://images.unsplash.com/photo-1606744837616-56c9a5c6a6eb?auto=format&fit=crop&w=1200&q=80',
    primaryColor: '#0F766E',
    headerGradient: 'linear-gradient(135deg, rgba(17, 94, 89, 0.88) 0%, rgba(15, 118, 110, 0.92) 100%)',
    cardGradient: 'linear-gradient(135deg, rgba(240, 253, 250, 0.96) 0%, rgba(153, 246, 228, 0.92) 100%)',
    borderColor: '#5EEAD4',
    accentColor: '#134E4A',
    tagline: 'Traditional wooden loom, Muga silk & intricate artisan motifs',
    ambientNote: 'Rhythmic tap-tap of the handloom crafting golden silk',
  },
  'hobby_cricket': {
    id: 'hobby_cricket',
    category: 'hobby',
    label: 'Cricket & Sports',
    emoji: '🏏',
    imageUrl: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1200&q=80',
    primaryColor: '#16A34A',
    headerGradient: 'linear-gradient(135deg, rgba(21, 128, 61, 0.88) 0%, rgba(22, 163, 74, 0.92) 100%)',
    cardGradient: 'linear-gradient(135deg, rgba(240, 253, 244, 0.96) 0%, rgba(187, 247, 208, 0.92) 100%)',
    borderColor: '#86EFAC',
    accentColor: '#14532D',
    tagline: 'Sunny afternoon matches, radio commentary & cheering joy',
    ambientNote: 'Crack of the willow bat and nostalgic afternoon memories',
  },

  // --- FRUITS ---
  'fruit_mango': {
    id: 'fruit_mango',
    category: 'fruit',
    label: 'Mango',
    emoji: '🥭',
    imageUrl: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=1200&q=80',
    primaryColor: '#F59E0B',
    headerGradient: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)',
    cardGradient: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 50%, #FDE68A 100%)',
    borderColor: '#FCD34D',
    accentColor: '#92400E',
    tagline: 'Sweet golden mangoes from summer orchards',
    ambientNote: 'Juicy sunshine sweetness of the mango season',
  },
  'fruit_banana': {
    id: 'fruit_banana',
    category: 'fruit',
    label: 'Banana',
    emoji: '🍌',
    imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=1200&q=80',
    primaryColor: '#EAB308',
    headerGradient: 'linear-gradient(135deg, #CA8A04 0%, #EAB308 100%)',
    cardGradient: 'linear-gradient(135deg, #FEFCE8 0%, #FEF9C3 50%, #FEF08A 100%)',
    borderColor: '#FDE047',
    accentColor: '#854D0E',
    tagline: 'Soft, sweet bananas from the backyard grove',
    ambientNote: 'Simple everyday sweetness and gentle energy',
  },
  'fruit_jackfruit': {
    id: 'fruit_jackfruit',
    category: 'fruit',
    label: 'Jackfruit',
    emoji: '🟢',
    imageUrl: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?auto=format&fit=crop&w=1200&q=80',
    primaryColor: '#65A30D',
    headerGradient: 'linear-gradient(135deg, #4D7C0F 0%, #65A30D 100%)',
    cardGradient: 'linear-gradient(135deg, #F7FEE7 0%, #ECFCCB 50%, #D9F99D 100%)',
    borderColor: '#BEF264',
    accentColor: '#365314',
    tagline: 'Fragrant ripe jackfruit shared with the whole family',
    ambientNote: 'Rich tropical sweetness and communal harvest joy',
  },
  'fruit_papaya': {
    id: 'fruit_papaya',
    category: 'fruit',
    label: 'Papaya',
    emoji: '🍈',
    imageUrl: 'https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?auto=format&fit=crop&w=1200&q=80',
    primaryColor: '#EA580C',
    headerGradient: 'linear-gradient(135deg, #C2410C 0%, #EA580C 100%)',
    cardGradient: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 50%, #FED7AA 100%)',
    borderColor: '#FDBA74',
    accentColor: '#9A3412',
    tagline: 'Soft orange papaya, ripened in the courtyard tree',
    ambientNote: 'Gentle, soothing sweetness for a calm afternoon',
  },
  'fruit_pineapple': {
    id: 'fruit_pineapple',
    category: 'fruit',
    label: 'Pineapple',
    emoji: '🍍',
    imageUrl: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=1200&q=80',
    primaryColor: '#CA8A04',
    headerGradient: 'linear-gradient(135deg, #A16207 0%, #CA8A04 100%)',
    cardGradient: 'linear-gradient(135deg, #FEFCE8 0%, #FEF08A 50%, #FDE047 100%)',
    borderColor: '#FACC15',
    accentColor: '#713F12',
    tagline: 'Tangy-sweet pineapples from the hill gardens',
    ambientNote: 'Bright zesty freshness and cheerful memories',
  },

  // --- VEGETABLES ---
  'vegetable_pumpkin': {
    id: 'vegetable_pumpkin',
    category: 'vegetable',
    label: 'Pumpkin',
    emoji: '🎃',
    imageUrl: 'https://images.unsplash.com/photo-1506917728037-b6af01a7d403?auto=format&fit=crop&w=1200&q=80',
    primaryColor: '#EA580C',
    headerGradient: 'linear-gradient(135deg, #C2410C 0%, #EA580C 100%)',
    cardGradient: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 50%, #FED7AA 100%)',
    borderColor: '#FDBA74',
    accentColor: '#9A3412',
    tagline: 'Home-grown pumpkins from the kitchen garden',
    ambientNote: 'Warm, hearty comfort of a home-cooked meal',
  },
  'vegetable_brinjal': {
    id: 'vegetable_brinjal',
    category: 'vegetable',
    label: 'Brinjal',
    emoji: '🍆',
    imageUrl: 'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?auto=format&fit=crop&w=1200&q=80',
    primaryColor: '#7C3AED',
    headerGradient: 'linear-gradient(135deg, #6D28D9 0%, #7C3AED 100%)',
    cardGradient: 'linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 50%, #E9D5FF 100%)',
    borderColor: '#D8B4FE',
    accentColor: '#5B21B6',
    tagline: 'Glossy purple brinjals fresh from the vine',
    ambientNote: 'Simple, wholesome flavours of everyday cooking',
  },
  'vegetable_bottlegourd': {
    id: 'vegetable_bottlegourd',
    category: 'vegetable',
    label: 'Bottle Gourd',
    emoji: '🥒',
    imageUrl: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5c317?auto=format&fit=crop&w=1200&q=80',
    primaryColor: '#16A34A',
    headerGradient: 'linear-gradient(135deg, #15803D 0%, #16A34A 100%)',
    cardGradient: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 50%, #BBF7D0 100%)',
    borderColor: '#86EFAC',
    accentColor: '#166534',
    tagline: 'Cool bottle gourd from the backyard trellis',
    ambientNote: 'Light, refreshing calm of a garden morning',
  },
  'vegetable_potato': {
    id: 'vegetable_potato',
    category: 'vegetable',
    label: 'Potato',
    emoji: '🥔',
    imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=1200&q=80',
    primaryColor: '#B45309',
    headerGradient: 'linear-gradient(135deg, #92400E 0%, #B45309 100%)',
    cardGradient: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 50%, #FDE68A 100%)',
    borderColor: '#FCD34D',
    accentColor: '#78350F',
    tagline: 'Earthy potatoes, a staple of every family meal',
    ambientNote: 'Grounded, comforting warmth of home cooking',
  },
};

export const NEUTRAL_DEFAULT_THEME: ThemeAsset = {
  id: 'default',
  category: 'nature',
  label: 'Sahaaya Serenity',
  emoji: '🧠',
  imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
  primaryColor: '#2E7D8B',
  headerGradient: 'linear-gradient(135deg, rgba(21, 101, 192, 0.90) 0%, rgba(46, 125, 139, 0.94) 100%)',
  cardGradient: 'linear-gradient(135deg, rgba(240, 248, 250, 0.96) 0%, rgba(224, 242, 254, 0.92) 100%)',
  borderColor: '#BAE6FD',
  accentColor: '#0369A1',
  tagline: 'Calm, clear and supportive cognitive companionship',
  ambientNote: 'Peaceful clarity for your day',
};

/** Look up theme asset by themeAssetId, falling back safely to default */
export function getThemeAsset(themeAssetId?: string): ThemeAsset {
  if (!themeAssetId) return NEUTRAL_DEFAULT_THEME;
  return THEME_REGISTRY[themeAssetId] ?? NEUTRAL_DEFAULT_THEME;
}

/**
 * Resolves the patient's theme preference from either:
 * 1. Explicit themePreference.themeAssetId
 * 2. Explicit themePreference category & subOption
 * 3. Fallback free-text favorites (e.g. food: "Chicken Biryani", place: "Tea Garden", etc.)
 */
export function resolvePatientTheme(
  themePreference?: ThemePreference | null,
  fallbackFavorites?: { food?: string; place?: string; music?: string; colour?: string } | null,
): ThemeAsset {
  // 1. Direct match on themeAssetId
  if (themePreference?.themeAssetId && THEME_REGISTRY[themePreference.themeAssetId]) {
    return THEME_REGISTRY[themePreference.themeAssetId];
  }

  // 2. Match on category + subOption
  if (themePreference?.category && themePreference?.subOption) {
    const matched = Object.values(THEME_REGISTRY).find(
      (t) => t.category === themePreference.category && t.label.toLowerCase().includes(themePreference.subOption.toLowerCase()),
    );
    if (matched) return matched;
  }

  // 3. Fallback matching on free-text inputs (e.g. "Chicken Biryani", "chicken briyani", "pitha", etc.)
  const food = (fallbackFavorites?.food || '').toLowerCase();
  const place = (fallbackFavorites?.place || '').toLowerCase();
  const music = (fallbackFavorites?.music || '').toLowerCase();

  if (food.includes('biryani') || food.includes('briyani') || food.includes('pulao') || food.includes('chicken') || food.includes('mutton') || food.includes('rice')) {
    return THEME_REGISTRY['food_biryani'];
  }
  if (food.includes('payesh') || food.includes('kheer') || food.includes('sweet') || food.includes('mithai')) {
    return THEME_REGISTRY['food_payesh'];
  }
  if (food.includes('idli') || food.includes('dosa') || food.includes('sambar')) {
    return THEME_REGISTRY['food_idli'];
  }
  if (food.includes('momo') || food.includes('dumpling')) {
    return THEME_REGISTRY['food_momos'];
  }
  if (food.includes('pitha') || food.includes('laru') || food.includes('til')) {
    return THEME_REGISTRY['food_pitha'];
  }
  if (food.includes('tea') || food.includes('chai') || food.includes('kahwa')) {
    return THEME_REGISTRY['food_assam_tea'];
  }

  if (place.includes('tea') || place.includes('garden')) {
    return THEME_REGISTRY['food_assam_tea'];
  }
  if (place.includes('river') || place.includes('brahmaputra') || place.includes('water') || place.includes('ghat')) {
    return THEME_REGISTRY['nature_rivers'];
  }
  if (place.includes('mountain') || place.includes('hill') || place.includes('mist') || place.includes('shillong')) {
    return THEME_REGISTRY['nature_mountains'];
  }
  if (place.includes('flower') || place.includes('garden') || place.includes('park')) {
    return THEME_REGISTRY['nature_flowers'];
  }
  if (place.includes('bird') || place.includes('forest') || place.includes('kaziranga') || place.includes('jungle')) {
    return THEME_REGISTRY['nature_birds'];
  }

  if (music.includes('bihu')) {
    return THEME_REGISTRY['festival_bihu'];
  }
  if (music.includes('classic') || music.includes('bhajan') || music.includes('song') || music.includes('radio') || music.includes('old')) {
    return THEME_REGISTRY['hobby_music'];
  }
  if (music.includes('cricket') || music.includes('sport') || music.includes('match')) {
    return THEME_REGISTRY['hobby_cricket'];
  }
  if (music.includes('weave') || music.includes('loom') || music.includes('sari') || music.includes('muga')) {
    return THEME_REGISTRY['hobby_weaving'];
  }
  if (music.includes('farm') || music.includes('village') || music.includes('paddy')) {
    return THEME_REGISTRY['hobby_farming'];
  }

  return NEUTRAL_DEFAULT_THEME;
}

/** Lists themes for a specific category */
export function getThemesByCategory(category: ThemeCategory): ThemeAsset[] {
  return Object.values(THEME_REGISTRY).filter((t) => t.category === category);
}
