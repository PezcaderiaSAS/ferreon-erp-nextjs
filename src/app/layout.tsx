import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

import { AppShell } from "../components/layout/AppShell";
import { RealtimeProvider } from "../components/providers/RealtimeProvider";
import { GlobalTourWrapper } from "../components/ui/GlobalTourWrapper";
import { ToastNotification } from "../components/ui/ToastNotification";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "FerreOn ERP & AppFrios Pezca — Gestión Integral y Presets de Diseño",
  description: "Sistema Empresarial Ferretero y Frío Industrial con Soporte Multiestilo y Gobernanza de Tokens",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${outfit.variable}`}>
      <body className="antialiased font-sans bg-slate-50 text-slate-900 min-h-screen flex">
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

