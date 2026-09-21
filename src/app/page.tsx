import React from 'react';
import type { Metadata } from 'next';
import { Header } from '../components/landing/Header';
import { HeroSection } from '../components/landing/HeroSection';
import { TrustSection } from '../components/landing/TrustSection';
import { FeaturesSection } from '../components/landing/FeaturesSection';
import { ProductShowcase } from '../components/landing/ProductShowcase';
import { PricingSection } from '../components/landing/PricingSection';
import { TestimonialsSection } from '../components/landing/TestimonialsSection';
import { CTABanner } from '../components/landing/CTABanner';
import { Footer } from '../components/landing/Footer';
import { LANDING_CONFIG } from '../config/landing';

export const metadata: Metadata = {
  title: "Alquileres System — La Plataforma Todo en Uno para Equipos Modernos",
  description: "Planifica contratos de alquiler, controla despachos de maquinaria pesada y maximiza la rentabilidad operativa de tu flota con Alquileres System.",
  keywords: [
    "alquiler de maquinaria",
    "gestión de equipos de construcción",
    "software de alquileres",
    "ERP maquinaria",
    "control de flota",
    "facturación de alquileres",
    "Alquileres System",
  ],
  openGraph: {
    title: "Alquileres System — The All-in-One Platform for Modern Teams",
    description: "La solución integral para empresas de alquiler de maquinaria y equipos de construcción.",
    type: "website",
    locale: "es_CO",
    siteName: "Alquileres System",
  },
  twitter: {
    card: "summary_large_image",
    title: "Alquileres System — Gestión Integral de Alquileres",
    description: "Plataforma SaaS en la nube para empresas de alquiler de maquinaria y contratistas de obra.",
  },
};

export default function LandingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: LANDING_CONFIG.brand.name,
    operatingSystem: "Web Cloud",
    applicationCategory: "BusinessApplication",
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "COP",
      lowPrice: "0",
      highPrice: "220000",
    },
    description: LANDING_CONFIG.brand.shortDescription,
  };

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen flex flex-col selection:bg-blue-600 selection:text-white font-sans antialiased">
      {/* Schema.org JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Sección 1: Header / Navigation (Sticky) */}
      <Header />

      <main className="flex-1 flex flex-col">
        {/* Sección 2: Hero Section con Mockup Interactivo de Rendimiento */}
        <HeroSection />

        {/* Sección 3: Logos / Trust Section */}
        <TrustSection />

        {/* Sección 4: Features Section (4 Cards Grid) */}
        <FeaturesSection />

        {/* Sección 5: Product Showcase con Tablero Kanban Interactivo */}
        <ProductShowcase />

        {/* Sección 6: Pricing Section (Dual Currency COP/USD y Mensual/Anual) */}
        <PricingSection />

        {/* Sección 7: Testimonials Section (Prueba Social 3 Cards) */}
        <TestimonialsSection />

        {/* Sección 8: Call to Action (CTA Banner) */}
        <CTABanner />
      </main>

      {/* Sección 9: Footer Semántico */}
      <Footer />
    </div>
  );
}
