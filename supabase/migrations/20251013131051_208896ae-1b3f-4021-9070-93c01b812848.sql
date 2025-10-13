-- Add user timezone to profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS user_timezone text NOT NULL DEFAULT 'America/Chicago';

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_timezone ON public.user_profiles (user_timezone);
