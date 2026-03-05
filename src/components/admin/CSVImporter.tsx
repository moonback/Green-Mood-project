import React, { useRef, useState } from 'react';
import { Upload, FileDown, AlertCircle, CheckCircle2 } from 'lucide-react';
import Papa from 'papaparse';
import { supabase } from '../../lib/supabase';

interface CSVImporterProps {
    type: 'products' | 'categories';
    onComplete: () => void;
    exampleUrl: string;
}

export default function CSVImporter({ type, onComplete, exampleUrl }: CSVImporterProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        setError(null);
        setSuccess(null);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    const data = results.data as any[];

                    if (type === 'categories') {
                        await importCategories(data);
                    } else {
                        await importProducts(data);
                    }

                    setSuccess(`${data.length} ${type === 'categories' ? 'catégories' : 'produits'} importés avec succès.`);
                    onComplete();
                    if (fileInputRef.current) fileInputRef.current.value = '';
                } catch (err: any) {
                    console.error('Import error:', err);
                    setError(err.message || 'Une erreur est survenue lors de l\'importation.');
                } finally {
                    setIsImporting(false);
                }
            },
            error: (err) => {
                setError('Erreur lors de la lecture du fichier CSV.');
                setIsImporting(false);
            }
        });
    };

    const importCategories = async (data: any[]) => {
        // Basic validation & formatting
        const categoriesToUpsert = data.map(row => ({
            name: row.name,
            slug: (row.slug || slugify(row.name)).trim().toLowerCase(),
            description: row.description || null,
            is_active: row.is_active === 'true' || row.is_active === true,
            sort_order: parseInt(row.sort_order) || 0,
        }));

        const { error } = await supabase.from('categories').upsert(categoriesToUpsert, { onConflict: 'slug' });
        if (error) throw error;
    };

    const importProducts = async (data: any[]) => {
        // 1. Get all categories for slug matching
        const { data: categories, error: catError } = await supabase.from('categories').select('id, slug');
        if (catError) throw catError;

        // Use trimmed slugs for matching
        const categoryMap = new Map(categories?.map(c => [c.slug.trim().toLowerCase(), c.id]));

        // 2. Format products
        const productsToUpsert = data.map((row, index) => {
            const rawSlug = (row.category_slug || '').toString().trim().toLowerCase();
            const categoryId = categoryMap.get(rawSlug);

            if (!categoryId && rawSlug) {
                throw new Error(`Erreur ligne ${index + 2}: La catégorie avec le slug "${rawSlug}" n'existe pas en base. Veuillez importer les catégories d'abord.`);
            }

            if (!categoryId) {
                throw new Error(`Erreur ligne ${index + 2}: Le champ "category_slug" est obligatoire.`);
            }

            return {
                category_id: categoryId,
                name: row.name,
                slug: row.slug || slugify(row.name),
                sku: row.sku || null,
                description: row.description || null,
                price: parseFloat(row.price) || 0,
                original_value: row.original_value ? parseFloat(row.original_value) : null,
                stock_quantity: parseInt(row.stock_quantity) || 0,
                cbd_percentage: row.cbd_percentage ? parseFloat(row.cbd_percentage) : null,
                thc_max: row.thc_max ? parseFloat(row.thc_max) : 0.2,
                weight_grams: row.weight_grams ? parseFloat(row.weight_grams) : null,
                is_available: row.is_available === 'true' || row.is_available === true,
                is_active: row.is_active === 'true' || row.is_active === true,
                is_featured: row.is_featured === 'true' || row.is_featured === true,
                is_subscribable: row.is_subscribable === 'true' || row.is_subscribable === true,
                image_url: row.image_url || null,
                attributes: { benefits: [], aromas: [] } // Default attributes
            };
        });

        const { error } = await supabase.from('products').upsert(productsToUpsert, { onConflict: 'slug' });
        if (error) throw error;
    };

    const slugify = (s: string) =>
        s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-3">
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting}
                    className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all border border-zinc-700"
                >
                    {isImporting ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Upload className="w-4 h-4" />
                    )}
                    Importer CSV
                </button>

                <a
                    href={exampleUrl}
                    download
                    className="flex items-center gap-2 text-zinc-400 hover:text-white text-xs transition-colors"
                >
                    <FileDown className="w-3.5 h-3.5" />
                    Exemple CSV
                </a>

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImport}
                    accept=".csv"
                    className="hidden"
                />
            </div>

            {error && (
                <div className="flex items-start gap-2 text-red-400 bg-red-400/10 border border-red-400/20 p-3 rounded-xl text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>{error}</p>
                </div>
            )}

            {success && (
                <div className="flex items-start gap-2 text-green-400 bg-green-400/10 border border-green-400/20 p-3 rounded-xl text-sm">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>{success}</p>
                </div>
            )}
        </div>
    );
}
