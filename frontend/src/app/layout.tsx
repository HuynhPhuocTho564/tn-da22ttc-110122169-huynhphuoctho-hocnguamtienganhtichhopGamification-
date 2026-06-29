import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter, Noto_Sans } from "next/font/google";
import "./globals.css";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import RewardEffectsLayer from "@/components/gamification/RewardEffectsLayer";
import ThemeInitScript from "@/components/layout/ThemeInitScript";

const inter = Inter({ subsets: ["latin", "vietnamese"], variable: "--font-inter" });
const notoSans = Noto_Sans({
  weight: ["400", "500", "700"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-ipa",
});

export const metadata: Metadata = {
  title: "LinguaEcho - Master English Pronunciation",
  description: "Web hỗ trợ phát âm tiếng Anh cho người Việt, sử dụng AI và gamification",
};

const themeInitScript = `
  (function () {
    // Force light mode only
    document.documentElement.dataset.theme = "light";
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "light";
  })();
`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read pathname from middleware-injected header (see src/middleware.ts).
  // We must do this on the server so the request scope is preserved when
  // rendering the async server-component <Navbar /> (which calls auth()).
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const isExerciseRoute = pathname.startsWith("/exercises/");

  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        {/*
          next/script với strategy="beforeInteractive" chỉ work trong app/layout.tsx.
          Tránh React 19 warning "Scripts inside React components are never executed"
          khi dùng <script dangerouslySetInnerHTML> thuần.
          Script này chạy TRƯỚC khi React hydrate → set theme light ngay để tránh flash.
        */}
        <ThemeInitScript />
      </head>
      <body
        className={`${inter.variable} ${notoSans.variable} flex min-h-screen flex-col font-sans antialiased`}
      >
        <ThemeProvider>
          <RewardEffectsLayer>
            {!isExerciseRoute && <Navbar />}
            <div
              id="main-content"
              tabIndex={-1}
              className="flex-1 focus:outline-none"
            >
              {children}
            </div>
            <Footer />
          </RewardEffectsLayer>
        </ThemeProvider>
      </body>
    </html>
  );
}
