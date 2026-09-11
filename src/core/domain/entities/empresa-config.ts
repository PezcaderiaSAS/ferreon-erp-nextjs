import { ThemePresetId } from '../theme/theme-tokens';

export interface MonedaConfig {
  codigo: string;
  locale: string;
  simbolo: string;
}

export type ColorPalettePDF = 'SALMON' | 'TEAL' | 'AZUL';
export type TemaColorCorporativo = 'salmon-pastel' | 'cyber-cyan' | 'monochrome';

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
  /** País o Jurisdicción Fiscal de Operación */
  pais?: string;
  /** Tasa de impuesto por defecto en % (ej. 19 para CO, 16 para MX) */
  tasaImpuestoDefecto?: number;
  /** Nombre comercial del impuesto (ej. IVA, IGV, ITBMS) */
  nombreImpuesto?: string;
  /** Si nuevos alquileres inician con el cobro de impuesto preactivado */
  aplicaImpuestoDefecto?: boolean;
  /** Tríada Institucional de Color Corporate Clean */
  temaColor?: TemaColorCorporativo;
  /** Identificador del tema unificado (6 presets + custom) */
  themeId?: ThemePresetId;
  /** Código HEX personalizado (ej: #FF5722) cuando themeId === 'custom' */
  customBrandHex?: string;
  /** Campos legados para retrocompatibilidad */
  paletaPDF?: ColorPalettePDF;
  themeApp?: 'salmon' | 'ocean' | 'slate';
}

export interface PaisLATAMConfig {
  codigoPais: string;
  nombrePais: string;
  monedaCodigo: string;
  nombreImpuesto: string;
  tasaImpuesto: number;
}

export const PAISES_LATAM_PRESETS: PaisLATAMConfig[] = [
  { codigoPais: 'CO', nombrePais: 'Colombia', monedaCodigo: 'COP', nombreImpuesto: 'IVA', tasaImpuesto: 19 },
  { codigoPais: 'MX', nombrePais: 'México', monedaCodigo: 'MXN', nombreImpuesto: 'IVA', tasaImpuesto: 16 },
  { codigoPais: 'PE', nombrePais: 'Perú', monedaCodigo: 'USD', nombreImpuesto: 'IGV', tasaImpuesto: 18 },
  { codigoPais: 'CL', nombrePais: 'Chile', monedaCodigo: 'USD', nombreImpuesto: 'IVA', tasaImpuesto: 19 },
  { codigoPais: 'EC', nombrePais: 'Ecuador', monedaCodigo: 'USD', nombreImpuesto: 'IVA', tasaImpuesto: 15 },
  { codigoPais: 'PA', nombrePais: 'Panamá', monedaCodigo: 'USD', nombreImpuesto: 'ITBMS', tasaImpuesto: 7 },
  { codigoPais: 'INTL', nombrePais: 'Internacional / Dólares', monedaCodigo: 'USD', nombreImpuesto: 'Tax', tasaImpuesto: 0 },
];

export const DEFAULT_EMPRESA_CONFIG: EmpresaConfig = {
  razonSocial: "ALQUILERES SYSTEM",
  nit: "900.854.123-9",
  telefono: "(+57) 310 987 6543 / 601 234 5678",
  email: "contacto@alquileressystem.com",
  direccion: "Avenida Principal # 14 - 34",
  ciudad: "Bogotá D.C., Colombia",
  pais: "Colombia",
  tasaImpuestoDefecto: 19,
  nombreImpuesto: "IVA",
  aplicaImpuestoDefecto: false,
  moneda: {
    codigo: "COP",
    locale: "es-CO",
    simbolo: "$"
  },
  logoBase64: "",
  notasFacturaPDF: "Horario de corte de facturación: 5:00 PM (hora de Bogotá). Los equipos deben ser devueltos limpios y en las mismas condiciones técnicas de entrega.",
  cuentaBancariaInfo: "Pagos y Transferencias: Cuenta de Ahorros Bancolombia No. 123-456789-01 a nombre de ALQUILERES SYSTEM (NIT 900.854.123-9) o Nequi/Daviplata al 3109876543.",
  diasMinimosAlquiler: 1,
  temaColor: 'salmon-pastel',
  themeId: 'salmon',
  paletaPDF: 'SALMON',
  themeApp: 'salmon'
};

