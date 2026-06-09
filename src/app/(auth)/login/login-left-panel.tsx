"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "next-themes";
import { loginAction, magicLinkAction } from "@/actions/auth";
import { signupAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

type AuthMode = "login" | "signup";
type LoginStep = "email" | "password" | "magic";

// ── Step indicator (dots + connecting line) ────────────────────────────────

function StepIndicator({ currentStep }: { currentStep: LoginStep }) {
  const steps = [
    { id: "email", label: "Identity" },
    { id: "password", label: "Security" },
  ];
  const currentIndex = currentStep === "email" ? 0 : 1;

  return (
    <div className="flex items-center justify-center gap-3 mb-8">
      {steps.map((step, index) => {
        const isActive = index <= currentIndex;
        const isCurrent = index === currentIndex;
        return (
          <div key={step.id} className="flex items-center">
            <div className="relative group">
              <motion.div
                initial={false}
                animate={{
                  scale: isCurrent ? 1.3 : 1,
                  backgroundColor: isActive ? "#16a34a" : undefined,
                }}
                className={`w-2.5 h-2.5 rounded-full ${!isActive ? "bg-gray-200 dark:bg-gray-700" : ""}`}
                style={{
                  boxShadow: isCurrent ? "0 0 12px #16a34a80" : "none",
                }}
              />
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  {step.label}
                </span>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className="w-10 h-[2px] mx-1.5 overflow-hidden bg-gray-200 dark:bg-gray-700">
                <motion.div
                  initial={false}
                  animate={{ width: index < currentIndex ? "100%" : "0%" }}
                  className="h-full bg-primary"
                  transition={{ duration: 0.5 }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Email step ──────────────────────────────────────────────────────────────

function EmailStep({
  email,
  onEmailChange,
  onContinue,
  onMagicLink,
}: {
  email: string;
  onEmailChange: (v: string) => void;
  onContinue: (e: React.FormEvent) => void;
  onMagicLink: () => void;
}) {
  return (
    <motion.form
      onSubmit={onContinue}
      className="space-y-5"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
    >
      <div className="space-y-1">
        <div className="relative">
          <Icon icon="solar:letter-broken" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="name@company.com"
            required
            autoFocus
            className="h-11 w-full pl-10 pr-4 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground"
          />
        </div>
        <p className="text-[11px] font-medium text-muted-foreground ml-1">
          We&apos;ll verify your email and get you into your dashboard.
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={!email.trim()}>
        Continue
        <Icon icon="solar:alt-arrow-right-broken" className="w-4 h-4 ml-1" />
      </Button>

      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="px-3 text-xs text-muted-foreground bg-background dark:bg-[#020617]">or</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onMagicLink}
        className="w-full rounded-xl border border-border py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
      >
        Send magic link instead
      </button>
    </motion.form>
  );
}

// ── Password step ───────────────────────────────────────────────────────────

function PasswordStep({
  email,
  onBack,
}: {
  email: string;
  onBack: () => void;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginState, loginDispatch, loginPending] = useActionState(loginAction, undefined);

  return (
    <motion.div
      className="space-y-5"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
    >
      {/* Account card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-3.5 rounded-2xl border border-primary/20 flex items-center gap-3 bg-linear-to-r from-primary/5 to-primary/10"
      >
        <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-base font-bold text-white bg-linear-to-br from-primary to-green-400 shadow-lg shadow-primary/20">
          {email.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{email}</p>
          <p className="text-xs text-muted-foreground">Returning user</p>
        </div>
        <button
          type="button"
          onClick={onBack}
          title="Switch account"
          className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground transition-colors"
        >
          <Icon icon="solar:user-rounded-broken" className="w-4 h-4" />
        </button>
      </motion.div>

      <form action={loginDispatch} className="space-y-4">
        {/* Hidden email so loginAction gets it */}
        <input type="hidden" name="email" value={email} />

        <div className="relative">
          <Icon icon="solar:lock-password-broken" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="••••••••"
            required
            autoFocus
            className="h-11 w-full pl-10 pr-11 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icon icon={showPassword ? "solar:eye-closed-broken" : "solar:eye-broken"} className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="sr-only"
            />
            <div className={`w-5 h-5 border-2 rounded-lg flex items-center justify-center transition-all ${
              rememberMe
                ? "bg-primary border-primary shadow-md shadow-primary/25"
                : "border-border bg-background group-hover:border-primary/50"
            }`}>
              {rememberMe && <Icon icon="solar:check-circle-broken" className="w-3.5 h-3.5 text-white" />}
            </div>
            <span className="text-sm text-muted-foreground">Keep me signed in</span>
          </label>
          <button type="button" className="text-sm font-bold text-primary hover:underline">
            Forgot?
          </button>
        </div>

        {loginState?.success === false && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
            <Icon icon="solar:danger-circle-broken" className="w-4 h-4 shrink-0" />
            {loginState.error}
          </div>
        )}

        <Button type="submit" className="w-full" loading={loginPending}>
          Sign In to Dashboard
          {!loginPending && <Icon icon="solar:login-2-broken" className="w-4 h-4 ml-2" />}
        </Button>
      </form>
    </motion.div>
  );
}

// ── Magic link step ─────────────────────────────────────────────────────────

function MagicStep({ onBack }: { onBack: () => void }) {
  const [magicState, magicDispatch, magicPending] = useActionState(magicLinkAction, undefined);

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
    >
      {magicState?.success ? (
        <div className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 text-sm text-green-800 dark:text-green-300">
          <p className="font-semibold mb-0.5">Check your email</p>
          We sent you a sign-in link. It expires in 10 minutes.
        </div>
      ) : (
        <form action={magicDispatch} className="space-y-4">
          <div className="relative">
            <Icon icon="solar:letter-broken" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              required
              autoFocus
              className="h-11 w-full pl-10 pr-4 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          {magicState?.success === false && (
            <p className="text-sm text-destructive">{magicState.error}</p>
          )}
          <Button type="submit" className="w-full" loading={magicPending}>
            Send sign-in link
          </Button>
        </form>
      )}
      <button type="button" onClick={onBack} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
        ← Back to sign in
      </button>
    </motion.div>
  );
}

// ── Signup step ─────────────────────────────────────────────────────────────

function SignupStep({ onSwitch }: { onSwitch: () => void }) {
  const [state, dispatch, pending] = useActionState(signupAction, undefined);

  if (state?.success) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 text-sm text-green-800 dark:text-green-300">
          <p className="font-semibold mb-0.5">Check your email</p>
          We sent a confirmation link. Click it to activate your account.
        </div>
        <button type="button" onClick={onSwitch} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Back to sign in
        </button>
      </div>
    );
  }

  return (
    <motion.form
      action={dispatch}
      className="space-y-4"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
    >
      <Input label="Your name" name="name" type="text" autoComplete="name" placeholder="Jane Wanjiku" required />
      <Input label="Email address" name="email" type="email" autoComplete="email" placeholder="jane@example.com" required />
      <Input label="Password" name="password" type="password" autoComplete="new-password" placeholder="••••••••" hint="At least 8 characters, one uppercase, one number" required />
      {state?.success === false && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" className="w-full" loading={pending}>Create account</Button>
      <p className="text-xs text-center text-muted-foreground">
        By signing up you agree to our{" "}
        <Link href="/terms" className="underline hover:text-foreground">terms</Link>
        {" "}and{" "}
        <Link href="/privacy" className="underline hover:text-foreground">privacy policy</Link>.
      </p>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <button type="button" onClick={onSwitch} className="text-primary font-semibold hover:underline">Sign in</button>
      </p>
    </motion.form>
  );
}

// ── Logo ────────────────────────────────────────────────────────────────────

function Logo() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  return (
    <div className="flex justify-center mb-6">
      <Image
        src={isDark ? "/assets/images/logo-white.svg" : "/logo.svg"}
        alt="WhatsApp Front Desk"
        width={180}
        height={68}
        className="w-44 h-auto"
        priority
      />
    </div>
  );
}

// ── Left panel ──────────────────────────────────────────────────────────────

export function LoginLeftPanel() {
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [loginStep, setLoginStep] = useState<LoginStep>("email");
  const [email, setEmail] = useState("");

  const isLogin = authMode === "login";

  const handleEmailContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) setLoginStep("password");
  };

  const switchAuthMode = (mode: AuthMode) => {
    setAuthMode(mode);
    setLoginStep("email");
    setEmail("");
  };

  return (
    <div className="relative z-10 w-full md:w-[42%] flex flex-col justify-center items-center px-6 md:px-12 py-16 bg-white/60 dark:bg-gray-900/60 border-r border-black/5 dark:border-white/5 shadow-2xl backdrop-blur-3xl">
      {/* Theme toggle */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        <Logo />

        {/* Auth mode tabs */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl gap-1 shadow-inner">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => switchAuthMode(m)}
                className={`px-5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  authMode === m
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-md"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                {m === "login" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>
        </div>

        {/* Heading */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${authMode}-${loginStep}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="text-center mb-6"
          >
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1">
              {isLogin
                ? loginStep === "email" ? "Welcome back" : "Enter your password"
                : "Get started free"}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              {isLogin
                ? loginStep === "email"
                  ? "Sign in to your WhatsApp Front Desk"
                  : `Signing in as ${email}`
                : "Set up your front desk in under 2 minutes"}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Step indicator — only for login */}
        {isLogin && loginStep !== "magic" && (
          <StepIndicator currentStep={loginStep} />
        )}

        {/* Form area */}
        <div className="relative min-h-[260px]">
          <AnimatePresence mode="wait">
            {isLogin && loginStep === "email" && (
              <EmailStep
                key="email"
                email={email}
                onEmailChange={setEmail}
                onContinue={handleEmailContinue}
                onMagicLink={() => setLoginStep("magic")}
              />
            )}
            {isLogin && loginStep === "password" && (
              <PasswordStep
                key="password"
                email={email}
                onBack={() => setLoginStep("email")}
              />
            )}
            {isLogin && loginStep === "magic" && (
              <MagicStep
                key="magic"
                onBack={() => setLoginStep("email")}
              />
            )}
            {!isLogin && (
              <SignupStep
                key="signup"
                onSwitch={() => switchAuthMode("login")}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-10 text-center space-y-3">
        <div className="flex items-center justify-center gap-4 text-xs text-gray-400 dark:text-gray-500">
          <Link href="/" className="flex items-center gap-1.5 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <Icon icon="solar:alt-arrow-left-broken" className="w-3.5 h-3.5" />
            Back to Home
          </Link>
          <span>•</span>
          <Link href="mailto:support@example.com" className="flex items-center gap-1.5 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <Icon icon="solar:question-square-broken" className="w-3.5 h-3.5" />
            Need Help?
          </Link>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-600">
          © {new Date().getFullYear()} WhatsApp Front Desk. All rights reserved.
        </p>
      </div>
    </div>
  );
}
