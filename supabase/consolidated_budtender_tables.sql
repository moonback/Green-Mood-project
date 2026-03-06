-- ─── Consolidated BudTender Tables (v2 + v4) ───

-- 1. User AI Preferences
CREATE TABLE IF NOT EXISTS public.user_ai_preferences (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    goal TEXT,
    experience_level TEXT,
    preferred_format TEXT,
    budget_range TEXT,
    terpene_preferences TEXT[] DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BudTender Interactions (Chat History, Quiz Results, Clicks)
CREATE TABLE IF NOT EXISTS public.budtender_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    interaction_type TEXT NOT NULL, -- 'chat_session', 'quiz_result', 'product_click', etc.
    quiz_answers JSONB DEFAULT '{}',
    recommended_products UUID[], -- from legacy v2
    clicked_product UUID REFERENCES products(id) ON DELETE SET NULL, -- from legacy v2
    feedback TEXT CHECK (feedback IN ('positive', 'negative')), -- from legacy v2
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, session_id)
);

-- 3. RLS Enabling
ALTER TABLE public.user_ai_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budtender_interactions ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for user_ai_preferences
DROP POLICY IF EXISTS "ai_prefs_owner_all" ON user_ai_preferences;
CREATE POLICY "ai_prefs_owner_all" ON user_ai_preferences
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "ai_prefs_admin_select" ON user_ai_preferences;
CREATE POLICY "ai_prefs_admin_select" ON user_ai_preferences
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- 5. RLS Policies for budtender_interactions
DROP POLICY IF EXISTS "interactions_owner_all" ON budtender_interactions;
CREATE POLICY "interactions_owner_all" ON budtender_interactions
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "interactions_admin_select" ON budtender_interactions;
CREATE POLICY "interactions_admin_select" ON budtender_interactions
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
