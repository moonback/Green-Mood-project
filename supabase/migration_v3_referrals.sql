-- Migration V3: Referral Program

-- 1. Update Profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by_id UUID REFERENCES public.profiles(id);

-- 2. Create Referrals table
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES public.profiles(id),
    referee_id UUID NOT NULL REFERENCES public.profiles(id),
    status TEXT NOT NULL DEFAULT 'joined' CHECK (status IN ('joined', 'completed')),
    reward_issued BOOLEAN DEFAULT false,
    points_awarded INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable RLS on Referrals
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for Referrals
CREATE POLICY "Users can see their own referrals as referrer"
    ON public.referrals FOR SELECT
    USING (auth.uid() = referrer_id);

CREATE POLICY "Users can see their own referral as referee"
    ON public.referrals FOR SELECT
    USING (auth.uid() = referee_id);

-- 5. Helper Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code() 
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    done BOOLEAN DEFAULT FALSE;
BEGIN
    WHILE NOT done LOOP
        new_code := 'GRN-' || upper(substring(md5(random()::text) from 1 for 6));
        done := NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = new_code);
    END LOOP;
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger to automatically generate referral code on profile creation
CREATE OR REPLACE FUNCTION tr_generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.referral_code IS NULL THEN
        NEW.referral_code := generate_referral_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profile_created_gen_code
    BEFORE INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION tr_generate_referral_code();

-- 7. Grant access
GRANT ALL ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO anon;
GRANT ALL ON public.referrals TO service_role;
