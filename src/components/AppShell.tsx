"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  LogOut,
  Store,
  User,
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { PaidOrderNotifier } from "@/components/PaidOrderNotifier";
import { useEffect, useState } from "react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/restaurants", label: "Restaurants", icon: Store },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState("");

  useEffect(() => {
    void fetch("/api/account", { credentials: "include" })
      .then((r) => r.json())
      .then((d: { email?: string }) => setEmail(d.email ?? ""))
      .catch(() => undefined);
  }, []);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.replace("/login");
  }

  return (
    <div className="flex min-h-screen">
      <PaidOrderNotifier />
      <aside className="flex w-56 flex-col bg-[var(--mo-sidebar)] text-white">
        <div className="p-5">
          <BrandLogo />
        </div>
        <nav className="mt-4 flex-1 space-y-1 px-3">
          {nav.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${
                  active
                    ? "bg-[var(--mo-sidebar-hover)] font-medium"
                    : "text-white/80 hover:bg-white/10"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-3">
          <Link
            href="/account"
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${
              pathname === "/account"
                ? "bg-[var(--mo-sidebar-hover)] font-medium"
                : "text-white/80 hover:bg-white/10"
            }`}
          >
            <User className="h-4 w-4" />
            My Account
          </Link>
          {email ? (
            <p className="mt-2 truncate px-3 text-xs text-white/45">{email}</p>
          ) : null}
          <button
            type="button"
            onClick={() => void signOut()}
            className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>
      <div className="min-w-0 flex-1 overflow-auto">{children}</div>
    </div>
  );
}
