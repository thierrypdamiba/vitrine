import type { CatalogItem } from './vitrine.ts';

export const GLEN_PACKABLE_SHELL_ID = 'glen-packable-shell';

function sampleUrl(name: string): string {
  return `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(name)}`;
}

export const CATALOG: CatalogItem[] = [
  {
    id: GLEN_PACKABLE_SHELL_ID,
    name: 'REI Co-op Rainier Packable Shell',
    priceUsd: 180,
    imageUrl:
      'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=640&q=80',
    merchantName: 'REI',
    rating: 4.6,
    url: sampleUrl('REI Co-op Rainier Packable Shell'),
    category: 'jacket',
    size: 'XL',
    features: ['waterproof', 'packable'],
    colors: ['navy'],
  },
  {
    id: 'cuillin-expedition-parka',
    name: "Arc'teryx Beta AR Jacket",
    priceUsd: 429,
    imageUrl:
      'https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=640&q=80',
    merchantName: 'Backcountry',
    rating: 4.8,
    url: sampleUrl("Arc'teryx Beta AR Jacket"),
    category: 'jacket',
    size: 'XL',
    features: ['waterproof', 'packable'],
    colors: ['olive'],
  },
  {
    id: 'forth-city-coat',
    name: 'Uniqlo Blocktech Coat',
    priceUsd: 195,
    imageUrl:
      'https://images.unsplash.com/photo-1495107334309-fcf20504a5ab?auto=format&fit=crop&w=640&q=80',
    merchantName: 'Uniqlo',
    rating: 4.3,
    url: sampleUrl('Uniqlo Blocktech Coat'),
    category: 'jacket',
    size: 'XL',
    features: [],
    colors: ['navy'],
  },
  {
    id: 'skye-trail-rain',
    name: 'Patagonia Torrentshell 3L',
    priceUsd: 88,
    imageUrl:
      'https://images.unsplash.com/photo-1520975661595-6453be3f7070?auto=format&fit=crop&w=640&q=80',
    merchantName: 'Patagonia',
    rating: 4.5,
    url: sampleUrl('Patagonia Torrentshell 3L'),
    category: 'jacket',
    size: 'M',
    features: ['waterproof', 'packable'],
    colors: ['olive'],
  },
];
