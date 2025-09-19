import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";

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
  description: "Transforma la productividad de tu equipo a través de la gamificación. Completa misiones, gana puntos y sube de nivel mientras colaboras con tu equipo.",
  keywords: ["Misión Maestra", "gestión de tareas", "gamificación", "productividad", "colaboración", "equipos"],
  authors: [{ name: "Misión Maestra Team" }],
  openGraph: {
    title: "Misión Maestra - Gestión de Tareas Gamificada",
    description: "Transforma la productividad de tu equipo a través de la gamificación. Completa misiones, gana puntos y sube de nivel.",
    url: "https://misionmaestra.com",
    siteName: "Misión Maestra",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Misión Maestra - Gestión de Tareas Gamificada",
    description: "Transforma la productividad de tu equipo a través de la gamificación.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
