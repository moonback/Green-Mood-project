-- ═══════════════════════════════════════════════════════════════════
-- Green Mood CBD — Migration V2 (Additive)
-- Run AFTER migration.sql in: Supabase Dashboard > SQL Editor
-- Tables: user_ai_preferences, budtender_interactions, wishlists, product_images
-- ═══════════════════════════════════════════════════════════════════

-- ─── Table: User AI Preferences (replaces localStorage for BudTender) ──

CREATE TABLE IF NOT EXISTS user_ai_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  goal text,
  experience_level text,
  preferred_format text,
  budget_range text,
  terpene_preferences text[] DEFAULT '{}',
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- ─── Table: BudTender Interaction Analytics ────────────────────────

CREATE TABLE IF NOT EXISTS budtender_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text NOT NULL,
  interaction_type text NOT NULL,
  quiz_answers jsonb,
  recommended_products uuid[],
  clicked_product uuid REFERENCES products(id) ON DELETE SET NULL,
  feedback text CHECK (feedback IN ('positive', 'negative')),
  created_at timestamptz DEFAULT now()
);

-- ─── Table: Wishlists ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- ─── Table: Product Images (gallery) ──────────────────────────────

CREATE TABLE IF NOT EXISTS product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  image_url text NOT NULL,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════
-- Row Level Security
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE user_ai_preferences  ENABLE ROW LEVEL SECURITY;
ALTER TABLE budtender_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists             ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images        ENABLE ROW LEVEL SECURITY;

-- ─── user_ai_preferences: owner CRUD + admin read ─────────────────

DROP POLICY IF EXISTS "ai_prefs_owner_select" ON user_ai_preferences;
CREATE POLICY "ai_prefs_owner_select" ON user_ai_preferences FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "ai_prefs_owner_insert" ON user_ai_preferences;
CREATE POLICY "ai_prefs_owner_insert" ON user_ai_preferences FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "ai_prefs_owner_update" ON user_ai_preferences;
CREATE POLICY "ai_prefs_owner_update" ON user_ai_preferences FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "ai_prefs_owner_delete" ON user_ai_preferences;
CREATE POLICY "ai_prefs_owner_delete" ON user_ai_preferences FOR DELETE
  USING (user_id = auth.uid());

-- ─── budtender_interactions: user insert own + admin read all ──────

DROP POLICY IF EXISTS "budtender_interactions_user_insert" ON budtender_interactions;
CREATE POLICY "budtender_interactions_user_insert" ON budtender_interactions FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (user_id = auth.uid() OR user_id IS NULL)
  );

DROP POLICY IF EXISTS "budtender_interactions_admin_select" ON budtender_interactions;
CREATE POLICY "budtender_interactions_admin_select" ON budtender_interactions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ─── wishlists: owner read / insert / delete ──────────────────────

DROP POLICY IF EXISTS "wishlists_owner_select" ON wishlists;
CREATE POLICY "wishlists_owner_select" ON wishlists FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "wishlists_owner_insert" ON wishlists;
CREATE POLICY "wishlists_owner_insert" ON wishlists FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "wishlists_owner_delete" ON wishlists;
CREATE POLICY "wishlists_owner_delete" ON wishlists FOR DELETE
  USING (user_id = auth.uid());

-- ─── product_images: public read + admin CRUD ─────────────────────

DROP POLICY IF EXISTS "product_images_public_select" ON product_images;
CREATE POLICY "product_images_public_select" ON product_images FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "product_images_admin_insert" ON product_images;
CREATE POLICY "product_images_admin_insert" ON product_images FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "product_images_admin_update" ON product_images;
CREATE POLICY "product_images_admin_update" ON product_images FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "product_images_admin_delete" ON product_images;
CREATE POLICY "product_images_admin_delete" ON product_images FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
