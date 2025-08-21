-- Create time_entries table for tracking check-ins and check-outs
CREATE TABLE public.time_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL,
  employee_name TEXT NOT NULL,
  check_in_time TIMESTAMP WITH TIME ZONE NOT NULL,
  check_out_time TIMESTAMP WITH TIME ZONE NULL,
  total_hours NUMERIC NULL,
  status TEXT NOT NULL DEFAULT 'checked_in' CHECK (status IN ('checked_in', 'checked_out')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for time entries
CREATE POLICY "Allow all operations on time_entries" 
ON public.time_entries 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_time_entries_updated_at
BEFORE UPDATE ON public.time_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically calculate hours when checking out
CREATE OR REPLACE FUNCTION public.calculate_total_hours()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.check_out_time IS NOT NULL AND OLD.check_out_time IS NULL THEN
    NEW.total_hours = EXTRACT(EPOCH FROM (NEW.check_out_time - NEW.check_in_time)) / 3600;
    NEW.status = 'checked_out';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to calculate hours on check-out
CREATE TRIGGER calculate_hours_on_checkout
BEFORE UPDATE ON public.time_entries
FOR EACH ROW
EXECUTE FUNCTION public.calculate_total_hours();