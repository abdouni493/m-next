-- ============================================
-- CAISSE (CASH REGISTER) MANAGEMENT SCHEMA
-- ============================================

-- Create caisse_transactions table for encaissement and décaissement
CREATE TABLE IF NOT EXISTS public.caisse_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('encaissement', 'decaissement')),
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT NOT NULL,
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_caisse_type ON public.caisse_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_caisse_date ON public.caisse_transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_caisse_active ON public.caisse_transactions(is_active);

-- Create caisse_summary view to get balance
CREATE OR REPLACE VIEW public.caisse_summary AS
SELECT 
  COALESCE(SUM(CASE WHEN transaction_type = 'encaissement' THEN amount ELSE 0 END), 0) as total_encaissements,
  COALESCE(SUM(CASE WHEN transaction_type = 'decaissement' THEN amount ELSE 0 END), 0) as total_decaissements,
  COALESCE(SUM(CASE WHEN transaction_type = 'encaissement' THEN amount ELSE 0 END), 0) - 
  COALESCE(SUM(CASE WHEN transaction_type = 'decaissement' THEN amount ELSE 0 END), 0) as balance,
  COUNT(*) as total_transactions
FROM public.caisse_transactions
WHERE is_active = TRUE;

-- Disable RLS if enabled (keeping it open for all authenticated users)
ALTER TABLE public.caisse_transactions DISABLE ROW LEVEL SECURITY;

-- Create RLS policy to allow all authenticated users to view and manage caisse transactions
CREATE POLICY "Allow all authenticated users to manage caisse" ON public.caisse_transactions
  USING (TRUE)
  WITH CHECK (TRUE);

ALTER TABLE public.caisse_transactions ENABLE ROW LEVEL SECURITY;
