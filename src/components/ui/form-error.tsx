import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

interface FormErrorProps {
  message: string | null | undefined;
  className?: string;
}

export function FormError({ message, className }: FormErrorProps) {
  if (!message) return null;
  return (
    <div className={cn(
      "flex items-center gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-3",
      className
    )}>
      <Icon icon="solar:danger-circle-broken" className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

export default FormError;
