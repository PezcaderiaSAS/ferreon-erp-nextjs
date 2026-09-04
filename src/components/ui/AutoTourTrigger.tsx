"use client";

import React from 'react';
import { useAutoTour } from '../../hooks/useAutoTour';

interface AutoTourTriggerProps {
  tourId: string;
  delay?: number;
  forceMode?: boolean;
}

/**
 * Componente pasivo puramente cliente ("use client").
 * Su única función es montar el hook de React sin corromper un Server Component en Next.js.
 * Puedes tirarlo en cualquier page.tsx o layout.tsx de App Router.
 */
export function AutoTourTrigger({ tourId, delay = 800, forceMode = true }: AutoTourTriggerProps) {
  useAutoTour(tourId, delay, forceMode);
  
  // Es invisible
  return null;
}
