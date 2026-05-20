"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Timer, CheckCircle, Image as ImageIcon, Loader2 } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

export default function Dashboard() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // Wait for auth to initialize
    const unsubscribe = auth.onAuthStateChanged(async (user: any) => {
      if (user) {
        setCurrentUser(user);
        
        try {
          // For demo, just fetch all users in 'test-group-1'
          const q = query(collection(db, "users"), where("groupId", "==", "test-group-1"));
          const querySnapshot = await getDocs(q);
          const loadedMembers: any[] = [];
          
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            loadedMembers.push({
              id: data.uid,
              name: data.nickname || data.email.split("@")[0],
              color: data.themeColor || "bg-gray-400",
              // Mocking task status for the UI demo
              taskStatus: data.uid === user.uid ? "In Progress" : "Completed",
              focusedTime: "1시간 30분",
              hasPhoto: data.uid !== user.uid,
            });
          });

          setMembers(loadedMembers);
        } catch (error) {
          console.error("Failed to load members:", error);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50 flex flex-col p-6 relative">
      <header className="flex justify-between items-center py-6 mb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">우리의 마을</h1>
          <p className="text-sm text-gray-500 font-medium">오늘의 목표 현황</p>
        </div>
        <div className="w-12 h-12 bg-gray-200 rounded-full border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
          {currentUser && <div className="w-full h-full bg-pink-400" />}
        </div>
      </header>

      {/* 2x2 Grid */}
      <div className="flex-1 grid grid-cols-2 gap-4 auto-rows-fr pb-32">
        {members.length === 0 ? (
          <div className="col-span-2 text-center py-20 text-gray-400">
            마을에 참여한 주민이 없습니다.<br/>(테스트 환경: /seed 페이지에서 유저를 생성하세요)
          </div>
        ) : (
          members.map((member, index) => (
            <Link href={`/village/${member.id}`} key={member.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, ease: "easeOut" }}
                className="h-full bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow active:scale-95"
              >
                {/* Card Header: Avatar & Name */}
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${member.color} shadow-inner flex-shrink-0 border-2 border-white`} />
                  <h3 className="font-semibold text-gray-900 truncate">{member.name}</h3>
                </div>

                {/* Card Body: Stats */}
                <div className="space-y-3 mt-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Timer size={16} className="text-blue-500" />
                    <span className="font-medium">{member.focusedTime}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    {member.taskStatus === "Completed" ? (
                      <>
                        <CheckCircle size={16} className="text-green-500" />
                        <span className="text-green-600 font-medium text-xs">완료됨</span>
                      </>
                    ) : member.taskStatus === "In Progress" ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-yellow-500 border-t-transparent animate-spin" />
                        <span className="text-yellow-600 font-medium text-xs">진행 중</span>
                      </>
                    ) : (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                        <span className="text-gray-500 font-medium text-xs">대기 중</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Card Footer: Photo Verification Preview */}
                <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-center">
                  {member.hasPhoto ? (
                    <div className="w-full h-20 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden relative">
                      <div className="absolute inset-0 bg-gradient-to-tr from-blue-100 to-green-100 opacity-50"></div>
                      <ImageIcon size={24} className="text-gray-400 z-10" />
                      <span className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full z-10">인증됨</span>
                    </div>
                  ) : (
                    <div className="w-full h-20 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50/50">
                      <span className="text-xs text-gray-400 font-medium">사진 없음</span>
                    </div>
                  )}
                </div>
              </motion.div>
            </Link>
          ))
        )}
      </div>

      {/* Floating Action Button for own task */}
      <div className="fixed md:absolute bottom-[80px] left-0 right-0 flex justify-center px-6 pointer-events-none z-10">
        <Link href="/timer" className="pointer-events-auto w-full max-w-[calc(28rem-3rem)] bg-black text-white rounded-full py-4 font-semibold text-lg shadow-xl shadow-black/20 flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors active:scale-95">
          <Timer size={22} />
          포커스 타이머 시작
        </Link>
      </div>
    </div>
  );
}
