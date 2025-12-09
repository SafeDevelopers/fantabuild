-- Credits and Pricing System Schema
-- Run this migration to add credits and pricing support

-- Add plan and credits columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'FREE' CHECK (plan IN ('FREE', 'PAY_PER_USE', 'PRO')),
ADD COLUMN IF NOT EXISTS credits INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS pro_since TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS pro_until TIMESTAMPTZ;

-- Credit Transactions table
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  change INTEGER NOT NULL, -- Positive for credits added, negative for credits consumed
  reason TEXT NOT NULL CHECK (reason IN ('INITIAL_FREE', 'DOWNLOAD', 'ONE_OFF_PURCHASE', 'SUBSCRIPTION_MONTHLY')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('ONE_OFF', 'SUBSCRIPTION')),
  amount DECIMAL(10, 2) NOT NULL,
  provider TEXT NOT NULL DEFAULT 'stripe' CHECK (provider IN ('stripe', 'paypal', 'telebirr', 'cbe')),
  provider_session_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded')),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_session_id ON payments(provider_session_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan);
CREATE INDEX IF NOT EXISTS idx_users_credits ON users(credits);

-- Trigger to auto-update payments updated_at
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to initialize new users with 3 free credits
CREATE OR REPLACE FUNCTION initialize_free_credits()
RETURNS TRIGGER AS $$
BEGIN
  -- Set initial credits to 3 for new users
  IF NEW.credits = 0 AND NEW.plan = 'FREE' THEN
    NEW.credits := 3;
    -- Create initial credit transaction
    INSERT INTO credit_transactions (user_id, change, reason)
    VALUES (NEW.id, 3, 'INITIAL_FREE');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to initialize free credits on user creation
CREATE TRIGGER initialize_user_credits
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_free_credits();

-- Update existing users to have FREE plan and 3 credits if they don't have credits
UPDATE users 
SET plan = 'FREE', credits = 3
WHERE credits = 0 AND plan IS NULL;

-- Create initial credit transactions for existing users who got credits
INSERT INTO credit_transactions (user_id, change, reason)
SELECT id, 3, 'INITIAL_FREE'
FROM users
WHERE credits = 3
AND NOT EXISTS (
  SELECT 1 FROM credit_transactions 
  WHERE user_id = users.id AND reason = 'INITIAL_FREE'
);
