-- ═══════════════════════════════════════════════════════════════════
-- Green Moon CBD — Migration Supabase
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

-- Categories : lecture publique
CREATE POLICY "categories_public_read" ON categories FOR SELECT USING (true);
CREATE POLICY "categories_admin_write" ON categories FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Products : lecture publique
CREATE POLICY "products_public_read" ON products FOR SELECT USING (true);
CREATE POLICY "products_admin_write" ON products FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Profiles : lecture/écriture par propriétaire ou admin
CREATE POLICY "profiles_self_read" ON profiles FOR SELECT USING (
  id = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "profiles_self_update" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "profiles_admin_all" ON profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Addresses : propriétaire uniquement
CREATE POLICY "addresses_owner" ON addresses FOR ALL USING (user_id = auth.uid());

-- Orders : propriétaire ou admin
CREATE POLICY "orders_owner_read" ON orders FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "orders_auth_insert" ON orders FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "orders_admin_update" ON orders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Order items : propriétaire ou admin
CREATE POLICY "order_items_owner_read" ON order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders o WHERE o.id = order_id AND (
      o.user_id = auth.uid() OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    )
  )
);
CREATE POLICY "order_items_auth_insert" ON order_items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Stock movements : admin uniquement
CREATE POLICY "stock_admin_all" ON stock_movements FOR ALL USING (
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
END $$;
