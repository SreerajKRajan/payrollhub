-- Add timezone field to time_entries table
ALTER TABLE time_entries 
ADD COLUMN IF NOT EXISTS timezone_offset INTEGER;

-- Add comment explaining the timezone_offset field
COMMENT ON COLUMN time_entries.timezone_offset IS 'User timezone offset in minutes from UTC at time of check-in';

-- Add timezone to existing entries (default to 0 for UTC)
UPDATE time_entries 
SET timezone_offset = 0 
WHERE timezone_offset IS NULL;