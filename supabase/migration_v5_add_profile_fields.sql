-- ── Ajout des champs manquants pour les préférences IA ──
ALTER TABLE public.user_ai_preferences ADD COLUMN IF NOT EXISTS age_range TEXT;
ALTER TABLE public.user_ai_preferences ADD COLUMN IF NOT EXISTS intensity_preference TEXT;
