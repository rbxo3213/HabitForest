"use client";

import Link from "next/link";

export default function SeedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
      <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-md w-full space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">
          테스트 데이터 생성 기능 제거됨
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          이 페이지는 더 이상 테스트용 계정을 자동으로 생성하지 않습니다.
          Firebase 데이터는 직접 정리한 다음, 직접 가입한 계정으로 로그인해
          주세요.
        </p>
        <div className="bg-slate-100 p-4 rounded-2xl text-sm text-slate-700">
          - 가입 후 프로필을 설정하고
          <br />- 그룹을 직접 생성하거나 초대 코드를 입력해 그룹에 참여할 수
          있습니다.
        </div>
        <Link
          href="/login"
          className="inline-flex w-full justify-center rounded-2xl bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-slate-900 transition-colors"
        >
          로그인 페이지로 돌아가기
        </Link>
      </div>
    </div>
  );
}
