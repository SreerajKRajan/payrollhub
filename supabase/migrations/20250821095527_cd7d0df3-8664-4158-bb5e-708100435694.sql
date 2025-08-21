-- Add new fields to payouts table for enhanced project tracking
ALTER TABLE public.payouts 
ADD COLUMN assigned_member_id UUID,
ADD COLUMN assigned_member_name TEXT,
ADD COLUMN quoted_by_id UUID, 
ADD COLUMN quoted_by_name TEXT,
ADD COLUMN project_title TEXT,
ADD COLUMN is_first_time BOOLEAN DEFAULT false;