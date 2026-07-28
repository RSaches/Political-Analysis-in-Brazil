import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppLayout from "@/components/AppLayout";
import { VideoProvider } from "@/context/VideoContext";
import { AuthProvider } from "@/context/AuthContext";
import FloatingVideoPlayer from "@/components/FloatingVideoPlayer";
import { ThemeProvider } from "@/components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Olho de Águia - Inteligência",
  description: "Sistema de Monitoramento e Análise Política",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <VideoProvider>
              <AppLayout>{children}</AppLayout>
              <FloatingVideoPlayer />
            </VideoProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
