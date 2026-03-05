import { Link } from 'react-router-dom';
import SEO from '../../components/SEO';
import { articleSchema, breadcrumbSchema, faqSchema, howToSchema } from '../../lib/seo/schemaBuilder';

export const guideContent = {
  'guide-huile-cbd': {
    title: 'Guide complet de l’huile CBD',
    description: 'Tout comprendre sur les huiles CBD: spectres, concentration, utilisation et qualité.',
    summary: 'Guide expert pour choisir une huile CBD premium et comprendre son dosage.',
    body: 'Les huiles CBD sont la forme la plus utilisée du cannabidiol grâce à leur polyvalence. Chez Green Mood CBD, nous privilégions des huiles analysées en laboratoire, avec traçabilité et extraction propre. Pour comparer les produits, regardez le spectre (isolat, broad, full), la concentration, l’origine du chanvre et les certificats.',
    faq: [
      { question: 'Quelle concentration choisir ?', answer: 'Débutez à 10% puis adaptez selon la sensibilité et l’objectif bien-être.' },
      { question: 'Full spectrum ou broad spectrum ?', answer: 'Le full spectrum inclut plus de composés naturels, le broad retire le THC.' },
    ],
  },
  'guide-dosage-cbd': {
    title: 'Guide dosage CBD',
    description: 'Comment doser le CBD selon vos besoins: démarrage progressif et suivi.',
    summary: 'Méthode simple start low, go slow pour optimiser votre routine CBD.',
    body: 'Le bon dosage dépend du poids, du métabolisme et de l’objectif recherché. Commencez faible pendant 5 à 7 jours, puis augmentez par paliers. Notez vos sensations pour identifier la dose utile.',
    faq: [
      { question: 'Combien de gouttes au départ ?', answer: 'Commencez avec une faible dose quotidienne puis ajustez tous les 3 à 7 jours.' },
      { question: 'Puis-je prendre du CBD tous les jours ?', answer: 'Oui, une routine régulière est souvent utilisée pour stabiliser les effets.' },
    ],
  },
  'guide-cbd-sommeil': {
    title: 'CBD et sommeil: guide pratique',
    description: 'Optimiser votre récupération nocturne avec une routine CBD adaptée.',
    summary: 'Comprendre quand et comment utiliser le CBD pour améliorer la détente du soir.',
    body: 'Pour le sommeil, l’important est la régularité, l’hygiène de vie et le bon timing. Une prise 30 à 60 minutes avant le coucher peut favoriser la détente. Associez à une routine sans écran et respiration lente.',
    faq: [
      { question: 'Le CBD aide-t-il à s’endormir ?', answer: 'Il peut favoriser la détente, souvent utile dans une routine du soir.' },
      { question: 'Quelle forme privilégier ?', answer: 'Les huiles sublinguales sont précises, les infusions sont plus progressives.' },
    ],
  },
  'guide-cbd-anxiete': {
    title: 'CBD et anxiété: repères essentiels',
    description: 'Approche responsable du CBD pour la sérénité et la gestion du stress quotidien.',
    summary: 'Bonnes pratiques CBD pour réduire la charge mentale et soutenir la relaxation.',
    body: 'Le CBD est recherché pour son potentiel apaisant. Il ne remplace pas un suivi médical, mais peut compléter une routine de gestion du stress: sommeil, activité physique, respiration, et produits de qualité certifiée.',
    faq: [
      { question: 'Le CBD est-il une solution unique ?', answer: 'Non, il s’intègre dans une stratégie globale de bien-être.' },
      { question: 'En combien de temps sentir un effet ?', answer: 'Cela varie selon les profils; la régularité reste essentielle.' },
    ],
  },
  'guide-legalite-cbd-france': {
    title: 'Légalité du CBD en France: ce qu’il faut savoir',
    description: 'Réglementation française du CBD, seuil THC et conformité produit.',
    summary: 'Guide légal CBD France pour acheter des produits conformes et traçables.',
    body: 'En France, les produits CBD doivent respecter un taux de THC conforme à la réglementation. Vérifiez les analyses laboratoire, la traçabilité du lot et la transparence du vendeur pour rester dans un cadre sécurisé.',
    faq: [
      { question: 'Le CBD est-il légal en France ?', answer: 'Oui, sous conditions de conformité, notamment sur le taux de THC.' },
      { question: 'Comment vérifier un produit ?', answer: 'Consultez les certificats d’analyses et la fiche de lot.' },
    ],
  },
} as const;

export default function GuidePage({ slug }: { slug: keyof typeof guideContent }) {
  const content = guideContent[slug];
  const schema = [
    articleSchema({ title: content.title, description: content.description, path: `/guides/${slug}`, datePublished: '2026-01-01' }),
    faqSchema(content.faq),
    breadcrumbSchema([
      { name: 'Accueil', path: '/' },
      { name: 'Guides CBD', path: '/guides' },
      { name: content.title, path: `/guides/${slug}` },
    ]),
    howToSchema({
      name: `Comment utiliser ${content.title}`,
      description: content.description,
      steps: ['Choisir un produit CBD testé en laboratoire', 'Commencer à faible dose', 'Ajuster progressivement selon les ressentis'],
    }),
  ];

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 pt-28 pb-20">
      <SEO
        title={`${content.title} | Green Mood CBD`}
        description={content.description}
        canonical={`/guides/${slug}`}
        schema={schema}
        article={{ publishedTime: '2026-01-01', section: 'Guides CBD' }}
        keywords={['cbd', 'guide cbd', 'green mood cbd', 'cbd france', ...content.faq.map((f) => f.question)]}
        semanticKeywords={['cannabidiol', 'sommeil', 'anxiété', 'bien-être', 'relaxation']}
        aiSummary={content.summary}
        aiEntity="CBD;Cannabidiol;Sleep;Anxiety;Pain relief;Relaxation"
      />
      <section className="max-w-4xl mx-auto px-4 space-y-6">
        <p className="text-sm uppercase tracking-widest text-green-400">AI Summary</p>
        <p className="rounded-xl border border-green-500/30 bg-green-500/10 p-4">{content.summary}</p>
        <h1 className="text-4xl font-bold">{content.title}</h1>
        <p className="text-zinc-300 leading-7">{content.body}</p>

        <div className="space-y-3">
          <h2 className="text-2xl font-semibold">Questions fréquentes</h2>
          {content.faq.map((item) => (
            <article key={item.question} className="rounded-lg border border-zinc-800 p-4">
              <h3 className="font-medium">{item.question}</h3>
              <p className="text-zinc-300">{item.answer}</p>
            </article>
          ))}
        </div>

        <div className="pt-4 border-t border-zinc-800">
          <h2 className="text-xl font-semibold mb-3">Liens internes recommandés</h2>
          <div className="flex flex-wrap gap-3">
            <Link className="text-green-400 underline" to="/catalogue">Voir les produits CBD</Link>
            <Link className="text-green-400 underline" to="/boutique">Explorer la boutique</Link>
            <Link className="text-green-400 underline" to="/contact">Parler à un expert</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
