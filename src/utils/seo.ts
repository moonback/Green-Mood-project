const BASE_TITLE = 'Green IA';
const DEFAULT_DESCRIPTION = 'Green IA helps CBD brands launch, operate, and scale omnichannel e-commerce with AI assistants, POS, and automation.';
const DEFAULT_KEYWORDS = [
  'CBD SaaS',
  'CBD ecommerce software',
  'CBD POS system',
  'AI budtender',
  'cannabis retail platform',
  'multi-tenant ecommerce',
];

export function generateTitle(title: string, siteName = BASE_TITLE): string {
  return `${title} | ${siteName}`;
}

export function generateDescription(description?: string): string {
  if (!description) return DEFAULT_DESCRIPTION;
  return description.length > 160 ? `${description.slice(0, 157)}...` : description;
}

export function generateCanonical(path = '/', origin = 'https://green-ia.io'): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return new URL(normalizedPath, origin).toString();
}

export function generateKeywords(extraKeywords: string[] = []): string {
  return [...new Set([...DEFAULT_KEYWORDS, ...extraKeywords])].join(', ');
}
