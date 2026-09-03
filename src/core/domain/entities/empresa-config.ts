import { ThemePresetId } from '../theme/theme-tokens';

export interface MonedaConfig {
  codigo: string;
  locale: string;
  simbolo: string;
}

export type ColorPalettePDF = 'SALMON' | 'TEAL' | 'AZUL';

export interface EmpresaConfig {
  razonSocial: string;
  nit: string;
  telefono: string;
  email: string;
  direccion: string;
  ciudad: string;
  moneda: MonedaConfig;
  logoBase64?: string;
  notasFacturaPDF?: string;
  cuentaBancariaInfo?: string;
  diasMinimosAlquiler?: number;
  /** Identificador del tema unificado (6 presets + custom) */
  themeId?: ThemePresetId;
  /** Código HEX personalizado (ej: #FF5722) cuando themeId === 'custom' */
  customBrandHex?: string;
  /** Campos legados para retrocompatibilidad */
  paletaPDF?: ColorPalettePDF;
  themeApp?: 'salmon' | 'ocean' | 'slate';
}

export const DEFAULT_EMPRESA_CONFIG: EmpresaConfig = {
  razonSocial: "ALQUILERES SYSTEM",
  nit: "900.854.123-9",
  telefono: "(+57) 310 987 6543 / 601 234 5678",
  email: "contacto@alquileressystem.com",
  direccion: "Avenida Principal # 14 - 34",
  ciudad: "Bogotá D.C., Colombia",
  moneda: {
    codigo: "COP",
    locale: "es-CO",
    simbolo: "$"
  },
  logoBase64: "",
  notasFacturaPDF: "Horario de corte de facturación: 5:00 PM (hora de Bogotá). Los equipos deben ser devueltos limpios y en las mismas condiciones técnicas de entrega.",
  cuentaBancariaInfo: "Pagos y Transferencias: Cuenta de Ahorros Bancolombia No. 123-456789-01 a nombre de ALQUILERES SYSTEM (NIT 900.854.123-9) o Nequi/Daviplata al 3109876543.",
  diasMinimosAlquiler: 1,
  themeId: 'salmon',
  paletaPDF: 'SALMON',
  themeApp: 'salmon'
};

