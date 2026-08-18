import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FerreOn ERP — alquileres_app",
  description: "Sistema de Gestión de Alquiler de Equipos de Construcción y Facturación",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased bg-slate-50 text-slate-900 font-sans">
        {children}
      </body>
    </html>
  );
}
