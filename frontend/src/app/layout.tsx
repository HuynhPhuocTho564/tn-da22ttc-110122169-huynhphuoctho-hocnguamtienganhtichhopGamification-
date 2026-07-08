import type { Metadata } from "next";
import { Inter, Noto_Sans } from "next/font/google";
import "./globals.css";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import AdminRouteGuard from "@/components/layout/AdminRouteGuard";
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <ThemeInitScript />
      </head>
      <body
        className={`${inter.variable} ${notoSans.variable} flex min-h-screen flex-col font-sans antialiased`}
      >
        <ThemeProvider>
          <RewardEffectsLayer>
            <AdminRouteGuard>
              <Navbar />
            </AdminRouteGuard>
            <div
              id="main-content"
              tabIndex={-1}
              className="flex-1 focus:outline-none"
              style={{ overflowAnchor: "none" }}
            >
              {children}
            </div>
            <AdminRouteGuard>
              <Footer />
            </AdminRouteGuard>
          </RewardEffectsLayer>
        </ThemeProvider>
      </body>
    </html>
  );
}
