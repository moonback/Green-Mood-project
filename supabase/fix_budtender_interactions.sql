-- ── Fix for BudTender Interactions Schema ──
-- This migration adds missing columns used for analytics and fixes the session_id constraint

-- 1. Add missing columns for clicks, feedback and recommendations
ALTER TABLE public.budtender_interactions 
ADD COLUMN IF NOT EXISTS clicked_product UUID REFERENCES public.products(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS feedback TEXT,
ADD COLUMN IF NOT EXISTS recommended_products UUID[];

-- 2. Make session_id optional
-- In initial migration v4, it was NOT NULL which caused errors for individual events like clicks or questions
ALTER TABLE public.budtender_interactions ALTER COLUMN session_id DROP NOT NULL;

-- 3. Add helpful commentary
COMMENT ON COLUMN public.budtender_interactions.clicked_product IS 'ID of the product clicked during a recommendation session';
COMMENT ON COLUMN public.budtender_interactions.feedback IS 'User satisfaction feedback: positive or negative';
COMMENT ON COLUMN public.budtender_interactions.recommended_products IS 'List of product IDs suggested by the AI in this interaction';
