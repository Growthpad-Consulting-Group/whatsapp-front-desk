-- ============================================================
-- Default message templates and reminder rules seeded per
-- business on signup via the seed_business_defaults() function.
-- Called from the signup Server Action after business creation.
-- ============================================================

create or replace function public.seed_business_defaults(p_business_id uuid)
returns void language plpgsql security definer as $$
declare
  v_tmpl_confirmation   uuid;
  v_tmpl_reminder_24h   uuid;
  v_tmpl_reminder_2h    uuid;
  v_tmpl_deposit        uuid;
  v_tmpl_invoice_sent   uuid;
  v_tmpl_overdue_1_3    uuid;
  v_tmpl_overdue_4_7    uuid;
begin

  -- ── Message templates ──────────────────────────────────────

  insert into public.message_templates (business_id, type, language, body)
  values (p_business_id, 'booking_confirmed', 'en',
    'Hi {{customer_name}}! Your booking for *{{service_name}}* is confirmed for {{date}} at {{time}}. Reply *R* to reschedule or *C* to cancel. — {{business_name}}')
  returning id into v_tmpl_confirmation;

  insert into public.message_templates (business_id, type, language, body)
  values (p_business_id, 'reminder_24h', 'en',
    'Hi {{customer_name}}, just a reminder that your *{{service_name}}* appointment is tomorrow at {{time}}. Reply *R* to reschedule or *C* to cancel. — {{business_name}}')
  returning id into v_tmpl_reminder_24h;

  insert into public.message_templates (business_id, type, language, body)
  values (p_business_id, 'reminder_2h', 'en',
    'Hi {{customer_name}}, your *{{service_name}}* appointment is in 2 hours at {{time}}. See you soon! — {{business_name}}')
  returning id into v_tmpl_reminder_2h;

  insert into public.message_templates (business_id, type, language, body)
  values (p_business_id, 'deposit_request', 'en',
    'Hi {{customer_name}}, to secure your booking for *{{service_name}}* on {{date}} at {{time}}, please pay the deposit of *{{amount}}* here: {{payment_link}} — {{business_name}}')
  returning id into v_tmpl_deposit;

  insert into public.message_templates (business_id, type, language, body)
  values (p_business_id, 'invoice_sent', 'en',
    'Hi {{customer_name}}, thank you for choosing {{business_name}}! Your invoice for *{{amount}}* is ready here: {{invoice_link}}')
  returning id into v_tmpl_invoice_sent;

  insert into public.message_templates (business_id, type, language, body)
  values (p_business_id, 'invoice_overdue_1_3', 'en',
    'Hi {{customer_name}}, friendly reminder that invoice *{{invoice_number}}* for *{{amount}}* is now overdue. You can pay here: {{payment_link}} — {{business_name}}')
  returning id into v_tmpl_overdue_1_3;

  insert into public.message_templates (business_id, type, language, body)
  values (p_business_id, 'invoice_overdue_4_7', 'en',
    'Hi {{customer_name}}, your invoice *{{invoice_number}}* for *{{amount}}* is still outstanding. Please let us know when you can settle this or share a payment date. Pay here: {{payment_link}} — {{business_name}}')
  returning id into v_tmpl_overdue_4_7;

  -- ── Reminder rules ─────────────────────────────────────────

  insert into public.reminder_rules (business_id, trigger, timing_minutes, channel, template_id, active)
  values
    (p_business_id, 'booking_confirmed',    0,     'whatsapp', v_tmpl_confirmation, true),
    (p_business_id, '24h_before',           1440,  'whatsapp', v_tmpl_reminder_24h, true),
    (p_business_id, '2h_before',            120,   'whatsapp', v_tmpl_reminder_2h,  true),
    (p_business_id, 'deposit_pending',      0,     'whatsapp', v_tmpl_deposit,      true),
    (p_business_id, 'invoice_due',          0,     'whatsapp', v_tmpl_invoice_sent, true),
    (p_business_id, 'invoice_overdue_1_3',  null,  'whatsapp', v_tmpl_overdue_1_3,  true),
    (p_business_id, 'invoice_overdue_4_7',  null,  'whatsapp', v_tmpl_overdue_4_7,  true);

  -- ── Default operating hours (Mon–Fri 9–17, Sat 9–13, Sun closed) ──

  insert into public.operating_hours (business_id, day_of_week, open_time, close_time, is_closed)
  values
    (p_business_id, 0, null,    null,    true),   -- Sunday
    (p_business_id, 1, '09:00', '17:00', false),  -- Monday
    (p_business_id, 2, '09:00', '17:00', false),  -- Tuesday
    (p_business_id, 3, '09:00', '17:00', false),  -- Wednesday
    (p_business_id, 4, '09:00', '17:00', false),  -- Thursday
    (p_business_id, 5, '09:00', '17:00', false),  -- Friday
    (p_business_id, 6, '09:00', '13:00', false);  -- Saturday

end;
$$;
