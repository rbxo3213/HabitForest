"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export function HeaderNav() {
  const [myVillageHref, setMyVillageHref] = useState("/dashboard");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user?.uid) {
        setMyVillageHref(`/village/${user.uid}`);
      } else {
        setMyVillageHref("/dashboard");
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <nav className="flex gap-6 font-medium">
      <Link
        href="/dashboard"
        className="hover:text-black text-gray-600 transition-colors"
      >
        홈
      </Link>
      <Link
        href="/timer"
        className="hover:text-black text-gray-600 transition-colors"
      >
        타이머
      </Link>
      <Link
        href={myVillageHref}
        className="hover:text-black text-gray-600 transition-colors"
      >
        내 마을
      </Link>
    </nav>
  );
}
