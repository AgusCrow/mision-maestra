import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/auth-context";
import { RealTimeProvider } from "@/lib/realtime-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Misión Maestra - Gestión de Tareas Gamificada",
  description: "Transforma tus tareas en misiones emocionantes. Colabora en equipo, gana XP y sube de nivel mientras completas tus objetivos.",
  keywords: ["gamificación", "tareas", "equipos", "productividad", "colaboración", "XP", "misiones"],
  authors: [{ name: "Misión Maestra Team" }],
  openGraph: {
    title: "Misión Maestra",
    description: "Gestión de tareas gamificada para equipos",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Misión Maestra",
    description: "Gestión de tareas gamificada para equipos",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AuthProvider>
          <RealTimeProvider>
            {children}
            <Toaster />
          </RealTimeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
