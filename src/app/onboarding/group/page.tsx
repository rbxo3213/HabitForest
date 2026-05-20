"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, Link as LinkIcon, Check } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";

function generateInviteCode() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += letters[Math.floor(Math.random() * letters.length)];
  }
  return code;
}

export default function GroupSetup() {
  const [isJoining, setIsJoining] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      router.push("/login");
    }
  }, [router]);

  const handleCreateGroup = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    setLoading(true);
    setErrorMessage("");

    try {
      let code = generateInviteCode();
      let groupRef = doc(db, "groups", code);
      let attempts = 0;

      while (attempts < 5) {
        const groupSnap = await getDoc(groupRef);
        if (!groupSnap.exists()) break;
        code = generateInviteCode();
        groupRef = doc(db, "groups", code);
        attempts += 1;
      }

      await setDoc(groupRef, {
        id: code,
        ownerId: currentUser.uid,
        members: [currentUser.uid],
        memberCount: 1,
        memberLimit: 4,
        createdAt: serverTimestamp(),
      });

      await setDoc(
        doc(db, "users", currentUser.uid),
        {
          groupId: code,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      router.push("/dashboard");
    } catch (error) {
      console.error("새 마을 생성 실패:", error);
      setErrorMessage("마을 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentUser = auth.currentUser;
    if (!currentUser || inviteCode.length !== 6) return;
    setLoading(true);
    setErrorMessage("");

    try {
      const groupRef = doc(db, "groups", inviteCode);

      await runTransaction(db, async (transaction) => {
        const groupSnap = await transaction.get(groupRef);
        if (!groupSnap.exists()) {
          throw new Error("초대 코드가 올바르지 않습니다.");
        }

        const groupData = groupSnap.data();
        const members: string[] = groupData.members || [];
        const memberLimit: number = groupData.memberLimit || 4;

        if (members.includes(currentUser.uid)) {
          return;
        }

        if (members.length >= memberLimit) {
          throw new Error("이 마을은 이미 정원이 가득 찼습니다.");
        }

        transaction.update(groupRef, {
          members: [...members, currentUser.uid],
          memberCount: members.length + 1,
        });
      });

      const userDocRef = doc(db, "users", currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        await updateDoc(userDocRef, {
          groupId: inviteCode,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(
          userDocRef,
          {
            uid: currentUser.uid,
            email: currentUser.email,
            nickname: currentUser.email?.split(\"@\")[0] || \"주민\",
            themeColor: \"bg-blue-400\",
            groupId: inviteCode,
            points: 500,
            currentActivity: \"idle\",
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
      }

      router.push("/dashboard");
    } catch (error) {
      console.error("마을 합류 실패:", error);
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("마을 합류 중 문제가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
            마을 구성하기
          </h1>
          <p className="text-gray-500">
            마을은 최대 4명까지만 입장할 수 있습니다.
          </p>
        </div>

        {errorMessage ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="space-y-4">
          {!isJoining ? (
            <>
              <button
                type="button"
                onClick={handleCreateGroup}
                disabled={loading}
                className="w-full bg-white border border-gray-200 rounded-2xl p-6 text-left hover:border-black hover:shadow-md transition-all group flex items-start gap-4 disabled:opacity-50"
              >
                <div className="bg-blue-100 p-3 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Users size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">
                    새 마을 만들기
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 break-keep">
                    아무도 없는 곳에서 새롭게 시작하고 최대 3명의 친구를
                    초대하세요.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setInviteCode("");
                  setErrorMessage("");
                  setIsJoining(true);
                }}
                className="w-full bg-white border border-gray-200 rounded-2xl p-6 text-left hover:border-black hover:shadow-md transition-all group flex items-start gap-4"
              >
                <div className="bg-green-100 p-3 rounded-xl text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                  <LinkIcon size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">
                    기존 마을 참여하기
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 break-keep">
                    초대 코드가 있으신가요? 코드를 입력하고 친구들의 마을에
                    합류하세요.
                  </p>
                </div>
              </button>
            </>
          ) : (
            <div className="bg-white border border-gray-200 rounded-3xl p-8 space-y-6 shadow-sm">
              <h3 className="font-semibold text-xl text-center text-gray-900">
                초대 코드 입력
              </h3>
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
                  disabled={inviteCode.length < 6 || loading}
                  className="w-full bg-black text-white rounded-xl py-3 font-medium hover:bg-gray-800 disabled:opacity-50 disabled:hover:bg-black transition-colors flex items-center justify-center gap-2"
                >
                  <Check size={18} /> 마을 합류하기
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsJoining(false);
                    setErrorMessage("");
                  }}
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
