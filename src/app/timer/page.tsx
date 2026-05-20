"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Play, Pause, Square, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { auth, db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

const CATEGORIES = [
  { id: "workout", name: "헬스/운동", emoji: "🏋️", color: "bg-orange-500" },
  { id: "study", name: "공부/독서", emoji: "📚", color: "bg-blue-500" },
  { id: "shower", name: "샤워/씻기", emoji: "🚿", color: "bg-teal-500" },
  { id: "housework", name: "집안일", emoji: "🧹", color: "bg-amber-500" },
];

export default function FocusTimer() {
  const [currentCategory, setCurrentCategory] = useState(CATEGORIES[0].id);
  const [isRunning, setIsRunning] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const router = useRouter();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  // 타이머 작동 시 유저 도큐먼트에 실시간 상태(currentActivity) 반영 (마을 화면 연동용)
  useEffect(() => {
    const updateActivity = async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        await updateDoc(doc(db, "users", user.uid), {
          currentActivity: isRunning ? currentCategory : "idle",
        });
      } catch (e) {
        console.error("활동 상태 업데이트 실패:", e);
      }
    };
    updateActivity();
  }, [isRunning, currentCategory]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleStop = async () => {
    setIsRunning(false);
    const user = auth.currentUser;
    if (user) {
      try {
        await updateDoc(doc(db, "users", user.uid), {
          currentActivity: "idle",
        });
      } catch (e) {
        console.error(e);
      }
    }
    if (timeElapsed > 0) {
      router.push(
        `/timer/verify?time=${timeElapsed}&category=${currentCategory}`,
      );
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-[#efe5d0] via-[#d8b39a] to-[#3b2a1f] text-slate-900 flex flex-col p-4 pb-12">
      <header className="flex items-center justify-between py-2">
        <Link
          href="/dashboard"
          className="p-2 text-[#3b2a1f] hover:text-black transition-colors"
        >
          <ChevronLeft size={24} />
        </Link>
        <div className="text-sm font-bold tracking-wide text-[#3b2a1f]">
          포커스 모드
        </div>
        <div className="w-8"></div>
      </header>

      {/* 카테고리 셀렉터 (타이머가 멈춰있을 때만 변경 가능) */}
      {!isRunning && (
        <div className="mt-4 grid grid-cols-4 gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCurrentCategory(cat.id)}
              className={`p-3 rounded-[28px] flex flex-col items-center justify-center gap-1 transition-all border ${
                currentCategory === cat.id
                  ? `border-[#8c5a32] bg-[#8c5a32] text-white scale-105 font-bold`
                  : "border-[#d8b39a] bg-[#fff4e6] text-[#5d4324] hover:border-[#8c5a32]"
              }`}
            >
              <span className="text-xl">{cat.emoji}</span>
              <span className="text-[10px] whitespace-nowrap">{cat.name}</span>
            </button>
          ))}
        </div>
      )}

      <main className="flex-1 flex flex-col items-center justify-center my-8">
        <motion.div
          animate={{ scale: isRunning ? [1, 1.03, 1] : 1 }}
          transition={{ duration: 2, repeat: isRunning ? Infinity : 0 }}
          className="relative w-64 h-64 rounded-full border-8 border-[#8c5a32] flex items-center justify-center mb-8 shadow-[0_24px_60px_rgba(0,0,0,0.18)] bg-[#f7e7d4]"
        >
          <div className="text-5xl font-mono tracking-tight tabular-nums z-10 text-[#3b2a1f]">
            {formatTime(timeElapsed)}
          </div>
        </motion.div>

        <div className="text-center space-y-2 max-w-xs mb-10">
          <h2 className="text-2xl font-bold text-[#3b2a1f]">
            {isRunning
              ? `${CATEGORIES.find((c) => c.id === currentCategory)?.name} 진행 중...`
              : "집중을 시작할까요?"}
          </h2>
          <p className="text-sm text-[#5d4324] leading-relaxed">
            따뜻한 크래프트 감성으로 집중 시간을 기록하고 마을에 보상을
            쌓아보세요.
          </p>
        </div>

        {/* 컨트롤러 */}
        <div className="flex items-center gap-6">
          {isRunning ? (
            <>
              <button
                onClick={() => setIsRunning(false)}
                className="w-14 h-14 bg-[#3b2a1f] rounded-full flex items-center justify-center text-white hover:bg-[#2f2318] shadow-xl"
              >
                <Pause size={20} />
              </button>
              <button
                onClick={handleStop}
                className="w-14 h-14 bg-[#8c5a32] rounded-full flex items-center justify-center text-white hover:bg-[#7c4d2b] shadow-xl"
              >
                <Square size={20} fill="currentColor" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsRunning(true)}
              className="w-18 h-18 bg-[#8c5a32] rounded-full flex items-center justify-center text-white shadow-[0_16px_40px_rgba(79,53,26,0.3)] hover:bg-[#7c4d2b] active:scale-95"
            >
              <Play size={28} fill="currentColor" className="ml-1" />
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
