"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, User } from "lucide-react";

const AVATAR_COLORS = [
  "bg-red-400", "bg-blue-400", "bg-green-400", "bg-yellow-400", "bg-purple-400", "bg-pink-400"
];

export default function OnboardingProfile() {
  const [nickname, setNickname] = useState("");
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0]);
  const router = useRouter();

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname) return;
    
    // TODO: Save nickname and avatar choice to Firestore
    
    router.push("/onboarding/group");
  };

  return (
    <div className="min-h-full bg-white flex flex-col items-center justify-center p-6">
      <div className="w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
            프로필 설정
          </h1>
          <p className="text-gray-500">
            마을 주민들이 당신을 뭐라고 부르면 좋을까요?
          </p>
        </div>

        <form onSubmit={handleNext} className="space-y-8">
          <div className="flex flex-col items-center space-y-6">
            <div className={`w-32 h-32 rounded-full flex items-center justify-center shadow-inner ${selectedColor} transition-colors duration-300`}>
              <User size={48} className="text-white opacity-80" />
            </div>

            <div className="flex gap-3">
              {AVATAR_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-full ${color} ${
                    selectedColor === color ? "ring-2 ring-offset-2 ring-black scale-110" : ""
                  } transition-all`}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">닉네임</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              required
              maxLength={12}
              className="w-full text-center text-xl font-medium px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black transition-all"
              placeholder="당신의 이름"
            />
          </div>

          <button
            type="submit"
            disabled={!nickname}
            className="w-full bg-black text-white rounded-2xl py-4 font-medium hover:bg-gray-800 disabled:opacity-50 disabled:hover:bg-black transition-all flex items-center justify-center gap-2"
          >
            계속하기 <ChevronRight size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
