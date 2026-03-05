import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpDown, Brain, Edit3, LayoutGrid, List, Plus, Search, ShoppingBag, Trash2 } from 'lucide-react';
import type { Product } from '../../lib/types';
import CSVImporter from './CSVImporter';

export default function AdminProductsTab(props: any) {
  const {
    filteredProducts, products, searchQuery, setSearchQuery, viewMode, setViewMode, onOpenProductModal,
    onDeleteProduct, onSyncMissingVectors, isSyncingVectors, vectorSyncProgress, productsWithoutVectors,
    stockAdjust, setStockAdjust, onConfirmStockAdjust, isSaving, onReloadProducts,
  } = props;

  return <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-bold flex items-center gap-2"><ShoppingBag className="w-5 h-5" />Produits ({filteredProducts.length})</h2>
      <div className="flex gap-2">
        <button onClick={() => setViewMode('list')}><List className="w-4 h-4" /></button>
        <button onClick={() => setViewMode('grid')}><LayoutGrid className="w-4 h-4" /></button>
        <CSVImporter type="products" onComplete={onReloadProducts} exampleUrl="/examples/products_example.csv" />
        <button onClick={onSyncMissingVectors} disabled={isSyncingVectors || productsWithoutVectors.length === 0}><Brain className="w-4 h-4" />{vectorSyncProgress ? `${vectorSyncProgress.done}/${vectorSyncProgress.total}` : 'Sync IA'}</button>
        <button onClick={() => onOpenProductModal()}><Plus className="w-4 h-4" />Ajouter</button>
      </div>
    </div>
    <div className="relative"><Search className="absolute left-2 top-2 w-4 h-4" /><input className="pl-8" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
    <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-3' : 'space-y-2'}>
      {filteredProducts.map((product: Product) => <div key={product.id} className="border border-zinc-800 rounded-xl p-3 flex justify-between items-center">
        <div>{product.name}</div>
        <div className="flex gap-2">
          <button onClick={() => onOpenProductModal(product)}><Edit3 className="w-4 h-4" /></button>
          <button onClick={() => setStockAdjust({ id: product.id, qty: '', note: '' })}><ArrowUpDown className="w-4 h-4" /></button>
          <button onClick={() => onDeleteProduct(product.id)}><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>)}
    </div>
    <AnimatePresence>{stockAdjust && <motion.div><input value={stockAdjust.qty} onChange={(e) => setStockAdjust({ ...stockAdjust, qty: e.target.value })} />
    <input value={stockAdjust.note} onChange={(e) => setStockAdjust({ ...stockAdjust, note: e.target.value })} /><button onClick={onConfirmStockAdjust} disabled={isSaving}>Confirmer</button></motion.div>}</AnimatePresence>
  </div>;
}
