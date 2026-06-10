-- Per-business WhatsApp Cloud API credentials.
-- Each tenant connects their own WhatsApp Business number.
alter table public.businesses
  add column if not exists whatsapp_phone_number_id text,
  add column if not exists whatsapp_access_token     text;
