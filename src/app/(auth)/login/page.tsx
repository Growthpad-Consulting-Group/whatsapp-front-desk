import type { Metadata } from "next";
import { LoginLeftPanel } from "./login-left-panel";
import { LoginRightPanel } from "./login-right-panel";
import { GradientOrb } from "@/components/ui/GradientOrb";

export const metadata: Metadata = {
  title: "Sign in — WhatsApp Front Desk",
};

export default function LoginPage() {
  return (
    <div className="relative flex flex-col md:flex-row min-h-screen overflow-hidden w-full bg-[#f0fdf4] dark:bg-[#020617]">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <GradientOrb className="top-[-10%] right-[-5%] w-[50vw] h-[50vw] bg-linear-to-br from-green-400/20 to-emerald-300/10 opacity-60" />
        <GradientOrb className="bottom-[0%] left-[-10%] w-[40vw] h-[40vw] bg-linear-to-br from-green-200/20 to-teal-200/10 opacity-60" delay={5} />
      </div>

      <LoginLeftPanel />
      <LoginRightPanel />
    </div>
  );
}
