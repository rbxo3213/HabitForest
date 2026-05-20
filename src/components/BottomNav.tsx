"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Timer, Map, Settings } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  const NAV_ITEMS = [
    { label: "홈", href: "/dashboard", icon: Home },
    { label: "타이머", href: "/timer", icon: Timer },
    { label: "내 마을", href: "/village/me", icon: Map },
    { label: "설정", href: "/settings", icon: Settings },
  ];

  // Hide BottomNav on certain pages (like onboarding, timer active)
  if (
    pathname === "/" || 
    pathname.startsWith("/login") || 
    pathname.startsWith("/onboarding") ||
    pathname.includes("/verify") // Hide during verification
  ) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 w-full max-w-md bg-white/90 backdrop-blur-md border-t border-gray-200 flex justify-around items-center pb-safe pt-2 px-2 z-50">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname.startsWith(item.href) && (item.href !== "/timer" || pathname === "/timer"); // basic logic
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all ${
              isActive ? "text-black font-semibold" : "text-gray-400 hover:text-gray-600 font-medium"
            }`}
          >
            <item.icon size={24} className={`mb-1 ${isActive ? "fill-black" : ""}`} />
            <span className="text-[10px]">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
