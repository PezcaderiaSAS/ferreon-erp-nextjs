import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Design System Playground & Showcase — FerreOn & AppFrios Pezca',
  description: 'Plataforma de Gobernanza Visual, Auditoría de Tokens HSL y Comparación Simultánea de los 6 Presets de Diseño.',
};

/**
 * Layout dedicado para el Design System Playground.
 * Suministra un lienzo Full-Screen (100% ancho y alto) con fondo base inmersivo
 * permitiendo auditar el contraste y elevación de los 6 presets sin restricciones.
 */
export default function DesignSystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950 antialiased">
      {children}
    </div>
  );
}
