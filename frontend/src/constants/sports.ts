import { Ionicons } from '@expo/vector-icons';

export interface SportConfig {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  label: string;
  aliases: string[];
  popular?: boolean; // Sports populaires affichés par défaut
}

export const SPORTS: SportConfig[] = [
  // ========== SPORTS POPULAIRES ==========
  // Sports collectifs populaires
  {
    key: 'football',
    icon: 'football',
    color: '#4CAF50',
    label: 'Football',
    aliases: ['football', 'foot', 'soccer'],
    popular: true,
  },
  {
    key: 'basketball',
    icon: 'basketball',
    color: '#FF9800',
    label: 'Basketball',
    aliases: ['basketball', 'basket', 'basket-ball'],
    popular: true,
  },
  {
    key: 'tennis',
    icon: 'tennisball',
    color: '#CDDC39',
    label: 'Tennis',
    aliases: ['tennis'],
    popular: true,
  },
  {
    key: 'running',
    icon: 'walk',
    color: '#FF6B6B',
    label: 'Course à pied',
    aliases: ['running', 'course', 'course a pied', 'course à pied', 'jogging', 'run'],
    popular: true,
  },
  {
    key: 'gym',
    icon: 'barbell',
    color: '#9C27B0',
    label: 'Musculation',
    aliases: ['gym', 'musculation', 'fitness', 'muscu', 'bodybuilding', 'salle'],
    popular: true,
  },
  {
    key: 'cycling',
    icon: 'bicycle',
    color: '#4ECDC4',
    label: 'Vélo',
    aliases: ['cycling', 'velo', 'vélo', 'cyclisme', 'bike', 'vtt'],
    popular: true,
  },
  {
    key: 'swimming',
    icon: 'water',
    color: '#45B7D1',
    label: 'Natation',
    aliases: ['swimming', 'natation', 'swim', 'nage'],
    popular: true,
  },
  {
    key: 'yoga',
    icon: 'body',
    color: '#85C1E9',
    label: 'Yoga',
    aliases: ['yoga'],
    popular: true,
  },
  {
    key: 'padel',
    icon: 'tennisball-outline',
    color: '#00BCD4',
    label: 'Padel',
    aliases: ['padel'],
    popular: true,
  },
  {
    key: 'hiking',
    icon: 'trail-sign',
    color: '#27AE60',
    label: 'Randonnée',
    aliases: ['hiking', 'randonnee', 'randonnée', 'rando', 'marche', 'trek', 'trekking'],
    popular: true,
  },
  {
    key: 'boxing',
    icon: 'fitness',
    color: '#E74C3C',
    label: 'Boxe',
    aliases: ['boxing', 'boxe', 'box'],
    popular: true,
  },
  {
    key: 'golf',
    icon: 'golf',
    color: '#388E3C',
    label: 'Golf',
    aliases: ['golf'],
    popular: true,
  },

  // ========== AUTRES SPORTS COLLECTIFS ==========
  {
    key: 'volleyball',
    icon: 'basketball-outline',
    color: '#FFEB3B',
    label: 'Volleyball',
    aliases: ['volleyball', 'volley', 'volley-ball', 'beach volley'],
  },
  {
    key: 'handball',
    icon: 'hand-left',
    color: '#2196F3',
    label: 'Handball',
    aliases: ['handball', 'hand'],
  },
  {
    key: 'rugby',
    icon: 'american-football',
    color: '#8B4513',
    label: 'Rugby',
    aliases: ['rugby', 'rugby à 7', 'rugby a 7'],
  },
  {
    key: 'hockey',
    icon: 'disc',
    color: '#1565C0',
    label: 'Hockey',
    aliases: ['hockey', 'hockey sur glace', 'hockey sur gazon', 'hockey sur roller'],
  },
  {
    key: 'baseball',
    icon: 'baseball',
    color: '#D32F2F',
    label: 'Baseball',
    aliases: ['baseball', 'softball'],
  },
  {
    key: 'cricket',
    icon: 'baseball-outline',
    color: '#FF8F00',
    label: 'Cricket',
    aliases: ['cricket'],
  },
  {
    key: 'futsal',
    icon: 'football-outline',
    color: '#43A047',
    label: 'Futsal',
    aliases: ['futsal', 'foot en salle', 'foot salle'],
  },
  {
    key: 'waterpolo',
    icon: 'water-outline',
    color: '#0097A7',
    label: 'Water-polo',
    aliases: ['waterpolo', 'water-polo', 'water polo'],
  },

  // ========== SPORTS DE RAQUETTE ==========
  {
    key: 'badminton',
    icon: 'tennisball',
    color: '#E91E63',
    label: 'Badminton',
    aliases: ['badminton', 'bad'],
  },
  {
    key: 'squash',
    icon: 'tennisball-outline',
    color: '#607D8B',
    label: 'Squash',
    aliases: ['squash'],
  },
  {
    key: 'pingpong',
    icon: 'ellipse',
    color: '#F44336',
    label: 'Tennis de table',
    aliases: ['pingpong', 'ping-pong', 'tennis de table', 'ping pong'],
  },
  {
    key: 'racquetball',
    icon: 'tennisball',
    color: '#7B1FA2',
    label: 'Racquetball',
    aliases: ['racquetball'],
  },

  // ========== FITNESS & MUSCULATION ==========
  {
    key: 'crossfit',
    icon: 'barbell-outline',
    color: '#FF5722',
    label: 'CrossFit',
    aliases: ['crossfit', 'cross fit', 'cross-fit'],
  },
  {
    key: 'pilates',
    icon: 'body-outline',
    color: '#9575CD',
    label: 'Pilates',
    aliases: ['pilates'],
  },
  {
    key: 'stretching',
    icon: 'body',
    color: '#4DD0E1',
    label: 'Stretching',
    aliases: ['stretching', 'étirements', 'etirements'],
  },
  {
    key: 'hiit',
    icon: 'flash',
    color: '#FF7043',
    label: 'HIIT',
    aliases: ['hiit', 'high intensity', 'interval training'],
  },
  {
    key: 'calisthenics',
    icon: 'body',
    color: '#5C6BC0',
    label: 'Callisthénie',
    aliases: ['calisthenics', 'callisthénie', 'street workout'],
  },
  {
    key: 'aerobic',
    icon: 'pulse',
    color: '#EC407A',
    label: 'Aérobic',
    aliases: ['aerobic', 'aérobic', 'step'],
  },

  // ========== ARTS MARTIAUX & COMBAT ==========
  {
    key: 'kickboxing',
    icon: 'fitness',
    color: '#C62828',
    label: 'Kickboxing',
    aliases: ['kickboxing', 'kick-boxing', 'kick boxing'],
  },
  {
    key: 'mma',
    icon: 'fitness-outline',
    color: '#BF360C',
    label: 'MMA',
    aliases: ['mma', 'mixed martial arts', 'arts martiaux mixtes'],
  },
  {
    key: 'judo',
    icon: 'fitness-outline',
    color: '#1A237E',
    label: 'Judo',
    aliases: ['judo'],
  },
  {
    key: 'karate',
    icon: 'hand-right',
    color: '#283593',
    label: 'Karaté',
    aliases: ['karate', 'karaté'],
  },
  {
    key: 'taekwondo',
    icon: 'footsteps',
    color: '#303F9F',
    label: 'Taekwondo',
    aliases: ['taekwondo', 'taekwon-do'],
  },
  {
    key: 'jiujitsu',
    icon: 'fitness',
    color: '#512DA8',
    label: 'Jiu-Jitsu',
    aliases: ['jiujitsu', 'jiu-jitsu', 'bjj', 'jiu jitsu brésilien'],
  },
  {
    key: 'aikido',
    icon: 'infinite',
    color: '#4527A0',
    label: 'Aïkido',
    aliases: ['aikido', 'aïkido'],
  },
  {
    key: 'kravmaga',
    icon: 'shield',
    color: '#6A1B9A',
    label: 'Krav Maga',
    aliases: ['kravmaga', 'krav maga', 'krav-maga'],
  },
  {
    key: 'wrestling',
    icon: 'people',
    color: '#AD1457',
    label: 'Lutte',
    aliases: ['wrestling', 'lutte', 'grappling'],
  },
  {
    key: 'fencing',
    icon: 'remove',
    color: '#C2185B',
    label: 'Escrime',
    aliases: ['fencing', 'escrime'],
  },
  {
    key: 'muaythai',
    icon: 'fitness',
    color: '#D84315',
    label: 'Muay Thaï',
    aliases: ['muaythai', 'muay thai', 'muay-thai', 'boxe thai'],
  },
  {
    key: 'capoeira',
    icon: 'musical-notes',
    color: '#F9A825',
    label: 'Capoeira',
    aliases: ['capoeira'],
  },

  // ========== SPORTS OUTDOOR / AVENTURE ==========
  {
    key: 'climbing',
    icon: 'trending-up',
    color: '#795548',
    label: 'Escalade',
    aliases: ['climbing', 'escalade', 'bloc', 'bouldering'],
  },
  {
    key: 'skiing',
    icon: 'snow',
    color: '#03A9F4',
    label: 'Ski',
    aliases: ['skiing', 'ski', 'ski alpin', 'ski de fond'],
  },
  {
    key: 'snowboard',
    icon: 'snow',
    color: '#00ACC1',
    label: 'Snowboard',
    aliases: ['snowboard', 'snow'],
  },
  {
    key: 'surf',
    icon: 'boat',
    color: '#00ACC1',
    label: 'Surf',
    aliases: ['surf', 'surfing'],
  },
  {
    key: 'windsurf',
    icon: 'boat',
    color: '#26C6DA',
    label: 'Planche à voile',
    aliases: ['windsurf', 'planche à voile', 'planche a voile', 'windsurf'],
  },
  {
    key: 'kitesurf',
    icon: 'airplane',
    color: '#4FC3F7',
    label: 'Kitesurf',
    aliases: ['kitesurf', 'kite', 'kitesurfing', 'kiteboard'],
  },
  {
    key: 'wakeboard',
    icon: 'boat-outline',
    color: '#29B6F6',
    label: 'Wakeboard',
    aliases: ['wakeboard', 'wake', 'ski nautique'],
  },
  {
    key: 'diving',
    icon: 'water',
    color: '#0277BD',
    label: 'Plongée',
    aliases: ['diving', 'plongée', 'plongee', 'scuba', 'apnée', 'apnee'],
  },
  {
    key: 'sailing',
    icon: 'boat',
    color: '#01579B',
    label: 'Voile',
    aliases: ['sailing', 'voile', 'catamaran'],
  },
  {
    key: 'kayak',
    icon: 'boat-outline',
    color: '#0288D1',
    label: 'Kayak',
    aliases: ['kayak', 'canoë', 'canoe', 'canoë-kayak'],
  },
  {
    key: 'rowing',
    icon: 'boat-outline',
    color: '#0288D1',
    label: 'Aviron',
    aliases: ['rowing', 'aviron'],
  },
  {
    key: 'paragliding',
    icon: 'airplane',
    color: '#81D4FA',
    label: 'Parapente',
    aliases: ['paragliding', 'parapente', 'deltaplane'],
  },
  {
    key: 'trailrunning',
    icon: 'trail-sign',
    color: '#558B2F',
    label: 'Trail',
    aliases: ['trailrunning', 'trail', 'trail running', 'course nature'],
  },
  {
    key: 'orienteering',
    icon: 'compass',
    color: '#689F38',
    label: 'Course d\'orientation',
    aliases: ['orienteering', 'orientation', 'course d\'orientation'],
  },

  // ========== SPORTS DE PRÉCISION ==========
  {
    key: 'petanque',
    icon: 'ellipse-outline',
    color: '#8D6E63',
    label: 'Pétanque',
    aliases: ['petanque', 'pétanque', 'boules'],
  },
  {
    key: 'archery',
    icon: 'locate',
    color: '#A1887F',
    label: 'Tir à l\'arc',
    aliases: ['archery', 'tir à l\'arc', 'tir a l\'arc'],
  },
  {
    key: 'shooting',
    icon: 'locate-outline',
    color: '#757575',
    label: 'Tir sportif',
    aliases: ['shooting', 'tir', 'tir sportif'],
  },
  {
    key: 'darts',
    icon: 'locate',
    color: '#D32F2F',
    label: 'Fléchettes',
    aliases: ['darts', 'fléchettes', 'flechettes'],
  },
  {
    key: 'billiards',
    icon: 'ellipse',
    color: '#00695C',
    label: 'Billard',
    aliases: ['billiards', 'billard', 'pool', 'snooker'],
  },
  {
    key: 'bowling',
    icon: 'ellipse',
    color: '#7B1FA2',
    label: 'Bowling',
    aliases: ['bowling'],
  },

  // ========== DANSE ==========
  {
    key: 'dance',
    icon: 'musical-notes',
    color: '#D81B60',
    label: 'Danse',
    aliases: ['dance', 'danse'],
  },
  {
    key: 'salsa',
    icon: 'musical-notes',
    color: '#E91E63',
    label: 'Salsa',
    aliases: ['salsa', 'bachata', 'danse latine'],
  },
  {
    key: 'hiphop',
    icon: 'musical-notes',
    color: '#880E4F',
    label: 'Hip-hop',
    aliases: ['hiphop', 'hip-hop', 'hip hop', 'breakdance'],
  },
  {
    key: 'ballet',
    icon: 'musical-notes',
    color: '#F8BBD9',
    label: 'Ballet',
    aliases: ['ballet', 'danse classique'],
  },
  {
    key: 'zumba',
    icon: 'musical-notes',
    color: '#FF4081',
    label: 'Zumba',
    aliases: ['zumba'],
  },
  {
    key: 'contemporain',
    icon: 'musical-notes',
    color: '#9C27B0',
    label: 'Danse contemporaine',
    aliases: ['contemporain', 'danse contemporaine', 'modern jazz'],
  },

  // ========== SPORTS URBAINS ==========
  {
    key: 'skateboard',
    icon: 'flash',
    color: '#FFC107',
    label: 'Skateboard',
    aliases: ['skateboard', 'skate'],
  },
  {
    key: 'roller',
    icon: 'flash',
    color: '#FF9800',
    label: 'Roller',
    aliases: ['roller', 'rollers', 'patin à roulettes', 'inline'],
  },
  {
    key: 'bmx',
    icon: 'bicycle',
    color: '#E65100',
    label: 'BMX',
    aliases: ['bmx', 'bmx race', 'bmx freestyle'],
  },
  {
    key: 'trottinette',
    icon: 'flash',
    color: '#FFB300',
    label: 'Trottinette',
    aliases: ['trottinette', 'scooter', 'trottinette freestyle'],
  },
  {
    key: 'parkour',
    icon: 'walk',
    color: '#37474F',
    label: 'Parkour',
    aliases: ['parkour', 'freerunning', 'free running'],
  },

  // ========== SPORTS ÉQUESTRES ==========
  {
    key: 'equitation',
    icon: 'paw',
    color: '#5D4037',
    label: 'Équitation',
    aliases: ['equitation', 'équitation', 'cheval', 'horse', 'dressage', 'saut d\'obstacle'],
  },
  {
    key: 'polo',
    icon: 'paw',
    color: '#4E342E',
    label: 'Polo',
    aliases: ['polo'],
  },

  // ========== SPORTS MOTORISÉS ==========
  {
    key: 'karting',
    icon: 'car-sport',
    color: '#F44336',
    label: 'Karting',
    aliases: ['karting', 'kart'],
  },
  {
    key: 'motocross',
    icon: 'bicycle',
    color: '#EF6C00',
    label: 'Motocross',
    aliases: ['motocross', 'moto', 'enduro'],
  },

  // ========== SPORTS DE GLACE ==========
  {
    key: 'iceskating',
    icon: 'snow',
    color: '#B3E5FC',
    label: 'Patinage',
    aliases: ['iceskating', 'patinage', 'patinage artistique', 'ice skating'],
  },
  {
    key: 'curling',
    icon: 'ellipse',
    color: '#90CAF9',
    label: 'Curling',
    aliases: ['curling'],
  },

  // ========== AUTRES ==========
  {
    key: 'triathlon',
    icon: 'medal',
    color: '#FFA000',
    label: 'Triathlon',
    aliases: ['triathlon', 'ironman'],
  },
  {
    key: 'athletics',
    icon: 'ribbon',
    color: '#D50000',
    label: 'Athlétisme',
    aliases: ['athletics', 'athlétisme', 'athletisme', 'sprint', 'saut', 'lancer'],
  },
  {
    key: 'gymnastics',
    icon: 'body',
    color: '#E040FB',
    label: 'Gymnastique',
    aliases: ['gymnastics', 'gymnastique', 'gym artistique'],
  },
  {
    key: 'cheerleading',
    icon: 'star',
    color: '#FF4081',
    label: 'Cheerleading',
    aliases: ['cheerleading', 'pom-pom', 'pompom'],
  },
  {
    key: 'esport',
    icon: 'game-controller',
    color: '#7C4DFF',
    label: 'E-sport',
    aliases: ['esport', 'e-sport', 'gaming', 'jeux vidéo'],
  },
  {
    key: 'chess',
    icon: 'grid',
    color: '#424242',
    label: 'Échecs',
    aliases: ['chess', 'échecs', 'echecs'],
  },
  {
    key: 'other',
    icon: 'fitness',
    color: '#9E9E9E',
    label: 'Autre sport',
    aliases: ['other', 'autre', 'divers'],
  },
];

// Get popular sports only
export function getPopularSports(): SportConfig[] {
  return SPORTS.filter(sport => sport.popular);
}

// Get all sports except 'other'
export function getAllSportsExceptOther(): SportConfig[] {
  return SPORTS.filter(sport => sport.key !== 'other');
}

// Get sport config by any name (key, label, or alias)
export function getSportConfig(sportName: string): SportConfig | null {
  const normalized = sportName.toLowerCase().trim();
  return SPORTS.find(sport =>
    sport.key === normalized ||
    sport.label.toLowerCase() === normalized ||
    sport.aliases.some(alias => alias.toLowerCase() === normalized)
  ) || null;
}

// Get sport key from any name
export function getSportKey(sportName: string): string {
  const config = getSportConfig(sportName);
  return config?.key || sportName.toLowerCase();
}

// Get sport label (French) from any name
export function getSportLabel(sportName: string): string {
  const config = getSportConfig(sportName);
  return config?.label || sportName;
}

// Check if a user's sport matches a filter key
export function sportMatchesFilter(userSport: string, filterKey: string): boolean {
  const userSportConfig = getSportConfig(userSport);
  return userSportConfig?.key === filterKey;
}

// Get all sport keys for filtering
export function getAllSportKeys(): string[] {
  return SPORTS.map(s => s.key);
}

// Search sports by query (for autocomplete)
export function searchSports(query: string): SportConfig[] {
  if (!query.trim()) return SPORTS;

  const normalized = query.toLowerCase().trim();
  return SPORTS.filter(sport =>
    sport.label.toLowerCase().includes(normalized) ||
    sport.key.includes(normalized) ||
    sport.aliases.some(alias => alias.includes(normalized))
  );
}

// Legacy support: create a Record for backward compatibility
export const sportConfigRecord: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; label: string }> =
  SPORTS.reduce((acc, sport) => {
    acc[sport.key] = {
      icon: sport.icon,
      color: sport.color,
      label: sport.label,
    };
    return acc;
  }, {} as Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; label: string }>);
