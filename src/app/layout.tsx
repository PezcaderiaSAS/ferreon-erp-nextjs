import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="es" className="dark">
      <body className="antialiased font-sans bg-slate-950 text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
