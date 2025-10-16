-- Add fields to payouts table for tracking edits and time entries
ALTER TABLE public.payouts 
ADD COLUMN IF NOT EXISTS clock_in_time timestamp with time zone,
ADD COLUMN IF NOT EXISTS clock_out_time timestamp with time zone,
ADD COLUMN IF NOT EXISTS edit_reason text,
ADD COLUMN IF NOT EXISTS is_edited boolean DEFAULT false;