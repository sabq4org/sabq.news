-- ============================================
-- PUBLISHER / CONTENT SALES SYSTEM TABLES
-- ============================================
-- Execute these SQL statements in your Production Database

-- 1. Publishers Table
CREATE TABLE IF NOT EXISTS publishers (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Agency/Publisher details
  agency_name TEXT NOT NULL,
  agency_name_en TEXT,
  contact_person TEXT NOT NULL,
  contact_person_en TEXT,
  phone_number TEXT NOT NULL,
  email TEXT NOT NULL,
  
  -- Business info
  commercial_registration TEXT,
  tax_number TEXT,
  address TEXT,
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  suspended_until TIMESTAMP,
  suspension_reason TEXT,
  
  -- Metadata
  notes TEXT,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for publishers
CREATE INDEX IF NOT EXISTS publishers_user_id_idx ON publishers(user_id);
CREATE INDEX IF NOT EXISTS publishers_is_active_idx ON publishers(is_active);

-- 2. Publisher Credits Table
CREATE TABLE IF NOT EXISTS publisher_credits (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  publisher_id VARCHAR NOT NULL REFERENCES publishers(id) ON DELETE CASCADE,
  
  -- Package details
  package_name TEXT NOT NULL,
  total_credits INTEGER NOT NULL,
  used_credits INTEGER NOT NULL DEFAULT 0,
  remaining_credits INTEGER NOT NULL,
  
  -- Package period
  period TEXT NOT NULL, -- monthly, quarterly, yearly, one-time
  start_date TIMESTAMP NOT NULL,
  expiry_date TIMESTAMP, -- null for one-time packages
  
  -- Pricing (optional - for invoicing)
  price_per_article REAL,
  total_price REAL,
  currency TEXT DEFAULT 'SAR',
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Metadata
  notes TEXT,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for publisher_credits
CREATE INDEX IF NOT EXISTS publisher_credits_publisher_id_idx ON publisher_credits(publisher_id);
CREATE INDEX IF NOT EXISTS publisher_credits_is_active_idx ON publisher_credits(is_active);
CREATE INDEX IF NOT EXISTS publisher_credits_expiry_date_idx ON publisher_credits(expiry_date);

-- 3. Publisher Credit Logs Table
CREATE TABLE IF NOT EXISTS publisher_credit_logs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  publisher_id VARCHAR NOT NULL REFERENCES publishers(id) ON DELETE CASCADE,
  credit_package_id VARCHAR NOT NULL REFERENCES publisher_credits(id) ON DELETE CASCADE,
  article_id VARCHAR REFERENCES articles(id) ON DELETE SET NULL,
  
  -- Action type
  action_type TEXT NOT NULL, -- credit_added, credit_used, credit_refunded, package_expired
  
  -- Details
  credits_before INTEGER NOT NULL,
  credits_changed INTEGER NOT NULL, -- +/- amount
  credits_after INTEGER NOT NULL,
  
  -- Who performed the action
  performed_by VARCHAR REFERENCES users(id),
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for publisher_credit_logs
CREATE INDEX IF NOT EXISTS publisher_credit_logs_publisher_id_idx ON publisher_credit_logs(publisher_id);
CREATE INDEX IF NOT EXISTS publisher_credit_logs_article_id_idx ON publisher_credit_logs(article_id);
CREATE INDEX IF NOT EXISTS publisher_credit_logs_created_at_idx ON publisher_credit_logs(created_at DESC);

-- 4. Add Publisher fields to articles table (if not exist)
ALTER TABLE articles 
  ADD COLUMN IF NOT EXISTS is_publisher_news BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS publisher_id VARCHAR REFERENCES publishers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS publisher_credit_deducted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS publisher_submitted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS publisher_approved_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS publisher_approved_by VARCHAR REFERENCES users(id);

-- Indexes for articles publisher fields
CREATE INDEX IF NOT EXISTS articles_publisher_id_idx ON articles(publisher_id);
CREATE INDEX IF NOT EXISTS articles_is_publisher_news_idx ON articles(is_publisher_news);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify tables were created successfully:

-- Check publishers table
SELECT COUNT(*) as publisher_count FROM publishers;

-- Check publisher_credits table
SELECT COUNT(*) as credits_count FROM publisher_credits;

-- Check publisher_credit_logs table
SELECT COUNT(*) as logs_count FROM publisher_credit_logs;

-- Check articles publisher columns
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'articles' 
  AND column_name IN ('is_publisher_news', 'publisher_id', 'publisher_credit_deducted');
