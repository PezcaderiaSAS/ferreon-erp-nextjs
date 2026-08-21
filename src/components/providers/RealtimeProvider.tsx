'use client';

import React from 'react';
import { useRealtimeSync } from '../../infrastructure/state/realtimeSync';

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  useRealtimeSync();
  return <>{children}</>;
}
