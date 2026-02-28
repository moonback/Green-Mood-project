
interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  schema?: object;
}

export default function SEO({ title, description, keywords, schema }: SEOProps) {
  // Base URL for canonical links and Open Graph
  const siteUrl = 'https://greenMood-cbd.fr'; // Replace with actual domain

  return (
    <>
      {/* Standard SEO */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}

      {/* Open Graph / Social Media */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={siteUrl} />
      <meta property="og:site_name" content="Green Mood CBD Shop" />
      <meta property="og:locale" content="fr_FR" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />

      {/* GEO (Generative Engine Optimization) - Structured Data */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </>
  );
}
