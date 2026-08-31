import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

import { Sidebar } from "../components/ui/Sidebar";
import { TopNav } from "../components/ui/TopNav";
import { RealtimeProvider } from "../components/providers/RealtimeProvider";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "Alquileres ERP — Gestión Integral de Maquinaria y Construcción",
  description: "Sistema de Gestión de Alquiler de Equipos de Construcción, Control de Stock, Cartera y Facturación",
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
          <Sidebar />
          <div className="flex-1 flex flex-col min-h-screen transition-all duration-300 md:ml-64 w-full overflow-hidden">
            <TopNav />
            <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto overflow-x-hidden">
              {children}
            </main>
          </div>
        </RealtimeProvider>
      </body>
    </html>
  );
}
