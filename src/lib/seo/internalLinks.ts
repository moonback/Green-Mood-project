import { Product } from '../types';

export function buildInternalLinks(product?: Product) {
  const guideLinks = [
    { label: 'Guide huile CBD', to: '/guides/guide-huile-cbd' },
    { label: 'Guide dosage CBD', to: '/guides/guide-dosage-cbd' },
    { label: 'Guide CBD sommeil', to: '/guides/guide-cbd-sommeil' },
  ];

  const productLinks = product
    ? [
        { label: `Voir la catégorie ${product.category?.name ?? 'CBD'}`, to: '/catalogue' },
        { label: 'Produits liés', to: '/produits' },
      ]
    : [];

  return [...productLinks, ...guideLinks];
}
