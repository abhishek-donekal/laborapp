import { Category } from './types';

const P = '?w=800&q=80&auto=format&fit=crop';
const base = 'https://images.unsplash.com/';

interface CatVisual {
  image: string;
  emoji: string;
  gradient: [string, string]; // fallback + overlay tint
}

export const CATEGORY_VISUALS: Record<Category, CatVisual> = {
  Construction: {
    image: `${base}photo-1503387762-592deb58ef4e${P}`,
    emoji: '👷',
    gradient: ['#F97316', '#C2410C'],
  },
  Moving: {
    image: `${base}photo-1600585154340-be6161a56a0c${P}`,
    emoji: '📦',
    gradient: ['#0EA5E9', '#0369A1'],
  },
  Cleaning: {
    image: `${base}photo-1581578731548-c64695cc6952${P}`,
    emoji: '🧽',
    gradient: ['#14B8A6', '#0F766E'],
  },
  Landscaping: {
    image: `${base}photo-1416879595882-3373a0480b5b${P}`,
    emoji: '🌿',
    gradient: ['#22C55E', '#15803D'],
  },
  Warehouse: {
    image: `${base}photo-1553413077-190dd305871c${P}`,
    emoji: '🏭',
    gradient: ['#6366F1', '#4338CA'],
  },
  Painting: {
    image: `${base}photo-1562259949-e8e7689d7828${P}`,
    emoji: '🎨',
    gradient: ['#EC4899', '#BE185D'],
  },
  Delivery: {
    image: `${base}photo-1586528116311-ad8dd3c8310d${P}`,
    emoji: '🚚',
    gradient: ['#EAB308', '#A16207'],
  },
  General: {
    image: `${base}photo-1521737604893-d14cc237f11d${P}`,
    emoji: '🛠️',
    gradient: ['#64748B', '#334155'],
  },
};

export function catVisual(category: Category): CatVisual {
  return CATEGORY_VISUALS[category] ?? CATEGORY_VISUALS.General;
}
