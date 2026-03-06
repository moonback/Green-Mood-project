import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    ShoppingBag,
    Plus,
    Search,
    List,
    LayoutGrid,
    Brain,
    Edit3,
    ArrowUpDown,
    Trash2,
    X,
    Hash,
    Star,
    Eye,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Product, Category } from '../../lib/types';
import CSVImporter from './CSVImporter';
import MassModifyModal from './MassModifyModal';
import AdminProductPreviewModal from './AdminProductPreviewModal';
import { generateEmbedding } from '../../lib/embeddings';
import { slugify, sleep, isQuotaError } from '../../lib/utils';

interface AdminProductsTabProps {
    products: Product[];
    categories: Category[];
    onRefresh: () => void;
}

const EMPTY_PRODUCT = {
    category_id: '',
    slug: '',
    name: '',
    sku: null as string | null,
    description: null as string | null,
    cbd_percentage: null as number | null,
    thc_max: 0.2 as number | null,
    weight_grams: null as number | null,
    price: 0,
    original_value: null as number | null,
    image_url: null as string | null,
    stock_quantity: 0,
    is_available: true,
    is_featured: false,
    is_active: true,
    is_bundle: false,
    is_subscribable: false,
    attributes: {
        benefits: [] as string[],
        aromas: [] as string[],
    },
};

const INPUT =
    'w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-green-primary transition-colors';
const LABEL = 'block text-xs text-zinc-400 mb-1 font-medium uppercase tracking-wider';

export default function AdminProductsTab({ products, categories, onRefresh }: AdminProductsTabProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
    const [isSaving, setIsSaving] = useState(false);
    const [isSyncingVectors, setIsSyncingVectors] = useState(false);
    const [vectorSyncProgress, setVectorSyncProgress] = useState<{ done: number; total: number } | null>(null);

    const ITEMS_PER_PAGE = 20;
    const [currentPage, setCurrentPage] = useState(1);

    // ── Product modal ──
    const [showProductModal, setShowProductModal] = useState(false);
    const [productForm, setProductForm] = useState(EMPTY_PRODUCT);
    const [editingProductId, setEditingProductId] = useState<string | null>(null);
    const [bundleItemsEditor, setBundleItemsEditor] = useState<{ product_id: string; quantity: number }[]>([]);

    // ── Mass Modification ──
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
    const [showMassModifyModal, setShowMassModifyModal] = useState(false);

    // ── Preview ──
    const [previewProduct, setPreviewProduct] = useState<Product | null>(null);

    // ── Stock adjustment ──
    const [stockAdjust, setStockAdjust] = useState<{ id: string; qty: string; note: string } | null>(null);

    const openProductModal = (product?: Product) => {
        if (product) {
            setEditingProductId(product.id);
            setProductForm({
                category_id: product.category_id,
                slug: product.slug,
                name: product.name,
                sku: product.sku ?? null,
                description: product.description,
                cbd_percentage: product.cbd_percentage,
                thc_max: product.thc_max,
                weight_grams: product.weight_grams,
                price: product.price,
                original_value: product.original_value ?? null,
                image_url: product.image_url,
                stock_quantity: product.stock_quantity,
                is_available: product.is_available,
                is_featured: product.is_featured,
                is_active: product.is_active,
                is_bundle: product.is_bundle ?? false,
                is_subscribable: product.is_subscribable ?? false,
                attributes: {
                    benefits: [],
                    aromas: [],
                    ...product.attributes,
                },
            });
            if (product.is_bundle) {
                supabase
                    .from('bundle_items')
                    .select('product_id, quantity')
                    .eq('bundle_id', product.id)
                    .then(({ data }) => {
                        setBundleItemsEditor((data ?? []) as { product_id: string; quantity: number }[]);
                    });
            } else {
                setBundleItemsEditor([]);
            }
        } else {
            setEditingProductId(null);
            setProductForm({ ...EMPTY_PRODUCT, category_id: categories[0]?.id ?? '' });
            setBundleItemsEditor([]);
        }
        setShowProductModal(true);
    };

    const handleSaveProduct = async (e: FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const payload = { ...productForm, slug: productForm.slug || slugify(productForm.name) };
        let savedId = editingProductId;
        if (editingProductId) {
            await supabase.from('products').update(payload).eq('id', editingProductId);
        } else {
            const { data: newProd } = await supabase.from('products').insert(payload).select('id').single();
            if (newProd) savedId = newProd.id;
        }
        if (productForm.is_bundle && savedId) {
            await supabase.from('bundle_items').delete().eq('bundle_id', savedId);
            if (bundleItemsEditor.length > 0) {
                await supabase.from('bundle_items').insert(
                    bundleItemsEditor.filter((i) => i.product_id).map((i) => ({ bundle_id: savedId, ...i }))
                );
            }
            await supabase.rpc('sync_bundle_stock', { p_bundle_id: savedId });
        }
        setShowProductModal(false);
        onRefresh();
        setIsSaving(false);
    };

    const handleDeleteProduct = async (id: string) => {
        if (!confirm('Désactiver ce produit ? Il ne sera plus visible dans le catalogue.')) return;
        await supabase.from('products').update({ is_active: false }).eq('id', id);
        onRefresh();
    };

    const handleStockAdjust = async () => {
        if (!stockAdjust) return;
        const qty = parseInt(stockAdjust.qty);
        if (isNaN(qty) || qty === 0) return;
        setIsSaving(true);
        const product = products.find((p) => p.id === stockAdjust.id);
        if (!product) { setIsSaving(false); return; }
        const newStock = Math.max(0, product.stock_quantity + qty);
        await supabase.from('products').update({ stock_quantity: newStock }).eq('id', stockAdjust.id);
        await supabase.from('stock_movements').insert({
            product_id: stockAdjust.id,
            quantity_change: qty,
            type: qty > 0 ? 'restock' : 'adjustment',
            note: stockAdjust.note || 'Ajustement manuel',
        });
        onRefresh();
        setStockAdjust(null);
        setIsSaving(false);
    };

    const hasEmbedding = (embedding: Product['embedding']) => {
        if (Array.isArray(embedding)) return embedding.length > 0;
        if (typeof embedding === 'string') return embedding.trim().length > 0 && embedding.trim() !== '[]';
        return false;
    };

    const buildProductEmbeddingText = (product: Product) => {
        const benefits = Array.isArray(product.attributes?.benefits)
            ? product.attributes.benefits.join(' ')
            : '';

        return [
            product.name,
            product.description ?? '',
            product.cbd_percentage ? `CBD ${product.cbd_percentage}%` : '',
            benefits,
        ]
            .filter(Boolean)
            .join(' ')
            .trim();
    };

    const productsWithoutVectors = products.filter((product) => !hasEmbedding(product.embedding));

    const handleSyncMissingVectors = async () => {
        if (productsWithoutVectors.length === 0 || isSyncingVectors) return;

        setIsSyncingVectors(true);
        setVectorSyncProgress({ done: 0, total: productsWithoutVectors.length });

        let successCount = 0;
        let failedCount = 0;
        let stoppedByQuota = false;

        for (let i = 0; i < productsWithoutVectors.length; i += 1) {
            const product = productsWithoutVectors[i];
            try {
                const textToEmbed = buildProductEmbeddingText(product);
                if (!textToEmbed) throw new Error('Texte vide pour la génération du vecteur.');

                const embedding = await generateEmbedding(textToEmbed);
                if (!embedding.length) throw new Error('Vecteur vide reçu depuis OpenRouter.');

                const { error } = await supabase
                    .from('products')
                    .update({ embedding })
                    .eq('id', product.id);

                if (error) throw error;

                successCount += 1;
            } catch (error) {
                failedCount += 1;

                if (isQuotaError(error)) {
                    stoppedByQuota = true;
                    break;
                }
            } finally {
                setVectorSyncProgress({ done: i + 1, total: productsWithoutVectors.length });
            }
            await sleep(700);
        }

        setIsSyncingVectors(false);
        setVectorSyncProgress(null);
        onRefresh();

        if (stoppedByQuota) {
            alert(`Quota OpenRouter atteint. Sync interrompue après ${successCount} succès.`);
        } else {
            alert(`Sync IA terminée: ${successCount}/${productsWithoutVectors.length} produit(s) vectorisé(s). Échecs: ${failedCount}.`);
        }
    };

    const filteredProducts = products.filter(
        (p) =>
            !searchQuery ||
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
    const paginatedProducts = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const toggleSelection = (id: string) => {
        setSelectedProductIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        if (selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0) {
            setSelectedProductIds([]);
        } else {
            setSelectedProductIds(filteredProducts.map(p => p.id));
        }
    };

    const allSelected = filteredProducts.length > 0 && selectedProductIds.length === filteredProducts.length;

    return (
        <div className="space-y-6">
            {/* Header: Search, Count & Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-green-neon" />
                        Inventaire des Produits
                        <span className="ml-2 px-2 py-0.5 bg-green-neon/10 text-green-neon border border-green-neon/20 rounded-full text-xs font-bold leading-none">
                            {filteredProducts.length}
                        </span>
                    </h2>
                    <p className="text-xs text-zinc-500 mt-1">Gérez votre catalogue et vos niveaux de stock.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-zinc-800 text-green-neon shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                            title="Vue Liste"
                        >
                            <List className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-zinc-800 text-green-neon shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                            title="Vue Grille"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                    </div>

                    <CSVImporter
                        type="products"
                        onComplete={onRefresh}
                        exampleUrl="/examples/products_example.csv"
                    />

                    {selectedProductIds.length > 0 && (
                        <button
                            onClick={() => setShowMassModifyModal(true)}
                            className="flex items-center gap-2 bg-green-900/40 hover:bg-green-600/60 border border-green-neon text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-green-neon/20 active:scale-95"
                        >
                            <Edit3 className="w-4 h-4" />
                            <span className="hidden sm:inline">Modif. massive ({selectedProductIds.length})</span>
                        </button>
                    )}

                    <button
                        onClick={handleSyncMissingVectors}
                        disabled={isSyncingVectors || productsWithoutVectors.length === 0}
                        className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all border border-zinc-700"
                        title="Générer les vecteurs IA"
                    >
                        <Brain className={`w-4 h-4 ${isSyncingVectors ? 'animate-pulse text-green-neon' : 'text-zinc-300'}`} />
                        <span>
                            {isSyncingVectors && vectorSyncProgress
                                ? `Sync IA ${vectorSyncProgress.done}/${vectorSyncProgress.total}`
                                : `Sync IA manquante (${productsWithoutVectors.length})`}
                        </span>
                    </button>

                    <button
                        onClick={() => openProductModal()}
                        className="flex items-center gap-2 bg-green-neon hover:bg-green-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-green-neon/20 active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Nouveau produit</span>
                        <span className="sm:hidden">Ajouter</span>
                    </button>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-4 flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                        }}
                        placeholder="Rechercher par nom, SKU ou description..."
                        className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-green-neon transition-all"
                    />
                </div>
            </div>

            {/* Views */}
            {viewMode === 'list' ? (
                <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-xs text-zinc-500 uppercase tracking-wider border-b border-zinc-800 bg-zinc-800/50">
                                    <th className="px-5 py-4 w-12 text-center">
                                        <input
                                            type="checkbox"
                                            onChange={toggleAll}
                                            checked={allSelected}
                                            className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-green-neon focus:ring-green-neon cursor-pointer"
                                        />
                                    </th>
                                    <th className="px-5 py-4 font-bold">Produit</th>
                                    <th className="px-5 py-4 font-bold">Catégorie</th>
                                    <th className="px-5 py-4 font-bold">Prix</th>
                                    <th className="px-5 py-4 font-bold">CBD</th>
                                    <th className="px-5 py-4 font-bold">Stock</th>
                                    <th className="px-5 py-4 font-bold">Statut</th>
                                    <th className="px-5 py-4 text-center font-bold" title="Statut IA">IA</th>
                                    <th className="px-5 py-4 text-right font-bold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/80">
                                {paginatedProducts.map((product) => (
                                    <tr key={product.id} className="hover:bg-zinc-800/40 transition-colors group">
                                        <td className="px-5 py-4 text-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedProductIds.includes(product.id)}
                                                onChange={() => toggleSelection(product.id)}
                                                className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-green-neon focus:ring-green-neon cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-zinc-800 ring-1 ring-zinc-700/50 group-hover:ring-green-neon/50 transition-all">
                                                    <img
                                                        src={product.image_url ?? ''}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-white text-sm group-hover:text-green-neon transition-colors line-clamp-1">{product.name}</p>
                                                    <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{product.sku || 'SANS-SKU'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="text-xs px-2 py-1 rounded-md bg-zinc-800 text-zinc-400 border border-zinc-700">
                                                {(product.category as Category | undefined)?.name ?? 'Divers'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 font-bold text-white text-sm">
                                            {product.price.toFixed(2)} €
                                        </td>
                                        <td className="px-5 py-4 text-sm font-medium text-zinc-400">
                                            {product.cbd_percentage != null ? (
                                                <span className="text-green-neon/80">{product.cbd_percentage}%</span>
                                            ) : '—'}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span
                                                    className={`font-bold text-sm ${product.stock_quantity === 0
                                                        ? 'text-red-400'
                                                        : product.stock_quantity <= 5
                                                            ? 'text-orange-400'
                                                            : 'text-white'
                                                        }`}
                                                >
                                                    {product.stock_quantity}
                                                </span>
                                                <div className="w-12 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${product.stock_quantity === 0 ? 'bg-red-500' : product.stock_quantity <= 5 ? 'bg-orange-500' : 'bg-green-500'}`}
                                                        style={{ width: `${Math.min(100, (product.stock_quantity / 50) * 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex gap-1.5 flex-wrap">
                                                <span
                                                    className={`text-[10px] font-bold uppercase tracking-tight px-2 py-0.5 rounded-lg border ${product.is_active
                                                        ? 'text-green-400 bg-green-900/20 border-green-800/50'
                                                        : 'text-zinc-500 bg-zinc-900 border-zinc-800'
                                                        }`}
                                                >
                                                    {product.is_active ? 'Actif' : 'Masqué'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex justify-center">
                                                {product.embedding ? (
                                                    <div className="w-8 h-8 rounded-full bg-green-neon/10 flex items-center justify-center border border-green-neon/20" title="Optimisé IA">
                                                        <Brain className="w-4 h-4 text-green-neon" />
                                                    </div>
                                                ) : (
                                                    <Brain className="w-4 h-4 text-zinc-700 opacity-30" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => setPreviewProduct(product)}
                                                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
                                                    title="Aperçu"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => openProductModal(product)}
                                                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
                                                    title="Modifier"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setStockAdjust({ id: product.id, qty: '', note: '' })}
                                                    className="p-2 text-zinc-400 hover:text-green-neon hover:bg-zinc-800 rounded-lg transition-all"
                                                    title="Stock"
                                                >
                                                    <ArrowUpDown className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteProduct(product.id)}
                                                    className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-all"
                                                    title="Désactiver"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {paginatedProducts.map((product) => (
                        <motion.div
                            key={product.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden group hover:border-green-neon/30 transition-all flex flex-col shadow-lg"
                        >
                            <div className="relative aspect-square bg-zinc-800 overflow-hidden">
                                <div className="absolute top-2 left-2 z-10 bg-black/40 rounded p-1 backdrop-blur-md">
                                    <input
                                        type="checkbox"
                                        checked={selectedProductIds.includes(product.id)}
                                        onChange={() => toggleSelection(product.id)}
                                        className="w-5 h-5 rounded border-zinc-700 bg-zinc-800 text-green-neon focus:ring-green-neon cursor-pointer shadow-lg"
                                    />
                                </div>
                                <img
                                    src={product.image_url ?? ''}
                                    alt={product.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute top-2 right-2 flex flex-col gap-2">
                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border ${product.is_active ? 'bg-green-950/40 text-green-400 border-green-800/50' : 'bg-zinc-950/40 text-zinc-400 border-zinc-800'}`}>
                                        {product.is_active ? 'En ligne' : 'Masqué'}
                                    </span>
                                    {product.is_featured && (
                                        <span className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase bg-yellow-400 text-black border border-yellow-500 flex items-center gap-1">
                                            <Star className="w-3 h-3 fill-current" />
                                            Top
                                        </span>
                                    )}
                                </div>
                                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-end">
                                    <span className="text-lg font-bold text-white leading-none">{product.price.toFixed(2)} €</span>
                                </div>
                            </div>

                            <div className="p-4 flex-1 flex flex-col space-y-3">
                                <div>
                                    <h3 className="font-semibold text-white group-hover:text-green-neon transition-colors line-clamp-1">{product.name}</h3>
                                    <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider mt-0.5">
                                        {(product.category as Category | undefined)?.name ?? 'Divers'}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between text-xs py-2 border-y border-zinc-800/50">
                                    <div className="flex flex-col">
                                        <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-tighter">Stock</span>
                                        <span className={`font-bold ${product.stock_quantity <= 5 ? 'text-orange-400' : 'text-white'}`}>
                                            {product.stock_quantity}
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-tighter">CBD</span>
                                        <span className="font-bold text-green-neon/80">{product.cbd_percentage ?? 0}%</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 pt-1">
                                    <button
                                        onClick={() => setPreviewProduct(product)}
                                        className="p-2 bg-zinc-800 hover:bg-white/10 hover:text-white text-zinc-400 rounded-xl border border-zinc-700 transition-all"
                                        title="Aperçu"
                                    >
                                        <Eye className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => openProductModal(product)}
                                        className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold py-2 rounded-xl border border-zinc-700 transition-all"
                                    >
                                        <Edit3 className="w-3.5 h-3.5" />
                                        Modifier
                                    </button>
                                    <button
                                        onClick={() => setStockAdjust({ id: product.id, qty: '', note: '' })}
                                        className="p-2 bg-zinc-800 hover:bg-green-neon/10 hover:text-green-neon text-zinc-400 rounded-xl border border-zinc-700 transition-all"
                                    >
                                        <ArrowUpDown className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteProduct(product.id)}
                                        className="p-2 bg-zinc-800 hover:bg-red-500/10 hover:text-red-500 text-zinc-400 rounded-xl border border-zinc-700 transition-all"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        <ChevronLeft className="w-5 h-5 text-white" />
                    </button>
                    <span className="text-zinc-500 font-medium text-sm px-4">
                        Page {currentPage} sur {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        <ChevronRight className="w-5 h-5 text-white" />
                    </button>
                </div>
            )}

            {/* Stock adjustment inline */}
            <AnimatePresence>
                {stockAdjust && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="bg-zinc-900 border border-green-primary/40 rounded-2xl p-5"
                    >
                        <p className="text-sm font-medium text-white mb-3">
                            Ajustement —{' '}
                            <span className="text-green-neon">
                                {products.find((p) => p.id === stockAdjust.id)?.name}
                            </span>
                        </p>
                        <div className="flex gap-3 flex-wrap">
                            <input
                                type="number"
                                placeholder="Ex: +10 or -5"
                                value={stockAdjust.qty}
                                onChange={(e) => setStockAdjust({ ...stockAdjust, qty: e.target.value })}
                                className="w-36 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-primary"
                            />
                            <input
                                type="text"
                                placeholder="Note..."
                                value={stockAdjust.note}
                                onChange={(e) => setStockAdjust({ ...stockAdjust, note: e.target.value })}
                                className="flex-1 min-w-40 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-primary"
                            />
                            <button
                                onClick={handleStockAdjust}
                                disabled={isSaving}
                                className="bg-green-neon hover:bg-green-600 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
                            >
                                Confirmer
                            </button>
                            <button
                                onClick={() => setStockAdjust(null)}
                                className="text-zinc-400 hover:text-white px-3 text-sm transition-colors"
                            >
                                Annuler
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Product Modal */}
            <AnimatePresence>
                {showProductModal && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowProductModal(false)}
                            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="fixed inset-x-4 top-4 bottom-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl bg-zinc-900 border border-zinc-700 rounded-2xl z-50 flex flex-col"
                        >
                            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 flex-shrink-0">
                                <h2 className="font-serif text-xl font-bold">
                                    {editingProductId ? 'Modifier le produit' : 'Nouveau produit'}
                                </h2>
                                <button onClick={() => setShowProductModal(false)} className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className={LABEL}>Nom du produit *</label>
                                        <input
                                            required
                                            value={productForm.name}
                                            onChange={(e) =>
                                                setProductForm({ ...productForm, name: e.target.value, slug: slugify(e.target.value) })
                                            }
                                            className={INPUT}
                                        />
                                    </div>

                                    <div>
                                        <label className={LABEL}>Slug (URL)</label>
                                        <input
                                            value={productForm.slug}
                                            onChange={(e) => setProductForm({ ...productForm, slug: e.target.value })}
                                            className={INPUT}
                                        />
                                    </div>

                                    <div>
                                        <label className={LABEL}>Catégorie *</label>
                                        <select
                                            required
                                            value={productForm.category_id}
                                            onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                                            className={INPUT}
                                        >
                                            <option value="">Choisir…</option>
                                            {categories.map((c) => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="col-span-2">
                                        <label className={LABEL}>Code-barres / SKU</label>
                                        <div className="relative">
                                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                            <input
                                                value={productForm.sku ?? ''}
                                                onChange={(e) => setProductForm({ ...productForm, sku: e.target.value || null })}
                                                className={`${INPUT} pl-10`}
                                            />
                                        </div>
                                    </div>

                                    <div className="col-span-2">
                                        <label className={LABEL}>Description</label>
                                        <textarea
                                            rows={3}
                                            value={productForm.description ?? ''}
                                            onChange={(e) => setProductForm({ ...productForm, description: e.target.value || null })}
                                            className={INPUT}
                                        />
                                    </div>

                                    <div>
                                        <label className={LABEL}>Prix (€) *</label>
                                        <input
                                            required
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={productForm.price}
                                            onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })}
                                            className={INPUT}
                                        />
                                    </div>

                                    <div>
                                        <label className={LABEL}>Stock initial</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={productForm.stock_quantity}
                                            onChange={(e) => setProductForm({ ...productForm, stock_quantity: parseInt(e.target.value) || 0 })}
                                            className={INPUT}
                                        />
                                    </div>

                                    <div>
                                        <label className={LABEL}>CBD (%)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            max="100"
                                            value={productForm.cbd_percentage ?? ''}
                                            onChange={(e) =>
                                                setProductForm({ ...productForm, cbd_percentage: e.target.value ? parseFloat(e.target.value) : null })
                                            }
                                            className={INPUT}
                                        />
                                    </div>

                                    <div>
                                        <label className={LABEL}>THC max (%)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="0.3"
                                            value={productForm.thc_max ?? ''}
                                            onChange={(e) =>
                                                setProductForm({ ...productForm, thc_max: e.target.value ? parseFloat(e.target.value) : null })
                                            }
                                            className={INPUT}
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="flex-1 bg-green-neon hover:bg-green-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all"
                                    >
                                        {isSaving ? 'Enregistrement…' : editingProductId ? 'Mettre à jour' : 'Créer le produit'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowProductModal(false)}
                                        className="px-6 text-zinc-400 hover:text-white font-medium"
                                    >
                                        Annuler
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <MassModifyModal
                isOpen={showMassModifyModal}
                onClose={() => setShowMassModifyModal(false)}
                selectedIds={selectedProductIds}
                categories={categories}
                onSuccess={() => {
                    setSelectedProductIds([]);
                    onRefresh();
                }}
            />

            <AdminProductPreviewModal
                product={previewProduct}
                isOpen={previewProduct !== null}
                onClose={() => setPreviewProduct(null)}
            />
        </div>
    );
}
