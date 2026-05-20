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
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center px-4 py-3 bg-white border-b border-gray-50 flex-shrink-0">
          <div className="min-w-0 flex-1">
            <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 w-20 bg-gray-100 rounded mt-1 animate-pulse" />
          </div>
          <div className="w-9 h-9 bg-gray-200 rounded-full animate-pulse flex-shrink-0" />
        </div>

        {/* Banner Skeleton */}
        <div className="px-4 py-2 bg-white border-b border-gray-100 flex-shrink-0 animate-pulse">
          <div className="h-3 w-16 bg-gray-200 rounded mb-2" />
          <div className="h-5 w-32 bg-gray-100 rounded" />
        </div>

        {/* Grid Skeleton */}
        <div className="flex-1 overflow-hidden px-4 py-3">
          <div className="grid grid-cols-2 gap-2 h-full">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 animate-pulse"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
                  <div className="h-3 w-16 bg-gray-200 rounded flex-1" />
                </div>
                <div className="h-3 w-12 bg-gray-100 rounded mb-2" />
                <div className="h-12 w-full bg-gray-100 rounded-lg" />
              </div>
            ))}
          </div>
        </div>

        {/* FAB Skeleton */}
        <div className="px-4 py-3 bg-white border-t border-gray-100 flex-shrink-0">
          <div className="h-10 w-full bg-gray-900 rounded-full animate-pulse" />
        </div>
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header: 고정 높이, compact */}
      <header className="flex justify-between items-center px-4 py-3 bg-white border-b border-gray-50 flex-shrink-0">
        <div className="min-w-0">
          <h1 className="text-lg font-bold tracking-tight text-gray-900 truncate">
            {groupName}
          </h1>
          <p className="text-xs text-gray-400 font-medium">오늘의 목표</p>
        </div>
        <Link
          href="/settings"
          className="w-9 h-9 bg-gray-50 rounded-full border border-gray-100 flex items-center justify-center hover:bg-gray-100 transition-colors flex-shrink-0"
        >
          <Settings size={16} className="text-gray-600" />
        </Link>
      </header>

      {/* 초대 코드 배너: Compact */}
      {groupId && (
        <div className="px-4 py-2 bg-white border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-700">초대 코드</p>
              <p className="text-sm font-mono font-bold text-gray-900">
                {inviteCode}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={copyInviteCode}
                className="px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 transition-colors"
              >
                {copied ? "✓" : "복사"}
              </button>
              <button
                type="button"
                onClick={handleLeaveGroup}
                disabled={leaving}
                className="px-3 py-1.5 rounded-lg border border-red-300 bg-white text-red-600 text-xs font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                나가
              </button>
            </div>
          </div>
        </div>
      )}

      {!groupId && (
        <div className="px-4 py-3 bg-white border-b border-gray-100 flex-shrink-0">
          <p className="text-xs text-gray-600 mb-2">아직 마을이 없습니다</p>
          <div className="flex gap-2">
            <Link
              href="/onboarding/group"
              className="text-xs px-3 py-1.5 rounded-lg bg-black text-white font-semibold hover:bg-gray-900 transition-colors"
            >
              새 마을
            </Link>
            <Link
              href="/onboarding/group"
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-900 font-semibold hover:bg-gray-50 transition-colors"
            >
              참여
            </Link>
          </div>
        </div>
      )}

      {/* 멤버 그리드: 유연한 높이 */}
      <div className="flex-1 overflow-hidden px-4 py-3">
        {members.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center">
            <p className="text-sm">그룹 멤버가 없습니다</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 h-full">
            {members.slice(0, 4).map((member) => {
              const s = statusLabel(member.taskStatus);
              return (
                <Link href={`/village/${member.id}`} key={member.id}>
                  <div className="h-full bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow active:scale-95">
                    {/* 헤더 */}
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-full ${member.color} shadow-inner flex-shrink-0 border-2 border-white flex items-center justify-center`}
                      >
                        {member.isMe && (
                          <span className="text-white text-[7px] font-bold">
                            나
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 truncate text-xs leading-tight">
                        {member.name}
                      </h3>
                    </div>

                    {/* 상태 */}
                    <div className="flex items-center gap-1 text-[10px] mt-1">
                      {s.icon}
                      <span className={`font-medium ${s.color}`}>{s.text}</span>
                    </div>

                    {/* 사진 */}
                    <div className="mt-2 pt-2 border-t border-gray-50">
                      {member.hasPhoto ? (
                        <div className="w-full h-12 rounded-lg bg-gradient-to-tr from-blue-50 to-green-50 flex items-center justify-center relative text-[8px]">
                          <ImageIcon size={14} className="text-gray-300" />
                        </div>
                      ) : (
                        <div className="w-full h-12 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50/50 text-[8px]">
                          미인증
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* 포커스 타이머 FAB */}
      <div className="px-4 py-3 bg-white border-t border-gray-100 flex-shrink-0">
        <Link
          href="/timer"
          className="w-full bg-black text-white rounded-full py-2 font-semibold text-sm shadow-lg flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors active:scale-95"
        >
          <Timer size={16} />
          포커스 시작
        </Link>
      </div>
    </div>
  );
}
