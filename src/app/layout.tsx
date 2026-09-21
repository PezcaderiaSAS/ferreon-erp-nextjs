import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { AppShell } from "../components/layout/AppShell";
import { RealtimeProvider } from "../components/providers/RealtimeProvider";
import { GlobalTourWrapper } from "../components/ui/GlobalTourWrapper";
import { ToastNotification } from "../components/ui/ToastNotification";

const inter = Inter({ subsets: ["latin"], display: "swap" });

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
    <html lang="es" className={inter.className} suppressHydrationWarning>
      <body className="antialiased font-sans bg-slate-50 text-slate-900 min-h-screen flex" suppressHydrationWarning>
        <RealtimeProvider>
          <AppShell>
            {children}
          </AppShell>
          <GlobalTourWrapper />
          <ToastNotification />
        </RealtimeProvider>
      </body>
    </html>
  );
}

