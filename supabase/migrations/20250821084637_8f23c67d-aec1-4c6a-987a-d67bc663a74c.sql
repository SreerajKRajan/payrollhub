-- Fix the security warning by properly recreating the function with search_path
DROP TRIGGER IF EXISTS update_employees_updated_at ON public.employees;
DROP FUNCTION IF EXISTS public.update_updated_at_column();

-- Recreate the function with proper security settings
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER update_employees_updated_at
BEFORE UPDATE ON public.employees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();