import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile } from '../lib/types';

interface AuthStore {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  initialize: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  fetchProfile: (userId: string) => Promise<void>;
  setProfile: (profile: Profile | null) => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  profile: null,
  session: null,
  isLoading: true,

  initialize: () => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ session, user: session?.user ?? null, isLoading: false });
      if (session?.user) {
        get().fetchProfile(session.user.id);
      }
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null });
      if (session?.user) {
        get().fetchProfile(session.user.id);
      } else {
        set({ profile: null });
      }
    });
  },

  fetchProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      return;
    }

    if (data) set({ profile: data as Profile });
  },

  setProfile: (profile: Profile | null) => set({ profile }),

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },

  signUp: async (email, password, fullName, referralCode?: string) => {
    let referredById: string | null = null;

    if (referralCode) {
      const { data: referrer } = await supabase
        .from('profiles')
        .select('id')
        .eq('referral_code', referralCode.trim().toUpperCase())
        .single();

      if (referrer) {
        referredById = referrer.id;
      }
    }

    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      },
    });

    if (error) throw error;

    if (authData.user && referredById) {
      try {
        // 1. Update referred_by_id in profile manually (safer than metadata if col missing)
        await supabase
          .from('profiles')
          .update({ referred_by_id: referredById })
          .eq('id', authData.user.id);

        // 2. Create the initial entry in the referrals table
        await supabase.from('referrals').insert({
          referrer_id: referredById,
          referee_id: authData.user.id,
          status: 'joined'
        });

        // 3. Handle Welcome Bonus
        const { data: bonusSetting } = await supabase
          .from('store_settings')
          .select('value')
          .eq('key', 'referral_welcome_bonus')
          .maybeSingle();

        const welcomeBonus = bonusSetting ? parseInt(bonusSetting.value as string) : 0;

        if (welcomeBonus > 0) {
          // Update user's profile with initial points
          await supabase
            .from('profiles')
            .update({ loyalty_points: welcomeBonus })
            .eq('id', authData.user.id);

          // Log transaction
          await supabase.from('loyalty_transactions').insert({
            user_id: authData.user.id,
            type: 'earned',
            points: welcomeBonus,
            balance_after: welcomeBonus,
            note: 'Cadeau de bienvenue (Parrainage)'
          });
        }
      } catch (err) {
        if (import.meta.env.DEV) console.error('Referral logic failed, but user was created:', err);
      }
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null, session: null });
  },
}));
