"use client";

import { useEffect, useRef } from "react";
import { playNewOrderNotification } from "@/lib/play-order-notification";

type Order = { id: string; siteId: string };

export function PaidOrderNotifier() {
  const seenRef = useRef<Set<string>>(new Set());
  const readyRef = useRef(false);

  useEffect(() => {
    async function poll(notify: boolean) {
      try {
        const res = await fetch("/api/orders", { credentials: "include" });
        if (!res.ok) return;
        const data = (await res.json()) as { orders?: Order[] };
        const orders = data.orders ?? [];

        if (!readyRef.current) {
          for (const o of orders) {
            seenRef.current.add(`${o.siteId}:${o.id}`);
          }
          readyRef.current = true;
          return;
        }

        if (!notify) return;

        let hasNew = false;
        for (const o of orders) {
          const key = `${o.siteId}:${o.id}`;
          if (!seenRef.current.has(key)) {
            seenRef.current.add(key);
            hasNew = true;
          }
        }
        if (hasNew) {
          playNewOrderNotification();
          window.dispatchEvent(new CustomEvent("mcp:orders-updated"));
        }
      } catch {
        /* ignore network blips */
      }
    }

    void poll(false);
    const id = window.setInterval(() => void poll(true), 15000);
    return () => window.clearInterval(id);
  }, []);

  return null;
}
