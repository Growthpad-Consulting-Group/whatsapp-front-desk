import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create account — WhatsApp Front Desk",
};

export default function SignupPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-muted px-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-foreground">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Set up your WhatsApp front desk in minutes
          </p>
        </div>
        {/* Signup form will go here */}
        <p className="text-center text-sm text-muted-foreground">
          Signup form coming soon
        </p>
      </div>
    </main>
  );
}
