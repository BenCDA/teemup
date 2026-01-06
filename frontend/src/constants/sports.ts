import { Ionicons } from '@expo/vector-icons';

export interface SportConfig {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  label: string;
  aliases: string[]; // All possible names (EN, FR, variations)
}

export const SPORTS: SportConfig[] = [
  {
    key: 'running',
    icon: 'walk',
    color: '#FF6B6B',
    label: 'Course a pied',
    aliases: ['running', 'course', 'course a pied', 'course à pied', 'jogging'],
  },
  {
    key: 'cycling',
    icon: 'bicycle',
    color: '#4ECDC4',
    label: 'Velo',
    aliases: ['cycling', 'velo', 'vélo', 'cyclisme', 'bike'],
  },
  {
    key: 'swimming',
    icon: 'water',
    color: '#45B7D1',
    label: 'Natation',
    aliases: ['swimming', 'natation', 'swim', 'nage'],
  },
  {
    key: 'tennis',
    icon: 'tennisball',
    color: '#96CEB4',
    label: 'Tennis',
    aliases: ['tennis'],
  },
  {
    key: 'football',
    icon: 'football',
    color: '#DDA0DD',
    label: 'Football',
    aliases: ['football', 'foot', 'soccer'],
  },
  {
    key: 'basketball',
    icon: 'basketball',
    color: '#F7DC6F',
    label: 'Basketball',
    aliases: ['basketball', 'basket', 'basket-ball'],
  },
  {
    key: 'gym',
    icon: 'barbell',
    color: '#BB8FCE',
    label: 'Musculation',
    aliases: ['gym', 'musculation', 'fitness', 'muscu', 'bodybuilding'],
  },
  {
    key: 'yoga',
    icon: 'body',
    color: '#85C1E9',
    label: 'Yoga',
    aliases: ['yoga'],
  },
  {
    key: 'boxing',
    icon: 'fitness',
    color: '#E74C3C',
    label: 'Boxe',
    aliases: ['boxing', 'boxe', 'box'],
  },
  {
    key: 'hiking',
    icon: 'trail-sign',
    color: '#27AE60',
    label: 'Randonnee',
    aliases: ['hiking', 'randonnee', 'randonnée', 'rando', 'marche'],
  },
];

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
