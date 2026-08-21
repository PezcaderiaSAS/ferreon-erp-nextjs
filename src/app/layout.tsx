import type { Metadata } from "next";
import "./globals.css";

import { Sidebar } from "../components/ui/Sidebar";
import { TopNav } from "../components/ui/TopNav";
import { RealtimeProvider } from "../components/providers/RealtimeProvider";

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
    <html lang="es">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet"/>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
      </head>
      <body className="antialiased font-sans bg-slate-50 text-slate-900 min-h-screen flex">
        <RealtimeProvider>
          <Sidebar />
          <div className="flex-grow ml-64 flex flex-col min-h-screen">
            <TopNav />
            <main className="flex-grow p-8">
              {children}
            </main>
          </div>
        </RealtimeProvider>
      </body>
    </html>
  );
}
