-- Add birthday and anniversary date fields to customers
-- Used by the birthday/anniversary reminder cron to send WhatsApp greetings

alter table public.customers
  add column if not exists birthday     date,
  add column if not exists anniversary  date;

comment on column public.customers.birthday    is 'Client birthday (year is ignored; only month+day used for annual reminders).';
comment on column public.customers.anniversary is 'Client anniversary date (year is ignored; only month+day used for annual reminders).';
