-- ============================================================
-- Row Level Security Policies
-- Every table is scoped to business_id via staff_members.
-- ============================================================

-- Helper: returns the business_id for the currently authenticated user
create or replace function public.my_business_id()
returns uuid language sql stable security definer as $$
  select business_id
  from public.staff_members
  where user_id = auth.uid()
    and active = true
  limit 1;
$$;

-- ─── BUSINESSES ──────────────────────────────────────────────
alter table public.businesses enable row level security;

create policy "businesses: owner can read own"
  on public.businesses for select
  using (id = public.my_business_id());

create policy "businesses: owner can update own"
  on public.businesses for update
  using (id = public.my_business_id());

-- ─── STAFF MEMBERS ───────────────────────────────────────────
alter table public.staff_members enable row level security;

create policy "staff: read own business"
  on public.staff_members for select
  using (business_id = public.my_business_id());

create policy "staff: owner can insert"
  on public.staff_members for insert
  with check (business_id = public.my_business_id());

create policy "staff: owner can update"
  on public.staff_members for update
  using (business_id = public.my_business_id());

-- ─── CUSTOMERS ───────────────────────────────────────────────
alter table public.customers enable row level security;

create policy "customers: read own business"
  on public.customers for select
  using (business_id = public.my_business_id());

create policy "customers: insert own business"
  on public.customers for insert
  with check (business_id = public.my_business_id());

create policy "customers: update own business"
  on public.customers for update
  using (business_id = public.my_business_id());

-- ─── SERVICES ────────────────────────────────────────────────
alter table public.services enable row level security;

create policy "services: read own business"
  on public.services for select
  using (business_id = public.my_business_id());

create policy "services: insert own business"
  on public.services for insert
  with check (business_id = public.my_business_id());

create policy "services: update own business"
  on public.services for update
  using (business_id = public.my_business_id());

-- ─── OPERATING HOURS ─────────────────────────────────────────
alter table public.operating_hours enable row level security;

create policy "hours: read own business"
  on public.operating_hours for select
  using (business_id = public.my_business_id());

create policy "hours: insert own business"
  on public.operating_hours for insert
  with check (business_id = public.my_business_id());

create policy "hours: update own business"
  on public.operating_hours for update
  using (business_id = public.my_business_id());

create policy "hours: delete own business"
  on public.operating_hours for delete
  using (business_id = public.my_business_id());

-- ─── APPOINTMENTS ────────────────────────────────────────────
alter table public.appointments enable row level security;

create policy "appointments: read own business"
  on public.appointments for select
  using (business_id = public.my_business_id());

create policy "appointments: insert own business"
  on public.appointments for insert
  with check (business_id = public.my_business_id());

create policy "appointments: update own business"
  on public.appointments for update
  using (business_id = public.my_business_id());

-- ─── INVOICES ────────────────────────────────────────────────
alter table public.invoices enable row level security;

create policy "invoices: read own business"
  on public.invoices for select
  using (business_id = public.my_business_id());

create policy "invoices: insert own business"
  on public.invoices for insert
  with check (business_id = public.my_business_id());

create policy "invoices: update own business"
  on public.invoices for update
  using (business_id = public.my_business_id());

-- ─── PAYMENT REQUESTS ────────────────────────────────────────
alter table public.payment_requests enable row level security;

create policy "payment_requests: read own business"
  on public.payment_requests for select
  using (business_id = public.my_business_id());

create policy "payment_requests: insert own business"
  on public.payment_requests for insert
  with check (business_id = public.my_business_id());

create policy "payment_requests: update own business"
  on public.payment_requests for update
  using (business_id = public.my_business_id());

-- ─── MESSAGE TEMPLATES ───────────────────────────────────────
alter table public.message_templates enable row level security;

create policy "templates: read own business"
  on public.message_templates for select
  using (business_id = public.my_business_id());

create policy "templates: insert own business"
  on public.message_templates for insert
  with check (business_id = public.my_business_id());

create policy "templates: update own business"
  on public.message_templates for update
  using (business_id = public.my_business_id());

-- ─── REMINDER RULES ──────────────────────────────────────────
alter table public.reminder_rules enable row level security;

create policy "reminder_rules: read own business"
  on public.reminder_rules for select
  using (business_id = public.my_business_id());

create policy "reminder_rules: insert own business"
  on public.reminder_rules for insert
  with check (business_id = public.my_business_id());

create policy "reminder_rules: update own business"
  on public.reminder_rules for update
  using (business_id = public.my_business_id());

-- ─── REMINDER SENT LOG ───────────────────────────────────────
alter table public.reminder_sent_log enable row level security;

create policy "reminder_log: read own business"
  on public.reminder_sent_log for select
  using (business_id = public.my_business_id());

-- ─── MESSAGE LOGS ────────────────────────────────────────────
alter table public.message_logs enable row level security;

create policy "message_logs: read own business"
  on public.message_logs for select
  using (business_id = public.my_business_id());

-- ─── CONVERSATION SESSIONS ───────────────────────────────────
alter table public.conversation_sessions enable row level security;

create policy "sessions: read own business"
  on public.conversation_sessions for select
  using (business_id = public.my_business_id());
