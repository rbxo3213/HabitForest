import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { BottomNav } from "@/components/BottomNav";
import { HeaderNav } from "@/components/HeaderNav";

const notoSansKr = Noto_Sans_KR({
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans",
  subsets: ["latin"], // Noto Sans KR automatically includes Korean
});

export const metadata: Metadata = {
  title: "Habit Village",
  description: "친구들과 습관을 기르고 마을을 키워보세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {/* Korean Pixel Font: Galmuri11 */}
        <link
          href="https://cdn.jsdelivr.net/npm/galmuri@latest/dist/galmuri.css"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${notoSansKr.variable} font-sans antialiased bg-gray-50 text-gray-900`}
      >
        <ThemeProvider>
          <div className="flex flex-col min-h-screen relative overflow-x-hidden">
            {/* Desktop Top Navigation (Hidden on mobile) */}
            <header className="hidden md:flex items-center justify-between p-6 bg-white shadow-sm z-50">
              <div className="font-bold text-xl tracking-tight">
                해빗 빌리지
              </div>
              <HeaderNav />
            </header>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col md:pb-0 pb-20 w-full max-w-7xl mx-auto">
              {children}
            </main>

            {/* Mobile Bottom Navigation (Hidden on desktop) */}
            <div className="md:hidden block">
              <BottomNav />
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
