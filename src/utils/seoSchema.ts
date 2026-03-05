export interface FAQItem {
  question: string;
  answer: string;
}

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Green IA',
    url: 'https://green-ia.io',
    logo: 'https://green-ia.io/logo.png',
    sameAs: ['https://www.linkedin.com', 'https://x.com'],
  };
}

export function webSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Green IA',
    url: 'https://green-ia.io',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://green-ia.io/catalogue?query={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };
}

export function faqPageSchema(items: FAQItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export function softwareApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Green IA SaaS',
    operatingSystem: 'Web',
    applicationCategory: 'BusinessApplication',
    offers: {
      '@type': 'Offer',
      priceCurrency: 'EUR',
      price: '99',
    },
  };
}

export function breadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function productSchema(input: {
  name: string;
  description: string;
  image: string;
  price: number;
  brand: string;
  availability: string;
  aggregateRating?: { ratingValue: number; reviewCount: number };
  url?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: input.name,
    description: input.description,
    image: input.image,
    brand: {
      '@type': 'Brand',
      name: input.brand,
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'EUR',
      price: input.price,
      availability: input.availability,
      url: input.url,
    },
    ...(input.aggregateRating
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: input.aggregateRating.ratingValue,
            reviewCount: input.aggregateRating.reviewCount,
          },
        }
      : {}),
  };
}
