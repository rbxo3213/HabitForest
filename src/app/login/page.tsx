"use client";

import { useState } from "react";
import { LogIn, UserPlus } from "lucide-react";
import { auth } from "@/lib/firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      if (Object.keys(auth).length === 0) {
        // Mock mode fallback
        console.log("Mock Mode: Bypassing Auth");
        router.push(isLogin ? "/dashboard" : "/onboarding");
        return;
      }

      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        router.push("/dashboard");
      } else {
        if (password !== confirmPassword) {
          setError("비밀번호가 일치하지 않습니다.");
          return;
        }
        await createUserWithEmailAndPassword(auth, email, password);
        router.push("/onboarding");
      }
    } catch (err: any) {
      // Korean translation of common Firebase errors
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("이미 가입된 이메일입니다.");
      } else if (err.code === "auth/weak-password") {
        setError("비밀번호는 6자리 이상이어야 합니다.");
      } else {
        setError(`오류가 발생했습니다: ${err.code || err.message}`);
      }
    }
  };

  const handleGoogleLogin = async () => {
    try {
      if (Object.keys(auth).length === 0) {
        console.log("Mock Mode: Bypassing Google Auth");
        router.push("/dashboard");
        return;
      }
      
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push("/dashboard");
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user") {
        setError(`구글 로그인 오류: ${err.code || err.message}`);
      }
    }
  };

  return (
    <div className="min-h-full flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 break-keep">
            {isLogin ? "다시 오셨군요!" : "새로운 마을 주민 되기"}
          </h1>
          <p className="text-sm text-gray-500 break-keep">
            {isLogin 
              ? "이메일과 비밀번호를 입력해 마을에 입장하세요" 
              : "친구들과 함께 나만의 마을을 키워보세요"}
          </p>
        </div>

        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 rounded-xl break-all">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black transition-all"
              placeholder="name@example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black transition-all"
              placeholder="••••••••"
            />
          </div>

          {!isLogin && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">비밀번호 확인</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black transition-all"
                placeholder="••••••••"
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-black text-white rounded-xl py-3 font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
          >
            {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
            {isLogin ? "로그인" : "회원가입"}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">또는</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl py-3 font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google 계정으로 로그인
        </button>

        <p className="text-center text-sm text-gray-600">
          {isLogin ? "계정이 없으신가요? " : "이미 계정이 있으신가요? "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="font-semibold text-black hover:underline"
          >
            {isLogin ? "가입하기" : "로그인하기"}
          </button>
        </p>
      </div>
    </div>
  );
}
