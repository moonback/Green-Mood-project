-- ─── POS Reports (Clôture Z) ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pos_reports (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date            date UNIQUE NOT NULL DEFAULT CURRENT_DATE,
  total_sales     numeric(10,2) NOT NULL DEFAULT 0,
  cash_total      numeric(10,2) NOT NULL DEFAULT 0,
  card_total      numeric(10,2) NOT NULL DEFAULT 0,
  mobile_total    numeric(10,2) NOT NULL DEFAULT 0,
  items_sold      int NOT NULL DEFAULT 0,
  order_count     int NOT NULL DEFAULT 0,
  closed_at       timestamptz NOT NULL DEFAULT now(),
  closed_by       uuid REFERENCES profiles(id),
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE pos_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pos_reports_admin_all" ON pos_reports;
CREATE POLICY "pos_reports_admin_all" ON pos_reports FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
