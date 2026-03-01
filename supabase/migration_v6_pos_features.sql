-- ═══════════════════════════════════════════════════════════════════
-- Green Mood CBD — Migration V6 (POS Advanced Features)
-- Barcode Scanner Support & Bundle Optimization
-- ═══════════════════════════════════════════════════════════════════

-- 1. Add SKU/Barcode field to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku text UNIQUE;
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

-- 2. Add some example SKUs for testing (optional but helpful)
UPDATE products SET sku = '10001' WHERE slug = 'amnesia-haze';
UPDATE products SET sku = '10002' WHERE slug = 'gelato';
UPDATE products SET sku = '10003' WHERE slug = 'afghan';
UPDATE products SET sku = '20001' WHERE slug = 'pack-nuit-paisible';

-- 3. Ensure bundle_items has an index for fast lookups
CREATE INDEX IF NOT EXISTS idx_bundle_items_bundle_id ON bundle_items(bundle_id);
