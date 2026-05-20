"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Timer,
  CheckCircle,
  Image as ImageIcon,
  Loader2,
  Settings,
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  runTransaction,
  updateDoc,
  deleteField,
} from "firebase/firestore";

export default function Dashboard() {
  const [members, setMembers] = useState<
    Array<{
      id: string;
      name: string;
      color: string;
      isMe: boolean;
      taskStatus: string;
      focusedTime: string;
      hasPhoto: boolean;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [groupName, setGroupName] = useState("우리의 마을");
  const [groupId, setGroupId] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

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
          setGroupId(null);
          setInviteCode(null);
          setLoading(false);
          return;
        }

        setGroupId(groupId);
        setInviteCode(groupId);

        // 2. 그룹 이름 가져오기
        const groupDoc = await getDoc(doc(db, "groups", groupId));
        if (groupDoc.exists()) {
          setGroupName(groupDoc.data().name || "우리의 마을");
        }

        // 3. 같은 groupId를 가진 유저 전체 조회
        const q = query(
          collection(db, "users"),
          where("groupId", "==", groupId),
        );
        const snapshot = await getDocs(q);

        const loadedMembers: Array<{
          id: string;
          name: string;
          color: string;
          isMe: boolean;
          taskStatus: string;
          focusedTime: string;
          hasPhoto: boolean;
        }> = [];
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

  const copyInviteCode = async () => {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      console.error("초대 코드 복사 실패:", error);
    }
  };

  const handleLeaveGroup = async () => {
    const user = auth.currentUser;
    if (!user || !groupId) return;

    setLeaving(true);
    try {
      const groupRef = doc(db, "groups", groupId);

      await runTransaction(db, async (transaction) => {
        const groupSnap = await transaction.get(groupRef);
        if (!groupSnap.exists()) {
          throw new Error("그룹 정보를 찾을 수 없습니다.");
        }

        const groupData = groupSnap.data();
        const members: string[] = groupData.members || [];
        const nextMembers = members.filter((memberId) => memberId !== user.uid);

        if (nextMembers.length === 0) {
          transaction.delete(groupRef);
        } else {
          transaction.update(groupRef, {
            members: nextMembers,
            memberCount: nextMembers.length,
            ownerId:
              groupData.ownerId === user.uid
                ? nextMembers[0]
                : groupData.ownerId,
          });
        }
      });

      await updateDoc(doc(db, "users", user.uid), {
        groupId: deleteField(),
        updatedAt: new Date().toISOString(),
      });

      setGroupId(null);
      setInviteCode(null);
      setGroupName("우리의 마을");
      setMembers([]);
    } catch (error) {
      console.error("마을 나가기 실패:", error);
    } finally {
      setLeaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  const statusLabel = (status: string) => {
    if (status === "completed")
      return {
        text: "완료됨",
        color: "text-green-600",
        icon: <CheckCircle size={14} className="text-green-500" />,
      };
    if (status === "in_progress")
      return {
        text: "진행 중",
        color: "text-yellow-600",
        icon: (
          <div className="w-3.5 h-3.5 rounded-full border-2 border-yellow-400 border-t-transparent animate-spin" />
        ),
      };
    return {
      text: "대기 중",
      color: "text-gray-400",
      icon: (
        <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300" />
      ),
    };
  };

  return (
    <div className="min-h-full bg-gray-50 flex flex-col p-4 relative">
      <header className="flex justify-between items-center pt-4 pb-3 mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            {groupName}
          </h1>
          <p className="text-xs text-gray-400 font-medium mt-0.5">
            오늘의 목표 현황
          </p>
        </div>
        <Link
          href="/settings"
          className="w-10 h-10 bg-white rounded-full border border-gray-100 shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <Settings size={18} className="text-gray-500" />
        </Link>
      </header>

      {groupId ? (
        <div className="bg-white border border-gray-200 rounded-3xl p-4 shadow-sm mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">초대 코드</p>
            <p className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-sm font-medium tracking-widest text-gray-800">
              {inviteCode}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <button
              type="button"
              onClick={copyInviteCode}
              className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
            >
              {copied ? "복사됨" : "코드 복사"}
            </button>
            <button
              type="button"
              onClick={handleLeaveGroup}
              disabled={leaving}
              className="rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {leaving ? "나가는 중..." : "마을 나가기"}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-dashed border-gray-200 rounded-3xl p-6 shadow-sm mb-4 text-center">
          <p className="text-sm text-gray-600">
            아직 참여 중인 마을이 없습니다.
          </p>
          <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/onboarding/group"
              className="rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-gray-900 transition-colors"
            >
              새 마을 만들기
            </Link>
            <Link
              href="/onboarding/group"
              className="rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
            >
              초대 코드로 참여
            </Link>
          </div>
        </div>
      )}

      {/* 2x2 Grid */}
      <div
        className="flex-1 grid grid-cols-2 gap-3 pb-28"
        style={{ gridAutoRows: "1fr" }}
      >
        {members.length === 0 ? (
          <div className="col-span-2 flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
            <p className="text-sm text-center break-keep">
              그룹 데이터가 없습니다.
              <br />
              <Link href="/seed" className="text-blue-500 underline">
                /seed 페이지
              </Link>
              에서 테스트 유저를 생성하세요.
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
                    member.isMe
                      ? "border-black/10 ring-2 ring-black/5"
                      : "border-gray-100"
                  }`}
                >
                  {/* 헤더: 아바타 + 이름 */}
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-full ${member.color} shadow-inner flex-shrink-0 border-2 border-white flex items-center justify-center`}
                    >
                      {member.isMe && (
                        <span className="text-white text-[8px] font-bold">
                          나
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate text-sm leading-tight">
                        {member.name}
                      </h3>
                      {member.isMe && (
                        <span className="text-[10px] text-gray-400">
                          내 캐릭터
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 상태 */}
                  <div className="flex items-center gap-1.5 mt-3">
                    {s.icon}
                    <span className={`text-xs font-medium ${s.color}`}>
                      {s.text}
                    </span>
                  </div>

                  {/* 사진 영역 */}
                  <div className="mt-3 pt-3 border-t border-gray-50">
                    {member.hasPhoto ? (
                      <div className="w-full h-16 rounded-xl bg-gradient-to-tr from-blue-50 to-green-50 flex items-center justify-center relative">
                        <ImageIcon size={20} className="text-gray-300" />
                        <span className="absolute bottom-1.5 right-2 bg-black/40 text-white text-[9px] px-1.5 py-0.5 rounded-full">
                          인증됨
                        </span>
                      </div>
                    ) : (
                      <div className="w-full h-16 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50/50">
                        <span className="text-[10px] text-gray-300">
                          미인증
                        </span>
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
