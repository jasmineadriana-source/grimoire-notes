import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getPaddleEnvironment } from "@/lib/paddle";
import { useAuth } from "./useAuth";

type SubRow = {
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  price_id: string;
  product_id: string;
  paddle_subscription_id: string;
  paddle_customer_id: string;
};

export function useSubscription() {
  const { user, loading: authLoading } = useAuth();
  const [subscription, setSubscription] = useState<SubRow | null>(null);
  const [loading, setLoading] = useState(true);

  const env = getPaddleEnvironment();

  const refetch = async () => {
    if (!user) { setSubscription(null); setLoading(false); return; }
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("environment", env)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setSubscription(data as SubRow | null);
    setLoading(false);
  };

  useEffect(() => {
    if (authLoading) return;
    refetch();
    if (!user) return;
    const channel = supabase
      .channel(`subs-${user.id}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "subscriptions",
        filter: `user_id=eq.${user.id}`,
      }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading]);

  const isActive = !!subscription && (
    (["active", "trialing", "past_due"].includes(subscription.status) &&
      (!subscription.current_period_end || new Date(subscription.current_period_end) > new Date())) ||
    (subscription.status === "canceled" && subscription.current_period_end &&
      new Date(subscription.current_period_end) > new Date())
  );

  return { subscription, isPremium: !!isActive, loading, refetch };
}
