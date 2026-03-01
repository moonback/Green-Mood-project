-- ── BudTender Sync Migration ──

-- Table for User AI Preferences
CREATE TABLE IF NOT EXISTS public.user_ai_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    goal TEXT,
    experience_level TEXT,
    preferred_format TEXT,
    budget_range TEXT,
    terpene_preferences TEXT[] DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for BudTender Interactions (Chat History, Quiz Results)
CREATE TABLE IF NOT EXISTS public.budtender_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    interaction_type TEXT NOT NULL, -- 'chat_session', 'quiz_result', 'product_click'
    quiz_answers JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, session_id)
);

-- RLS Policies
ALTER TABLE public.user_ai_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budtender_interactions ENABLE ROW LEVEL SECURITY;

-- user_ai_preferences: User can manage their own prefs
CREATE POLICY "Users can manage their own AI preferences"
    ON public.user_ai_preferences
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- budtender_interactions: User can manage their own interactions
CREATE POLICY "Users can manage their own BudTender interactions"
    ON public.budtender_interactions
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Admin can view everything
CREATE POLICY "Admins can view all AI preferences"
    ON public.user_ai_preferences
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "Admins can view all BudTender interactions"
    ON public.budtender_interactions
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );
