-- Create enum types for employee data
CREATE TYPE public.pay_scale_type AS ENUM ('hourly', 'project');
CREATE TYPE public.employee_status AS ENUM ('active', 'inactive', 'on_leave');

-- Create employees table
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  department TEXT NOT NULL,
  position TEXT NOT NULL,
  status employee_status NOT NULL DEFAULT 'active',
  pay_scale_type pay_scale_type NOT NULL,
  hourly_rate DECIMAL(10,2),
  -- Project percentage rates for different collaboration levels (1-5 members)
  project_rate_1_member DECIMAL(5,2), -- percentage for solo work
  project_rate_2_members DECIMAL(5,2),
  project_rate_3_members DECIMAL(5,2),
  project_rate_4_members DECIMAL(5,2),
  project_rate_5_members DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all operations for now since this is a simple payroll tool)
CREATE POLICY "Allow all operations on employees" 
ON public.employees 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_employees_updated_at
BEFORE UPDATE ON public.employees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_employees_status ON public.employees(status);
CREATE INDEX idx_employees_department ON public.employees(department);
CREATE INDEX idx_employees_email ON public.employees(email);