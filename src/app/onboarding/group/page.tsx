"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Link as LinkIcon, Check } from "lucide-react";

export default function GroupSetup() {
  const [isJoining, setIsJoining] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const router = useRouter();

  const handleCreateGroup = () => {
    // TODO: Create a group in Firestore, generate an invite code, and link user to it
    // For now, mock navigation
    router.push("/dashboard");
  };

  const handleJoinGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode) return;
    
    // TODO: Verify code in Firestore, join group
    router.push("/dashboard");
  };

  return (
    <div className="min-h-full bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
            마을 구성하기
          </h1>
          <p className="text-gray-500">
            마을은 최대 4명까지만 입장할 수 있습니다.
          </p>
        </div>

        <div className="space-y-4">
          {!isJoining ? (
            <>
              <button
                onClick={handleCreateGroup}
                className="w-full bg-white border border-gray-200 rounded-2xl p-6 text-left hover:border-black hover:shadow-md transition-all group flex items-start gap-4"
              >
                <div className="bg-blue-100 p-3 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Users size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">새 마을 만들기</h3>
                  <p className="text-sm text-gray-500 mt-1 break-keep">아무도 없는 곳에서 새롭게 시작하고 최대 3명의 친구를 초대하세요.</p>
                </div>
              </button>

              <button
                onClick={() => setIsJoining(true)}
                className="w-full bg-white border border-gray-200 rounded-2xl p-6 text-left hover:border-black hover:shadow-md transition-all group flex items-start gap-4"
              >
                <div className="bg-green-100 p-3 rounded-xl text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                  <LinkIcon size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">기존 마을 참여하기</h3>
                  <p className="text-sm text-gray-500 mt-1 break-keep">초대 코드가 있으신가요? 코드를 입력하고 친구들의 마을에 합류하세요.</p>
                </div>
              </button>
            </>
          ) : (
            <div className="bg-white border border-gray-200 rounded-3xl p-8 space-y-6 shadow-sm">
              <h3 className="font-semibold text-xl text-center text-gray-900">초대 코드 입력</h3>
              <form onSubmit={handleJoinGroup} className="space-y-4">
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="예: A1B2C3"
                  className="w-full text-center text-2xl tracking-widest uppercase px-4 py-4 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black transition-all"
                  maxLength={6}
                />
                <button
                  type="submit"
                  disabled={inviteCode.length < 6}
                  className="w-full bg-black text-white rounded-xl py-3 font-medium hover:bg-gray-800 disabled:opacity-50 disabled:hover:bg-black transition-colors flex items-center justify-center gap-2"
                >
                  <Check size={18} /> 마을 합류하기
                </button>
                <button
                  type="button"
                  onClick={() => setIsJoining(false)}
                  className="w-full py-2 text-sm text-gray-500 hover:text-black font-medium transition-colors"
                >
                  취소
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
