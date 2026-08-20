export interface Cliente {
  id: string;
  nit: string;
  nombre: string;
  contacto: string;
  nivel_riesgo: 'Bajo' | 'Medio' | 'Alto';
  creado_en: Date;
}
