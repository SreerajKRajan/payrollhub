-- Create payouts table to track payout records
CREATE TABLE public.payouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL,
  employee_name TEXT NOT NULL,
  calculation_type TEXT NOT NULL CHECK (calculation_type IN ('hourly', 'project')),
  amount NUMERIC(10,2) NOT NULL,
  rate NUMERIC(10,2) NOT NULL,
  project_value NUMERIC(10,2),
  hours_worked NUMERIC(10,2),
  collaborators_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (since this is internal payroll data)
CREATE POLICY "Allow all operations on payouts" 
ON public.payouts 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_payouts_updated_at
BEFORE UPDATE ON public.payouts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();