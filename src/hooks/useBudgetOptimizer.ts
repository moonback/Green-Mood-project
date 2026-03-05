import { useCallback, useMemo } from 'react';

import { OptimizedCart, OptimizerProduct, optimizeMonthlyBudget } from '../lib/budgetOptimizer';
import { Product } from '../lib/types';
import { useCartStore } from '../store/cartStore';

type UseBudgetOptimizerInput = {
  budget: number;
  shippingThreshold: number;
  products: Product[];
};

type UseBudgetOptimizerResult = {
  optimizedCart: OptimizedCart;
  explanation: string;
  applyToCart: () => void;
};

function productToOptimizerProduct(product: Product): OptimizerProduct {
  const grams = typeof product.weight_grams === 'number' && product.weight_grams > 0
    ? product.weight_grams
    : undefined;

  const mlFromAttributes = typeof product.attributes?.ml === 'number' && product.attributes.ml > 0
    ? product.attributes.ml
    : undefined;

  return {
    id: product.id,
    name: product.name,
    price: product.price,
    attributes: {
      grams,
      ml: mlFromAttributes,
      cbd_percent: typeof product.cbd_percentage === 'number' ? product.cbd_percentage : undefined,
    },
  };
}

export function useBudgetOptimizer({
  budget,
  shippingThreshold,
  products,
}: UseBudgetOptimizerInput): UseBudgetOptimizerResult {
  const applyOptimizedCart = useCartStore((state) => state.applyOptimizedCart);

  const optimizerProducts = useMemo(
    () => products.map(productToOptimizerProduct),
    [products]
  );

  const optimizedCart = useMemo(
    () => optimizeMonthlyBudget(budget, shippingThreshold, optimizerProducts),
    [budget, shippingThreshold, optimizerProducts]
  );

  const productIndex = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products]
  );

  const applyToCart = useCallback(() => {
    const entries = optimizedCart.items
      .map(({ productId, quantity }) => {
        const product = productIndex.get(productId);
        return product ? { product, quantity } : null;
      })
      .filter((item): item is { product: Product; quantity: number } => item !== null);

    applyOptimizedCart(entries);
  }, [applyOptimizedCart, optimizedCart.items, productIndex]);

  return {
    optimizedCart,
    explanation: optimizedCart.explanation,
    applyToCart,
  };
}
