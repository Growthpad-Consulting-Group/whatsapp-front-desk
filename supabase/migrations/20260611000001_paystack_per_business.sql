alter table public.businesses
  add column if not exists paystack_secret_key text;
