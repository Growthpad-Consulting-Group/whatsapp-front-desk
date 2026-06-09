-- ============================================================
-- WhatsApp Front Desk — Initial Schema
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ─── BUSINESSES ──────────────────────────────────────────────
create table public.businesses (
  id                       uuid primary key default gen_random_uuid(),
  name                     text not null,
  industry                 text,
  timezone                 text not null default 'Africa/Nairobi',
  currency                 text not null default 'KES',
  whatsapp_number          text,
  logo_url                 text,
  billing_plan             text not null default 'trial',
  cancellation_hours       int  not null default 24,
  deposit_default_percent  numeric(5,2),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

-- ─── STAFF MEMBERS ───────────────────────────────────────────
create table public.staff_members (
  id                 uuid primary key default gen_random_uuid(),
  business_id        uuid not null references public.businesses(id) on delete cascade,
  user_id            uuid references auth.users(id) on delete set null,
  name               text not null,
  email              text not null,
  role               text not null default 'staff' check (role in ('owner','staff')),
  phone              text,
  calendar_connected boolean not null default false,
  active             boolean not null default true,
  created_at         timestamptz not null default now()
);

create index idx_staff_business on public.staff_members(business_id);
create index idx_staff_user    on public.staff_members(user_id);

-- ─── CUSTOMERS ───────────────────────────────────────────────
create table public.customers (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.businesses(id) on delete cascade,
  name          text not null,
  phone         text not null,
  email         text,
  notes         text,
  consent_given boolean not null default false,
  tags          text[] not null default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (business_id, phone)
);

create index idx_customers_business on public.customers(business_id);
create index idx_customers_phone    on public.customers(business_id, phone);

-- ─── SERVICES ────────────────────────────────────────────────
create table public.services (
  id                    uuid primary key default gen_random_uuid(),
  business_id           uuid not null references public.businesses(id) on delete cascade,
  name                  text not null,
  description           text,
  duration_minutes      int  not null check (duration_minutes > 0),
  price                 numeric(10,2) not null check (price >= 0),
  deposit_required      boolean not null default false,
  deposit_amount        numeric(10,2),
  buffer_before_minutes int  not null default 0,
  buffer_after_minutes  int  not null default 0,
  staff_id              uuid references public.staff_members(id) on delete set null,
  active                boolean not null default true,
  created_at            timestamptz not null default now()
);

create index idx_services_business on public.services(business_id);

-- ─── OPERATING HOURS ─────────────────────────────────────────
create table public.operating_hours (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  day_of_week int  not null check (day_of_week between 0 and 6), -- 0=Sun, 6=Sat
  open_time   time,           -- null = closed
  close_time  time,
  is_closed   boolean not null default false,
  unique (business_id, day_of_week)
);

create index idx_hours_business on public.operating_hours(business_id);

-- ─── APPOINTMENTS ────────────────────────────────────────────
create table public.appointments (
  id             uuid primary key default gen_random_uuid(),
  business_id    uuid not null references public.businesses(id) on delete cascade,
  customer_id    uuid not null references public.customers(id) on delete restrict,
  service_id     uuid not null references public.services(id)  on delete restrict,
  staff_id       uuid references public.staff_members(id) on delete set null,
  start_at       timestamptz not null,
  end_at         timestamptz not null,
  status         text not null default 'pending'
                   check (status in ('pending','confirmed','cancelled','completed','no_show')),
  payment_status text not null default 'unpaid'
                   check (payment_status in ('unpaid','deposit_pending','deposit_paid','paid','partially_paid','refunded')),
  source         text not null default 'whatsapp'
                   check (source in ('whatsapp','manual','link')),
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  check (end_at > start_at)
);

create index idx_appt_business    on public.appointments(business_id);
create index idx_appt_customer    on public.appointments(customer_id);
create index idx_appt_staff_time  on public.appointments(business_id, staff_id, start_at)
  where status not in ('cancelled');
create index idx_appt_start       on public.appointments(business_id, start_at);

-- Prevent double booking: unique active slot per staff per business
create unique index idx_appt_no_double_book
  on public.appointments(business_id, staff_id, start_at)
  where status not in ('cancelled');

-- ─── INVOICES ────────────────────────────────────────────────
create table public.invoices (
  id             uuid primary key default gen_random_uuid(),
  business_id    uuid not null references public.businesses(id) on delete cascade,
  customer_id    uuid not null references public.customers(id) on delete restrict,
  appointment_id uuid references public.appointments(id) on delete set null,
  invoice_number text not null,
  amount         numeric(10,2) not null check (amount >= 0),
  amount_paid    numeric(10,2) not null default 0 check (amount_paid >= 0),
  currency       text not null default 'KES',
  due_date       date not null,
  status         text not null default 'draft'
                   check (status in ('draft','sent','due','overdue','partially_paid','paid','cancelled','disputed')),
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (business_id, invoice_number)
);

create index idx_invoices_business    on public.invoices(business_id);
create index idx_invoices_customer    on public.invoices(customer_id);
create index idx_invoices_status      on public.invoices(business_id, status);
create index idx_invoices_due_date    on public.invoices(business_id, due_date);

-- ─── PAYMENT REQUESTS ────────────────────────────────────────
create table public.payment_requests (
  id                uuid primary key default gen_random_uuid(),
  business_id       uuid not null references public.businesses(id) on delete cascade,
  invoice_id        uuid references public.invoices(id) on delete set null,
  appointment_id    uuid references public.appointments(id) on delete set null,
  provider          text not null default 'paystack',
  link              text not null,
  amount            numeric(10,2) not null,
  currency          text not null default 'KES',
  status            text not null default 'pending'
                      check (status in ('pending','paid','expired','failed')),
  webhook_reference text,
  created_at        timestamptz not null default now()
);

create index idx_payment_req_business on public.payment_requests(business_id);
create index idx_payment_req_invoice  on public.payment_requests(invoice_id);

-- ─── MESSAGE TEMPLATES ───────────────────────────────────────
create table public.message_templates (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references public.businesses(id) on delete cascade,
  type            text not null,
  language        text not null default 'en',
  body            text not null,
  approval_status text not null default 'local'
                    check (approval_status in ('local','pending','approved','rejected')),
  unique (business_id, type, language)
);

create index idx_templates_business on public.message_templates(business_id);

-- ─── REMINDER RULES ──────────────────────────────────────────
create table public.reminder_rules (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references public.businesses(id) on delete cascade,
  trigger         text not null
                    check (trigger in (
                      'booking_confirmed','24h_before','2h_before',
                      'invoice_due','invoice_overdue_1_3','invoice_overdue_4_7',
                      'deposit_pending'
                    )),
  timing_minutes  int,
  channel         text not null default 'whatsapp',
  template_id     uuid references public.message_templates(id) on delete set null,
  active          boolean not null default true,
  unique (business_id, trigger)
);

create index idx_reminder_rules_business on public.reminder_rules(business_id);

-- ─── REMINDER SENT LOG (idempotency) ─────────────────────────
create table public.reminder_sent_log (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  trigger      text not null,
  reference_id uuid not null,   -- appointment_id or invoice_id
  sent_at      timestamptz not null default now(),
  unique (business_id, trigger, reference_id)
);

create index idx_reminder_log_business on public.reminder_sent_log(business_id);

-- ─── MESSAGE LOGS ────────────────────────────────────────────
create table public.message_logs (
  id                  uuid primary key default gen_random_uuid(),
  business_id         uuid not null references public.businesses(id) on delete cascade,
  customer_id         uuid references public.customers(id) on delete set null,
  channel             text not null default 'whatsapp',
  direction           text not null check (direction in ('inbound','outbound')),
  content_summary     text not null,
  status              text not null default 'sent'
                        check (status in ('sent','delivered','read','failed')),
  provider_message_id text,
  timestamp           timestamptz not null default now()
);

create index idx_msg_log_business   on public.message_logs(business_id);
create index idx_msg_log_customer   on public.message_logs(customer_id);
create index idx_msg_log_timestamp  on public.message_logs(business_id, timestamp desc);

-- ─── CONVERSATION SESSIONS ───────────────────────────────────
create table public.conversation_sessions (
  id             uuid primary key default gen_random_uuid(),
  business_id    uuid not null references public.businesses(id) on delete cascade,
  customer_phone text not null,
  state          text not null default 'idle'
                   check (state in (
                     'idle','awaiting_service','awaiting_slot',
                     'awaiting_confirmation','awaiting_deposit','human_handoff'
                   )),
  context        jsonb not null default '{}',
  expires_at     timestamptz not null default (now() + interval '30 minutes'),
  updated_at     timestamptz not null default now(),
  unique (business_id, customer_phone)
);

create index idx_sessions_business on public.conversation_sessions(business_id);
create index idx_sessions_expires  on public.conversation_sessions(expires_at);

-- ─── UPDATED_AT TRIGGER ──────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_businesses_updated_at
  before update on public.businesses
  for each row execute function public.set_updated_at();

create trigger trg_customers_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

create trigger trg_appointments_updated_at
  before update on public.appointments
  for each row execute function public.set_updated_at();

create trigger trg_invoices_updated_at
  before update on public.invoices
  for each row execute function public.set_updated_at();

create trigger trg_sessions_updated_at
  before update on public.conversation_sessions
  for each row execute function public.set_updated_at();

-- ─── INVOICE AUTO-NUMBERING ──────────────────────────────────
create sequence if not exists public.invoice_number_seq start 1000;

create or replace function public.generate_invoice_number(p_business_id uuid)
returns text language plpgsql as $$
declare
  v_num int;
begin
  v_num := nextval('public.invoice_number_seq');
  return 'INV-' || lpad(v_num::text, 5, '0');
end;
$$;
