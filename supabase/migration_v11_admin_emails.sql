-- ═══════════════════════════════════════════════════════════════════
-- Green Mood CBD — Migration V11 (Emails Clients Admin)
-- Permet aux admins de récupérer l'email d'un client et d'ajouter
-- le champ email dans la table profiles pour plus de facilité.
-- ═══════════════════════════════════════════════════════════════════

-- 1. Ajouter la colonne email à la table profiles (facultatif mais recommandé pour la recherche)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- 2. Synchroniser les emails existants
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- 3. Mettre à jour le trigger handle_new_user pour inclure l'email à la création
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email -- On ajoute l'email ici
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RPC pour envoyer un lien de réinitialisation (enveloppe sécurisée)
-- Note: On peut le faire en JS avec supabase.auth.resetPasswordForEmail, 
-- mais avoir l'email dans profiles permet à l'admin de le voir.

-- 5. RPC dédiée pour récupérer l'email (si on ne veut pas l'exposer partout via profiles)
CREATE OR REPLACE FUNCTION public.admin_get_user_email(p_user_id uuid)
RETURNS text AS $$
DECLARE
  v_email text;
BEGIN
  -- Vérification admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;
  RETURN v_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_get_user_email(uuid) TO authenticated;
