import type { Metadata } from "next";
import { requireBusiness } from "@/lib/data/business";
import { BotPersonaForm } from "./bot-persona-form";

export const metadata: Metadata = { title: "Bot Persona — Settings" };

export default async function BotPersonaPage() {
  const { business, staff } = await requireBusiness();
  const isOwner = staff.role === "owner";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Bot Persona</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure how your WhatsApp booking bot communicates with clients. These settings shape its name, tone, and overall personality.
        </p>
      </div>

      <BotPersonaForm
        botName={(business as any).bot_name ?? "Front Desk"}
        botTone={(business as any).bot_tone ?? "warm"}
        isOwner={isOwner}
      />
    </div>
  );
}
