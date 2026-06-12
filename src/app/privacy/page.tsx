import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@iconify/react";

export const metadata: Metadata = {
  title: "Privacy Policy — WhatsApp Front Desk",
  description: "How WhatsApp Front Desk collects, uses, and protects your data.",
};

const LAST_UPDATED = "12 June 2026";
const CONTACT_EMAIL = "privacy@whatsappfrontdesk.com";
const APP_NAME = "WhatsApp Front Desk";
const COMPANY = "GCG Internal Tools";

interface Section {
  id: string;
  title: string;
  icon: string;
}

const SECTIONS: Section[] = [
  { id: "overview",       title: "Overview",                      icon: "solar:info-circle-broken" },
  { id: "data-collected", title: "Data We Collect",               icon: "solar:database-broken" },
  { id: "how-we-use",     title: "How We Use Your Data",          icon: "solar:settings-broken" },
  { id: "third-parties",  title: "Third-Party Services",          icon: "solar:share-broken" },
  { id: "client-data",    title: "Your Clients' Data",            icon: "solar:users-group-rounded-broken" },
  { id: "retention",      title: "Data Retention",                icon: "solar:clock-circle-broken" },
  { id: "security",       title: "Security",                      icon: "solar:shield-keyhole-broken" },
  { id: "rights",         title: "Your Rights",                   icon: "solar:hand-stars-broken" },
  { id: "cookies",        title: "Cookies",                       icon: "solar:devices-broken" },
  { id: "changes",        title: "Changes to This Policy",        icon: "solar:document-text-broken" },
  { id: "contact",        title: "Contact Us",                    icon: "solar:letter-broken" },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* Top nav */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm font-bold text-foreground hover:text-primary transition-colors">
            <Icon icon="solar:chat-round-dots-bold-duotone" className="h-5 w-5 text-primary" />
            {APP_NAME}
          </Link>
          <Link
            href="/login"
            className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
          >
            <Icon icon="solar:arrow-left-broken" className="h-3.5 w-3.5" />
            Back to app
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-12">

          {/* Sidebar TOC — sticky on desktop */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-3 mb-3">Contents</p>
              {SECTIONS.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-150 group"
                >
                  <Icon icon={s.icon} className="h-4 w-4 shrink-0 group-hover:text-primary transition-colors" />
                  {s.title}
                </a>
              ))}
            </div>
          </aside>

          {/* Main content */}
          <main className="space-y-14 min-w-0">

            {/* Hero */}
            <div className="space-y-3 pb-8 border-b border-border/40">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
                <Icon icon="solar:shield-check-broken" className="h-3.5 w-3.5" />
                Last updated: {LAST_UPDATED}
              </div>
              <h1 className="text-4xl font-black text-foreground tracking-tight">Privacy Policy</h1>
              <p className="text-base text-muted-foreground leading-relaxed max-w-2xl">
                {APP_NAME} is built for small businesses. We take your privacy — and your clients&apos; privacy — seriously.
                This policy explains exactly what data we collect, why we collect it, and how we protect it.
              </p>
            </div>

            {/* 1. Overview */}
            <section id="overview" className="scroll-mt-24 space-y-4">
              <SectionHeader icon="solar:info-circle-broken" title="1. Overview" />
              <Prose>
                <p>
                  {APP_NAME} (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is a WhatsApp-powered booking and business management platform
                  operated by <strong>{COMPANY}</strong>. This Privacy Policy applies to all users of the {APP_NAME} platform,
                  including business owners and staff members who access the dashboard.
                </p>
                <p>
                  By using {APP_NAME}, you agree to the collection and use of information in accordance with this policy.
                  If you do not agree, please discontinue use of the service.
                </p>
                <p>
                  This policy does not cover the privacy practices of Meta (WhatsApp), Paystack, Google, or any other
                  third-party services we integrate with. Please refer to their respective privacy policies for that information.
                </p>
              </Prose>
            </section>

            {/* 2. Data Collected */}
            <section id="data-collected" className="scroll-mt-24 space-y-4">
              <SectionHeader icon="solar:database-broken" title="2. Data We Collect" />

              <SubHeading>Account & Business Data</SubHeading>
              <Prose>
                <p>When you create an account and set up a business, we collect:</p>
                <ul>
                  <li>Your name and email address (used for authentication)</li>
                  <li>Business name, industry, timezone, and currency</li>
                  <li>WhatsApp Business phone number and API credentials</li>
                  <li>Paystack API keys (stored encrypted; used solely to process payments for your business)</li>
                  <li>Google Calendar OAuth tokens (if you connect your calendar)</li>
                  <li>Operating hours, services, pricing, and booking policies you configure</li>
                </ul>
              </Prose>

              <SubHeading>Staff Data</SubHeading>
              <Prose>
                <ul>
                  <li>Staff member names, phone numbers, and email addresses</li>
                  <li>Role assignments (owner or staff)</li>
                  <li>Google Calendar connection status</li>
                </ul>
              </Prose>

              <SubHeading>Customer Data (your clients)</SubHeading>
              <Prose>
                <p>
                  When your clients interact with your WhatsApp bot, we collect and store on your behalf:
                </p>
                <ul>
                  <li>WhatsApp phone number (E.164 format)</li>
                  <li>Display name provided by WhatsApp at the time of first contact</li>
                  <li>Booking history and appointment details</li>
                  <li>Invoice records and payment status</li>
                  <li>Conversation message logs (inbound and outbound summaries)</li>
                  <li>Bot conversation state (used to maintain booking flow continuity)</li>
                  <li>Special dates such as birthdays or anniversaries, if provided by the client</li>
                </ul>
              </Prose>

              <SubHeading>Usage & Technical Data</SubHeading>
              <Prose>
                <ul>
                  <li>Log data including pages visited, actions taken, and timestamps</li>
                  <li>Browser type and operating system (from server logs)</li>
                  <li>IP address</li>
                  <li>Session tokens managed by Supabase Auth</li>
                </ul>
              </Prose>
            </section>

            {/* 3. How We Use */}
            <section id="how-we-use" className="scroll-mt-24 space-y-4">
              <SectionHeader icon="solar:settings-broken" title="3. How We Use Your Data" />
              <Prose>
                <p>We use the data we collect exclusively to operate and improve the {APP_NAME} platform:</p>
                <ul>
                  <li><strong>Authenticate</strong> business owners and staff members</li>
                  <li><strong>Automate</strong> WhatsApp booking conversations on your behalf</li>
                  <li><strong>Send</strong> appointment reminders, deposit requests, and invoice notifications via WhatsApp</li>
                  <li><strong>Process payments</strong> through Paystack using your API credentials</li>
                  <li><strong>Sync appointments</strong> with Google Calendar when connected</li>
                  <li><strong>Display</strong> booking, invoice, and customer data in your dashboard</li>
                  <li><strong>Enforce</strong> multi-tenancy — ensuring your data is never visible to other businesses on the platform</li>
                  <li><strong>Improve</strong> the service through anonymised, aggregated usage analysis</li>
                </ul>
                <p>
                  We do <strong>not</strong> sell your data or your clients&apos; data to any third party. We do not use your data
                  for advertising. We do not train AI models on your business data or client conversations.
                </p>
              </Prose>
            </section>

            {/* 4. Third Parties */}
            <section id="third-parties" className="scroll-mt-24 space-y-4">
              <SectionHeader icon="solar:share-broken" title="4. Third-Party Services" />
              <Prose>
                <p>
                  {APP_NAME} integrates with the following third-party services to deliver its functionality. Each service
                  processes data according to its own privacy policy.
                </p>
              </Prose>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    name: "Meta (WhatsApp Cloud API)",
                    icon: "mdi:whatsapp",
                    color: "text-green-500",
                    purpose: "Sending and receiving WhatsApp messages on your behalf.",
                    link: "https://www.facebook.com/privacy/policy/",
                  },
                  {
                    name: "Supabase",
                    icon: "solar:database-broken",
                    color: "text-emerald-500",
                    purpose: "Database hosting, authentication, and file storage. Data is stored in your chosen region.",
                    link: "https://supabase.com/privacy",
                  },
                  {
                    name: "Paystack",
                    icon: "solar:card-recieve-broken",
                    color: "text-blue-500",
                    purpose: "Payment processing for deposits and invoices. We never store full card details.",
                    link: "https://paystack.com/privacy",
                  },
                  {
                    name: "Google (Calendar API)",
                    icon: "mdi:google",
                    color: "text-red-500",
                    purpose: "Syncing appointments with staff Google Calendars when explicitly connected.",
                    link: "https://policies.google.com/privacy",
                  },
                  {
                    name: "Vercel",
                    icon: "solar:server-broken",
                    color: "text-foreground",
                    purpose: "Hosting the application. Request logs and edge network data are handled by Vercel.",
                    link: "https://vercel.com/legal/privacy-policy",
                  },
                  {
                    name: "cron-job.org",
                    icon: "solar:clock-circle-broken",
                    color: "text-orange-500",
                    purpose: "Scheduling automated reminders and overdue checks via secured HTTP requests.",
                    link: "https://cron-job.org/en/privacy/",
                  },
                ].map((tp) => (
                  <div key={tp.name} className="rounded-2xl border border-border/60 bg-card/50 p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Icon icon={tp.icon} className={`h-4 w-4 shrink-0 ${tp.color}`} />
                      <p className="text-sm font-bold text-foreground">{tp.name}</p>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{tp.purpose}</p>
                    <a
                      href={tp.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-semibold text-primary hover:underline flex items-center gap-1"
                    >
                      View privacy policy
                      <Icon icon="solar:arrow-right-up-broken" className="h-3 w-3" />
                    </a>
                  </div>
                ))}
              </div>
            </section>

            {/* 5. Client Data */}
            <section id="client-data" className="scroll-mt-24 space-y-4">
              <SectionHeader icon="solar:users-group-rounded-broken" title="5. Your Clients' Data" />
              <Prose>
                <p>
                  Your clients interact with your WhatsApp bot — they are not direct users of {APP_NAME}.
                  As the business owner, <strong>you are the data controller</strong> for your clients&apos; personal data.
                  {APP_NAME} acts as a <strong>data processor</strong> on your behalf.
                </p>
                <p>This means:</p>
                <ul>
                  <li>You are responsible for having a lawful basis to communicate with your clients via WhatsApp</li>
                  <li>You are responsible for informing your clients that their booking interactions are processed automatically</li>
                  <li>We process your clients&apos; data strictly as instructed by your configuration — reminders, booking flows, invoice notifications</li>
                  <li>We do not contact your clients independently or use their data for any purpose outside your service</li>
                  <li>If a client requests deletion of their data, you can action this from the Customers section of your dashboard</li>
                </ul>
              </Prose>

              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 px-5 py-4 flex gap-3">
                <Icon icon="solar:danger-triangle-broken" className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">
                  <strong>Important:</strong> Under GDPR, NDPR (Nigeria), and similar data protection laws, you must ensure
                  you have consent or a legitimate interest basis before using automated WhatsApp messaging to contact clients.
                  {APP_NAME} does not provide legal advice — consult a legal professional if you are unsure.
                </p>
              </div>
            </section>

            {/* 6. Retention */}
            <section id="retention" className="scroll-mt-24 space-y-4">
              <SectionHeader icon="solar:clock-circle-broken" title="6. Data Retention" />
              <Prose>
                <ul>
                  <li><strong>Account data</strong> is retained for as long as your account is active.</li>
                  <li><strong>Business and customer data</strong> is retained for as long as your subscription is active, plus 90 days after cancellation to allow for data export.</li>
                  <li><strong>Message logs</strong> are retained for 12 months by default. You may request earlier deletion.</li>
                  <li><strong>Payment records</strong> may be retained for up to 7 years for financial compliance purposes.</li>
                  <li>Upon account deletion, all personal data is permanently removed within 30 days except where legal obligations require longer retention.</li>
                </ul>
              </Prose>
            </section>

            {/* 7. Security */}
            <section id="security" className="scroll-mt-24 space-y-4">
              <SectionHeader icon="solar:shield-keyhole-broken" title="7. Security" />
              <Prose>
                <p>We take reasonable technical and organisational measures to protect your data:</p>
                <ul>
                  <li>All data is transmitted over HTTPS (TLS 1.2+)</li>
                  <li>Database access is controlled via Row-Level Security (RLS) — no query can return data outside your tenant</li>
                  <li>API keys (WhatsApp, Paystack) are stored encrypted at rest</li>
                  <li>Authentication is handled by Supabase Auth with secure session tokens</li>
                  <li>Staff access is role-controlled — staff members cannot access billing, credentials, or owner-only settings</li>
                  <li>Webhook endpoints verify cryptographic signatures before processing any payload</li>
                </ul>
                <p>
                  No system is completely secure. If you discover a security vulnerability, please report it
                  responsibly to <strong>{CONTACT_EMAIL}</strong>.
                </p>
              </Prose>
            </section>

            {/* 8. Rights */}
            <section id="rights" className="scroll-mt-24 space-y-4">
              <SectionHeader icon="solar:hand-stars-broken" title="8. Your Rights" />
              <Prose>
                <p>Depending on your jurisdiction, you may have the right to:</p>
                <ul>
                  <li><strong>Access</strong> the personal data we hold about you</li>
                  <li><strong>Correct</strong> inaccurate or incomplete data</li>
                  <li><strong>Delete</strong> your account and associated data</li>
                  <li><strong>Export</strong> your data in a portable format</li>
                  <li><strong>Restrict</strong> or object to certain types of processing</li>
                  <li><strong>Withdraw consent</strong> at any time where processing is based on consent</li>
                </ul>
                <p>
                  To exercise any of these rights, contact us at <strong>{CONTACT_EMAIL}</strong>. We will respond within 30 days.
                  We may need to verify your identity before processing requests.
                </p>
              </Prose>
            </section>

            {/* 9. Cookies */}
            <section id="cookies" className="scroll-mt-24 space-y-4">
              <SectionHeader icon="solar:devices-broken" title="9. Cookies" />
              <Prose>
                <p>
                  {APP_NAME} uses a minimal number of cookies, strictly necessary for the service to function:
                </p>
                <ul>
                  <li><strong>Authentication cookies</strong> — set by Supabase Auth to maintain your login session. These are essential and cannot be disabled.</li>
                  <li><strong>Preference cookies</strong> — used to remember UI preferences such as dark/light mode. These are optional.</li>
                </ul>
                <p>
                  We do not use advertising cookies, tracking pixels, or any cross-site tracking technology.
                  We do not use Google Analytics or similar third-party analytics scripts.
                </p>
              </Prose>
            </section>

            {/* 10. Changes */}
            <section id="changes" className="scroll-mt-24 space-y-4">
              <SectionHeader icon="solar:document-text-broken" title="10. Changes to This Policy" />
              <Prose>
                <p>
                  We may update this Privacy Policy from time to time. When we make material changes, we will:
                </p>
                <ul>
                  <li>Update the &ldquo;Last updated&rdquo; date at the top of this page</li>
                  <li>Notify active business owners via email at least 14 days before changes take effect</li>
                </ul>
                <p>
                  Continued use of {APP_NAME} after the effective date constitutes acceptance of the updated policy.
                </p>
              </Prose>
            </section>

            {/* 11. Contact */}
            <section id="contact" className="scroll-mt-24 space-y-4">
              <SectionHeader icon="solar:letter-broken" title="11. Contact Us" />
              <Prose>
                <p>
                  If you have any questions, concerns, or requests relating to this Privacy Policy or the way we
                  handle your data, please contact us:
                </p>
              </Prose>

              <div className="rounded-2xl border border-border/60 bg-card/50 p-6 space-y-3">
                <div className="flex items-center gap-2.5">
                  <Icon icon="solar:buildings-2-broken" className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-bold text-foreground">{COMPANY}</p>
                </div>
                <div className="flex items-center gap-2.5">
                  <Icon icon="solar:letter-broken" className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${CONTACT_EMAIL}`} className="text-sm text-primary hover:underline font-medium">
                    {CONTACT_EMAIL}
                  </a>
                </div>
                <p className="text-xs text-muted-foreground pt-1">
                  We aim to respond to all privacy-related enquiries within 5 business days.
                </p>
              </div>
            </section>

            {/* Footer */}
            <div className="pt-8 border-t border-border/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-muted-foreground">
              <p>© {new Date().getFullYear()} {COMPANY}. All rights reserved.</p>
              <Link href="/login" className="text-primary hover:underline font-semibold flex items-center gap-1">
                <Icon icon="solar:arrow-left-broken" className="h-3.5 w-3.5" />
                Back to {APP_NAME}
              </Link>
            </div>

          </main>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
        <Icon icon={icon} className="h-4 w-4 text-primary" />
      </div>
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
    </div>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-bold text-foreground mt-6 mb-2">{children}</h3>;
}

function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed space-y-3 [&_ul]:space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_strong]:text-foreground [&_strong]:font-semibold">
      {children}
    </div>
  );
}
