"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { SimpleModal } from "@/components/common/SimpleModal";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface Step {
  title: string;
  description: string;
  linkText?: string;
  linkUrl?: string;
  copyValue?: "webhook" | "verify_token";
}

interface GuideSection {
  id: string;
  label: string;
  icon: string;
  color: string;
  estTime: string;
  difficulty: string;
  steps: Step[];
  note?: string;
}

const GUIDES: GuideSection[] = [
  {
    id: "whatsapp",
    label: "WhatsApp Business API",
    icon: "mdi:whatsapp",
    color: "from-[#128C7E] to-[#25D366]",
    estTime: "5 mins",
    difficulty: "Medium",
    steps: [
      {
        title: "Create a Meta Developer account",
        description: "Go to developers.facebook.com, sign in with your Facebook account, and accept the developer terms.",
        linkUrl: "https://developers.facebook.com",
        linkText: "Meta Developer Portal",
      },
      {
        title: "Create a Business App",
        description: "Click 'Create App' → choose Business type → give it a name → add the WhatsApp product from the dashboard.",
        linkUrl: "https://developers.facebook.com/apps",
        linkText: "Create App Link",
      },
      {
        title: "Get your Phone Number ID",
        description: "In WhatsApp → API Setup, you'll see your test number with a Phone Number ID (e.g. 120364XXXXXXXXX). Copy it.",
        linkUrl: "https://developers.facebook.com/apps",
        linkText: "Meta App Console",
      },
      {
        title: "Generate an Access Token",
        description: "On the same page, click 'Generate token'. For production, generate a permanent System User token from Meta Business Manager to avoid expiry.",
        linkUrl: "https://business.facebook.com/settings/system-users",
        linkText: "System Users Settings",
      },
      {
        title: "Set your Webhook",
        description: "In WhatsApp → Configuration, set the Webhook URL and Verification Token below, and subscribe to the 'messages' field.",
        copyValue: "webhook",
      },
      {
        title: "Paste credentials here",
        description: "Enter the Phone Number ID and Access Token in the WhatsApp card on this settings page and click Save.",
      },
    ],
    note: "Meta provides a free test number that can message up to 5 verified phone numbers. You need a real approved number for production.",
  },
  {
    id: "paystack",
    label: "Paystack Payments",
    icon: "solar:dollar-minimalistic-broken",
    color: "from-[#00C3F7] to-[#0BA4DB]",
    estTime: "3 mins",
    difficulty: "Easy",
    steps: [
      {
        title: "Create a Paystack account",
        description: "Go to paystack.com and sign up. Complete business verification to unlock live payments.",
        linkUrl: "https://dashboard.paystack.com",
        linkText: "Paystack Signup",
      },
      {
        title: "Get your Secret Key",
        description: "In the Paystack Dashboard, go to Settings → API Keys & Webhooks. Copy your Secret Key (starts with sk_live_ or sk_test_).",
        linkUrl: "https://dashboard.paystack.com/#/settings/developer",
        linkText: "API Keys Dashboard",
      },
      {
        title: "Set up your Webhook",
        description: "On the same settings page, add the Webhook URL below. This is how Paystack notifies the app when a payment succeeds.",
        copyValue: "webhook",
        linkUrl: "https://dashboard.paystack.com/#/settings/developer",
        linkText: "Webhooks Dashboard",
      },
      {
        title: "Paste your Secret Key here",
        description: "Enter the Secret Key in the Paystack card on this settings page and click Connect.",
      },
    ],
    note: "Money goes directly into your Paystack account — you withdraw to your bank on your own schedule. Paystack settles T+1 business days.",
  },
];

export function ConnectionsGuide() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("whatsapp");
  const [activeStep, setActiveStep] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean[]>>({
    whatsapp: new Array(GUIDES[0].steps.length).fill(false),
    paystack: new Array(GUIDES[1].steps.length).fill(false),
  });

  const [origin, setOrigin] = useState("https://your-app.com");
  useEffect(() => {
    if (typeof window !== "undefined") {
      const frame = requestAnimationFrame(() => {
        setOrigin(window.location.origin);
      });
      return () => cancelAnimationFrame(frame);
    }
  }, []);

  const active = GUIDES.find((g) => g.id === activeTab)!;

  const toggleStepComplete = (index: number) => {
    setCompletedSteps((prev) => {
      const updated = [...prev[activeTab]];
      updated[index] = !updated[index];
      return {
        ...prev,
        [activeTab]: updated,
      };
    });
  };

  const markStepComplete = (index: number) => {
    setCompletedSteps((prev) => {
      const updated = [...prev[activeTab]];
      updated[index] = true;
      return {
        ...prev,
        [activeTab]: updated,
      };
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const completedCount = completedSteps[activeTab].filter(Boolean).length;

  const renderCopyWidget = (type: "webhook" | "verify_token") => {
    if (type === "webhook") {
      const webhookUrl = `${origin}/api/webhooks/${activeTab}`;
      const tokenValue = "gcg-verify-token-2026";

      return (
        <div className="space-y-3.5">
          <div className="bg-muted/30 dark:bg-slate-800/40 border border-border/80 rounded-2xl p-4 space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">Webhook Callback URL</span>
              <button
                onClick={() => copyToClipboard(webhookUrl, "Webhook URL")}
                className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Icon icon="solar:copy-broken" className="w-3.5 h-3.5" />
                Copy URL
              </button>
            </div>
            <div className="font-mono text-xs text-foreground bg-background border border-border/60 px-3.5 py-2.5 rounded-xl break-all select-all font-semibold">
              {webhookUrl}
            </div>
          </div>

          {activeTab === "whatsapp" && (
            <div className="bg-muted/30 dark:bg-slate-800/40 border border-border/80 rounded-2xl p-4 space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">Verify Token</span>
                <button
                  onClick={() => copyToClipboard(tokenValue, "Verify Token")}
                  className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Icon icon="solar:copy-broken" className="w-3.5 h-3.5" />
                  Copy Token
                </button>
              </div>
              <div className="font-mono text-xs text-foreground bg-background border border-border/60 px-3.5 py-2.5 rounded-xl select-all font-semibold">
                {tokenValue}
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground border border-border/70 hover:border-border bg-card/60 hover:bg-muted/40 rounded-xl px-3 py-2 transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-xs"
      >
        <Icon icon="solar:question-circle-broken" className="h-4 w-4" />
        Setup Guide
      </button>

      <SimpleModal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Connection Setup Guide"
        icon="solar:plug-circle-broken"
        width="max-w-3xl"
        noPadding={true}
      >
        <div className="flex flex-col md:flex-row min-h-[520px]">
          {/* Left Sidebar */}
          <div className="w-full md:w-[260px] bg-slate-50 dark:bg-slate-900/40 md:border-r border-border/60 p-5 flex flex-col justify-between gap-6 shrink-0 border-b md:border-b-0">
            <div className="space-y-5">
              <h4 className="text-xs uppercase tracking-wider font-extrabold text-muted-foreground/80 px-1">
                Integration Services
              </h4>
              
              <div className="space-y-1.5">
                {GUIDES.map((g) => {
                  const isSelected = activeTab === g.id;
                  return (
                    <button
                      key={g.id}
                      onClick={() => {
                        setActiveTab(g.id);
                        setActiveStep(0);
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden cursor-pointer ${
                        isSelected
                          ? "bg-card border-border shadow-2xs text-foreground font-extrabold"
                          : "bg-transparent border-transparent text-muted-foreground hover:bg-muted/30 hover:text-foreground font-semibold"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${g.color} text-white flex items-center justify-center shadow-xs shrink-0`}>
                          <Icon icon={g.icon} className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">{g.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{g.steps.length} Steps</p>
                        </div>
                      </div>
                      {isSelected && (
                        <motion.div
                          layoutId="activeTabIndicator"
                          className={`absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b ${g.color}`}
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="bg-card/60 dark:bg-slate-900/60 border border-border/60 rounded-2xl p-4 space-y-3 shadow-2xs">
                <h4 className="text-xs uppercase tracking-wider font-extrabold text-muted-foreground/80">
                  Guide Status
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-semibold">Est. Time:</span>
                    <span className="font-extrabold text-foreground">{active.estTime}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-semibold">Difficulty:</span>
                    <span className={`font-bold px-2 py-0.5 rounded-md text-xs border ${
                      active.difficulty === "Easy"
                        ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200/40 text-emerald-600 dark:text-emerald-400"
                        : "bg-amber-50 dark:bg-amber-950/20 border-amber-200/40 text-amber-600 dark:text-amber-400"
                    }`}>
                      {active.difficulty}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {active.note && (
              <div className="bg-amber-50 dark:bg-amber-950/10 border border-amber-200/30 rounded-2xl p-4 flex gap-2.5 items-start">
                <Icon icon="solar:info-circle-broken" className="w-4.5 h-4.5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold leading-relaxed">
                  {active.note}
                </p>
              </div>
            )}
          </div>

          {/* Right Panel */}
          <div className="flex-1 p-6 flex flex-col min-w-0">
            {/* Steps Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-5 mb-5 shrink-0">
              <div>
                <h3 className="text-base font-extrabold text-foreground leading-none">{active.label} Setup</h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-none">
                  Follow the interactive steps to connect your credentials.
                </p>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold text-muted-foreground">
                  {completedCount} of {active.steps.length} Completed
                </span>
                <div className="w-32 h-1.5 bg-muted dark:bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                  <motion.div
                    className={`h-full bg-gradient-to-r ${active.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${(completedCount / active.steps.length) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            </div>

            {/* Steps Body */}
            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              {active.steps.map((step, i) => {
                const isActive = activeStep === i;
                const isCompleted = completedSteps[activeTab][i];

                return (
                  <div
                    key={i}
                    className={`flex gap-4 p-4 rounded-2xl border transition-all duration-300 relative group cursor-pointer ${
                      isActive
                        ? "bg-card border-border shadow-xs"
                        : "bg-muted/10 border-transparent hover:bg-muted/20 hover:border-border/40"
                    }`}
                    onClick={() => setActiveStep(i)}
                  >
                    {/* Timeline connecting line */}
                    {i < active.steps.length - 1 && (
                      <div className="absolute left-[28px] top-11 bottom-0 w-0.5 bg-border/40 group-hover:bg-border/60 transition-colors" />
                    )}

                    {/* Step indicator node */}
                    <div className="shrink-0 relative mt-0.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStepComplete(i);
                        }}
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold border transition-all duration-300 cursor-pointer ${
                          isCompleted
                            ? `bg-gradient-to-tr ${active.color} text-white border-transparent shadow-xs`
                            : isActive
                              ? "bg-background border-primary text-primary shadow-2xs"
                              : "bg-background border-border text-muted-foreground hover:border-muted-foreground/60"
                        }`}
                      >
                        {isCompleted ? (
                          <Icon icon="solar:check-read-broken" className="w-3.5 h-3.5 stroke-[2.5]" />
                        ) : (
                          i + 1
                        )}
                      </button>
                      {isActive && !isCompleted && (
                        <span className="absolute -inset-1 rounded-full border border-primary/30 animate-pulse pointer-events-none" />
                      )}
                    </div>

                    {/* Step Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm font-bold leading-snug transition-colors duration-200 ${
                          isActive ? "text-foreground" : "text-muted-foreground"
                        }`}>
                          {step.title}
                        </p>
                        {!isActive && isCompleted && (
                          <span className="text-xs font-bold text-emerald-500 flex items-center gap-0.5 shrink-0">
                            <Icon icon="solar:check-circle-broken" className="w-3 h-3" />
                            Completed
                          </span>
                        )}
                      </div>

                      {/* Collapsible Details */}
                      <AnimatePresence initial={false}>
                        {isActive && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div className="pt-3 pb-1 space-y-4" onClick={(e) => e.stopPropagation()}>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {step.description}
                              </p>

                              {/* External Portal buttons */}
                              {step.linkUrl && (
                                <div>
                                  <a
                                    href={step.linkUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-hover border border-primary/20 hover:border-primary/40 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-xl transition-all duration-200"
                                  >
                                    <Icon icon="solar:square-share-line-broken" className="w-3.5 h-3.5" />
                                    {step.linkText || "Open Console"}
                                    <Icon icon="solar:arrow-right-up-broken" className="w-3 h-3" />
                                  </a>
                                </div>
                              )}

                              {/* Clipboard Widget */}
                              {step.copyValue && renderCopyWidget(step.copyValue)}

                              {/* Timeline Navigation */}
                              <div className="flex gap-2 pt-3 border-t border-border/55">
                                {i > 0 && (
                                  <button
                                    onClick={() => setActiveStep(i - 1)}
                                    className="px-3 py-1.5 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all duration-250 cursor-pointer"
                                  >
                                    Previous
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    markStepComplete(i);
                                    if (i < active.steps.length - 1) {
                                      setActiveStep(i + 1);
                                    } else {
                                      setOpen(false);
                                      toast.success(`${active.label} connection setup finished!`);
                                    }
                                  }}
                                  className={`px-3 py-1.5 rounded-xl text-white text-xs font-bold shadow-xs transition-all duration-250 cursor-pointer bg-gradient-to-tr ${active.color}`}
                                >
                                  {i < active.steps.length - 1 ? "Next Step" : "Finish Guide"}
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </SimpleModal>
    </>
  );
}
