export interface MonedaConfig {
  codigo: string;
  locale: string;
  simbolo: string;
}

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
}

export const DEFAULT_EMPRESA_CONFIG: EmpresaConfig = {
  razonSocial: "ALQUILERES & MAQUINARIA S.A.S.",
  nit: "900.854.123-9",
  telefono: "(+57) 310 987 6543 / 601 234 5678",
  email: "gerencia@alquilereserp.com",
  direccion: "Avenida Las Américas # 68-45",
  ciudad: "Bogotá D.C., Colombia",
  moneda: {
    codigo: "COP",
    locale: "es-CO",
    simbolo: "$"
  },
  logoBase64: "",
  notasFacturaPDF: "Horario de corte de facturación: 5:00 PM (hora de Bogotá). Los equipos deben ser devueltos limpios y en las mismas condiciones técnicas de entrega.",
  cuentaBancariaInfo: "Pagos y Transferencias: Cuenta de Ahorros Bancolombia No. 123-456789-01 a nombre de ALQUILERES & MAQUINARIA S.A.S. (NIT 900.854.123-9) o Nequi/Daviplata al 3109876543."
};
