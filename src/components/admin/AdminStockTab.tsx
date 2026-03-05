import { BarChart3 } from 'lucide-react';

export default function AdminStockTab({ products, movements, stockAdjust, setStockAdjust, onConfirmStockAdjust }: any) {
  return <div className="space-y-4">
    <h2 className="flex items-center gap-2"><BarChart3 className="w-5 h-5" />Stock</h2>
    {products.map((p: any) => <div key={p.id} className="flex justify-between border rounded p-2"><span>{p.name}</span><button onClick={() => setStockAdjust({ id: p.id, qty: '', note: '' })}>Ajuster</button></div>)}
    {stockAdjust && <div><input value={stockAdjust.qty} onChange={(e) => setStockAdjust({ ...stockAdjust, qty: e.target.value })} /><button onClick={onConfirmStockAdjust}>OK</button></div>}
    <div>{movements.length} mouvements</div>
  </div>;
}
