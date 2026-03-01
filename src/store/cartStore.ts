import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, DeliveryType, Product } from '../lib/types';

import { useSettingsStore } from './settingsStore';

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  deliveryType: DeliveryType;
  // actions
  addItem: (product: Product, quantity?: number, isSubscription?: boolean, interval?: string) => void;
  removeItem: (productId: string, isSubscription?: boolean, interval?: string) => void;
  updateQuantity: (productId: string, quantity: number, isSubscription?: boolean, interval?: string) => void;
  clearCart: () => void;
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  setDeliveryType: (type: DeliveryType) => void;
  // computed helpers
  itemCount: () => number;
  subtotal: () => number;
  deliveryFee: () => number;
  total: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      deliveryType: 'click_collect',

      addItem: (product, quantity = 1, isSubscription = false, interval) => {
        set((state) => {
          const itemKey = `${product.id}-${isSubscription ? interval : 'once'}`;
          const existingIndex = state.items.findIndex((i) =>
            `${i.product.id}-${i.is_subscription ? i.interval : 'once'}` === itemKey
          );

          if (existingIndex > -1) {
            const newItems = [...state.items];
            newItems[existingIndex] = {
              ...newItems[existingIndex],
              quantity: newItems[existingIndex].quantity + quantity,
            };
            return { items: newItems };
          }
          return {
            items: [
              ...state.items,
              { product, quantity, is_subscription: isSubscription, interval },
            ],
          };
        });
      },

      removeItem: (productId, isSubscription = false, interval) => {
        set((state) => {
          const itemKey = `${productId}-${isSubscription ? interval : 'once'}`;
          return {
            items: state.items.filter((i) =>
              `${i.product.id}-${i.is_subscription ? i.interval : 'once'}` !== itemKey
            ),
          };
        });
      },

      updateQuantity: (productId, quantity, isSubscription = false, interval) => {
        if (quantity <= 0) {
          get().removeItem(productId, isSubscription, interval);
          return;
        }
        set((state) => {
          const itemKey = `${productId}-${isSubscription ? interval : 'once'}`;
          return {
            items: state.items.map((i) =>
              `${i.product.id}-${i.is_subscription ? i.interval : 'once'}` === itemKey
                ? { ...i, quantity }
                : i
            ),
          };
        });
      },

      clearCart: () => set({ items: [] }),

      toggleSidebar: () => set((state) => ({ isOpen: !state.isOpen })),
      openSidebar: () => set({ isOpen: true }),
      closeSidebar: () => set({ isOpen: false }),

      setDeliveryType: (type) => set({ deliveryType: type }),

      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      subtotal: () =>
        get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),

      deliveryFee: () => {
        if (get().deliveryType === 'click_collect') return 0;
        const { settings } = useSettingsStore.getState();
        return get().subtotal() >= settings.delivery_free_threshold ? 0 : settings.delivery_fee;
      },

      total: () => get().subtotal() + get().deliveryFee(),
    }),
    {
      name: 'greenMood-cart',
      partialize: (state) => ({ items: state.items, deliveryType: state.deliveryType }),
    }
  )
);



