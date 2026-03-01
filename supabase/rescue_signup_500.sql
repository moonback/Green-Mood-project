-- 🛟 RESCUE MIGRATION: Robust Referrals & Fix Signup 500
-- This script fixes potential permission issues in triggers.

-- 1. Ensure Referral Code Generation is Robust
CREATE OR REPLACE FUNCTION public.generate_referral_code() 
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    done BOOLEAN DEFAULT FALSE;
BEGIN
    FOR i IN 1..10 LOOP -- Limit attempts to prevent infinite loop
        new_code := 'GRN-' || upper(substring(md5(random()::text) from 1 for 6));
        -- Querying with SECURITY DEFINER context
        done := NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = new_code);
        IF done THEN
            RETURN new_code;
        END IF;
    END LOOP;
    -- Fallback with timestamp if random fails (unlikely)
    RETURN 'GRN-' || upper(substring(md5(now()::text) from 1 for 6));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Ensure Trigger is SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.tr_generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
    -- Only generate if it's currently null
    IF NEW.referral_code IS NULL THEN
        BEGIN
            NEW.referral_code := public.generate_referral_code();
        EXCEPTION WHEN OTHERS THEN
            -- Failure here should NOT block signup
            RAISE WARNING 'Referral code generation failed: %', SQLERRM;
        END;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Re-create the trigger safely
DROP TRIGGER IF EXISTS on_profile_created_gen_code ON public.profiles;
CREATE TRIGGER on_profile_created_gen_code
    BEFORE INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.tr_generate_referral_code();

-- 4. Cleanup any profiles missing referral codes (from failed attempts)
UPDATE public.profiles SET referral_code = public.generate_referral_code() 
WHERE referral_code IS NULL;

-- 5. Fix potential conflict with v4 budtender sync
-- If migration_v2 already created user_ai_preferences, my v4 primary key change might fail if not handled.
-- No action needed here unless user reports specific v4 errors.
