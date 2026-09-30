import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

import { AppShell } from "../components/layout/AppShell";
import { RealtimeProvider } from "../components/providers/RealtimeProvider";
import { GlobalTourWrapper } from "../components/ui/GlobalTourWrapper";
import { ToastNotification } from "../components/ui/ToastNotification";
import { CipaPrivacyGuard } from "../components/legal/CipaPrivacyGuard";

const inter = Inter({ 
  subsets: ["latin"], 
  display: "swap",
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Alquileres System — Plataforma Integral de Gestión de Alquileres y Maquinaria",
  description: "Sistema Empresarial para la Gestión de Alquileres de Maquinaria, Equipos de Construcción y Facturación.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${jetbrainsMono.variable} ${inter.className}`} suppressHydrationWarning>
      <body className="antialiased font-sans bg-slate-50 text-slate-900 min-h-screen flex" suppressHydrationWarning>
        <CipaPrivacyGuard>
          <RealtimeProvider>
            <AppShell>
              {children}
            </AppShell>
            <GlobalTourWrapper />
            <ToastNotification />
          </RealtimeProvider>
        </CipaPrivacyGuard>
      </body>
    </html>
  );
}

