/*
# Create Expense & Investment Tracker Schema (single-tenant, no auth)

1. Overview
This migration creates the core schema for a premium expense & investment tracker.
The app is single-tenant (no sign-in screen), so all policies allow anon + authenticated access.

2. New Tables
- `categories`: Stores expense and investment categories with color, icon, budget limit, and description.
  - id (uuid, PK)
  - name (text, unique, not null) — category name, must be unique
  - type (text, not null) — 'expense' or 'investment'
  - color (text, not null) — hex color string for label
  - icon (text, not null) — lucide icon name
  - budget_limit (numeric) — spending limit; null means unlimited (used for investment categories)
  - description (text) — optional description
  - created_at (timestamptz, default now())
  - updated_at (timestamptz, default now())

- `transactions`: Stores individual expense/investment transactions linked to a category.
  - id (uuid, PK)
  - category_id (uuid, FK -> categories.id ON DELETE CASCADE)
  - type (text, not null) — 'expense' or 'investment'
  - item_name (text, not null) — name of the item/transaction
  - amount (numeric, not null) — must be > 0
  - date (date, not null) — transaction date
  - receipt_url (text) — optional base64 or URL of receipt image
  - notes (text) — optional notes
  - status (text, not null, default 'completed') — 'completed' or 'pending'
  - created_at (timestamptz, default now())
  - updated_at (timestamptz, default now())

3. Indexes
- Index on transactions.category_id for join performance
- Index on transactions.date for date-range filtering
- Index on categories.type for type-based filtering

4. Security
- RLS enabled on both tables.
- All CRUD policies use `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)` because this is a single-tenant app with intentionally shared data and no sign-in screen.

5. Notes
- `budget_limit` is nullable: NULL means unlimited (default for investment categories).
- `receipt_url` stores a base64 data URL for receipt thumbnails (no external storage needed).
- `updated_at` auto-updates via trigger.
*/

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  type text NOT NULL CHECK (type IN ('expense', 'investment')),
  color text NOT NULL DEFAULT '#6366f1',
  icon text NOT NULL DEFAULT 'Wallet',
  budget_limit numeric,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_categories" ON categories;
CREATE POLICY "anon_select_categories" ON categories FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_categories" ON categories;
CREATE POLICY "anon_insert_categories" ON categories FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_categories" ON categories;
CREATE POLICY "anon_update_categories" ON categories FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_categories" ON categories;
CREATE POLICY "anon_delete_categories" ON categories FOR DELETE
  TO anon, authenticated USING (true);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('expense', 'investment')),
  item_name text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  date date NOT NULL,
  receipt_url text,
  notes text,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_transactions" ON transactions;
CREATE POLICY "anon_select_transactions" ON transactions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_transactions" ON transactions;
CREATE POLICY "anon_insert_transactions" ON transactions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_transactions" ON transactions;
CREATE POLICY "anon_update_transactions" ON transactions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_transactions" ON transactions;
CREATE POLICY "anon_delete_transactions" ON transactions FOR DELETE
  TO anon, authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS categories_updated_at ON categories;
CREATE TRIGGER categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS transactions_updated_at ON transactions;
CREATE TRIGGER transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();