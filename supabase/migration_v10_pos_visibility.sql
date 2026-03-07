-- ═══════════════════════════════════════════════════════════════════
-- Green Mood CBD — Migration V10 (Forcer visibilité Auth)
-- Met à jour create_pos_customer pour insérer dans auth.identities
-- Cela permet l'affichage immédiat dans le dashboard Supabase
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.create_pos_customer(
  p_full_name text,
  p_phone     text DEFAULT NULL,
  p_email     text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_user_id uuid := gen_random_uuid();
  v_email   text;
BEGIN
  -- Admin-only guard
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  -- Use provided email or generate a placeholder
  v_email := COALESCE(p_email, 'pos_' || replace(v_user_id::text, '-', '') || '@greenmoon.internal');

  -- 1. Create a minimal auth user
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
    confirmation_token,
    is_super_admin
  )
  VALUES (
    v_user_id,
    v_email,
    crypt(replace(gen_random_uuid()::text, '-', ''), gen_salt('bf')), -- Random password hash
    now(),
    'authenticated',
    jsonb_build_object('full_name', p_full_name),
    now(),
    now(),
    'authenticated',
    '',
    false
  );

  -- 2. Create the Identity (CRUCIAL pour la visibilité dans le Dashboard)
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    v_user_id,
    jsonb_build_object('sub', v_user_id, 'email', v_email),
    'email',
    now(),
    now(),
    now()
  );

  -- 3. Update profile with phone if provided
  -- (Le profil a déjà été créé par le trigger handle_new_user)
  IF p_phone IS NOT NULL AND p_phone <> '' THEN
    UPDATE public.profiles SET phone = p_phone WHERE id = v_user_id;
  END IF;

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.create_pos_customer(text, text, text) TO authenticated;

COMMENT ON FUNCTION public.create_pos_customer IS
  'Creates a walk-in customer profile from the POS terminal. '
  'Includes identity creation to ensure visibility in the Supabase Dashboard.';
