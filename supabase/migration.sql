-- ═══════════════════════════════════════════════════════════════════
-- Green Mood CBD — Migration Supabase
-- Exécuter dans : Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════════

-- ─── Tables ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text UNIQUE NOT NULL,
  name        text NOT NULL,
  description text,
  icon_name   text,
  image_url   text,
  sort_order  int NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id     uuid NOT NULL REFERENCES categories(id),
  slug            text UNIQUE NOT NULL,
  name            text NOT NULL,
  description     text,
  cbd_percentage  numeric(5,2),
  thc_max         numeric(5,3),
  weight_grams    numeric(8,2),
  price           numeric(10,2) NOT NULL,
  image_url       text,
  stock_quantity  int NOT NULL DEFAULT 0,
  is_available    boolean NOT NULL DEFAULT true,
  is_featured     boolean NOT NULL DEFAULT false,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     text,
  phone         text,
  loyalty_points int NOT NULL DEFAULT 0,
  is_admin      boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS addresses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label       text NOT NULL DEFAULT 'Domicile',
  street      text NOT NULL,
  city        text NOT NULL,
  postal_code text NOT NULL,
  country     text NOT NULL DEFAULT 'France',
  is_default  boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid REFERENCES profiles(id),
  status               text NOT NULL DEFAULT 'pending',
  delivery_type        text NOT NULL DEFAULT 'click_collect',
  address_id           uuid REFERENCES addresses(id),
  subtotal             numeric(10,2) NOT NULL,
  delivery_fee         numeric(10,2) NOT NULL DEFAULT 0,
  total                numeric(10,2) NOT NULL,
  loyalty_points_earned int NOT NULL DEFAULT 0,
  viva_order_code      text,
  payment_status       text NOT NULL DEFAULT 'pending',
  notes                text,
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id   uuid NOT NULL REFERENCES products(id),
  product_name text NOT NULL,
  unit_price   numeric(10,2) NOT NULL,
  quantity     int NOT NULL,
  total_price  numeric(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      uuid NOT NULL REFERENCES products(id),
  quantity_change int NOT NULL,
  type            text NOT NULL,
  note            text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS store_settings (
  key        text PRIMARY KEY,
  value      jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Trigger : créer profil automatiquement à l'inscription ──────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ─── Row Level Security ───────────────────────────────────────────────

ALTER TABLE categories      ENABLE ROW LEVEL SECURITY;
ALTER TABLE products        ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses       ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders          ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings  ENABLE ROW LEVEL SECURITY;

-- Categories : lecture publique
DROP POLICY IF EXISTS "categories_public_read" ON categories;
CREATE POLICY "categories_public_read" ON categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "categories_admin_write" ON categories;
CREATE POLICY "categories_admin_write" ON categories FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Products : lecture publique
DROP POLICY IF EXISTS "products_public_read" ON products;
CREATE POLICY "products_public_read" ON products FOR SELECT USING (true);
DROP POLICY IF EXISTS "products_admin_write" ON products;
CREATE POLICY "products_admin_write" ON products FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Profiles : lecture/écriture par propriétaire ou admin
DROP POLICY IF EXISTS "profiles_self_read" ON profiles;
CREATE POLICY "profiles_self_read" ON profiles FOR SELECT USING (
  id = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
DROP POLICY IF EXISTS "profiles_self_update" ON profiles;
CREATE POLICY "profiles_self_update" ON profiles FOR UPDATE USING (id = auth.uid());
DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;
CREATE POLICY "profiles_admin_all" ON profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Addresses : propriétaire uniquement
DROP POLICY IF EXISTS "addresses_owner" ON addresses;
CREATE POLICY "addresses_owner" ON addresses FOR ALL USING (user_id = auth.uid());

-- Orders : propriétaire ou admin
DROP POLICY IF EXISTS "orders_owner_read" ON orders;
CREATE POLICY "orders_owner_read" ON orders FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
DROP POLICY IF EXISTS "orders_auth_insert" ON orders;
CREATE POLICY "orders_auth_insert" ON orders FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "orders_admin_update" ON orders;
CREATE POLICY "orders_admin_update" ON orders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Order items : propriétaire ou admin
DROP POLICY IF EXISTS "order_items_owner_read" ON order_items;
CREATE POLICY "order_items_owner_read" ON order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders o WHERE o.id = order_id AND (
      o.user_id = auth.uid() OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    )
  )
);
DROP POLICY IF EXISTS "order_items_auth_insert" ON order_items;
CREATE POLICY "order_items_auth_insert" ON order_items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Stock movements : admin uniquement
DROP POLICY IF EXISTS "stock_admin_all" ON stock_movements;
CREATE POLICY "stock_admin_all" ON stock_movements FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Store settings : lecture publique, admin tout
DROP POLICY IF EXISTS "store_settings_public_read" ON store_settings;
CREATE POLICY "store_settings_public_read" ON store_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "store_settings_admin_all" ON store_settings;
CREATE POLICY "store_settings_admin_all" ON store_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- ─── Données initiales (seed) ─────────────────────────────────────────

INSERT INTO categories (slug, name, description, icon_name, image_url, sort_order) VALUES
  ('fleurs', 'Fleurs CBD', 'Fleurs de CBD de haute qualité, récoltées avec soin pour une expérience aromatique exceptionnelle.', 'Flower', 'https://images.unsplash.com/photo-1584467541268-b040f83be3fd?w=800', 1),
  ('resines', 'Résines & Pollens', 'Concentrés de CBD artisanaux, extraits selon des méthodes traditionnelles respectueuses des terpènes.', 'Droplets', 'https://images.unsplash.com/photo-1611241893603-3c359704e0ee?w=800', 2),
  ('huiles', 'Huiles & Infusions', 'Huiles CBD full spectrum et infusions relaxantes, formulées pour votre bien-être quotidien.', 'Leaf', 'https://images.unsplash.com/photo-1617791160505-6f00504e3519?w=800', 3)
ON CONFLICT (slug) DO NOTHING;

-- Seed produits (à exécuter après l'insertion des catégories)
DO $$
DECLARE
  cat_fleurs   uuid;
  cat_resines  uuid;
  cat_huiles   uuid;
BEGIN
  SELECT id INTO cat_fleurs   FROM categories WHERE slug = 'fleurs';
  SELECT id INTO cat_resines  FROM categories WHERE slug = 'resines';
  SELECT id INTO cat_huiles   FROM categories WHERE slug = 'huiles';

  INSERT INTO products (category_id, slug, name, description, cbd_percentage, thc_max, weight_grams, price, image_url, stock_quantity, is_featured) VALUES
    -- Fleurs
    (cat_fleurs, 'amnesia-haze', 'Amnesia Haze', 'Variété sativa légendaire aux arômes citronnés et terreux. Idéale pour la journée.', 18.5, 0.2, 3, 12.90, 'https://images.unsplash.com/photo-1526770542827-70b22c6e7e8d?w=800', 50, true),
    (cat_fleurs, 'gelato', 'Gelato', 'Hybride équilibré aux notes sucrées de dessert. Parfum floral et fruité intense.', 22.0, 0.2, 3, 14.90, 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800', 35, true),
    (cat_fleurs, 'white-widow', 'White Widow', 'Classique intemporel aux cristaux de résine abondants. Goût boisé et épicé.', 20.0, 0.2, 3, 13.90, 'https://images.unsplash.com/photo-1585435421671-0c16764628a9?w=800', 40, false),
    (cat_fleurs, 'strawberry', 'Strawberry', 'Notes fruitées de fraise mûre. L''une de nos variétés les plus appréciées.', 16.0, 0.2, 3, 11.90, 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800', 60, false),
    -- Résines
    (cat_resines, 'afghan', 'Afghan', 'Résine afghane traditionnelle aux arômes terreux et épicés. Texture souple et malléable.', 30.0, 0.2, 3, 18.90, 'https://images.unsplash.com/photo-1611241893603-3c359704e0ee?w=800', 25, true),
    (cat_resines, 'jaune-mousseux', 'Jaune Mousseux', 'Pollen pressé à froid aux reflets dorés. Goût doux et légèrement floral.', 25.0, 0.2, 3, 16.90, 'https://images.unsplash.com/photo-1584467541268-b040f83be3fd?w=800', 20, false),
    (cat_resines, 'filtre-x3', 'Filtré x3', 'Triple filtration pour une pureté maximale. Texture fine et homogène.', 35.0, 0.2, 3, 22.90, 'https://images.unsplash.com/photo-1617791160505-6f00504e3519?w=800', 15, false),
    (cat_resines, 'ice-o-lator', 'Ice O Lator', 'Extraction à l''eau glacée pour préserver les terpènes. Qualité premium.', 40.0, 0.2, 3, 28.90, 'https://images.unsplash.com/photo-1526770542827-70b22c6e7e8d?w=800', 10, true),
    -- Huiles & Infusions
    (cat_huiles, 'huile-10-full-spectrum', 'Huile 10% Full Spectrum', 'Huile CBD full spectrum 10% avec tous les cannabinoïdes bénéfiques. Flacon 30ml.', 10.0, 0.2, null, 34.90, 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800', 30, true),
    (cat_huiles, 'huile-20-sommeil', 'Huile 20% Sommeil', 'Formule enrichie en mélatonine et CBD 20% pour un sommeil réparateur. Flacon 30ml.', 20.0, 0.2, null, 54.90, 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800', 20, true),
    (cat_huiles, 'infusion-detente', 'Infusion Détente', 'Mélange de plantes bio avec fleurs de CBD. Camomille, tilleul et lavande. Boîte 30 sachets.', 5.0, 0.1, null, 16.90, 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800', 45, false),
    (cat_huiles, 'infusion-digestion', 'Infusion Digestion', 'Association fenouil, menthe et CBD pour soutenir le confort digestif. Boîte 30 sachets.', 5.0, 0.1, null, 16.90, 'https://images.unsplash.com/photo-1585435421671-0c16764628a9?w=800', 45, false)
  ON CONFLICT (slug) DO NOTHING;

  -- Settings par défaut
  INSERT INTO store_settings (key, value) VALUES
    ('delivery_fee', '5.90'),
    ('delivery_free_threshold', '50.00'),
    ('store_name', '"Green Mood CBD"'),
    ('store_address', '"123 Rue de la Nature, 75000 Paris"'),
    ('store_phone', '"01 23 45 67 89"'),
    ('store_hours', '"Lun–Sam 10h00–19h30"'),
    ('banner_text', '"🌿 Offre de bienvenue : -10% avec le code GREENMood !"'),
    ('banner_enabled', 'true')
  ON CONFLICT (key) DO NOTHING;
END $$;

-- ═══════════════════════════════════════════════════════════════════
-- Phase 3 — Expansion Future
-- ═══════════════════════════════════════════════════════════════════

-- ─── Colonne loyalty_points_redeemed sur orders ───────────────────
ALTER TABLE orders ADD COLUMN IF NOT EXISTS loyalty_points_redeemed int NOT NULL DEFAULT 0;

-- ─── Table loyalty_transactions ──────────────────────────────────

CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_id      uuid REFERENCES orders(id) ON DELETE SET NULL,
  type          text NOT NULL CHECK (type IN ('earned', 'redeemed', 'adjusted', 'expired')),
  points        int NOT NULL,
  balance_after int NOT NULL,
  note          text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "loyalty_tx_owner_read" ON loyalty_transactions FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "loyalty_tx_auth_insert" ON loyalty_transactions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "loyalty_tx_admin_all" ON loyalty_transactions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ─── Table subscriptions ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS subscriptions (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id         uuid NOT NULL REFERENCES products(id),
  quantity           int NOT NULL DEFAULT 1 CHECK (quantity > 0),
  frequency          text NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly')),
  next_delivery_date date NOT NULL,
  status             text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  created_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_owner_read" ON subscriptions FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "subscriptions_owner_insert" ON subscriptions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "subscriptions_owner_update" ON subscriptions FOR UPDATE
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ─── Table subscription_orders ───────────────────────────────────

CREATE TABLE IF NOT EXISTS subscription_orders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  order_id        uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE subscription_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sub_orders_owner_read" ON subscription_orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM subscriptions s WHERE s.id = subscription_id AND (
        s.user_id = auth.uid() OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
      )
    )
  );

CREATE POLICY "sub_orders_admin_insert" ON subscription_orders FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ─── Table reviews ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS reviews (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_id     uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  rating       smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment      text,
  is_verified  boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, user_id, order_id)
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_public_read" ON reviews FOR SELECT
  USING (
    is_published = true OR
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "reviews_owner_insert" ON reviews FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    user_id = auth.uid()
  );

CREATE POLICY "reviews_owner_update" ON reviews FOR UPDATE
  USING (user_id = auth.uid() AND is_published = false);

CREATE POLICY "reviews_admin_all" ON reviews FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ─── Storage : bucket product-images ─────────────────────────────────────────
-- Exécuter dans : Supabase Dashboard → SQL Editor
-- Crée le bucket public pour les images produits et les politiques RLS associées.

-- 1. Bucket (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'product-images') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'product-images',
      'product-images',
      true,
      5242880,  -- 5 Mo
      ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    );
  END IF;
END $$;

-- 2. Politique lecture publique
DROP POLICY IF EXISTS "product_images_public_read" ON storage.objects;
CREATE POLICY "product_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- 3. Upload réservé aux admins
DROP POLICY IF EXISTS "product_images_admin_insert" ON storage.objects;
CREATE POLICY "product_images_admin_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- 4. Mise à jour réservée aux admins
DROP POLICY IF EXISTS "product_images_admin_update" ON storage.objects;
CREATE POLICY "product_images_admin_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'product-images'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- 5. Suppression réservée aux admins
DROP POLICY IF EXISTS "product_images_admin_delete" ON storage.objects;
CREATE POLICY "product_images_admin_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ═══════════════════════════════════════════════════════════════════
-- Promo Codes — Codes de réduction
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS promo_codes (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code             text UNIQUE NOT NULL,
  description      text,
  discount_type    text NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value   numeric(10,2) NOT NULL CHECK (discount_value > 0),
  min_order_value  numeric(10,2) NOT NULL DEFAULT 0,
  max_uses         int,
  uses_count       int NOT NULL DEFAULT 0,
  expires_at       timestamptz,
  is_active        boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "promo_codes_auth_read" ON promo_codes;
CREATE POLICY "promo_codes_auth_read" ON promo_codes FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "promo_codes_admin_all" ON promo_codes;
CREATE POLICY "promo_codes_admin_all" ON promo_codes FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_code     text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_discount  numeric(10,2) NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.increment_promo_uses(code_text text)
RETURNS void AS $$
BEGIN
  UPDATE promo_codes SET uses_count = uses_count + 1 WHERE code = code_text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

INSERT INTO promo_codes (code, description, discount_type, discount_value, min_order_value, max_uses, expires_at)
VALUES
  ('WEEDKEND-20', 'Weekend spécial -20%', 'percent', 20, 30, 100, now() + interval '30 days'),
  ('BIENVENUE10', 'Réduction de bienvenue 10%', 'percent', 10, 0, NULL, NULL),
  ('CBD5EUR', 'Bon de réduction 5€', 'fixed', 5, 20, 50, now() + interval '60 days')
ON CONFLICT (code) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════
-- Bundles / Packs Découverte
-- ═══════════════════════════════════════════════════════════════════

-- Colonne is_bundle sur les produits
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_bundle boolean NOT NULL DEFAULT false;

-- Colonne economic_value : prix total si achetés séparément (calculé côté app)
ALTER TABLE products ADD COLUMN IF NOT EXISTS original_value numeric(10,2);

-- Table des articles composant un bundle
CREATE TABLE IF NOT EXISTS bundle_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id    uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_id   uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity     int NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (bundle_id, product_id)
);

ALTER TABLE bundle_items ENABLE ROW LEVEL SECURITY;

-- Lecture publique
DROP POLICY IF EXISTS "bundle_items_public_read" ON bundle_items;
CREATE POLICY "bundle_items_public_read" ON bundle_items FOR SELECT USING (true);

-- Écriture admin uniquement
DROP POLICY IF EXISTS "bundle_items_admin_all" ON bundle_items;
CREATE POLICY "bundle_items_admin_all" ON bundle_items FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Fonction : recalcule le stock d'un bundle = min(floor(component.stock / qty)) pour chaque item
CREATE OR REPLACE FUNCTION public.sync_bundle_stock(p_bundle_id uuid)
RETURNS void AS $$
DECLARE
  min_stock int;
BEGIN
  SELECT MIN(FLOOR(p.stock_quantity::float / bi.quantity))::int
    INTO min_stock
    FROM bundle_items bi
    JOIN products p ON p.id = bi.product_id
   WHERE bi.bundle_id = p_bundle_id;

  UPDATE products
     SET stock_quantity = COALESCE(min_stock, 0)
   WHERE id = p_bundle_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger sur les produits : quand le stock d'un produit change, resynchronise tous les bundles qui le contiennent
CREATE OR REPLACE FUNCTION public.trigger_sync_bundles_on_stock_change()
RETURNS trigger AS $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT DISTINCT bundle_id FROM bundle_items WHERE product_id = NEW.id
  LOOP
    PERFORM public.sync_bundle_stock(r.bundle_id);
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_bundle_stock ON products;
CREATE TRIGGER trg_sync_bundle_stock
  AFTER UPDATE OF stock_quantity ON products
  FOR EACH ROW
  WHEN (OLD.stock_quantity IS DISTINCT FROM NEW.stock_quantity AND NEW.is_bundle = false)
  EXECUTE FUNCTION public.trigger_sync_bundles_on_stock_change();

-- Exemple de bundle (seed — nécessite que les produits seed existent)
DO $$
DECLARE
  bundle_id   uuid;
  oil_id      uuid;
  infusion_id uuid;
BEGIN
  SELECT id INTO oil_id      FROM products WHERE slug = 'huile-20-sommeil'    LIMIT 1;
  SELECT id INTO infusion_id FROM products WHERE slug = 'infusion-detente'    LIMIT 1;

  IF oil_id IS NOT NULL AND infusion_id IS NOT NULL THEN
    -- Insérer le bundle produit
    INSERT INTO products (
      category_id, slug, name, description,
      price, original_value, image_url, stock_quantity,
      is_available, is_featured, is_active, is_bundle
    )
    SELECT
      (SELECT id FROM categories WHERE slug = 'huiles'),
      'pack-nuit-paisible',
      'Pack Nuit Paisible',
      'Le duo parfait pour des nuits sereines : Huile CBD 20% Sommeil + Infusion Détente. Économisez 10€ vs l''achat séparé.',
      64.90,
      71.80,
      'https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=800',
      0,
      true, true, true, true
    WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'pack-nuit-paisible')
    RETURNING id INTO bundle_id;

    IF bundle_id IS NOT NULL THEN
      INSERT INTO bundle_items (bundle_id, product_id, quantity) VALUES
        (bundle_id, oil_id, 1),
        (bundle_id, infusion_id, 1)
      ON CONFLICT DO NOTHING;

      PERFORM public.sync_bundle_stock(bundle_id);
    END IF;
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════
-- Cross-Selling — Produits Complémentaires
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS product_recommendations (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id       uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  recommended_id   uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sort_order       int NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, recommended_id),
  CHECK (product_id <> recommended_id)
);

ALTER TABLE product_recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recommendations_public_read" ON product_recommendations;
CREATE POLICY "recommendations_public_read" ON product_recommendations FOR SELECT USING (true);

DROP POLICY IF EXISTS "recommendations_admin_all" ON product_recommendations;
CREATE POLICY "recommendations_admin_all" ON product_recommendations FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Fonction : recommandations explicites + fallback même catégorie
CREATE OR REPLACE FUNCTION public.get_product_recommendations(p_product_id uuid, p_limit int DEFAULT 4)
RETURNS SETOF products AS $$
DECLARE
  cat_id uuid;
BEGIN
  SELECT category_id INTO cat_id FROM products WHERE id = p_product_id;

  RETURN QUERY
    SELECT prod.*
    FROM (
        -- Combine explicit recommendations and category fallback
        SELECT r.recommended_id as id, 0 AS priority, r.sort_order AS srt
        FROM product_recommendations r
        JOIN products p ON p.id = r.recommended_id
        WHERE r.product_id = p_product_id
          AND p.is_active = true AND p.is_available = true
        UNION ALL
        SELECT p.id, 1 AS priority, (random() * 100)::int AS srt
        FROM products p
        WHERE p.category_id = cat_id
          AND p.id <> p_product_id
          AND p.is_active = true AND p.is_available = true
          AND NOT EXISTS (
            SELECT 1 FROM product_recommendations
            WHERE product_id = p_product_id AND recommended_id = p.id
          )
    ) sub
    JOIN products prod ON prod.id = sub.id
    ORDER BY sub.priority, sub.srt
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Seed recommandations croisées
DO $$
DECLARE
  oil10   uuid; oil20 uuid; inf_det uuid; inf_dig uuid;
  amnesia uuid; gelato uuid; afghan  uuid;
BEGIN
  SELECT id INTO oil10   FROM products WHERE slug = 'huile-10-full-spectrum' LIMIT 1;
  SELECT id INTO oil20   FROM products WHERE slug = 'huile-20-sommeil'       LIMIT 1;
  SELECT id INTO inf_det FROM products WHERE slug = 'infusion-detente'       LIMIT 1;
  SELECT id INTO inf_dig FROM products WHERE slug = 'infusion-digestion'     LIMIT 1;
  SELECT id INTO amnesia FROM products WHERE slug = 'amnesia-haze'           LIMIT 1;
  SELECT id INTO gelato  FROM products WHERE slug = 'gelato'                 LIMIT 1;
  SELECT id INTO afghan  FROM products WHERE slug = 'afghan'                 LIMIT 1;

  IF oil10 IS NOT NULL AND inf_det IS NOT NULL THEN
    INSERT INTO product_recommendations (product_id, recommended_id, sort_order)
    VALUES (oil10, inf_det, 0) ON CONFLICT DO NOTHING;
  END IF;
  IF oil10 IS NOT NULL AND inf_dig IS NOT NULL THEN
    INSERT INTO product_recommendations (product_id, recommended_id, sort_order)
    VALUES (oil10, inf_dig, 1) ON CONFLICT DO NOTHING;
  END IF;
  IF oil20 IS NOT NULL AND inf_det IS NOT NULL THEN
    INSERT INTO product_recommendations (product_id, recommended_id, sort_order)
    VALUES (oil20, inf_det, 0) ON CONFLICT DO NOTHING;
  END IF;
  IF amnesia IS NOT NULL AND gelato IS NOT NULL THEN
    INSERT INTO product_recommendations (product_id, recommended_id, sort_order)
    VALUES (amnesia, gelato, 0) ON CONFLICT DO NOTHING;
  END IF;
  IF amnesia IS NOT NULL AND afghan IS NOT NULL THEN
    INSERT INTO product_recommendations (product_id, recommended_id, sort_order)
    VALUES (amnesia, afghan, 1) ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════
-- Attributs de Produits (Bénéfices & Notes Aromatiques)
-- ═══════════════════════════════════════════════════════════════════

-- 1. Ajout de la colonne JSONB
ALTER TABLE products ADD COLUMN IF NOT EXISTS attributes jsonb DEFAULT '{}'::jsonb;

-- 2. Mise à jour des produits existants avec des attributs
-- (Exemples: Détente Profonde, Focus & Énergie, Récupération Sportive, Fruité, Terreux, Épicé)
DO $$
BEGIN
  -- Fleurs
  UPDATE products SET attributes = jsonb_build_object(
    'benefits', jsonb_build_array('Détente Profonde'),
    'aromas', jsonb_build_array('Terreux', 'Épicé')
  ) WHERE slug IN ('amnesia-haze', 'afghan');

  UPDATE products SET attributes = jsonb_build_object(
    'benefits', jsonb_build_array('Focus & Énergie'),
    'aromas', jsonb_build_array('Fruité')
  ) WHERE slug = 'gelato';

  -- Huiles
  UPDATE products SET attributes = jsonb_build_object(
    'benefits', jsonb_build_array('Détente Profonde'),
    'aromas', jsonb_build_array('Naturel')
  ) WHERE slug LIKE 'huile%';

  UPDATE products SET attributes = jsonb_build_object(
    'benefits', jsonb_build_array('Sommeil Réparateur'),
    'aromas', jsonb_build_array('Naturel')
  ) WHERE slug = 'huile-20-sommeil';

  -- Infusions
  UPDATE products SET attributes = jsonb_build_object(
    'benefits', jsonb_build_array('Détente Profonde'),
    'aromas', jsonb_build_array('Fruité', 'Floral')
  ) WHERE slug = 'infusion-detente';

  UPDATE products SET attributes = jsonb_build_object(
    'benefits', jsonb_build_array('Confort Digestif'),
    'aromas', jsonb_build_array('Herbacé')
  ) WHERE slug = 'infusion-digestion';
END $$;
