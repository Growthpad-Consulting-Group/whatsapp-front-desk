"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { linkStaffMemberAction } from "@/actions/auth";

type Stage = "loading" | "ready" | "error";

export default function AcceptInvitePage() {
  const { resolvedTheme } = useTheme();
  const router = useRouter();

  const [stage, setStage] = useState<Stage>("loading");
  const [sessionError, setSessionError] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [matchError, setMatchError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // @supabase/ssr's createBrowserClient uses flowType:"pkce", which only detects
  // ?code= query params — it ignores #access_token= hash tokens. Invite links use
  // the implicit/hash flow, so we parse the hash manually and call setSession().
  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (!accessToken || !refreshToken) {
      setSessionError("This invite link is invalid or has expired. Ask your admin to resend.");
      setStage("error");
      return;
    }

    const supabase = createClient();
    supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ data, error }) => {
        if (error || !data.session) {
          setSessionError(
            error?.message?.includes("expired")
              ? "This invite link has expired. Ask your admin to resend."
              : "This invite link is invalid or has expired. Ask your admin to resend."
          );
          setStage("error");
        } else {
          // Clean tokens from the URL bar
          window.history.replaceState(null, "", window.location.pathname);
          setStage("ready");
        }
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMatchError("");
    setSubmitError("");

    if (password !== confirmPassword) {
      setMatchError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    // Update password — session is already active from the invite hash
    const { error: pwError } = await supabase.auth.updateUser({ password });
    if (pwError) {
      setLoading(false);
      setSubmitError(pwError.message);
      return;
    }

    // Link the staff_member record server-side (session now synced to cookies)
    const res = await linkStaffMemberAction();
    setLoading(false);

    if (!res.success) {
      // Non-fatal — account is active, just the link failed; send to dashboard anyway
      console.warn("Staff link warning:", res.error);
    }

    router.replace("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0fdf4] dark:bg-[#020617] px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Image
            src={resolvedTheme === "dark" ? "/assets/images/logo-white.svg" : "/logo.svg"}
            alt="WhatsApp Front Desk"
            width={160}
            height={60}
            className="w-40 h-auto"
            priority
          />
        </div>

        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-black/5 dark:border-white/5 shadow-2xl p-8 space-y-6">

          {/* Loading */}
          {stage === "loading" && (
            <div className="flex flex-col items-center gap-3 py-6">
              <Icon icon="solar:spinner-broken" className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Verifying your invite…</p>
            </div>
          )}

          {/* Invalid link */}
          {stage === "error" && (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
                <Icon icon="solar:danger-circle-broken" className="w-6 h-6 text-destructive" />
              </div>
              <h1 className="text-xl font-bold text-foreground">Link expired</h1>
              <p className="text-sm text-muted-foreground">{sessionError}</p>
              <a href="/login" className="text-sm text-primary font-semibold hover:underline mt-2">
                Back to login
              </a>
            </div>
          )}

          {/* Set password form */}
          {stage === "ready" && (
            <>
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Icon icon="solar:user-check-broken" className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Activate your account</h1>
                <p className="text-sm text-muted-foreground">You&apos;ve been invited to join the team. Set a password to get started.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={8}
                      autoFocus
                      className="h-11 w-full pl-4 pr-11 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Icon icon={showPassword ? "solar:eye-closed-broken" : "solar:eye-broken"} className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground ml-1">At least 8 characters</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Confirm password</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="h-11 w-full pl-4 pr-11 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Icon icon={showConfirm ? "solar:eye-closed-broken" : "solar:eye-broken"} className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {(matchError || submitError) && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                    <Icon icon="solar:danger-circle-broken" className="w-4 h-4 shrink-0" />
                    {matchError || submitError}
                  </div>
                )}

                <Button type="submit" className="w-full" loading={loading}>
                  Activate account
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
