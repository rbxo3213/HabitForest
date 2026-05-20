"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Timer, CheckCircle, Image as ImageIcon, Loader2, Settings } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";

export default function Dashboard() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [groupName, setGroupName] = useState("우리의 마을");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user: any) => {
      if (!user) {
        setLoading(false);
        return;
      }
      setCurrentUser(user);

      try {
        // 1. 현재 유저 doc에서 groupId 가져오기
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) {
          setLoading(false);
          return;
        }
        const userData = userDoc.data();
        const groupId = userData.groupId;

        if (!groupId) {
          setLoading(false);
          return;
        }

        // 2. 그룹 이름 가져오기
        const groupDoc = await getDoc(doc(db, "groups", groupId));
        if (groupDoc.exists()) {
          setGroupName(groupDoc.data().name || "우리의 마을");
        }

        // 3. 같은 groupId를 가진 유저 전체 조회
        const q = query(collection(db, "users"), where("groupId", "==", groupId));
        const snapshot = await getDocs(q);

        const loadedMembers: any[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          loadedMembers.push({
            id: data.uid,
            name: data.nickname || data.email?.split("@")[0] || "알 수 없음",
            color: data.themeColor || "bg-gray-400",
            isMe: data.uid === user.uid,
            taskStatus: data.uid === user.uid ? "in_progress" : "completed",
            focusedTime: "0분",
            hasPhoto: data.uid !== user.uid,
          });
        });

        // 본인이 목록에 없으면 추가 (Firestore 쿼리 누락 방어)
        const alreadyIncludesMe = loadedMembers.some((m) => m.id === user.uid);
        if (!alreadyIncludesMe) {
          loadedMembers.unshift({
            id: user.uid,
            name: userData.nickname || user.email?.split("@")[0] || "나",
            color: userData.themeColor || "bg-gray-400",
            isMe: true,
            taskStatus: "in_progress",
            focusedTime: "0분",
            hasPhoto: false,
          });
        }

        // 본인을 맨 앞으로
        loadedMembers.sort((a, b) => (b.isMe ? 1 : 0) - (a.isMe ? 1 : 0));

        setMembers(loadedMembers);
      } catch (error) {
        console.error("멤버 로드 실패:", error);
      } finally {
        setLoading(false);
      }
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

  const statusLabel = (status: string) => {
    if (status === "completed") return { text: "완료됨", color: "text-green-600", icon: <CheckCircle size={14} className="text-green-500" /> };
    if (status === "in_progress") return { text: "진행 중", color: "text-yellow-600", icon: <div className="w-3.5 h-3.5 rounded-full border-2 border-yellow-400 border-t-transparent animate-spin" /> };
    return { text: "대기 중", color: "text-gray-400", icon: <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300" /> };
  };

  return (
    <div className="min-h-full bg-gray-50 flex flex-col p-4 relative">
      <header className="flex justify-between items-center pt-4 pb-3 mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{groupName}</h1>
          <p className="text-xs text-gray-400 font-medium mt-0.5">오늘의 목표 현황</p>
        </div>
        <Link href="/settings" className="w-10 h-10 bg-white rounded-full border border-gray-100 shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors">
          <Settings size={18} className="text-gray-500" />
        </Link>
      </header>

      {/* 2x2 Grid */}
      <div className="flex-1 grid grid-cols-2 gap-3 pb-28" style={{ gridAutoRows: "1fr" }}>
        {members.length === 0 ? (
          <div className="col-span-2 flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
            <p className="text-sm text-center break-keep">
              그룹 데이터가 없습니다.<br />
              <Link href="/seed" className="text-blue-500 underline">/seed 페이지</Link>에서 테스트 유저를 생성하세요.
            </p>
          </div>
        ) : (
          members.slice(0, 4).map((member, index) => {
            const s = statusLabel(member.taskStatus);
            return (
              <Link href={`/village/${member.id}`} key={member.id}>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08, ease: "easeOut" }}
                  className={`h-full bg-white rounded-3xl p-4 shadow-sm border flex flex-col justify-between hover:shadow-md transition-shadow active:scale-95 ${
                    member.isMe ? "border-black/10 ring-2 ring-black/5" : "border-gray-100"
                  }`}
                >
                  {/* 헤더: 아바타 + 이름 */}
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-full ${member.color} shadow-inner flex-shrink-0 border-2 border-white flex items-center justify-center`}>
                      {member.isMe && <span className="text-white text-[8px] font-bold">나</span>}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate text-sm leading-tight">{member.name}</h3>
                      {member.isMe && <span className="text-[10px] text-gray-400">내 캐릭터</span>}
                    </div>
                  </div>

                  {/* 상태 */}
                  <div className="flex items-center gap-1.5 mt-3">
                    {s.icon}
                    <span className={`text-xs font-medium ${s.color}`}>{s.text}</span>
                  </div>

                  {/* 사진 영역 */}
                  <div className="mt-3 pt-3 border-t border-gray-50">
                    {member.hasPhoto ? (
                      <div className="w-full h-16 rounded-xl bg-gradient-to-tr from-blue-50 to-green-50 flex items-center justify-center relative">
                        <ImageIcon size={20} className="text-gray-300" />
                        <span className="absolute bottom-1.5 right-2 bg-black/40 text-white text-[9px] px-1.5 py-0.5 rounded-full">인증됨</span>
                      </div>
                    ) : (
                      <div className="w-full h-16 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50/50">
                        <span className="text-[10px] text-gray-300">미인증</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              </Link>
            );
          })
        )}
      </div>

      {/* 포커스 타이머 FAB */}
      <div className="fixed bottom-[68px] left-0 right-0 px-4 flex justify-center z-10 pointer-events-none">
        <Link
          href="/timer"
          className="pointer-events-auto w-full max-w-sm bg-black text-white rounded-full py-3.5 font-semibold text-base shadow-xl shadow-black/20 flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors active:scale-95"
        >
          <Timer size={20} />
          포커스 타이머 시작
        </Link>
      </div>
    </div>
  );
}
