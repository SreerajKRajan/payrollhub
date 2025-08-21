-- Fix the search path security issue for calculate_total_hours function
CREATE OR REPLACE FUNCTION public.calculate_total_hours()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.check_out_time IS NOT NULL AND OLD.check_out_time IS NULL THEN
    NEW.total_hours = EXTRACT(EPOCH FROM (NEW.check_out_time - NEW.check_in_time)) / 3600;
    NEW.status = 'checked_out';
  END IF;
  RETURN NEW;
END;
$$;