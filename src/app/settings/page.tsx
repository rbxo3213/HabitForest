"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import {
  ChevronLeft,
  Sparkles,
  Gamepad2,
  TreePine,
  Pickaxe,
  LogOut,
  User,
  Bell,
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useEffect, useState } from "react";

type ThemeOption = {
  id: "minimal" | "pixel" | "animal-crossing" | "craft";
  label: string;
  icon: React.ReactNode;
  preview: string;
};

const THEME_OPTIONS: ThemeOption[] = [
  {
    id: "minimal",
    label: "미니멀",
    icon: <Sparkles size={18} />,
    preview: "bg-white border-gray-200",
  },
  {
    id: "animal-crossing",
    label: "동물의 숲",
    icon: <TreePine size={18} />,
    preview: "bg-[#c8e6a0] border-[#8bc34a]",
  },
  {
    id: "pixel",
    label: "8비트",
    icon: <Gamepad2 size={18} />,
    preview: "bg-gray-900 border-gray-600",
  },
  {
    id: "craft",
    label: "크래프트",
    icon: <Pickaxe size={18} />,
    preview: "bg-[#5d4037] border-[#8d6e63]",
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userNickname, setUserNickname] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email);
        setUserNickname(user.displayName || null);
      }
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  return (
    <div className="min-h-full bg-gray-50 flex flex-col">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-100 px-4 pt-14 pb-4 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-bold tracking-tight">설정</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 pb-28">
        {/* 프로필 카드 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-14 h-14 bg-pink-400 rounded-full flex items-center justify-center shadow-inner">
            <User size={24} className="text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">
              {userNickname || "사용자"}
            </p>
            <p className="text-sm text-gray-400">
              {userEmail || "로그인 필요"}
            </p>
          </div>
        </div>

        {/* 테마 선택 */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
            테마 선택
          </h2>
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 divide-y divide-gray-50">
            {THEME_OPTIONS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className="w-full px-4 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors active:bg-gray-100"
              >
                {/* 컬러 프리뷰 */}
                <div
                  className={`w-10 h-10 rounded-xl border-2 ${t.preview} flex-shrink-0 shadow-sm`}
                />
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {t.icon}
                  <span className="font-medium text-gray-900">{t.label}</span>
                </div>
                {/* 체크 */}
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    theme === t.id ? "border-black bg-black" : "border-gray-200"
                  }`}
                >
                  {theme === t.id && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path
                        d="M1 4l2.5 3L9 1"
                        stroke="white"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* 알림 (추후 구현) */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
            알림
          </h2>
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            <div className="px-4 py-4 flex items-center gap-3">
              <Bell size={20} className="text-gray-400" />
              <span className="font-medium text-gray-900 flex-1">
                푸시 알림
              </span>
              <span className="text-xs text-gray-400">준비 중</span>
            </div>
          </div>
        </section>

        {/* 앱 정보 */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
            앱 정보
          </h2>
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 divide-y divide-gray-50">
            <div className="px-4 py-4 flex items-center justify-between">
              <span className="font-medium text-gray-900">버전</span>
              <span className="text-sm text-gray-400">0.1.0 (프로토타입)</span>
            </div>
            <div className="px-4 py-4 flex items-center justify-between">
              <span className="font-medium text-gray-900">개발자</span>
              <span className="text-sm text-gray-400">HabitForest Team</span>
            </div>
          </div>
        </section>

        {/* 로그아웃 */}
        <button
          onClick={handleLogout}
          className="w-full bg-white border border-red-100 text-red-500 rounded-2xl py-4 font-semibold flex items-center justify-center gap-2 hover:bg-red-50 transition-colors active:scale-95 shadow-sm"
        >
          <LogOut size={18} />
          로그아웃
        </button>
      </div>
    </div>
  );
}
