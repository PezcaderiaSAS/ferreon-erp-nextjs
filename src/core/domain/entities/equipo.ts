export interface Equipo {
  id: string;
  sku: string;
  nombre: string;
  categoria: string;
  estado: 'Disponible' | 'En Alquiler' | 'Mantenimiento';
  peso_gramos: number; // Stored in grams (integers)
  creado_en: Date;
}
