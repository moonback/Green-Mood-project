import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { guideContent } from './guides/GuidePage';
import { breadcrumbSchema } from '../lib/seo/schemaBuilder';

export default function Guides() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white pt-28 pb-20 px-4">
      <SEO
        title="Guides CBD experts | Green Mood CBD"
        description="Guides complets sur le CBD: huiles, dosage, sommeil, anxiété et légalité en France."
        canonical="/guides"
        schema={breadcrumbSchema([
          { name: 'Accueil', path: '/' },
          { name: 'Guides CBD', path: '/guides' },
        ])}
      />
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Guides CBD</h1>
        <div className="grid md:grid-cols-2 gap-4">
          {Object.entries(guideContent).map(([slug, guide]) => (
            <Link key={slug} to={`/guides/${slug}`} className="rounded-xl border border-zinc-800 p-5 hover:border-green-500">
              <h2 className="font-semibold text-xl mb-2">{guide.title}</h2>
              <p className="text-zinc-300">{guide.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
