-- Add source column to payouts table
ALTER TABLE public.payouts ADD COLUMN source text NOT NULL DEFAULT 'manual';

-- Add a check constraint to ensure valid source values
ALTER TABLE public.payouts ADD CONSTRAINT payouts_source_check CHECK (source IN ('manual', 'auto'));