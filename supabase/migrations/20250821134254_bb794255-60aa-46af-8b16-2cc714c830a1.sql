-- Create application settings table
CREATE TABLE public.app_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  setting_type TEXT NOT NULL DEFAULT 'text',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for app settings
CREATE POLICY "Allow all operations on app_settings" 
ON public.app_settings 
FOR ALL 
USING (true);

-- Insert default first time bonus percentage
INSERT INTO public.app_settings (setting_key, setting_value, setting_type) 
VALUES ('first_time_bonus_percentage', '30', 'number');

-- Add trigger for updated_at
CREATE TRIGGER update_app_settings_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();