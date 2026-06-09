-- Add columns for Google Calendar OAuth tokens to staff_members table
ALTER TABLE public.staff_members
ADD COLUMN IF NOT EXISTS google_access_token text,
ADD COLUMN IF NOT EXISTS google_refresh_token text,
ADD COLUMN IF NOT EXISTS google_token_expires_at timestamptz;

-- Add column for Google Calendar event reference to appointments table
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS google_event_id text;
