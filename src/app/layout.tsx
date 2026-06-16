import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProgressSync } from "@/components/progress-sync";
import { Toaster } from "@/components/ui/sonner";
import { authEnabled } from "@/lib/auth-config";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Yoona Academy", template: "%s · Yoona Academy" },
  description:
    "오픈소스로 만든 나만의 개발 아카데미 — 커리큘럼, AI 튜터, 퀴즈로 인강처럼 배우기.",
};

/** Wrap in ClerkProvider only when auth is configured. */
function MaybeClerk({ children }: { children: React.ReactNode }) {
  return authEnabled ? <ClerkProvider>{children}</ClerkProvider> : <>{children}</>;
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <MaybeClerk>
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
            {authEnabled && <ProgressSync />}
          </MaybeClerk>
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
