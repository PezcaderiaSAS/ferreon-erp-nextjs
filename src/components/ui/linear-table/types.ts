import React from 'react';

/**
 * Definición de alineación de celda en la cuadrícula métrica.
 */
export type LinearColumnAlign = 'left' | 'center' | 'right';

/**
 * Configuración estricta de columna para LinearDataTable.
 * Cada columna define un ancho inamovible o flexible y una alineación rigurosa.
 */
export interface LinearColumn<T> {
  /** Identificador único de la columna */
  id: string;
  /** Título del encabezado (renderizado en text-[11px] uppercase tracking-wider) */
  header: string;
  /** Ancho métrico estricto (ej. 'w-24', 'w-32', 'w-48', 'flex-1') */
  width?: string;
  /** Alineación obligatoria: texto/identificadores a la izquierda, badges al centro, cifras monetarias a la derecha */
  align?: LinearColumnAlign;
  /** Función de renderizado personalizado de la celda */
  render?: (row: T, index: number) => React.ReactNode;
  /** Clave de acceso directo a la propiedad de la entidad si no se usa render */
  accessorKey?: keyof T;
  /** Permite ordenar por esta columna */
  sortable?: boolean;
}

/**
 * Acción de la Paleta de Comandos rápida (Ctrl + K)
 */
export interface LinearCommandAction<T> {
  id: string;
  label: string;
  shortcut?: string;
  icon?: React.ComponentType<{ className?: string }>;
  description?: string;
  run: (selectedRows: T[], activeRow: T | null) => void;
  /** Si requiere que haya al menos una fila seleccionada o activa */
  requiresSelection?: boolean;
}

/**
 * Propiedades del componente genérico LinearDataTable
 */
export interface LinearDataTableProps<T extends { id: string | number }> {
  /** Datos a renderizar en la cuadrícula */
  data: T[];
  /** Definición métrica de columnas */
  columns: LinearColumn<T>[];
  /** Clave de búsqueda rápida local */
  searchPlaceholder?: string;
  /** Función extractora de texto para el buscador rápido */
  filterPredicate?: (row: T, query: string) => boolean;
  /** Callback al hacer click o presionar Enter sobre una fila */
  onRowClick?: (row: T) => void;
  /** Callback al presionar el atajo rápido 'C' (Crear) */
  onCreateAction?: () => void;
  /** Acciones registradas para la Paleta de Comandos (Ctrl + K) */
  commandActions?: LinearCommandAction<T>[];
  /** Habilitar selección múltiple (checkboxes quirúrgicos w-3.5 h-3.5) */
  enableMultiSelect?: boolean;
  /** Acciones disponibles en la barra flotante de operaciones masivas */
  batchActions?: Array<{
    id: string;
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    run: (selectedRows: T[]) => void;
    variant?: 'default' | 'danger';
  }>;
  /** Mensaje cuando no hay registros */
  emptyMessage?: string;
  /** Estado de carga */
  isLoading?: boolean;
}
