/**
 * Images par défaut pour les covers et avatars
 * Centralisé pour assurer la cohérence dans toute l'app
 */

// Cover images par sport (Unsplash optimisées 800x400)
export const SPORT_COVER_IMAGES: Record<string, string> = {
  // Sports populaires
  running: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&h=400&fit=crop',
  course: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&h=400&fit=crop',
  swimming: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&h=400&fit=crop',
  natation: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&h=400&fit=crop',
  tennis: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&h=400&fit=crop',
  football: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&h=400&fit=crop',
  soccer: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&h=400&fit=crop',
  basketball: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=400&fit=crop',
  cycling: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=800&h=400&fit=crop',
  velo: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=800&h=400&fit=crop',
  cyclisme: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=800&h=400&fit=crop',
  yoga: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=400&fit=crop',
  gym: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=400&fit=crop',
  musculation: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=400&fit=crop',
  fitness: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=400&fit=crop',
  boxing: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=800&h=400&fit=crop',
  boxe: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=800&h=400&fit=crop',
  hiking: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&h=400&fit=crop',
  randonnee: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&h=400&fit=crop',

  // Sports additionnels
  volleyball: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800&h=400&fit=crop',
  volley: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800&h=400&fit=crop',
  golf: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=400&fit=crop',
  rugby: 'https://images.unsplash.com/photo-1544919982-01a11e23c07d?w=800&h=400&fit=crop',
  badminton: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&h=400&fit=crop',
  pingpong: 'https://images.unsplash.com/photo-1558743212-586ed86fe3bb?w=800&h=400&fit=crop',
  tabletennis: 'https://images.unsplash.com/photo-1558743212-586ed86fe3bb?w=800&h=400&fit=crop',
  climbing: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=800&h=400&fit=crop',
  escalade: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=800&h=400&fit=crop',
  ski: 'https://images.unsplash.com/photo-1551524559-8af4e6624178?w=800&h=400&fit=crop',
  snowboard: 'https://images.unsplash.com/photo-1478700485868-972b69dc3fc4?w=800&h=400&fit=crop',
  surf: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800&h=400&fit=crop',
  skateboard: 'https://images.unsplash.com/photo-1547447134-cd3f5c716030?w=800&h=400&fit=crop',
  skate: 'https://images.unsplash.com/photo-1547447134-cd3f5c716030?w=800&h=400&fit=crop',
  crossfit: 'https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=800&h=400&fit=crop',
  pilates: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&h=400&fit=crop',
  danse: 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=800&h=400&fit=crop',
  dance: 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=800&h=400&fit=crop',
  martialarts: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=800&h=400&fit=crop',
  artsmartieux: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=800&h=400&fit=crop',
  equitation: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=800&h=400&fit=crop',
  horseriding: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=800&h=400&fit=crop',
  paddle: 'https://images.unsplash.com/photo-1526485856375-9110812fbf35?w=800&h=400&fit=crop',
  kayak: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=400&fit=crop',
  rowing: 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?w=800&h=400&fit=crop',
  aviron: 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?w=800&h=400&fit=crop',
  triathlon: 'https://images.unsplash.com/photo-1530143311094-34d807799e8f?w=800&h=400&fit=crop',
  handball: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&h=400&fit=crop',
  hockey: 'https://images.unsplash.com/photo-1580820267682-426da823b514?w=800&h=400&fit=crop',
  baseball: 'https://images.unsplash.com/photo-1508344928928-7165b67de128?w=800&h=400&fit=crop',
  softball: 'https://images.unsplash.com/photo-1508344928928-7165b67de128?w=800&h=400&fit=crop',
  archery: 'https://images.unsplash.com/photo-1511174511562-5f7f18b874f8?w=800&h=400&fit=crop',
  tirarc: 'https://images.unsplash.com/photo-1511174511562-5f7f18b874f8?w=800&h=400&fit=crop',
  athletics: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&h=400&fit=crop',
  athletisme: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&h=400&fit=crop',
  autre: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&h=400&fit=crop',
  other: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&h=400&fit=crop',
};

// Image par défaut générique sport
export const DEFAULT_COVER_IMAGE = 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&h=400&fit=crop';

// Gradients par défaut pour les covers (fallback si image ne charge pas)
export const SPORT_GRADIENTS: Record<string, [string, string]> = {
  running: ['#FF6B6B', '#FF8E53'],
  swimming: ['#4FACFE', '#00F2FE'],
  tennis: ['#43E97B', '#38F9D7'],
  football: ['#667EEA', '#764BA2'],
  basketball: ['#FA709A', '#FEE140'],
  cycling: ['#A8EDEA', '#FED6E3'],
  yoga: ['#89F7FE', '#66A6FF'],
  gym: ['#FF9A9E', '#FECFEF'],
  boxing: ['#F093FB', '#F5576C'],
  hiking: ['#43E97B', '#38F9D7'],
  default: ['#667EEA', '#764BA2'],
};

/**
 * Récupère l'image de cover pour un sport donné
 */
export function getCoverImageForSport(sport?: string | null): string {
  if (!sport) return DEFAULT_COVER_IMAGE;

  const normalizedSport = sport.toLowerCase().replace(/[^a-z]/g, '');
  return SPORT_COVER_IMAGES[normalizedSport] || DEFAULT_COVER_IMAGE;
}

/**
 * Récupère l'image de cover pour un utilisateur
 * Priorité: coverImage personnalisée > sport principal > défaut
 */
export function getUserCoverImage(user: { coverImage?: string; sports?: string[] }): string {
  if (user.coverImage) return user.coverImage;
  if (user.sports && user.sports.length > 0) {
    return getCoverImageForSport(user.sports[0]);
  }
  return DEFAULT_COVER_IMAGE;
}

/**
 * Récupère le gradient pour un sport
 */
export function getGradientForSport(sport?: string | null): [string, string] {
  if (!sport) return SPORT_GRADIENTS.default;

  const normalizedSport = sport.toLowerCase().replace(/[^a-z]/g, '');
  return SPORT_GRADIENTS[normalizedSport] || SPORT_GRADIENTS.default;
}
