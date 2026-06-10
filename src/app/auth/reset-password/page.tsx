"use client";

import { useActionState, useState } from "react";
import { useTheme } from "next-themes";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { updatePasswordAction } from "@/actions/auth";

export default function ResetPasswordPage() {
  const { resolvedTheme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [matchError, setMatchError] = useState("");
  const [state, dispatch, pending] = useActionState(updatePasswordAction, undefined);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const form = e.currentTarget;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    if (password !== confirmPassword) {
      e.preventDefault();
      setMatchError("Passwords do not match.");
    } else {
      setMatchError("");
    }
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
          <div className="text-center space-y-1">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Icon icon="solar:lock-password-broken" className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Set new password</h1>
            <p className="text-sm text-muted-foreground">Choose a strong password for your account.</p>
          </div>

          <form onSubmit={handleSubmit} action={dispatch} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">New password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
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

            {(matchError || state?.success === false) && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                <Icon icon="solar:danger-circle-broken" className="w-4 h-4 shrink-0" />
                {matchError || (state?.success === false && state.error)}
              </div>
            )}

            <Button type="submit" className="w-full" loading={pending}>
              Update password
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
