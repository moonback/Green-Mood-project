-- ═══════════════════════════════════════════════════════════════════
-- Green Mood CBD — Migration V8 (POS Enhancements)
-- Adds create_pos_customer RPC for in-store customer creation
-- ═══════════════════════════════════════════════════════════════════

-- 1. RPC function to create a customer profile directly from the POS
--    Creates a minimal auth user (triggering the handle_new_user trigger)
--    then updates the profile with the provided name and phone.
--    Only callable by admin users (enforced inside the function).

CREATE OR REPLACE FUNCTION public.create_pos_customer(
  p_full_name text,
  p_phone     text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_user_id uuid := gen_random_uuid();
  v_email   text := 'pos_' || replace(v_user_id::text, '-', '') || '@greenmoon.internal';
BEGIN
  -- Admin-only guard
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  -- Create a minimal auth user; the handle_new_user trigger will insert the profile row
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    role,
    raw_user_meta_data,
    created_at,
    updated_at,
    aud,
    confirmation_token
  )
  VALUES (
    v_user_id,
    v_email,
    '',
    now(),
    'authenticated',
    jsonb_build_object('full_name', p_full_name),
    now(),
    now(),
    'authenticated',
    ''
  );

  -- Update profile with phone if provided
  IF p_phone IS NOT NULL AND p_phone <> '' THEN
    UPDATE public.profiles SET phone = p_phone WHERE id = v_user_id;
  END IF;

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.create_pos_customer(text, text) TO authenticated;

COMMENT ON FUNCTION public.create_pos_customer IS
  'Creates a walk-in customer profile from the POS terminal. Admin-only. '
  'Inserts a minimal auth.users row so the handle_new_user trigger fires, '
  'then updates the profile with the given name and optional phone number.';
