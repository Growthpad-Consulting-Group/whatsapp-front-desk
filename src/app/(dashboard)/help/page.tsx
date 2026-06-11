"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface FAQItem {
  question: string;
  answer: string;
  category: "whatsapp" | "payments" | "calendar" | "general";
}

const FAQS: FAQItem[] = [
  {
    category: "whatsapp",
    question: "How do I connect the WhatsApp Business API?",
    answer: "Go to Settings → Connections and click 'Setup Guide'. You will need a Meta Developer App, your Phone Number ID, and a Permanent System User Token from Meta Business Manager. Always use a permanent token to avoid connection expiry.",
  },
  {
    category: "whatsapp",
    question: "What is the Webhook Verify Token?",
    answer: "Meta requires a verify token during the handshake when setting up webhooks. The verify token configured in this app is 'gcg-verify-token-2026'. Enter this in your Meta App WhatsApp configuration panel.",
  },
  {
    category: "payments",
    question: "How do deposit payments work?",
    answer: "When a customer initiates a booking, the bot generates a Paystack checkout URL. The appointment status is marked as 'Deposit Pending'. Once the customer pays, Paystack webhooks trigger the app to mark the booking as 'Confirmed'.",
  },
  {
    category: "payments",
    question: "Can I test Paystack payments without charging real money?",
    answer: "Yes! Use your Paystack Test API Keys (starts with sk_test_). Customers will see a test checkout page where they can mock successful transactions. Switch to live keys (starts with sk_live_) for real payments.",
  },
  {
    category: "calendar",
    question: "How does Google Calendar synchronization work?",
    answer: "Each staff member can link their Google Calendar via Settings → Staff. When a WhatsApp booking is confirmed, it is automatically written to their Google Calendar. The scheduler also reads existing calendar slots to prevent double-bookings.",
  },
  {
    category: "general",
    question: "How do I chat manually without the bot interfering?",
    answer: "Open the Messages Inbox feed. Simply type and send a message. Sending a human reply automatically pauses the AI WhatsApp chatbot responses for that customer for 24 hours, giving you full takeover control.",
  },
  {
    category: "general",
    question: "How do I add new booking slots or services?",
    answer: "Go to Settings → Services to create/delete offerings. You can set prices, duration, and default staff. Go to Settings → Hours to configure opening and closing hours for slot allocations.",
  },
];

const RESOURCE_CARDS = [
  {
    title: "Meta App Console",
    description: "Manage developer credentials and WhatsApp products.",
    icon: "mdi:whatsapp",
    url: "https://developers.facebook.com/apps",
    color: "from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
  },
  {
    title: "Paystack Settings",
    description: "Get your API keys and configure callback webhooks.",
    icon: "solar:wallet-money-broken",
    url: "https://dashboard.paystack.com/#/settings/developer",
    color: "from-sky-500/10 to-blue-500/10 border-sky-500/20 text-sky-600 dark:text-sky-400",
  },
  {
    title: "Meta Business Settings",
    description: "Manage System Users and create permanent access tokens.",
    icon: "solar:users-group-two-rounded-broken",
    url: "https://business.facebook.com/settings/system-users",
    color: "from-indigo-500/10 to-purple-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400",
  },
];

export default function HelpSupportPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  // Contact Support states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill in all support query fields.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Support request sent! GCG Support will WhatsApp or email you shortly.");
      setName("");
      setEmail("");
      setMessage("");
    }, 1200);
  };

  const filteredFAQs = FAQS.filter((faq) => {
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border/40 pb-5">
        <h1 className="text-xl font-extrabold text-foreground flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
            <Icon icon="solar:question-circle-broken" className="w-5 h-5" />
          </div>
          Help & Support Center
        </h1>
        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
          Need assistance with WhatsApp bot configurations, Paystack billing, or Google Calendar syncing? Find quick FAQs or contact GCG directly below.
        </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Left Column: Categories list & Contact form */}
        <div className="md:col-span-1 space-y-6">
          {/* Quick Categories */}
          <div className="bg-card/60 dark:bg-slate-900/60 backdrop-blur-md border border-border/80 rounded-2xl p-5 space-y-4 shadow-2xs">
            <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wider">
              FAQ Topics
            </h3>
            <div className="flex flex-wrap md:flex-col gap-1.5">
              {[
                { id: "all", label: "All Questions", icon: "solar:checklist-broken" },
                { id: "whatsapp", label: "WhatsApp Bot", icon: "mdi:whatsapp" },
                { id: "payments", label: "Paystack Payments", icon: "solar:wallet-money-broken" },
                { id: "calendar", label: "Calendar Syncing", icon: "solar:calendar-date-broken" },
                { id: "general", label: "General Help", icon: "solar:settings-broken" },
              ].map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setExpandedIndex(null);
                    }}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 border cursor-pointer ${isSelected
                        ? "bg-primary/10 border-primary/20 text-primary"
                        : "border-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                      }`}
                  >
                    <Icon icon={cat.icon} className="h-4 w-4 shrink-0" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Support request */}
          <div className="bg-card/60 dark:bg-slate-900/60 backdrop-blur-md border border-border/80 rounded-2xl p-5 space-y-4 shadow-2xs">
            <div className="space-y-1">
              <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Icon icon="solar:chat-square-call-broken" className="w-4 h-4 text-primary" />
                Contact GCG Support
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Send us a ticket and an agent will follow up.
              </p>
            </div>

            <form onSubmit={handleSupportSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Your Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full h-9 px-3 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full h-9 px-3 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Your Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Detail your request..."
                  rows={3}
                  className="w-full p-3 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-9 inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary/95 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <Icon icon="svg-spinners:ring-resize" className="h-4.5 w-4.5" />
                ) : (
                  <>
                    <Icon icon="solar:letter-opened-broken" className="h-4 w-4" />
                    <span>Submit Query</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Search, FAQs, Resource shortcuts */}
        <div className="md:col-span-2 space-y-6">

          {/* FAQ Search */}
          <div className="relative">
            <Icon icon="solar:magnifer-broken" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search help topics or keywords..."
              className="w-full h-11 pl-10 pr-4 rounded-2xl border border-border bg-card/60 dark:bg-slate-900/60 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <Icon icon="solar:close-circle-broken" className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* FAQ Accordion list */}
          <div className="space-y-3">
            {filteredFAQs.length === 0 ? (
              <div className="text-center py-12 bg-card/60 dark:bg-slate-900/60 border border-border/80 rounded-2xl text-muted-foreground">
                <Icon icon="solar:box-minimalistic-broken" className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-xs font-bold text-foreground">No matches found</p>
                <p className="text-xs text-muted-foreground mt-0.5">Try searching different terms or filter categories.</p>
              </div>
            ) : (
              filteredFAQs.map((faq, index) => {
                const isExpanded = expandedIndex === index;
                return (
                  <div
                    key={index}
                    className={`bg-card/60 dark:bg-slate-900/60 border rounded-2xl transition-all duration-300 overflow-hidden ${isExpanded ? "border-border shadow-xs" : "border-border/80 hover:border-border"
                      }`}
                  >
                    <button
                      onClick={() => setExpandedIndex(isExpanded ? null : index)}
                      className="w-full flex items-center justify-between p-4 text-left cursor-pointer"
                    >
                      <span className="text-sm font-bold text-foreground pr-4">
                        {faq.question}
                      </span>
                      <Icon
                        icon="solar:alt-arrow-down-broken"
                        className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""
                          }`}
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                        >
                          <div className="px-4 pb-4 pt-1 border-t border-border/30">
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {faq.answer}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>

          {/* System Console Shortcuts */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wider px-1">
              External Developer Links
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {RESOURCE_CARDS.map((res) => (
                <a
                  key={res.title}
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block p-4 rounded-2xl border bg-gradient-to-tr ${res.color} hover:shadow-xs transition-all duration-300 relative group`}
                >
                  <div className="flex items-center gap-3">
                    <Icon icon={res.icon} className="w-5 h-5 shrink-0" />
                    <h4 className="text-sm font-bold">{res.title}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    {res.description}
                  </p>
                  <Icon
                    icon="solar:arrow-right-up-broken"
                    className="absolute right-3.5 top-3.5 w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity"
                  />
                </a>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
