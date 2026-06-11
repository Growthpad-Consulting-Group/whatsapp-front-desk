-- Bot persona settings per business
alter table public.businesses
  add column if not exists bot_name text default 'Front Desk',
  add column if not exists bot_tone text default 'warm'
    check (bot_tone in ('warm', 'professional', 'casual'));
