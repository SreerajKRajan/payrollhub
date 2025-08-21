-- Insert default quoted by bonus percentage for non-first-time projects
INSERT INTO public.app_settings (setting_key, setting_value, setting_type) 
VALUES ('quoted_by_bonus_percentage', '2', 'number');