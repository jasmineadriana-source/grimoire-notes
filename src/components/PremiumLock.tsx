import { Crown } from "lucide-react";

export function PremiumLock({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-gradient-accent text-primary-foreground text-[9px] font-display tracking-wide px-1.5 py-0.5 ${className}`}
      title="Premium feature"
    >
      <Crown className="h-2.5 w-2.5" /> PRO
    </span>
  );
}
