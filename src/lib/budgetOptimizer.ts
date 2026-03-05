export type OptimizerProduct = {
  id: string;
  name: string;
  price: number;
  attributes?: {
    grams?: number;
    ml?: number;
    cbd_percent?: number;
  };
};

export type OptimizedCart = {
  items: {
    productId: string;
    quantity: number;
  }[];
  totalPrice: number;
  totalWeight: number;
  shippingFree: boolean;
  estimatedDays: number;
  explanation: string;
};

type ScoredProduct = OptimizerProduct & {
  unitWeight: number;
  ratio: number;
};

const MIN_PRICE_EPSILON = 0.0001;
const DAILY_CONSUMPTION_REFERENCE = 0.4;

function getUnitWeight(product: OptimizerProduct): number {
  const grams = product.attributes?.grams ?? 0;
  const ml = product.attributes?.ml ?? 0;
  return Math.max(grams, ml, 0);
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function buildExplanation(
  budget: number,
  totalPrice: number,
  totalWeight: number,
  shippingFree: boolean,
  estimatedDays: number,
  uniqueProducts: number
): string {
  const budgetSentence = `Avec ${budget.toFixed(2)}€, je te propose un panier à ${totalPrice.toFixed(2)}€.`;
  const durationSentence = `Il contient environ ${totalWeight.toFixed(1)}g/ml au total, soit près de ${estimatedDays} jours d'utilisation.`;
  const shippingSentence = shippingFree
    ? 'Tu bénéficies de la livraison gratuite avec cette sélection.'
    : 'La livraison gratuite n\'est pas atteinte avec ce budget.';
  const balanceSentence = uniqueProducts > 1
    ? 'Le panier reste équilibré avec plusieurs références.'
    : 'Le budget force un choix concentré sur un produit principal.';

  return `${budgetSentence} ${durationSentence} ${shippingSentence} ${balanceSentence}`;
}

export function optimizeMonthlyBudget(
  budget: number,
  shippingThreshold: number,
  products: OptimizerProduct[]
): OptimizedCart {
  if (budget <= 0 || products.length === 0) {
    return {
      items: [],
      totalPrice: 0,
      totalWeight: 0,
      shippingFree: false,
      estimatedDays: 0,
      explanation: 'Le budget ou la liste de produits ne permet pas de générer un panier optimisé.',
    };
  }

  const eligible: ScoredProduct[] = products
    .map((product) => {
      const unitWeight = getUnitWeight(product);
      const safePrice = Math.max(product.price, MIN_PRICE_EPSILON);
      return {
        ...product,
        unitWeight,
        ratio: unitWeight / safePrice,
      };
    })
    .filter((product) => product.price > 0 && product.unitWeight > 0)
    .sort((a, b) => b.ratio - a.ratio || a.price - b.price);

  if (eligible.length === 0) {
    return {
      items: [],
      totalPrice: 0,
      totalWeight: 0,
      shippingFree: false,
      estimatedDays: 0,
      explanation: 'Aucun produit avec grammage/ml exploitable n\'a été trouvé.',
    };
  }

  const targetSpend = shippingThreshold > 0 && shippingThreshold <= budget
    ? Math.max(shippingThreshold, budget * 0.92)
    : budget * 0.92;

  const itemQuantities = new Map<string, number>();
  let totalPrice = 0;
  let totalWeight = 0;

  const canAddProduct = (product: ScoredProduct): boolean => totalPrice + product.price <= budget + 1e-9;

  const pickProductScore = (product: ScoredProduct): number => {
    const currentQty = itemQuantities.get(product.id) ?? 0;
    const diversityPenalty = 1 - Math.min(currentQty * 0.08, 0.4);
    const budgetFitBoost = totalPrice < targetSpend ? 1.1 : 0.95;
    return product.ratio * diversityPenalty * budgetFitBoost;
  };

  let hasAdded = true;
  while (hasAdded) {
    hasAdded = false;

    const candidate = eligible
      .filter(canAddProduct)
      .sort((a, b) => pickProductScore(b) - pickProductScore(a))[0];

    if (!candidate) break;

    itemQuantities.set(candidate.id, (itemQuantities.get(candidate.id) ?? 0) + 1);
    totalPrice += candidate.price;
    totalWeight += candidate.unitWeight;
    hasAdded = true;

    const budgetGap = budget - totalPrice;
    if (budgetGap < Math.min(...eligible.map((item) => item.price))) break;
  }

  // Local refinement: try replacing one unit of the most expensive selected item
  // with one or two better ratio items to increase totalWeight while respecting budget.
  const selectedProducts = eligible.filter((product) => (itemQuantities.get(product.id) ?? 0) > 0);
  const expensiveSelected = [...selectedProducts].sort((a, b) => b.price - a.price);

  for (const expensive of expensiveSelected) {
    const qty = itemQuantities.get(expensive.id) ?? 0;
    if (qty <= 0) continue;

    for (const first of eligible) {
      for (const second of eligible) {
        const replacedPrice = totalPrice - expensive.price;
        const newPrice = replacedPrice + first.price + second.price;
        if (newPrice > budget + 1e-9) continue;

        const replacedWeight = totalWeight - expensive.unitWeight;
        const newWeight = replacedWeight + first.unitWeight + second.unitWeight;

        if (newWeight <= totalWeight + 1e-9) continue;

        itemQuantities.set(expensive.id, qty - 1);
        itemQuantities.set(first.id, (itemQuantities.get(first.id) ?? 0) + 1);
        itemQuantities.set(second.id, (itemQuantities.get(second.id) ?? 0) + 1);
        totalPrice = newPrice;
        totalWeight = newWeight;
        break;
      }
    }
  }

  const items = Array.from(itemQuantities.entries())
    .filter(([, quantity]) => quantity > 0)
    .map(([productId, quantity]) => ({ productId, quantity }));

  const shippingFree = totalPrice >= shippingThreshold;
  const estimatedDays = Math.max(1, Math.round(totalWeight / DAILY_CONSUMPTION_REFERENCE));

  return {
    items,
    totalPrice: roundCurrency(totalPrice),
    totalWeight: Math.round(totalWeight * 100) / 100,
    shippingFree,
    estimatedDays,
    explanation: buildExplanation(
      budget,
      roundCurrency(totalPrice),
      totalWeight,
      shippingFree,
      estimatedDays,
      items.length
    ),
  };
}

export function budgetOptimizerExample(): OptimizedCart {
  const sampleProducts: OptimizerProduct[] = [
    { id: 'fleur-1g', name: 'Fleur Relax 1g', price: 8, attributes: { grams: 1 } },
    { id: 'fleur-10g', name: 'Fleur Relax 10g', price: 55, attributes: { grams: 10 } },
    { id: 'huile-10ml', name: 'Huile Nuit 10ml', price: 24, attributes: { ml: 10 } },
  ];

  return optimizeMonthlyBudget(50, 49, sampleProducts);
}
