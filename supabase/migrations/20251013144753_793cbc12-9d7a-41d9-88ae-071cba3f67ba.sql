-- Add timezone column to employees table
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'America/Chicago';

-- Add a comment explaining the column
COMMENT ON COLUMN public.employees.timezone IS 'IANA timezone string for the employee (e.g., America/Chicago, Asia/Manila)';

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_employees_timezone ON public.employees(timezone);