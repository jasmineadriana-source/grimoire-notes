import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useApp } from "@/lib/store";
import { Notebook } from "@/lib/types";
import { toast } from "sonner";

/**
 * Mounts inside the app. When the user is signed in:
 *   1. Pulls all cloud notebooks.
 *   2. Migrates any local-only notebooks up to the cloud (first sign-in).
 *   3. Replaces local store with the merged set (cloud wins on conflicts).
 *   4. Subscribes to local notebook changes and pushes upserts/deletes.
 * On sign-out: clears the local notebook list so the next user starts clean.
 */
export function CloudSync() {
  const { user, loading } = useAuth();
  const userId = user?.id ?? null;

  const lastUserId = useRef<string | null>(null);
  const ready = useRef(false);
  const lastSnapshot = useRef<Map<string, string>>(new Map()); // id -> JSON
  const pushTimer = useRef<number | null>(null);

  // ---------- Initial pull / migration on auth change ----------
  useEffect(() => {
    if (loading) return;

    // Sign-out: wipe local notebooks and reset.
    if (!userId) {
      if (lastUserId.current) {
        useApp.getState().setNotebooks([]);
        useApp.getState().setActiveNotebook(null);
      }
      lastUserId.current = null;
      ready.current = false;
      lastSnapshot.current = new Map();
      return;
    }

    // Same user already synced — skip.
    if (lastUserId.current === userId) return;
    lastUserId.current = userId;
    ready.current = false;

    (async () => {
      try {
        const { data: rows, error } = await supabase
          .from("notebooks")
          .select("client_id, data")
          .eq("user_id", userId);
        if (error) throw error;

        const cloud: Notebook[] = (rows ?? []).map((r) => r.data as unknown as Notebook);
        const cloudIds = new Set(cloud.map((n) => n.id));
        const local = useApp.getState().notebooks;
        const localOnly = local.filter((n) => !cloudIds.has(n.id));

        // Migrate local-only notebooks up
        if (localOnly.length > 0) {
          const payload = localOnly.map((n) => ({
            user_id: userId,
            client_id: n.id,
            name: n.name,
            theme: n.theme,
            data: n as unknown as Record<string, unknown>,
          }));
          const { error: upErr } = await supabase
            .from("notebooks")
            .upsert(payload, { onConflict: "user_id,client_id" });
          if (upErr) throw upErr;
          toast.success(
            `Synced ${localOnly.length} local notebook${localOnly.length === 1 ? "" : "s"} to your account`,
          );
        }

        const merged = [...cloud, ...localOnly];
        // Build snapshot so we don't immediately re-push everything
        const snap = new Map<string, string>();
        merged.forEach((n) => snap.set(n.id, JSON.stringify(n)));
        lastSnapshot.current = snap;

        useApp.getState().setNotebooks(merged);
        ready.current = true;
      } catch (err) {
        console.error("Cloud sync failed:", err);
        toast.error("Couldn't load your notebooks from the cloud");
      }
    })();
  }, [userId, loading]);

  // ---------- Push local changes up ----------
  useEffect(() => {
    if (!userId) return;

    const flush = async () => {
      if (!ready.current || !lastUserId.current) return;
      const current = useApp.getState().notebooks;
      const prev = lastSnapshot.current;
      const next = new Map<string, string>();
      const toUpsert: Notebook[] = [];

      for (const nb of current) {
        const json = JSON.stringify(nb);
        next.set(nb.id, json);
        if (prev.get(nb.id) !== json) toUpsert.push(nb);
      }
      const toDelete: string[] = [];
      for (const id of prev.keys()) if (!next.has(id)) toDelete.push(id);

      if (toUpsert.length === 0 && toDelete.length === 0) return;

      try {
        if (toUpsert.length > 0) {
          const payload = toUpsert.map((n) => ({
            user_id: userId,
            client_id: n.id,
            name: n.name,
            theme: n.theme,
            data: n as unknown as Record<string, unknown>,
          }));
          const { error } = await supabase
            .from("notebooks")
            .upsert(payload, { onConflict: "user_id,client_id" });
          if (error) throw error;
        }
        if (toDelete.length > 0) {
          const { error } = await supabase
            .from("notebooks")
            .delete()
            .eq("user_id", userId)
            .in("client_id", toDelete);
          if (error) throw error;
        }
        lastSnapshot.current = next;
      } catch (err) {
        console.error("Cloud push failed:", err);
      }
    };

    const unsub = useApp.subscribe((state, prev) => {
      if (state.notebooks === prev.notebooks) return;
      if (pushTimer.current) window.clearTimeout(pushTimer.current);
      pushTimer.current = window.setTimeout(flush, 800);
    });

    return () => {
      unsub();
      if (pushTimer.current) window.clearTimeout(pushTimer.current);
    };
  }, [userId]);

  return null;
}