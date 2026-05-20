"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Camera,
  X,
  CheckCircle2,
  Loader2,
  Timer,
  ChevronLeft,
} from "lucide-react";
import imageCompression from "browser-image-compression";
import Link from "next/link";

function VerifyContent() {
  const searchParams = useSearchParams();
  const timeParam = searchParams.get("time");
  const focusedSeconds = timeParam ? parseInt(timeParam, 10) : 0;

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const originalFile = e.target.files[0];

      // Preview original first to feel fast
      const objectUrl = URL.createObjectURL(originalFile);
      setPreviewUrl(objectUrl);

      // Compress
      setIsCompressing(true);
      try {
        const options = {
          maxSizeMB: 0.2, // heavily compress to < 200KB
          maxWidthOrHeight: 800,
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(originalFile, options);
        setFile(compressedFile);
        console.log(
          `Original: ${originalFile.size / 1024} KB -> Compressed: ${compressedFile.size / 1024} KB`,
        );
      } catch (error) {
        console.error("Compression error:", error);
        setFile(originalFile); // Fallback
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const handleVerify = async () => {
    setIsUploading(true);

    if (file) {
      console.log("Verification image included:", file.name);
    }

    // TODO: Upload `file` to Firebase Storage if a photo was selected
    // TODO: Create verification document in Firestore with or without an image

    // Mock upload delay
    setTimeout(() => {
      setIsUploading(false);
      router.push("/dashboard");
    }, 1500);
  };

  return (
    <div className="min-h-full bg-gray-50 flex flex-col p-6 pb-20">
      <header className="flex items-center justify-between py-4 mb-6">
        <Link
          href="/timer"
          className="p-2 -ml-2 text-gray-500 hover:text-black transition-colors"
        >
          <ChevronLeft size={28} />
        </Link>
        <div className="text-sm font-semibold text-gray-900">
          목표 달성 인증
        </div>
        <div className="w-8 h-8"></div>
      </header>

      <main className="flex-1 flex flex-col max-w-sm mx-auto w-full space-y-8">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
            <Timer size={32} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">집중한 시간</p>
            <p className="text-4xl font-bold tracking-tight text-gray-900 mt-1">
              {Math.floor(focusedSeconds / 60)}분 {focusedSeconds % 60}초
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-sm font-medium text-gray-700 block ml-1">
            인증 사진 업로드
          </label>
          <p className="text-xs text-gray-500 ml-1">
            사진은 선택 사항입니다. 그냥 인증하기를 눌러도 가능합니다.
          </p>

          {!previewUrl ? (
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="w-full h-48 bg-white border-2 border-dashed border-gray-200 hover:border-black rounded-3xl flex flex-col items-center justify-center gap-3 transition-colors">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                  <Camera size={24} />
                </div>
                <div className="text-center">
                  <p className="font-medium text-gray-900 text-sm">
                    사진 찍기 또는 선택
                  </p>
                  <p className="text-xs text-gray-500 mt-1 break-keep">
                    이미지는 자동으로 압축되어 저장됩니다.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-sm relative">
              <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-md relative bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Verification"
                  className="w-full h-full object-cover opacity-90"
                />

                <button
                  onClick={() => {
                    setPreviewUrl(null);
                    setFile(null);
                  }}
                  className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                >
                  <X size={20} />
                </button>

                {isCompressing && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                    <Loader2 className="animate-spin mb-2" size={32} />
                    <p className="text-sm font-medium">이미지 압축 중...</p>
                  </div>
                )}
              </div>

              <button
                onClick={handleVerify}
                disabled={isCompressing || isUploading}
                className="w-full mt-8 bg-black text-white rounded-2xl py-4 font-medium hover:bg-gray-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/20"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} /> 업로드 중...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={20} /> 인증 완료하기
                  </>
                )}
              </button>
            </div>
          )}
          <button
            onClick={handleVerify}
            disabled={isCompressing || isUploading}
            className="w-full bg-slate-900 text-white rounded-2xl py-3 font-medium hover:bg-slate-800 disabled:opacity-50 transition-all"
          >
            {isUploading ? "저장 중..." : "사진 없이 인증하기"}
          </button>
        </div>
      </main>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="animate-spin text-gray-400" />
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
