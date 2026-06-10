"use client";

import { useActionState, useState } from "react";
import { loginAction, magicLinkAction, forgotPasswordAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const [mode, setMode] = useState<"password" | "magic" | "forgot">("password");
  const [loginState, loginDispatch, loginPending] = useActionState(loginAction, undefined);
  const [magicState, magicDispatch, magicPending] = useActionState(magicLinkAction, undefined);
  const [forgotState, forgotDispatch, forgotPending] = useActionState(forgotPasswordAction, undefined);

  if (mode === "forgot") {
    return (
      <div className="space-y-4">
        {forgotState?.success ? (
          <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-sm text-green-800">
            Check your email — we sent a password reset link.
          </div>
        ) : (
          <form action={forgotDispatch} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>
            <Input
              label="Email address"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
            {forgotState?.success === false && (
              <p className="text-sm text-destructive">{forgotState.error}</p>
            )}
            <Button type="submit" className="w-full" loading={forgotPending}>
              Send reset link
            </Button>
          </form>
        )}
        <button
          type="button"
          onClick={() => setMode("password")}
          className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  if (mode === "magic") {
    return (
      <div className="space-y-4">
        {magicState?.success ? (
          <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-sm text-green-800">
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
          className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Sign in with password instead
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <form action={loginDispatch} className="space-y-4">
        <Input
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
        <div className="space-y-1">
          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            required
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setMode("forgot")}
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Forgot password?
            </button>
          </div>
        </div>
        {loginState?.success === false && (
          <p className="text-sm text-destructive">{loginState.error}</p>
        )}
        <Button type="submit" className="w-full" loading={loginPending}>
          Sign in
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <button
        type="button"
        onClick={() => setMode("magic")}
        className="w-full rounded-xl border border-border py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
      >
        Sign in with magic link
      </button>
    </div>
  );
}
