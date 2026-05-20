"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const COLORS = ["bg-pink-400", "bg-blue-400", "bg-green-400", "bg-yellow-400"];

const USERS_TO_CREATE = [
  { email: "test1@test.com", pass: "123123", name: "테스터1", color: COLORS[0] },
  { email: "test2@test.com", pass: "123123", name: "테스터2", color: COLORS[1] },
  { email: "test3@test.com", pass: "123123", name: "테스터3", color: COLORS[2] },
  { email: "test4@test.com", pass: "123123", name: "테스터4", color: COLORS[3] },
];

export default function SeedPage() {
  const [status, setStatus] = useState("대기 중...");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSeed = async () => {
    setIsLoading(true);
    const uids: string[] = [];

    try {
      for (const u of USERS_TO_CREATE) {
        setStatus(`유저 처리 중: ${u.email}...`);
        let uid = "";

        try {
          // 신규 유저 생성 시도
          const cred = await createUserWithEmailAndPassword(auth, u.email, u.pass);
          uid = cred.user.uid;
        } catch (err: any) {
          if (err.code === "auth/email-already-in-use") {
            // 로그인 대신 Firestore에서 uid 조회 (auth 상태 변경 없이)
            const q = query(collection(db, "users"), where("email", "==", u.email));
            const snap = await getDocs(q);

            if (!snap.empty) {
              uid = snap.docs[0].data().uid;
            } else {
              // Firestore에도 없으면 어쩔 수 없이 signIn
              const cred = await signInWithEmailAndPassword(auth, u.email, u.pass);
              uid = cred.user.uid;
            }
          } else {
            throw err;
          }
        }

        uids.push(uid);

        // Firestore 유저 doc upsert
        await setDoc(
          doc(db, "users", uid),
          {
            uid,
            email: u.email,
            nickname: u.name,
            themeColor: u.color,
            groupId: "test-group-1",
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }

      setStatus("그룹 데이터 생성 중...");
      await setDoc(
        doc(db, "groups", "test-group-1"),
        {
          id: "test-group-1",
          name: "테스트 마을",
          members: uids,
          level: 1,
          points: 0,
          theme: "기본",
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      // 루프 끝난 후 딱 한 번만 signIn
      setStatus("test1@test.com으로 로그인 중...");
      await signInWithEmailAndPassword(auth, "test1@test.com", "123123");

      setStatus("완료! 대시보드로 이동합니다...");
      setTimeout(() => router.push("/dashboard"), 600);

    } catch (error: any) {
      console.error(error);
      setStatus(`에러: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
      <div className="bg-white p-8 rounded-3xl shadow-lg text-center max-w-sm w-full space-y-6">
        <h1 className="text-2xl font-bold">DB 초기화 (테스트용)</h1>
        <p className="text-gray-500 text-sm break-keep">
          테스트 유저 4명(test1~4@test.com / 비밀번호: 123123)을 생성하거나,
          이미 있으면 groupId를 재설정합니다.
        </p>
        <div className="bg-gray-100 p-4 rounded-xl text-sm font-medium text-gray-700 break-all min-h-[56px]">
          {status}
        </div>
        <button
          onClick={handleSeed}
          disabled={isLoading}
          className="w-full bg-black text-white rounded-xl py-3 font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors flex justify-center items-center gap-2"
        >
          {isLoading && <Loader2 size={18} className="animate-spin" />}
          유저 4명 생성 / 재설정
        </button>
      </div>
    </div>
  );
}
