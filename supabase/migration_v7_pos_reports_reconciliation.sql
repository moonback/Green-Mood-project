-- ═══════════════════════════════════════════════════════════════════
-- Green Mood CBD — Migration V7 (POS Reports Reconciliation & Breakdown)
-- Adds cash counting and product sales details to POS closing reports
-- ═══════════════════════════════════════════════════════════════════

-- 1. Add product breakdown and cash counting columns to pos_reports
ALTER TABLE pos_reports ADD COLUMN IF NOT EXISTS product_breakdown jsonb DEFAULT '{}'::jsonb;
ALTER TABLE pos_reports ADD COLUMN IF NOT EXISTS cash_counted numeric(10,2) DEFAULT 0;
ALTER TABLE pos_reports ADD COLUMN IF NOT EXISTS cash_difference numeric(10,2) DEFAULT 0;

-- 2. Optional: Migration for existing reports to ensure they have an empty breakdown
UPDATE pos_reports SET product_breakdown = '{}'::jsonb WHERE product_breakdown IS NULL;
