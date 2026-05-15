import type { Metadata } from "next";

export const metadata: Metadata = { title: "Messages" };

export default function MessagesPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground mb-6">Messages</h1>
      <p className="text-sm text-muted-foreground">Message log coming soon.</p>
    </div>
  );
}
