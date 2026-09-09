import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { LanguageProvider } from "@/lib/i18n";
import { ThemeProvider } from "@/lib/theme";
import { ConfigProvider } from "@/lib/config";
import { PostsProvider } from "@/lib/postsStore";
import { AccountsProvider } from "@/lib/accountsStore";
import { MediaProvider } from "@/lib/mediaStore";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EduHero 营销中心",
  description: "英雄教育 EduHero 内部营销工具",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex bg-background text-foreground" suppressHydrationWarning>
        <ThemeProvider>
          <LanguageProvider>
            <ConfigProvider>
              <AccountsProvider>
                <PostsProvider>
                  <MediaProvider>
                    <Sidebar />
                    <main className="flex-1 min-w-0">{children}</main>
                  </MediaProvider>
                </PostsProvider>
              </AccountsProvider>
            </ConfigProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
