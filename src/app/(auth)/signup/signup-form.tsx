"use client";

import { useActionState } from "react";
import { signupAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlassCard } from "@/components/ui/GlassCard";

export function SignupForm() {
  const [state, dispatch, pending] = useActionState(signupAction, undefined);

  if (state?.success) {
    return (
      <GlassCard mode="light" gradient className="p-8 w-full max-w-sm">
        <div className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 text-sm text-green-800 dark:text-green-300">
          <p className="font-medium">Check your email</p>
          <p className="mt-1">
            We sent you a confirmation link. Click it to activate your account and
            continue setup.
          </p>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard mode="light" gradient className="p-8 w-full max-w-sm">
    <form action={dispatch} className="space-y-4">
      <Input
        label="Your name"
        name="name"
        type="text"
        autoComplete="name"
        placeholder="Jane Wanjiku"
        required
      />
      <Input
        label="Email address"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="jane@example.com"
        required
      />
      <Input
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="••••••••"
        hint="At least 8 characters, one uppercase, one number"
        required
      />
      {state?.success === false && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      <Button type="submit" className="w-full" loading={pending}>
        Create account
      </Button>
      <p className="text-xs text-center text-muted-foreground">
        By signing up you agree to our terms of service and privacy policy.
      </p>
    </form>
    </GlassCard>
  );
}
