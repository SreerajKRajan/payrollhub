-- Add admin column to employees table
ALTER TABLE public.employees 
ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT false;