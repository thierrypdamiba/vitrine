import type { CatalogItem } from './vitrine.ts';

export const GLEN_PACKABLE_SHELL_ID = 'glen-packable-shell';

/**
 * The house-brand sample storefront. Twelve brand-free jackets, no remote images,
 * and every size returns at least two matches for the full waterproof + packable,
 * navy | olive brief so the grid visibly narrows from 12 for any shopper.
 */
function jacket(
  id: string,
  name: string,
  priceUsd: number,
  rating: number,
  size: CatalogItem['size'],
  colors: CatalogItem['colors'],
  features: CatalogItem['features'],
): CatalogItem {
  return {
    id,
    name,
    priceUsd,
    imageUrl: '',
    merchantName: 'Vitrine',
    rating,
    url: '#pick',
    category: 'jacket',
    size,
    features,
    colors,
  };
}

export const CATALOG: CatalogItem[] = [
  jacket(
    GLEN_PACKABLE_SHELL_ID,
    'Rainier Packable Shell',
    180,
    4.6,
    'XL',
    ['navy'],
    ['waterproof', 'packable'],
  ),
  jacket(
    'cuillin-expedition-shell',
    'Cuillin Expedition Shell',
    429,
    4.8,
    'XL',
    ['olive'],
    ['waterproof', 'packable'],
  ),
  jacket('forth-city-coat', 'Forth City Coat', 195, 4.3, 'XL', ['navy'], []),
  jacket(
    'nevis-insulated-parka',
    'Nevis Insulated Parka',
    310,
    4.5,
    'XL',
    ['olive'],
    ['waterproof'],
  ),
  jacket(
    'glen-coe-light-shell',
    'Glen Coe Light Shell',
    140,
    4.4,
    'L',
    ['navy'],
    ['waterproof', 'packable'],
  ),
  jacket(
    'lomond-rain-shell',
    'Lomond Rain Shell',
    210,
    4.7,
    'L',
    ['olive'],
    ['waterproof', 'packable'],
  ),
  jacket(
    'skye-trail-rain-jacket',
    'Skye Trail Rain Jacket',
    88,
    4.5,
    'M',
    ['olive'],
    ['waterproof', 'packable'],
  ),
  jacket(
    'moray-packable-anorak',
    'Moray Packable Anorak',
    120,
    4.2,
    'M',
    ['navy'],
    ['waterproof', 'packable'],
  ),
  jacket(
    'islay-stowaway-jacket',
    'Islay Stowaway Jacket',
    95,
    4.3,
    'S',
    ['olive'],
    ['waterproof', 'packable'],
  ),
  jacket('tay-rain-shell', 'Tay Rain Shell', 160, 4.6, 'S', ['navy'], ['waterproof', 'packable']),
  jacket(
    'orkney-compact-shell',
    'Orkney Compact Shell',
    110,
    4.4,
    'XS',
    ['navy'],
    ['waterproof', 'packable'],
  ),
  jacket(
    'hebrides-compact-shell',
    'Hebrides Compact Shell',
    150,
    4.7,
    'XS',
    ['olive'],
    ['waterproof', 'packable'],
  ),
];
