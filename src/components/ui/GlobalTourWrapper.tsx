"use client";

import React from 'react';
import { InteractiveTour, TourStep } from './InteractiveTour';
import { useTourStore } from '../../infrastructure/state/tourStore';
import { TOURS_CONFIG_ACADEMIA } from '../academia/toursConfig';

const TOUR_STEPS_DEFAULT: TourStep[] = [
  {
    targetId: 'tour-sidebar',
    title: 'Navegación Principal',
    content: 'Desde aquí puedes acceder a todas las áreas del sistema: Alquileres, Bodega, Facturación y más.',
    route: '/configuracion',
  },
  {
    targetId: 'tour-filtros-alquileres',
    title: 'Filtros y Búsqueda',
    content: 'Utiliza estos controles para encontrar rápidamente contratos activos, cotizaciones o finalizados.',
    route: '/alquileres',
  },
  {
    targetId: 'tour-nuevo-alquiler',
    title: 'Nuevo Contrato',
    content: 'Haz clic aquí para iniciar el asistente guiado y crear una cotización o contrato.',
    route: '/alquileres',
  },
  {
    targetId: 'tour-bodega',
    title: 'Control de Inventario',
    content: 'Revisa el stock disponible y configura tarifas desde el módulo de Bodega.',
    route: '/bodega',
  },
  {
    targetId: 'tour-facturacion',
    title: 'Gestión de Cartera',
    content: 'Monitorea saldos pendientes, registra abonos y genera cuentas de cobro desde Facturación.',
    route: '/facturacion',
  },
];

export function GlobalTourWrapper() {
  const { activeTour } = useTourStore();

  if (activeTour && TOURS_CONFIG_ACADEMIA[activeTour]) {
    const tourDef = TOURS_CONFIG_ACADEMIA[activeTour];
    return (
      <InteractiveTour
        key={tourDef.tourId}
        tourId={tourDef.tourId}
        steps={tourDef.steps}
      />
    );
  }

  return (
    <InteractiveTour 
      tourId="global"
      steps={TOUR_STEPS_DEFAULT} 
    />
  );
}
