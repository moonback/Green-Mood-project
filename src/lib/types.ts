// ─── Database Types ─────────────────────────────────────────────────────────

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon_name: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  category_id: string;
  slug: string;
  name: string;
  sku: string | null;
  description: string | null;
  cbd_percentage: number | null;
  thc_max: number | null;
  weight_grams: number | null;
  price: number;
  original_value: number | null; // prix total des articles séparés
  image_url: string | null;
  stock_quantity: number;
  is_available: boolean;
  is_featured: boolean;
  is_active: boolean;
  is_bundle: boolean;
  is_subscribable: boolean;
  attributes: {
    benefits?: string[];
    aromas?: string[];
    [key: string]: any;
  };
  created_at: string;
  // joined
  category?: Category;
  bundle_items?: BundleItem[]; // populated on detail page
  // computed (from reviews batch query)
  avg_rating?: number;
  review_count?: number;
}

export interface BundleItem {
  id: string;
  bundle_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  // joined
  product?: Pick<Product, 'id' | 'name' | 'slug' | 'price' | 'image_url' | 'cbd_percentage' | 'weight_grams'>;
}

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  loyalty_points: number;
  referral_code: string | null;
  referred_by_id: string | null;
  is_admin: boolean;
  created_at: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referee_id: string;
  status: 'joined' | 'completed';
  reward_issued: boolean;
  points_awarded: number;
  created_at: string;
  // joined
  referrer?: Pick<Profile, 'full_name'>;
  referee?: Pick<Profile, 'full_name' | 'created_at'>;
}

export interface Address {
  id: string;
  user_id: string;
  label: string;
  street: string;
  city: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at: string;
}

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'processing'
  | 'ready'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type DeliveryType = 'click_collect' | 'delivery' | 'in_store';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface Order {
  id: string;
  user_id: string | null;
  status: OrderStatus;
  delivery_type: DeliveryType;
  address_id: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  loyalty_points_earned: number;
  viva_order_code: string | null;
  payment_status: PaymentStatus;
  notes: string | null;
  created_at: string;
  // joined
  address?: Address;
  order_items?: OrderItem[];
  profile?: Profile;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  // joined
  product?: Product;
}

export interface StockMovement {
  id: string;
  product_id: string;
  quantity_change: number;
  type: 'sale' | 'restock' | 'adjustment' | 'return';
  note: string | null;
  created_at: string;
  // joined
  product?: Product;
}

// ─── Cart Types ──────────────────────────────────────────────────────────────

export interface CartItem {
  product: Product;
  quantity: number;
}

// ─── Payment Types ────────────────────────────────────────────────────────────

export interface CreateOrderPayload {
  orderId: string;
  amount: number; // en centimes
  customerEmail: string;
  customerName: string;
  description: string;
}

export interface VivaOrderResponse {
  orderCode: number;
}

// ─── Phase 3 Types ────────────────────────────────────────────────────────────

export type LoyaltyTransactionType = 'earned' | 'redeemed' | 'referral' | 'adjusted' | 'expired';

export interface LoyaltyTransaction {
  id: string;
  user_id: string;
  order_id: string | null;
  type: LoyaltyTransactionType;
  points: number;
  balance_after: number;
  note: string | null;
  created_at: string;
  // joined
  order?: Pick<Order, 'id' | 'created_at' | 'total'>;
}

export type SubscriptionFrequency = 'weekly' | 'biweekly' | 'monthly';
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled';

export interface Subscription {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  frequency: SubscriptionFrequency;
  next_delivery_date: string;
  status: SubscriptionStatus;
  created_at: string;
  // joined
  product?: Product;
  profile?: Pick<Profile, 'id' | 'full_name'>;
}

export interface SubscriptionOrder {
  id: string;
  subscription_id: string;
  order_id: string;
  created_at: string;
  // joined
  order?: Order;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  order_id: string;
  rating: number;
  comment: string | null;
  is_verified: boolean;
  is_published: boolean;
  created_at: string;
  // joined
  profile?: Pick<Profile, 'full_name'>;
  product?: Pick<Product, 'id' | 'name' | 'slug' | 'image_url'>;
}

// ─── Analytics Types ──────────────────────────────────────────────────────────

export interface RevenueDataPoint {
  date: string;
  revenue: number;
}

export interface TopProduct {
  product_id: string;
  product_name: string;
  total_quantity: number;
  total_revenue: number;
}

export interface OrderStatusDistribution {
  status: string;
  count: number;
}

export interface CustomerAcquisitionPoint {
  date: string;
  new_customers: number;
}
