"use client";

import React from 'react';
import { InteractiveTour, TourStep } from './InteractiveTour';
import { useLayoutStore } from '../../infrastructure/state/layoutStore';

const TOUR_STEPS: TourStep[] = [
  {
    targetId: 'tour-sidebar',
    title: 'Navegación Principal',
    content: 'Desde aquí puedes acceder a todas las áreas del sistema: Alquileres, Bodega, Facturación y más.',
    route: '/configuracion'
  },
  {
    targetId: 'tour-filtros-alquileres',
    title: 'Filtros y Búsqueda',
    content: 'Utiliza estos controles para encontrar rápidamente contratos activos, cotizaciones o finalizados.',
    route: '/alquileres'
  },
  {
    targetId: 'tour-nuevo-alquiler',
    title: 'Nuevo Contrato',
    content: 'Haz clic aquí para iniciar el asistente guiado y crear una cotización o contrato.',
    route: '/alquileres'
  },
  {
    targetId: 'tour-bodega',
    title: 'Control de Inventario',
    content: 'Revisa el stock disponible y configura tarifas desde el módulo de Bodega.',
    route: '/bodega'
  },
  {
    targetId: 'tour-facturacion',
    title: 'Gestión de Cartera',
    content: 'Monitorea saldos pendientes, registra abonos y genera cuentas de cobro desde Facturación.',
    route: '/facturacion'
  }
];

export function GlobalTourWrapper() {
  const { isTourOpen, setTourOpen } = useLayoutStore();

  return (
    <InteractiveTour 
      isOpen={isTourOpen} 
      onClose={() => setTourOpen(false)} 
      steps={TOUR_STEPS} 
    />
  );
}
