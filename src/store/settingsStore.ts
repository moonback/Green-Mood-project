import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface StoreSettings {
    delivery_fee: number;
    delivery_free_threshold: number;
    store_name: string;
    store_address: string;
    store_phone: string;
    store_hours: string;
    banner_text: string;
    banner_enabled: boolean;
    social_instagram: string;
    social_facebook: string;
    budtender_enabled: boolean;
    subscriptions_enabled: boolean;
    referral_reward_points: number;
    referral_welcome_bonus: number;
    referral_program_enabled: boolean;
}

export const DEFAULT_SETTINGS: StoreSettings = {
    delivery_fee: 5.90,
    delivery_free_threshold: 50.00,
    store_name: 'Green Mood CBD',
    store_address: '123 Rue de la Nature, 75000 Paris',
    store_phone: '01 23 45 67 89',
    store_hours: 'Lun–Sam 10h00–19h30',
    banner_text: '🌿 Offre de bienvenue : -10% avec le code GREENMood !',
    banner_enabled: true,
    social_instagram: 'https://instagram.com/greenMood_cbd',
    social_facebook: 'https://facebook.com/greenMood_cbd',
    budtender_enabled: true,
    subscriptions_enabled: true,
    referral_reward_points: 500,
    referral_welcome_bonus: 0,
    referral_program_enabled: true,
};

interface SettingsStore {
    settings: StoreSettings;
    isLoading: boolean;
    fetchSettings: () => Promise<void>;
    updateSettingsInStore: (newSettings: Partial<StoreSettings>) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
    settings: DEFAULT_SETTINGS,
    isLoading: true,
    fetchSettings: async () => {
        try {
            const { data, error } = await supabase.from('store_settings').select('*');
            if (error) throw error;

            if (data && data.length > 0) {
                const obj = data.reduce((acc: Record<string, any>, row: { key: string; value: any }) => {
                    acc[row.key] = row.value;
                    return acc;
                }, {});
                set({ settings: { ...DEFAULT_SETTINGS, ...obj }, isLoading: false });
            } else {
                set({ isLoading: false });
            }
        } catch (err) {
            console.error('Error fetching settings:', err);
            set({ isLoading: false });
        }
    },
    updateSettingsInStore: (newSettings) => {
        set((state) => ({ settings: { ...state.settings, ...newSettings } }));
    },
}));
