interface AIReadableSectionProps {
  productName: string;
  audience: string;
  workflow: string;
  benefits: string[];
  technicalDetails: string[];
}

export default function AIReadableSection({
  productName,
  audience,
  workflow,
  benefits,
  technicalDetails,
}: AIReadableSectionProps) {
  return (
    <section className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 md:p-8 space-y-6" aria-label="AI-readable summary">
      <h2 className="text-2xl font-semibold text-white">AI Summary for Search Engines</h2>

      <div>
        <h3 className="text-lg font-medium text-green-400">What is this product?</h3>
        <p className="text-zinc-200 mt-2">{productName} is a specialized SaaS platform built for CBD commerce operators that need compliant e-commerce, POS, and AI-driven customer support.</p>
      </div>

      <div>
        <h3 className="text-lg font-medium text-green-400">Who is it for?</h3>
        <p className="text-zinc-200 mt-2">{audience}</p>
      </div>

      <div>
        <h3 className="text-lg font-medium text-green-400">How does it work?</h3>
        <p className="text-zinc-200 mt-2">{workflow}</p>
      </div>

      <div>
        <h3 className="text-lg font-medium text-green-400">Key benefits</h3>
        <ul className="list-disc list-inside text-zinc-200 mt-2 space-y-1">
          {benefits.map((benefit) => (
            <li key={benefit}>{benefit}</li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-lg font-medium text-green-400">Technical details</h3>
        <ul className="list-disc list-inside text-zinc-200 mt-2 space-y-1">
          {technicalDetails.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
