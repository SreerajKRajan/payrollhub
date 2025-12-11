-- Add job_id column to payouts table for external system reference
ALTER TABLE public.payouts 
ADD COLUMN job_id text NULL;

-- Add index for faster duplicate lookups
CREATE INDEX idx_payouts_job_id ON public.payouts(job_id) WHERE job_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.payouts.job_id IS 'External job identifier from webhook source. NULL for manual records.';