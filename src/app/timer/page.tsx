"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Play, Pause, Square, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function FocusTimer() {
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

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    if (h > 0) {
      return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleStop = () => {
    setIsRunning(false);
    if (timeElapsed > 0) {
      // Navigate to verification screen with time
      router.push(`/timer/verify?time=${timeElapsed}`);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-full bg-gray-900 text-white flex flex-col p-6 pb-20">
      <header className="flex items-center justify-between py-4">
        <Link href="/dashboard" className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors">
          <ChevronLeft size={28} />
        </Link>
        <div className="text-sm font-medium text-gray-400">포커스 모드</div>
        <div className="w-8 h-8"></div> {/* Placeholder for balance */}
      </header>

      <main className="flex-1 flex flex-col items-center justify-center -mt-10">
        <motion.div
          animate={{ scale: isRunning ? 1.05 : 1 }}
          transition={{ duration: 1, repeat: isRunning ? Infinity : 0, repeatType: "reverse", ease: "easeInOut" }}
          className="relative w-64 h-64 rounded-full border-4 border-gray-800 flex items-center justify-center mb-12 shadow-[0_0_40px_rgba(0,0,0,0.5)]"
        >
          {/* Progress Ring (Mock) */}
          <svg className="absolute inset-0 w-full h-full transform -rotate-90">
            <circle
              cx="128"
              cy="128"
              r="124"
              stroke="currentColor"
              strokeWidth="4"
              fill="transparent"
              className="text-white/10"
            />
            {isRunning && (
              <circle
                cx="128"
                cy="128"
                r="124"
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray="780"
                strokeDashoffset={780 - (timeElapsed % 60) * (780 / 60)}
                className="text-blue-500 transition-all duration-1000 ease-linear"
              />
            )}
          </svg>
          
          <div className="text-6xl font-light tracking-tighter tabular-nums z-10">
            {formatTime(timeElapsed)}
          </div>
        </motion.div>

        <div className="text-center space-y-2 mb-16">
          <h2 className="text-xl font-medium break-keep">{isRunning ? "딥 워크 진행 중..." : "집중할 준비가 되셨나요?"}</h2>
          <p className="text-gray-400 text-sm break-keep">
            {isRunning ? "휴대폰을 내려놓고 목표에 집중하세요." : "타이머를 시작하고 마을 포인트를 모아보세요."}
          </p>
        </div>

        <div className="flex items-center gap-6">
          {isRunning ? (
            <>
              <button
                onClick={() => setIsRunning(false)}
                className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center text-white hover:bg-gray-700 transition-colors"
                aria-label="일시정지"
              >
                <Pause size={24} fill="currentColor" />
              </button>
              <button
                onClick={handleStop}
                className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                aria-label="정지"
              >
                <Square size={24} fill="currentColor" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsRunning(true)}
              className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition-transform active:scale-95 shadow-lg shadow-blue-500/30"
              aria-label="시작"
            >
              <Play size={32} fill="currentColor" className="ml-1" />
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
