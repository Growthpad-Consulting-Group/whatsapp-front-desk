"use client";

import { useState, useEffect, useRef } from "react";
import { releaseHandoffAction, sendMessageAction } from "@/actions/messages";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { formatDateTime } from "@/lib/utils";
import { Icon } from "@iconify/react";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/client";

interface HandoffSession {
  id: string;
  customer_phone: string;
  updated_at: string;
  customers?: {
    name: string;
  } | null;
}

interface MessageLogItem {
  id: string;
  direction: "inbound" | "outbound";
  content_summary: string;
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: string;
  customer_id: string | null;
  customers?: {
    name: string;
    phone: string;
  } | null;
}

interface MessagesClientProps {
  businessId: string;
  handoffSessions: HandoffSession[];
  messageLogs: MessageLogItem[];
  timezone: string;
}

// Predefined simulation events to showcase spa booking, rescheduling, and handoff flows
const SIMULATION_FLOW = [
  {
    phone: "+254712345678",
    name: "Sarah Jenkins",
    direction: "inbound",
    content: "Hi! I'd like to book a massage next week.",
  },
  {
    phone: "+254712345678",
    name: "Sarah Jenkins",
    direction: "outbound",
    content: "Hi Sarah! Welcome to GCG Wellness & Spa booking desk. 🗓️\n\nPlease reply with the number of the service you'd like to book:\n1. *Premium Aromatherapy Massage* (60 mins · KES 3,500)\n2. *Deep Tissue Therapy* (90 mins · KES 4,500)\n3. *Radiance Facial Treatment* (45 mins · KES 2,800)",
  },
  {
    phone: "+254712345678",
    name: "Sarah Jenkins",
    direction: "inbound",
    content: "1",
  },
  {
    phone: "+254712345678",
    name: "Sarah Jenkins",
    direction: "outbound",
    content: "We found these upcoming slots. Reply with the number of the slot you prefer:\n1. Thu, Jun 11 at 10:00 AM\n2. Thu, Jun 11 at 11:30 AM\n3. Fri, Jun 12 at 2:00 PM",
  },
  {
    phone: "+254712345678",
    name: "Sarah Jenkins",
    direction: "inbound",
    content: "2",
  },
  {
    phone: "+254712345678",
    name: "Sarah Jenkins",
    direction: "outbound",
    content: "Confirm your booking for *Premium Aromatherapy Massage* on *Thu, Jun 11 at 11:30 AM*?\n\nReply:\n*1.* Confirm\n*2.* Cancel & start over",
  },
  {
    phone: "+254712345678",
    name: "Sarah Jenkins",
    direction: "inbound",
    content: "1",
  },
  {
    phone: "+254712345678",
    name: "Sarah Jenkins",
    direction: "outbound",
    content: "Hi Sarah! To secure your booking for *Premium Aromatherapy Massage* on Thu, Jun 11 at 11:30 AM, please pay the deposit of *KES 1,000* here: https://whatsapp-front-desk.dev/pay/deposit/123 — GCG Wellness & Spa",
  },
  {
    phone: "+254742345678",
    name: "Marcus Aurelius",
    direction: "inbound",
    content: "Hi, I need to reschedule my massage appointment tomorrow.",
  },
  {
    phone: "+254742345678",
    name: "Marcus Aurelius",
    direction: "outbound",
    content: "Sure, let's reschedule your appointment for *Deep Tissue Therapy* (originally on Wed, Jun 10 at 4:00 PM).\n\nReply with the number of the slot you prefer:\n1. Fri, Jun 12 at 1:00 PM\n2. Fri, Jun 12 at 3:30 PM\n3. Sat, Jun 13 at 10:00 AM",
  },
  {
    phone: "+254742345678",
    name: "Marcus Aurelius",
    direction: "inbound",
    content: "1",
  },
  {
    phone: "+254742345678",
    name: "Marcus Aurelius",
    direction: "outbound",
    content: "Confirm rescheduling your appointment for *Deep Tissue Therapy* to *Fri, Jun 12 at 1:00 PM*?\n\nReply:\n*1.* Confirm Reschedule\n*2.* Cancel & keep original appointment",
  },
  {
    phone: "+254742345678",
    name: "Marcus Aurelius",
    direction: "inbound",
    content: "1",
  },
  {
    phone: "+254742345678",
    name: "Marcus Aurelius",
    direction: "outbound",
    content: "Your appointment for *Deep Tissue Therapy* has been successfully rescheduled to *Fri, Jun 12 at 1:00 PM*. — GCG Wellness & Spa",
  },
  {
    phone: "+254732345678",
    name: "Elena Rostova",
    direction: "inbound",
    content: "Hi, I need to speak to someone. I received the wrong invoice price.",
  },
  {
    phone: "+254732345678",
    name: "Elena Rostova",
    direction: "outbound",
    content: "I didn't catch that. If you'd like to book, please reply with anything. Otherwise, let me know how I can help.",
  },
  {
    phone: "+254732345678",
    name: "Elena Rostova",
    direction: "inbound",
    content: "No, I need to talk to a human. Invoice is wrong.",
  },
  {
    phone: "+254732345678",
    name: "Elena Rostova",
    direction: "outbound",
    content: "I am having trouble understanding your selection. I am transferring you to one of our agents who will message you directly. Please wait a moment.",
    triggerHandoff: true,
  },
];

const SIMULATED_REPLIES = [
  "Thank you for getting back to me so quickly! That makes a lot of sense.",
  "Great, I will wait for the updated link.",
  "Awesome, that works. Thanks for the quick support!",
  "Perfect, appreciate the help!",
];

export function MessagesClient({
  businessId,
  handoffSessions: initialHandoffs,
  messageLogs: initialLogs,
  timezone,
}: MessagesClientProps) {
  const [handoffs, setHandoffs] = useState<HandoffSession[]>(initialHandoffs);
  const [logs, setLogs] = useState<MessageLogItem[]>(initialLogs);
  const [releasingId, setReleasingId] = useState<string | null>(null);
  
  // Navigation / Focus States
  const [activeChatPhone, setActiveChatPhone] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // Simulator states
  const [isSimulating, setIsSimulating] = useState(false);
  const simIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const simStepRef = useRef(0);

  // Scrolling States
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // 1. Real-time Supabase Subscription
  useEffect(() => {
    if (isSimulating) return; // Ignore database updates when running mockup simulation

    const supabase = createClient();

    // Subscribe to message log updates
    const logsChannel = supabase
      .channel("realtime-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "message_logs",
          filter: `business_id=eq.${businessId}`,
        },
        async (payload) => {
          // Fetch the log with relation joins to get customer metadata
          const { data, error } = await supabase
            .from("message_logs")
            .select("id, direction, content_summary, status, timestamp, customer_id, customers(name, phone)")
            .eq("id", payload.new.id)
            .single();

          if (data && !error) {
            setLogs((prev) => {
              if (prev.some((l) => l.id === data.id)) return prev;
              return [data as MessageLogItem, ...prev];
            });
          }
        }
      )
      .subscribe();

    // Subscribe to conversation session state changes for handoff queue
    const sessionsChannel = supabase
      .channel("realtime-sessions")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversation_sessions",
          filter: `business_id=eq.${businessId}`,
        },
        async () => {
          const { data, error } = await supabase
            .from("conversation_sessions")
            .select("id, customer_phone, updated_at, state")
            .eq("business_id", businessId)
            .eq("state", "human_handoff")
            .order("updated_at", { ascending: false });

          if (data && !error) {
            if (data.length === 0) {
              setHandoffs([]);
            } else {
              const phones = data.map((h) => h.customer_phone);
              const { data: customers } = await supabase
                .from("customers")
                .select("phone, name")
                .eq("business_id", businessId)
                .in("phone", phones);

              const customerMap = new Map(customers?.map((c) => [c.phone, c.name]) || []);
              const updatedHandoffs = data.map((h) => ({
                id: h.id,
                customer_phone: h.customer_phone,
                updated_at: h.updated_at,
                customers: customerMap.has(h.customer_phone)
                  ? { name: customerMap.get(h.customer_phone)! }
                  : null,
              }));
              setHandoffs(updatedHandoffs);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(logsChannel);
      supabase.removeChannel(sessionsChannel);
    };
  }, [businessId, isSimulating]);

  // 2. Mockup Traffic Simulator Loop
  useEffect(() => {
    if (!isSimulating) {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
      return;
    }

    const runSimulationStep = () => {
      if (simStepRef.current >= SIMULATION_FLOW.length) {
        simStepRef.current = 0; // Loop simulation
      }

      const step = SIMULATION_FLOW[simStepRef.current];
      
      const newLog: MessageLogItem = {
        id: `sim-msg-${simStepRef.current}-${Date.now()}`,
        direction: step.direction as "inbound" | "outbound",
        content_summary: step.content,
        status: "read",
        timestamp: new Date().toISOString(),
        customer_id: `sim-cust-${step.phone}`,
        customers: {
          name: step.name,
          phone: step.phone,
        },
      };

      setLogs((prev) => [newLog, ...prev]);

      if (step.triggerHandoff) {
        const newHandoff: HandoffSession = {
          id: `sim-handoff-${Date.now()}`,
          customer_phone: step.phone,
          updated_at: new Date().toISOString(),
          customers: {
            name: step.name,
          },
        };
        setHandoffs((prev) => {
          if (prev.some((h) => h.customer_phone === step.phone)) return prev;
          return [newHandoff, ...prev];
        });

        toast.custom((t) => (
          <div className={`${t.visible ? 'animate-bounce' : 'opacity-0'} max-w-sm w-full bg-amber-500 text-white shadow-xl rounded-2xl p-4 flex gap-3 border border-amber-400 backdrop-blur-md`}>
            <Icon icon="solar:danger-triangle-bold-duotone" className="h-6 w-6 shrink-0 text-white animate-pulse" />
            <div className="space-y-1">
              <p className="text-sm font-extrabold">Handoff Triggered</p>
              <p className="text-xs opacity-90">{step.name} ({step.phone}) transferred to queue.</p>
            </div>
          </div>
        ), { duration: 5000 });
      }

      simStepRef.current += 1;
    };

    // Run first step instantly
    runSimulationStep();

    // Auto post message every 7.5 seconds
    simIntervalRef.current = setInterval(runSimulationStep, 7500);

    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, [isSimulating]);

  // 3. Scroll position controller
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      if (activeChatPhone) {
        // Chat mode (oldest -> newest, scroll to bottom)
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth",
        });
      } else {
        // Feed mode (newest -> oldest, scroll to top)
        container.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }
    }
  }, [logs, activeChatPhone]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (activeChatPhone) {
      const isScrolledUp = target.scrollHeight - target.scrollTop - target.clientHeight > 150;
      setShowScrollBottom(isScrolledUp);
    } else {
      setShowScrollBottom(false);
    }
  };

  const handleToggleSimulation = (enabled: boolean) => {
    setIsSimulating(enabled);
    if (enabled) {
      toast.success("Simulation mode active. Watching simulated traffic.");
      // Start with clean slate
      setLogs([]);
      setHandoffs([]);
      simStepRef.current = 0;
    } else {
      toast.success("Live Database sync restored.");
      setLogs(initialLogs);
      setHandoffs(initialHandoffs);
      setActiveChatPhone(null);
    }
  };

  const handleRelease = async (phone: string, id: string) => {
    setReleasingId(id);
    if (isSimulating) {
      // Simulator release
      await new Promise((resolve) => setTimeout(resolve, 800));
      setHandoffs((prev) => prev.filter((h) => h.id !== id));
      setReleasingId(null);
      if (activeChatPhone === phone) setActiveChatPhone(null);
      toast.success("Conversation returned to bot (simulated).");
      return;
    }

    const res = await releaseHandoffAction(phone);
    setReleasingId(null);
    if (res.success) {
      setHandoffs((prev) => prev.filter((h) => h.id !== id));
      if (activeChatPhone === phone) setActiveChatPhone(null);
      toast.success("Conversation returned to bot.");
    } else {
      toast.error(res.error ?? "Failed to release session.");
    }
  };

  const handleSendAgentReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeChatPhone) return;

    const bodyText = replyText.trim();
    setReplyText("");
    setSendingMessage(true);

    const activeChatName = handoffs.find(h => h.customer_phone === activeChatPhone)?.customers?.name || "Client";

    if (isSimulating) {
      // Simulator mode message append
      await new Promise((resolve) => setTimeout(resolve, 400));
      const agentLog: MessageLogItem = {
        id: `sim-agent-${Date.now()}`,
        direction: "outbound",
        content_summary: bodyText,
        status: "read",
        timestamp: new Date().toISOString(),
        customer_id: "sim-customer",
        customers: {
          name: activeChatName,
          phone: activeChatPhone,
        },
      };

      setLogs((prev) => [agentLog, ...prev]);
      setSendingMessage(false);

      // Simulate a response from the user after 1.5 seconds
      setTimeout(() => {
        const simulatedInbound: MessageLogItem = {
          id: `sim-cust-reply-${Date.now()}`,
          direction: "inbound",
          content_summary: SIMULATED_REPLIES[Math.floor(Math.random() * SIMULATED_REPLIES.length)],
          status: "read",
          timestamp: new Date().toISOString(),
          customer_id: "sim-customer",
          customers: {
            name: activeChatName,
            phone: activeChatPhone,
          },
        };
        setLogs((prev) => [simulatedInbound, ...prev]);
      }, 1500);

      return;
    }

    // Real mode WhatsApp delivery
    const result = await sendMessageAction(activeChatPhone, bodyText);
    setSendingMessage(false);
    if (result.success) {
      toast.success("Message sent successfully!");
    } else {
      toast.error(result.error || "Failed to send message via WhatsApp.");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <Icon icon="solar:check-broken" className="h-3.5 w-3.5 text-muted-foreground" />;
      case "delivered":
        return <Icon icon="solar:double-alt-check-broken" className="h-3.5 w-3.5 text-muted-foreground" />;
      case "read":
        return <Icon icon="solar:double-alt-check-broken" className="h-3.5 w-3.5 text-primary" />;
      case "failed":
        return <Icon icon="solar:danger-triangle-broken" className="h-3.5 w-3.5 text-destructive" />;
      default:
        return null;
    }
  };

  // Filter and format message logs for Direct Chat mode
  // Sorted chronologically (oldest to newest)
  const directChatLogs = [...logs]
    .filter((log) => {
      const logPhone = log.customers?.phone || (log as any).customer_phone;
      return logPhone === activeChatPhone;
    })
    .reverse();

  // Find active chat client metadata
  const activeChatClientName = handoffs.find((h) => h.customer_phone === activeChatPhone)?.customers?.name || "Client";

  return (
    <div className="space-y-6">
      {/* CSS Animation injection */}
      <style>{`
        @keyframes msgSlideIn {
          from {
            opacity: 0;
            transform: translateY(14px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-msg {
          animation: msgSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      <PageHeader
        title="Messages"
        icon="solar:chat-round-dots-bold-duotone"
        iconBgColor="bg-gradient-to-tr from-blue-600 to-blue-400 shadow-md shadow-blue-500/20"
        description="Monitor real-time conversations, message logs, and human agent transfers."
      />

      {/* Live / Simulation Mode Toggle */}
      <div className="flex justify-end mt-2">
        <div className="flex items-center bg-card border border-border/80 shadow-sm p-1.5 rounded-2xl gap-1.5">
          <button
            onClick={() => handleToggleSimulation(false)}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all duration-300 ${
              !isSimulating
                ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className={`relative flex h-2 w-2 ${!isSimulating ? "" : "opacity-40"}`}>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Real-time Sync
          </button>
          <button
            onClick={() => handleToggleSimulation(true)}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all duration-300 ${
              isSimulating
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/10"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className={`relative flex h-2 w-2 ${isSimulating ? "" : "opacity-40"}`}>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            Live Simulator
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Handoff Queue */}
        <div className="bg-card/60 dark:bg-slate-900/60 backdrop-blur-md border border-border/80 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-md font-extrabold text-foreground flex items-center gap-2">
                <Icon icon="solar:refresh-broken" className={`h-4 w-4 text-primary ${isSimulating ? "animate-spin" : "animate-pulse"}`} />
                Handoff Queue
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Conversations waiting for manual agent replies.
              </p>
            </div>
            {handoffs.length > 0 && (
              <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-200/50">
                {handoffs.length} Waiting
              </span>
            )}
          </div>

          {handoffs.length === 0 ? (
            <div className="text-center py-10 bg-muted/10 border border-dashed border-border/80 rounded-2xl flex flex-col items-center justify-center">
              <div className="h-12 w-12 rounded-full bg-muted/20 flex items-center justify-center text-muted-foreground mb-3 border border-border/40">
                <Icon icon="solar:check-circle-broken" className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-md font-bold text-foreground">Bot Active & Ready</p>
              <p className="text-sm text-muted-foreground mt-1 px-4 max-w-xs leading-relaxed">
                No active agent transfers. The WhatsApp Booking Bot is handling all users.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-120 overflow-y-auto pr-1.5 custom-scrollbar">
              {handoffs.map((session) => {
                const isActive = activeChatPhone === session.customer_phone;
                return (
                  <div
                    key={session.id}
                    onClick={() => setActiveChatPhone(session.customer_phone)}
                    className={`group relative p-3.5 border rounded-2xl flex flex-col justify-between gap-3 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 ${
                      isActive
                        ? "bg-slate-900 text-white border-slate-950 dark:bg-slate-50 dark:text-slate-900 shadow-md shadow-slate-950/10"
                        : "bg-muted/10 border-border/60 hover:bg-muted/30"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex justify-between items-start gap-2">
                        <p className="text-sm font-extrabold truncate">
                          {session.customers?.name || "Client"}
                        </p>
                        <span className={`text-[9px] ${isActive ? "text-slate-400 dark:text-slate-500" : "text-muted-foreground"}`}>
                          {formatDateTime(session.updated_at, timezone)}
                        </span>
                      </div>
                      <p className={`text-xs ${isActive ? "text-slate-300 dark:text-slate-600" : "text-muted-foreground"}`}>
                        {session.customer_phone}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <Button
                        size="sm"
                        variant={isActive ? "secondary" : "ghost"}
                        className="flex-1 text-[11px] h-8 font-bold rounded-xl flex items-center justify-center gap-1 shadow-sm transition-all duration-300 border border-border/80"
                        loading={releasingId === session.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRelease(session.customer_phone, session.id);
                        }}
                      >
                        <Icon icon="solar:user-check-broken" className="h-3.5 w-3.5" />
                        Release to Bot
                      </Button>
                      {!isActive && (
                        <div className="h-8 w-8 rounded-xl bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center text-primary transition-all duration-300">
                          <Icon icon="solar:chat-square-broken" className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Live Message Feed (Chronological Feed or Focused Direct Chat) */}
        <div className="lg:col-span-2 relative bg-card/60 dark:bg-slate-900/60 backdrop-blur-md border border-border/80 rounded-3xl p-5 shadow-sm flex flex-col h-150 overflow-hidden">
          
          {/* Header */}
          <div className="pb-4 border-b border-border/60 flex justify-between items-center shrink-0">
            {activeChatPhone ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveChatPhone(null)}
                  className="h-9 w-9 rounded-xl border border-border hover:bg-muted/40 text-foreground flex items-center justify-center transition-all duration-300 hover:-translate-x-0.5"
                >
                  <Icon icon="solar:arrow-left-broken" className="h-5 w-5" />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-foreground">{activeChatClientName}</span>
                    <span className="px-2 py-0.5 text-[9px] font-black rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/50">
                      Handoff
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">{activeChatPhone}</span>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-md font-extrabold text-foreground flex items-center gap-2">
                  <Icon icon="solar:chat-square-broken" className="h-4 w-4 text-muted-foreground" />
                  Live Message Feed
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Stream of incoming booking queries and bot actions.
                </p>
              </div>
            )}

            <div className="flex items-center gap-2">
              {!activeChatPhone && logs.length > 0 && (
                <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 bg-muted/40 px-2.5 py-1 rounded-xl">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  {logs.length} Total Logs
                </span>
              )}
              {activeChatPhone && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive flex items-center gap-1 h-8 px-2.5 rounded-xl font-bold"
                  onClick={() => {
                    const activeSession = handoffs.find((h) => h.customer_phone === activeChatPhone);
                    if (activeSession) handleRelease(activeChatPhone, activeSession.id);
                  }}
                >
                  <Icon icon="solar:stop-bold" className="h-3.5 w-3.5" /> Stop Handoff
                </Button>
              )}
            </div>
          </div>

          {/* Floating Scroll to Bottom Button */}
          {showScrollBottom && (
            <button
              onClick={() => {
                scrollContainerRef.current?.scrollTo({
                  top: scrollContainerRef.current.scrollHeight,
                  behavior: "smooth",
                });
              }}
              className="absolute bottom-20 right-8 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 p-2.5 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 hover:-translate-y-0.5 z-20 animate-msg"
            >
              <Icon icon="solar:arrow-left-broken" className="h-4 w-4 rotate-270" />
            </button>
          )}

          {/* Scrollable Message List */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto py-4 pr-1.5 space-y-4 custom-scrollbar"
          >
            {activeChatPhone ? (
              /* DIRECT CHAT STATE (Oldest first, scrolls to bottom) */
              directChatLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <Icon icon="solar:chat-round-dots-bold-duotone" className="h-10 w-10 text-muted-foreground mb-2 animate-bounce" />
                  <p className="text-md font-bold text-foreground">Start Conversation</p>
                  <p className="text-sm text-muted-foreground mt-0.5">Send a message below to assist the client.</p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {directChatLogs.map((log) => {
                    const isInbound = log.direction === "inbound";
                    return (
                      <div
                        key={log.id}
                        className={`flex ${isInbound ? "justify-start" : "justify-end"} animate-msg`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm space-y-1 transition-all duration-300 ${
                            isInbound
                              ? "bg-slate-100 dark:bg-slate-850 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200/40 dark:border-slate-800/40"
                              : "bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-950 rounded-tr-none"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">
                            {log.content_summary}
                          </p>
                          <div className="flex justify-between items-center gap-4 pt-1">
                            <span className={`text-[9px] font-medium opacity-60`}>
                              {formatDateTime(log.timestamp, timezone)}
                            </span>
                            {!isInbound && (
                              <div className="opacity-90">
                                {getStatusIcon(log.status)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              /* CHRONOLOGICAL LIVE ACTIVITY FEED (Newest first, scrolls to top) */
              logs.length === 0 ? (
                <EmptyState
                  icon="solar:chat-broken"
                  title="No Message Activity"
                  description="Conversations will stream here in real-time once active on WhatsApp."
                />
              ) : (
                <div className="space-y-3.5">
                  {logs.map((log) => {
                    const isInbound = log.direction === "inbound";
                    const clientName = log.customers?.name || log.customers?.phone || "Client";
                    const clientPhone = log.customers?.phone || (log as any).customer_phone;
                    const isSessionHandoff = handoffs.some((h) => h.customer_phone === clientPhone);

                    return (
                      <div
                        key={log.id}
                        className={`group p-4 border border-border/40 hover:border-border rounded-2xl transition-all duration-300 hover:bg-muted/10 flex flex-col gap-2 relative animate-msg`}
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex items-center gap-2">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-inner bg-gradient-to-tr ${
                              isInbound ? "from-emerald-500 to-teal-400" : "from-blue-600 to-blue-400"
                            }`}>
                              {isInbound ? clientName.substring(0, 2).toUpperCase() : "Bot"}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => {
                                    if (clientPhone) {
                                      // If customer is in handoff state, we can select them immediately to chat!
                                      // If not, we can simulate putting them in handoff or just let the user view history!
                                      if (isSessionHandoff) {
                                        setActiveChatPhone(clientPhone);
                                      } else {
                                        // Auto-create a local handoff session to make direct messaging work seamlessly
                                        const tempHandoff: HandoffSession = {
                                          id: `temp-hand-${Date.now()}`,
                                          customer_phone: clientPhone,
                                          updated_at: new Date().toISOString(),
                                          customers: { name: clientName },
                                        };
                                        setHandoffs((prev) => [tempHandoff, ...prev]);
                                        setActiveChatPhone(clientPhone);
                                        toast.success(`Opened chat thread for ${clientName}`);
                                      }
                                    }
                                  }}
                                  className="text-sm font-extrabold text-foreground hover:underline text-left"
                                >
                                  {isInbound ? clientName : "Booking Assistant"}
                                </button>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-black border ${
                                  isInbound
                                    ? "bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-400 border-teal-200/50"
                                    : "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-200/50"
                                }`}>
                                  {isInbound ? "INBOUND" : "OUTBOUND"}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">{clientPhone || "WhatsApp Link"}</p>
                            </div>
                          </div>
                          <span className="text-[9px] text-muted-foreground">
                            {formatDateTime(log.timestamp, timezone)}
                          </span>
                        </div>

                        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 bg-muted/20 dark:bg-slate-800/10 p-3 rounded-xl border border-border/30 whitespace-pre-wrap">
                          {log.content_summary}
                        </p>

                        {!isInbound && (
                          <div className="flex justify-end pr-1">
                            {getStatusIcon(log.status)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>

          {/* Footer Input Bar */}
          <div className="pt-4 border-t border-border/60 shrink-0">
            {activeChatPhone ? (
              <form onSubmit={handleSendAgentReply} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Reply to ${activeChatClientName}...`}
                  disabled={sendingMessage}
                  className="flex-1 min-w-0 bg-muted/30 border border-border/80 focus:border-primary/50 text-foreground text-sm px-4 py-2.5 rounded-2xl outline-hidden focus:ring-1 focus:ring-primary/30 transition-all duration-300 disabled:opacity-50"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!replyText.trim() || sendingMessage}
                  className="h-10 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-50 dark:hover:bg-slate-150 text-white dark:text-slate-950 font-bold flex items-center justify-center gap-1.5 transition-all duration-300 active:scale-95"
                >
                  <Icon icon="solar:send-bold-duotone" className="h-4 w-4" />
                  Send
                </Button>
              </form>
            ) : (
              <div className="text-center py-2 text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                <Icon icon="solar:user-bold" className="h-3.5 w-3.5" />
                Select a client from the Handoff Queue on the left, or click on a client's name inside the feed logs to open direct messaging.
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
