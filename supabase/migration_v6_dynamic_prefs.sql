-- ───── Support pour les préférences dynamiques ─────
ALTER TABLE public.user_ai_preferences ADD COLUMN IF NOT EXISTS extra_prefs JSONB DEFAULT '{}';

-- Index GIN pour des performances optimales sur les requêtes JSON si besoin
CREATE INDEX IF NOT EXISTS idx_user_ai_extra_prefs ON public.user_ai_preferences USING GIN (extra_prefs);
