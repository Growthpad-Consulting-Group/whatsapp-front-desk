"use client";

import { useActionState, useState } from "react";
import { loginAction, magicLinkAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [loginState, loginDispatch, loginPending] = useActionState(loginAction, undefined);
  const [magicState, magicDispatch, magicPending] = useActionState(magicLinkAction, undefined);

  if (mode === "magic") {
    return (
      <div>
        {magicState?.success ? (
          <div className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 text-sm text-green-800 dark:text-green-300">
            Check your email — we sent you a sign-in link.
          </div>
        ) : (
          <form action={magicDispatch} className="space-y-4">
            <Input
              label="Email address"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
            {magicState?.success === false && (
              <p className="text-sm text-destructive">{magicState.error}</p>
            )}
            <Button type="submit" className="w-full" loading={magicPending}>
              Send sign-in link
            </Button>
          </form>
        )}
        <button
          type="button"
          onClick={() => setMode("password")}
          className="mt-4 w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Sign in with password instead
        </button>
      </div>
    );
  }

  return (
    <div>
      <form action={loginDispatch} className="space-y-4">
        <Input
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
        />
        {loginState?.success === false && (
          <p className="text-sm text-destructive">{loginState.error}</p>
        )}
        <Button type="submit" className="w-full" loading={loginPending}>
          Sign in
        </Button>
      </form>

      <div className="mt-4 flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <button
        type="button"
        onClick={() => setMode("magic")}
        className="mt-4 w-full rounded-xl border border-border py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
      >
        Sign in with magic link
      </button>
    </div>
  );
}
