-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  event       text NOT NULL, -- 'booking_created', 'reminder_sent', 'invoice_sent', 'payment_changed', 'cancellation', 'reschedule', 'human_handoff'
  reference_id uuid,          -- ID of related appointment, invoice, customer, etc.
  details     jsonb NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_business ON public.audit_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_requests_appt_id ON public.payment_requests(appointment_id) WHERE appointment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payment_requests_inv_id ON public.payment_requests(invoice_id) WHERE invoice_id IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "audit_logs: read own business"
  ON public.audit_logs FOR SELECT
  USING (business_id = public.my_business_id());

CREATE POLICY "audit_logs: insert own business"
  ON public.audit_logs FOR INSERT
  WITH CHECK (business_id = public.my_business_id());
