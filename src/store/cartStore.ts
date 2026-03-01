import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, DeliveryType, Product } from '../lib/types';

import { useSettingsStore } from './settingsStore';

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  deliveryType: DeliveryType;
  // actions
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
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

      addItem: (product, quantity = 1) => {
        set((state) => {
          const existing = state.items.find((i) => i.product.id === product.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.product.id === product.id
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, { product, quantity }] };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.product.id !== productId),
        }));
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.product.id === productId ? { ...i, quantity } : i
          ),
        }));
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



