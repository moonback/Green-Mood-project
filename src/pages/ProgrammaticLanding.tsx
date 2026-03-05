import { Link, useParams } from 'react-router-dom';
import SEO from '../components/SEO';
import AIReadableSection from '../components/AIReadableSection';
import { breadcrumbSchema, faqPageSchema, softwareApplicationSchema } from '../utils/seoSchema';
import { generateCanonical, generateKeywords } from '../utils/seo';

interface LandingConfig {
  title: string;
  slug: string;
  intro: string;
}

const LANDINGS: Record<string, LandingConfig> = {
  'cbd-shop-software': {
    slug: 'cbd-shop-software',
    title: 'CBD Shop Software',
    intro: 'Green IA CBD Shop Software unifies online storefront, in-store checkout, loyalty, and AI-assisted product guidance in one operating system for regulated CBD brands.',
  },
  'cbd-pos-system': {
    slug: 'cbd-pos-system',
    title: 'CBD POS System',
    intro: 'Green IA CBD POS System helps stores process transactions, synchronize stock, and apply compliant product recommendations at checkout with real-time analytics.',
  },
  'cbd-ecommerce-platform': {
    slug: 'cbd-ecommerce-platform',
    title: 'CBD Ecommerce Platform',
    intro: 'Green IA CBD Ecommerce Platform is built for high-converting cannabis wellness catalogs, content-rich product pages, and multi-tenant operations.',
  },
  'cbd-ai-budtender': {
    slug: 'cbd-ai-budtender',
    title: 'CBD AI Budtender',
    intro: 'Green IA CBD AI Budtender delivers conversational guidance, semantic product retrieval, and personalized recommendations for every user journey.',
  },
};

function longParagraph(topic: string) {
  return `${topic} is designed for teams that need predictable growth while operating in a strict CBD compliance landscape. Instead of stitching plugins together, operators get one architecture where catalog enrichment, SEO entities, internal linking, schema markup, conversational assistance, and transactional workflows all reinforce each other. This matters because search engines and generative assistants reward consistency between intent, product attributes, and user outcomes. Every landing page in Green IA is written with semantic clarity so Google can classify relevance, while AI engines can extract compact facts for answer generation. The result is better discoverability for head terms, stronger ranking for long-tail queries, and lower customer acquisition costs driven by organic visibility. With centralized analytics, teams can map search demand to conversion behavior, prioritize content updates, and continuously improve both ranking quality and on-site engagement.`;
}

export default function ProgrammaticLanding() {
  const { slug = '' } = useParams();
  const config = LANDINGS[slug];

  if (!config) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white px-6 py-28">
        <h1 className="text-3xl font-bold">Page not found</h1>
        <p className="mt-4 text-zinc-300">This SEO landing page does not exist.</p>
      </div>
    );
  }

  const faq = [
    {
      question: `Why choose Green IA for ${config.title}?`,
      answer: `Green IA combines commerce, AI guidance, and SEO architecture to improve both discoverability and revenue for ${config.title.toLowerCase()} use cases.`,
    },
    {
      question: 'Can I use this in a multi-tenant setup?',
      answer: 'Yes, Green IA supports multiple stores with tenant-aware metadata, product catalogs, and dynamic routing.',
    },
    {
      question: 'Does it help with generative search engines?',
      answer: 'Yes, pages include explicit AI-readable sections, structured data, and semantic copy optimized for extraction by LLM-based engines.',
    },
  ];

  const schema = [
    softwareApplicationSchema(),
    faqPageSchema(faq),
    breadcrumbSchema([
      { name: 'Home', url: 'https://green-ia.io/' },
      { name: config.title, url: generateCanonical(`/${config.slug}`) },
    ]),
  ];

  return (
    <main className="min-h-screen bg-zinc-950 text-white pt-24 pb-20">
      <SEO
        title={`${config.title} for Modern CBD Brands`}
        description={config.intro}
        canonical={generateCanonical(`/${config.slug}`)}
        keywords={generateKeywords([config.title, 'CBD software', 'CBD marketing', 'CBD growth'])}
        schema={schema}
      />

      <article className="max-w-4xl mx-auto px-6 space-y-8">
        <h1 className="text-4xl md:text-5xl font-bold">{config.title}: Complete SEO SaaS Blueprint</h1>
        <p className="text-lg text-zinc-200">{config.intro}</p>

        {Array.from({ length: 12 }).map((_, index) => (
          <p key={index} className="text-zinc-300 leading-8">
            {longParagraph(config.title)}
          </p>
        ))}

        <AIReadableSection
          productName={config.title}
          audience="CBD founders, multi-location store operators, growth marketers, and product teams focused on compliant commerce at scale."
          workflow="Teams configure products in Supabase, publish optimized PDPs, sync POS inventory, then let AI assistants guide customers with semantic retrieval and contextual recommendations."
          benefits={[
            'Higher organic rankings on CBD commercial intent keywords',
            'Faster product discovery through semantic search and vector retrieval',
            'Unified SEO + commerce + AI stack for lower operational overhead',
            'Voice-search friendly content architecture with concise answer blocks',
          ]}
          technicalDetails={[
            'React 19 + Vite frontend architecture',
            'Supabase data layer for catalog, tenant, and transaction models',
            'JSON-LD schema injection for products, FAQs, and breadcrumbs',
            'Programmatic page generation with reusable content components',
          ]}
        />

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Frequently asked questions</h2>
          {faq.map((item) => (
            <div key={item.question} className="border border-white/10 rounded-xl p-4">
              <h3 className="font-medium">{item.question}</h3>
              <p className="text-zinc-300 mt-2">{item.answer}</p>
            </div>
          ))}
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Explore related pages</h2>
          <div className="flex flex-wrap gap-3">
            {Object.values(LANDINGS).map((entry) => (
              <Link key={entry.slug} className="px-4 py-2 border border-green-500 rounded-full hover:bg-green-500 hover:text-black transition" to={`/${entry.slug}`}>
                {entry.title}
              </Link>
            ))}
          </div>
        </section>
      </article>
    </main>
  );
}
