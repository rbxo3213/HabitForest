"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Timer, Map, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";

export function BottomNav() {
  const pathname = usePathname();
  const [myVillageHref, setMyVillageHref] = useState("/village/me");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged?.((user: any) => {
      if (user?.uid) {
        setMyVillageHref(`/village/${user.uid}`);
      }
    });
    return () => unsubscribe?.();
  }, []);

  const NAV_ITEMS = [
    { label: "홈", href: "/dashboard", icon: Home },
    { label: "타이머", href: "/timer", icon: Timer },
    { label: "내 마을", href: myVillageHref, icon: Map },
    { label: "설정", href: "/settings", icon: Settings },
  ];

  if (
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/onboarding") ||
    pathname.includes("/verify")
  ) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 w-full bg-white/90 backdrop-blur-md border-t border-gray-200 flex justify-around items-center pb-safe pt-2 px-2 z-50" style={{ paddingBottom: "env(safe-area-inset-bottom, 8px)" }}>
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : item.href.startsWith("/village")
            ? pathname.startsWith("/village")
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all ${
              isActive ? "text-black font-semibold" : "text-gray-400 hover:text-gray-600 font-medium"
            }`}
          >
            <item.icon size={24} className={`mb-1 ${isActive ? "fill-black stroke-none" : ""}`} />
            <span className="text-[10px]">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
