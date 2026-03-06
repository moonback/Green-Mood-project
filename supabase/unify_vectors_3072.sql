-- ─── Unified Vector Search Setup (3072 Dims) ───

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Consolidate Products Table Vector Column
-- Using 3072 dimensions for OpenAI text-embedding-3-large or Gemini 1.5
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'embedding') THEN
        ALTER TABLE public.products DROP COLUMN embedding;
    END IF;
    ALTER TABLE public.products ADD COLUMN embedding vector(3072);
END $$;

-- 3. Unified Match Products Function
CREATE OR REPLACE FUNCTION match_products (
  query_embedding vector(3072),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  category_id uuid,
  slug text,
  name text,
  description text,
  cbd_percentage numeric(5,2),
  thc_max numeric(5,3),
  weight_grams numeric(8,2),
  price numeric(10,2),
  image_url text,
  stock_quantity int,
  is_available boolean,
  is_featured boolean,
  is_active boolean,
  created_at timestamptz,
  attributes jsonb,
  is_bundle boolean,
  original_value numeric(10,2),
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.category_id,
    p.slug,
    p.name,
    p.description,
    p.cbd_percentage,
    p.thc_max,
    p.weight_grams,
    p.price,
    p.image_url,
    p.stock_quantity,
    p.is_available,
    p.is_featured,
    p.is_active,
    p.created_at,
    p.attributes,
    p.is_bundle,
    p.original_value,
    1 - (p.embedding <=> query_embedding) AS similarity
  FROM products p
  WHERE p.is_active = true
    AND p.is_available = true
    AND p.embedding IS NOT NULL
    AND 1 - (p.embedding <=> query_embedding) > match_threshold
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
