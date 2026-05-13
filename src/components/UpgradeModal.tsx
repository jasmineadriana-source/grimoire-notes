import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Crown, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  reason?: string;
};

const FEATURES = [
  "Unlimited notebooks",
  "Fully customize app & notebook themes",
  "Premium dice — obsidian, ruby, emerald, sapphire, gold & arcane",
  "Cross-device cloud sync",
  "Priority support",
];

export function UpgradeModal({ open, onOpenChange, reason }: Props) {
  const { user } = useAuth();
  const { openCheckout, loading } = usePaddleCheckout();
  const [interval, setInterval] = useState<"monthly" | "yearly">("yearly");

  const startCheckout = async () => {
    try {
      await openCheckout({
        priceId: interval === "monthly" ? "premium_monthly" : "premium_yearly",
        customerEmail: user?.email,
        customData: { userId: user?.id || "" },
        successUrl: `${window.location.origin}/?checkout=success`,
      });
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || "Could not open checkout");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto h-14 w-14 rounded-full bg-gradient-accent accent-glow flex items-center justify-center mb-2">
            <Crown className="h-7 w-7 text-primary-foreground" />
          </div>
          <DialogTitle className="font-decorative text-2xl text-center">
            Unlock Grimoire Premium
          </DialogTitle>
          <DialogDescription className="text-center font-script italic">
            {reason ?? "Take your grimoire to legendary status."}
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2 my-2">
          {FEATURES.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-accent mt-0.5 shrink-0" />
              <span>{f}</span>
            </li>
          ))}
        </ul>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setInterval("monthly")}
            className={`rounded-lg border-2 p-3 text-left transition-all ${
              interval === "monthly" ? "border-accent accent-glow" : "border-border"
            }`}
          >
            <div className="font-display text-sm">Monthly</div>
            <div className="font-decorative text-2xl text-foreground">$4.99<span className="text-sm text-muted-foreground">/mo</span></div>
            <div className="text-[10px] text-muted-foreground italic">Cancel anytime</div>
          </button>
          <button
            onClick={() => setInterval("yearly")}
            className={`rounded-lg border-2 p-3 text-left transition-all relative ${
              interval === "yearly" ? "border-accent accent-glow" : "border-border"
            }`}
          >
            <span className="absolute -top-2 right-2 bg-gradient-accent text-primary-foreground text-[9px] font-display px-2 py-0.5 rounded-full">
              Save 33%
            </span>
            <div className="font-display text-sm">Yearly</div>
            <div className="font-decorative text-2xl text-foreground">$39.99<span className="text-sm text-muted-foreground">/yr</span></div>
            <div className="text-[10px] text-muted-foreground italic">≈ $3.33/mo</div>
          </button>
        </div>

        <Button
          onClick={startCheckout}
          disabled={loading}
          className="w-full bg-gradient-accent text-primary-foreground hover:opacity-90 font-display tracking-wide mt-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Unlock Premium"}
        </Button>
        <p className="text-[10px] text-muted-foreground text-center italic">
          Secure checkout. Billed by Paddle, our merchant of record.
        </p>
      </DialogContent>
    </Dialog>
  );
}
