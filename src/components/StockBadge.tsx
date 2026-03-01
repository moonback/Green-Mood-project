interface StockBadgeProps {
  stock: number;
}

export default function StockBadge({ stock }: StockBadgeProps) {
  if (stock === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-red-900/25 text-red-400 border border-red-800/40">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
        Rupture de stock
      </span>
    );
  }
  if (stock <= 5) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-orange-900/25 text-orange-400 border border-orange-800/40">
        <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
        Stock limité ({stock} restant{stock > 1 ? "s" : ""})
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-green-900/25 text-green-400 border border-green-800/40">
      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
      En stock
    </span>
  );
}
