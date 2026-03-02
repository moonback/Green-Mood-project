// ─── Category slugs ──────────────────────────────────────────────────────────
// Single source of truth for DB category slugs used throughout the app.
// If a slug changes in the DB, update here only.

export const CATEGORY_SLUGS = {
  OILS: 'huiles',
  FLOWERS: 'fleurs',
  RESINS: 'resines',
  INFUSIONS: 'infusions',
} as const;

export type CategorySlug = (typeof CATEGORY_SLUGS)[keyof typeof CATEGORY_SLUGS];
