import { supabase } from './supabase';
import { Product, SubscriptionFrequency } from './types';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useLiveBudtenderStore } from '../store/liveBudtenderStore';

// ─── Tool Declarations (Google GenAI FunctionDeclaration format) ─────────────

export const LIVE_BUDTENDER_TOOLS = [
    {
        name: 'search_products',
        description:
            'Rechercher et filtrer des produits dans le catalogue Green Moon CBD. Utilise cet outil pour trouver des produits selon la catégorie, le prix, le pourcentage de CBD, les bienfaits ou des mots-clés.',
        parameters: {
            type: 'object' as const,
            properties: {
                query: { type: 'string' as const, description: 'Recherche texte libre (nom, description, bienfaits)' },
                category: { type: 'string' as const, description: 'Slug catégorie: huiles, fleurs, resines, infusions, packs' },
                min_price: { type: 'number' as const, description: 'Prix minimum en euros' },
                max_price: { type: 'number' as const, description: 'Prix maximum en euros' },
                min_cbd: { type: 'number' as const, description: 'Pourcentage CBD minimum' },
                is_subscribable: { type: 'boolean' as const, description: 'Filtrer uniquement les produits avec abonnement possible' },
                limit: { type: 'number' as const, description: 'Nombre maximum de résultats (défaut 5)' },
            },
        },
    },
    {
        name: 'get_product_details',
        description: "Obtenir les détails complets d'un produit par son nom ou ID, incluant prix, description, CBD%, stock et attributs.",
        parameters: {
            type: 'object' as const,
            properties: {
                product_name: { type: 'string' as const, description: 'Le nom exact ou partiel du produit' },
                product_id: { type: 'string' as const, description: 'Le UUID du produit (si connu)' },
            },
        },
    },
    {
        name: 'add_to_cart',
        description: 'Ajouter un produit au panier du client.',
        parameters: {
            type: 'object' as const,
            properties: {
                product_name: { type: 'string' as const, description: 'Le nom du produit à ajouter' },
                product_id: { type: 'string' as const, description: 'Le UUID du produit' },
                quantity: { type: 'number' as const, description: 'Quantité à ajouter (défaut 1)' },
            },
            required: ['product_name'],
        },
    },
    {
        name: 'remove_from_cart',
        description: 'Retirer un produit du panier.',
        parameters: {
            type: 'object' as const,
            properties: {
                product_name: { type: 'string' as const, description: 'Le nom du produit à retirer' },
                product_id: { type: 'string' as const, description: 'Le UUID du produit' },
            },
            required: ['product_name'],
        },
    },
    {
        name: 'update_cart_quantity',
        description: "Modifier la quantité d'un produit déjà dans le panier.",
        parameters: {
            type: 'object' as const,
            properties: {
                product_name: { type: 'string' as const, description: 'Le nom du produit' },
                product_id: { type: 'string' as const, description: 'Le UUID du produit' },
                quantity: { type: 'number' as const, description: 'Nouvelle quantité' },
            },
            required: ['product_name', 'quantity'],
        },
    },
    {
        name: 'get_cart_contents',
        description: 'Voir le contenu actuel du panier avec les articles, quantités et le total.',
        parameters: {
            type: 'object' as const,
            properties: {},
        },
    },
    {
        name: 'create_subscription',
        description: "Créer un abonnement récurrent pour un produit. Le client doit être connecté.",
        parameters: {
            type: 'object' as const,
            properties: {
                product_name: { type: 'string' as const, description: "Le produit pour l'abonnement" },
                product_id: { type: 'string' as const, description: 'Le UUID du produit' },
                quantity: { type: 'number' as const, description: 'Quantité par livraison (défaut 1)' },
                frequency: {
                    type: 'string' as const,
                    description: 'Fréquence de livraison: weekly (hebdomadaire), biweekly (bi-mensuel), monthly (mensuel)',
                },
            },
            required: ['product_name', 'frequency'],
        },
    },
    {
        name: 'get_categories',
        description: 'Lister toutes les catégories de produits disponibles en boutique.',
        parameters: {
            type: 'object' as const,
            properties: {},
        },
    },
];

// ─── Helper: resolve product by name ─────────────────────────────────────────

async function resolveProduct(name?: string, id?: string): Promise<Product | null> {
    if (id) {
        const { data } = await supabase
            .from('products')
            .select('*, category:categories(slug, name)')
            .eq('id', id)
            .eq('is_active', true)
            .single();
        return data as Product | null;
    }

    if (name) {
        const { data } = await supabase
            .from('products')
            .select('*, category:categories(slug, name)')
            .eq('is_active', true)
            .eq('is_available', true)
            .ilike('name', `%${name}%`)
            .limit(1);
        return (data && data.length > 0) ? data[0] as Product : null;
    }

    return null;
}

// ─── Tool Handler Dispatcher ─────────────────────────────────────────────────

export async function handleToolCall(
    name: string,
    args: Record<string, any>
): Promise<any> {
    const store = useLiveBudtenderStore.getState();

    switch (name) {
        case 'search_products': {
            let query = supabase
                .from('products')
                .select('*, category:categories(slug, name)')
                .eq('is_active', true)
                .eq('is_available', true);

            if (args.category) {
                // Join filter on category slug
                query = query.eq('category.slug', args.category);
            }
            if (args.min_price !== undefined) {
                query = query.gte('price', args.min_price);
            }
            if (args.max_price !== undefined) {
                query = query.lte('price', args.max_price);
            }
            if (args.min_cbd !== undefined) {
                query = query.gte('cbd_percentage', args.min_cbd);
            }
            if (args.is_subscribable) {
                query = query.eq('is_subscribable', true);
            }

            const limit = args.limit ?? 5;
            query = query.limit(limit);

            const { data, error } = await query;
            if (error) return { error: error.message };

            let results = (data ?? []) as Product[];

            // Text search filter (client-side for ilike on multiple fields)
            if (args.query) {
                const q = args.query.toLowerCase();
                results = results.filter(
                    (p) =>
                        p.name.toLowerCase().includes(q) ||
                        (p.description ?? '').toLowerCase().includes(q) ||
                        (p.attributes?.benefits ?? []).some((b: string) => b.toLowerCase().includes(q)) ||
                        (p.attributes?.aromas ?? []).some((a: string) => a.toLowerCase().includes(q))
                );
            }

            // If text search returned nothing, try a broader ilike search
            if (results.length === 0 && args.query) {
                const { data: fallbackData } = await supabase
                    .from('products')
                    .select('*, category:categories(slug, name)')
                    .eq('is_active', true)
                    .eq('is_available', true)
                    .ilike('name', `%${args.query}%`)
                    .limit(limit);
                results = (fallbackData ?? []) as Product[];
            }

            // Update recommended products in store
            if (results.length > 0) {
                store.setRecommendedProducts(
                    results.map((p) => ({ product: p, reason: args.query || args.category || 'Recommandé' }))
                );
            }

            return {
                count: results.length,
                products: results.map((p) => ({
                    id: p.id,
                    name: p.name,
                    category: p.category?.name ?? 'N/A',
                    price: `${p.price}€`,
                    cbd_percentage: p.cbd_percentage ? `${p.cbd_percentage}%` : 'N/A',
                    weight: p.weight_grams ? `${p.weight_grams}g` : 'N/A',
                    description: p.description?.substring(0, 120) ?? '',
                    in_stock: p.stock_quantity > 0,
                    is_subscribable: p.is_subscribable,
                    benefits: p.attributes?.benefits ?? [],
                })),
            };
        }

        case 'get_product_details': {
            const product = await resolveProduct(args.product_name, args.product_id);
            if (!product) return { error: 'Produit introuvable' };

            // Add to recommended products
            store.addRecommendedProduct({ product, reason: 'Détails consultés' });

            return {
                id: product.id,
                name: product.name,
                category: product.category?.name ?? 'N/A',
                price: `${product.price}€`,
                original_value: product.original_value ? `${product.original_value}€` : null,
                cbd_percentage: product.cbd_percentage ? `${product.cbd_percentage}%` : 'N/A',
                thc_max: product.thc_max ? `${product.thc_max}%` : 'N/A',
                weight: product.weight_grams ? `${product.weight_grams}g` : 'N/A',
                description: product.description ?? '',
                stock_quantity: product.stock_quantity,
                is_featured: product.is_featured,
                is_bundle: product.is_bundle,
                is_subscribable: product.is_subscribable,
                benefits: product.attributes?.benefits ?? [],
                aromas: product.attributes?.aromas ?? [],
            };
        }

        case 'add_to_cart': {
            const product = await resolveProduct(args.product_name, args.product_id);
            if (!product) return { error: `Produit "${args.product_name}" introuvable` };
            if (product.stock_quantity <= 0) return { error: `${product.name} est en rupture de stock` };

            const cart = useCartStore.getState();
            const qty = args.quantity ?? 1;
            for (let i = 0; i < qty; i++) {
                cart.addItem(product);
            }

            store.setLastCartAction({
                type: 'add',
                productName: product.name,
                timestamp: Date.now(),
            });

            // Also add to recommended products for visibility
            store.addRecommendedProduct({ product, reason: 'Ajouté au panier' });

            return {
                success: true,
                message: `${product.name} (x${qty}) ajouté au panier`,
                cart_total: `${cart.total().toFixed(2)}€`,
                cart_items: cart.itemCount(),
            };
        }

        case 'remove_from_cart': {
            const cart = useCartStore.getState();
            const cartItem = cart.items.find(
                (i) =>
                    i.product.id === args.product_id ||
                    i.product.name.toLowerCase().includes((args.product_name ?? '').toLowerCase())
            );
            if (!cartItem) return { error: `"${args.product_name}" n'est pas dans le panier` };

            cart.removeItem(cartItem.product.id);

            store.setLastCartAction({
                type: 'remove',
                productName: cartItem.product.name,
                timestamp: Date.now(),
            });

            return {
                success: true,
                message: `${cartItem.product.name} retiré du panier`,
                cart_total: `${cart.total().toFixed(2)}€`,
                cart_items: cart.itemCount(),
            };
        }

        case 'update_cart_quantity': {
            const cart = useCartStore.getState();
            const cartItem = cart.items.find(
                (i) =>
                    i.product.id === args.product_id ||
                    i.product.name.toLowerCase().includes((args.product_name ?? '').toLowerCase())
            );
            if (!cartItem) return { error: `"${args.product_name}" n'est pas dans le panier` };

            cart.updateQuantity(cartItem.product.id, args.quantity);

            store.setLastCartAction({
                type: 'update',
                productName: cartItem.product.name,
                timestamp: Date.now(),
            });

            return {
                success: true,
                message: `${cartItem.product.name} mis à jour: quantité = ${args.quantity}`,
                cart_total: `${cart.total().toFixed(2)}€`,
            };
        }

        case 'get_cart_contents': {
            const cart = useCartStore.getState();
            return {
                items: cart.items.map((i) => ({
                    name: i.product.name,
                    price: `${i.product.price}€`,
                    quantity: i.quantity,
                    line_total: `${(i.product.price * i.quantity).toFixed(2)}€`,
                })),
                item_count: cart.itemCount(),
                subtotal: `${cart.subtotal().toFixed(2)}€`,
                delivery_fee: `${cart.deliveryFee().toFixed(2)}€`,
                total: `${cart.total().toFixed(2)}€`,
                delivery_type: cart.deliveryType,
            };
        }

        case 'create_subscription': {
            const user = useAuthStore.getState().user;
            if (!user) {
                return { error: 'Le client doit être connecté pour créer un abonnement. Demandez-lui de se connecter.' };
            }

            const product = await resolveProduct(args.product_name, args.product_id);
            if (!product) return { error: `Produit "${args.product_name}" introuvable` };
            if (!product.is_subscribable) return { error: `${product.name} n'est pas disponible en abonnement` };

            const frequency = args.frequency as SubscriptionFrequency;
            const quantity = args.quantity ?? 1;

            // Calculate next delivery date
            const now = new Date();
            const daysMap: Record<string, number> = { weekly: 7, biweekly: 14, monthly: 30 };
            now.setDate(now.getDate() + (daysMap[frequency] ?? 30));

            const { data, error } = await supabase.from('subscriptions').insert({
                user_id: user.id,
                product_id: product.id,
                quantity,
                frequency,
                next_delivery_date: now.toISOString().split('T')[0],
                status: 'active',
            }).select().single();

            if (error) return { error: `Erreur création abonnement: ${error.message}` };

            store.setLastSubscriptionAction({
                productName: product.name,
                frequency,
                timestamp: Date.now(),
            });

            const freqLabels: Record<string, string> = {
                weekly: 'hebdomadaire',
                biweekly: 'bi-mensuel',
                monthly: 'mensuel',
            };

            return {
                success: true,
                message: `Abonnement ${freqLabels[frequency]} créé pour ${product.name} (x${quantity})`,
                subscription_id: data?.id,
                next_delivery: now.toISOString().split('T')[0],
            };
        }

        case 'get_categories': {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .eq('is_active', true)
                .order('sort_order');

            if (error) return { error: error.message };

            return {
                categories: (data ?? []).map((c: any) => ({
                    name: c.name,
                    slug: c.slug,
                    description: c.description,
                })),
            };
        }

        default:
            return { error: `Outil inconnu: ${name}` };
    }
}
