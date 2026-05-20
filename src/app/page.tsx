"use client";

import Link from 'next/link';
import { useTheme } from '@/components/ThemeProvider';
import { Sparkles, Gamepad2, TreePine, Pickaxe } from 'lucide-react';

export default function Home() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-full bg-white flex flex-col items-center justify-center p-6 transition-colors duration-300">
      <main className="flex flex-col items-center text-center w-full">
        {/* Abstract Logo / Icon */}
        <div className="w-24 h-24 bg-black rounded-3xl mb-8 flex items-center justify-center shadow-lg transition-all duration-300">
          <svg
            className="w-12 h-12 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-4 transition-all duration-300">
          해빗 빌리지
        </h1>
        <p className="text-lg text-gray-500 mb-10 transition-colors duration-300 break-keep">
          친구들과 함께 매일의 목표를 인증하고,<br/>나만의 다채로운 마을을 키워보세요
        </p>

        {/* Theme Selection */}
        <div className="w-full flex flex-col gap-3 mb-8">
          <div className="flex gap-3">
            <button
              onClick={() => setTheme('minimal')}
              className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-medium transition-all duration-200 ${
                theme === 'minimal' 
                  ? 'bg-black shadow-sm text-white border border-black' 
                  : 'bg-gray-50 text-gray-500 hover:text-black border border-transparent'
              }`}
            >
              <Sparkles size={18} />
              미니멀
            </button>
            <button
              onClick={() => setTheme('animal-crossing')}
              className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-medium transition-all duration-200 ${
                theme === 'animal-crossing' 
                  ? 'bg-[#aed581] shadow-sm text-black border-2 border-black' 
                  : 'bg-gray-50 text-gray-500 hover:text-black border-2 border-transparent'
              }`}
            >
              <TreePine size={18} />
              동물의 숲
            </button>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setTheme('pixel')}
              className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-medium transition-all duration-200 ${
                theme === 'pixel' 
                  ? 'bg-white shadow-[4px_4px_0_0_#000] text-black border-2 border-black' 
                  : 'bg-gray-50 text-gray-500 hover:text-black border-2 border-transparent'
              }`}
            >
              <Gamepad2 size={18} />
              8비트
            </button>
            <button
              onClick={() => setTheme('terraria')}
              className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-medium transition-all duration-200 ${
                theme === 'terraria' 
                  ? 'bg-[#5d4037] shadow-[4px_4px_0_0_#3e2723] text-white border-2 border-[#8d6e63]' 
                  : 'bg-gray-50 text-gray-500 hover:text-black border-2 border-transparent'
              }`}
            >
              <Pickaxe size={18} />
              테라리아
            </button>
          </div>
        </div>

        <Link
          href="/login"
          className="w-full bg-black text-white rounded-full px-12 py-4 font-medium text-lg hover:bg-gray-800 transition-all active:scale-95 shadow-md block"
        >
          시작하기
        </Link>
      </main>
    </div>
  );
}
