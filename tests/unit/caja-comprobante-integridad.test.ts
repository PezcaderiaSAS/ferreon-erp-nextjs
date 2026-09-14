import { describe, it, expect } from 'vitest';
import { 
  calcularTotalFisicoArqueo, 
  calcularBalanceSesionCaja,
  ConteoDenominaciones
} from '../../src/core/services/calculoCajaArqueo';

export interface ComprobanteArqueoDataModel {
  empresa: {
    razonSocial: string;
    nit: string;
    direccion: string;
    ciudad: string;
    telefono: string;
  };
  sesion: {
    id: string;
    usuarioNombre: string;
    usuarioDocumento?: string;
    supervisorNombre?: string;
    estado: 'ABIERTA' | 'CERRADA';
    fechaApertura: string;
    fechaCierre: string;
    montoApertura: number;
    totalCobrosEfectivo: number;
    totalIngresos: number;
    totalEgresos: number;
    saldoEsperado: number;
    montoCierreFisico: number;
    diferencia: number;
    clasificacionDescuadre: 'CUADRADO' | 'SOBRANTE' | 'FALTANTE';
    motivoDescuadre?: string | null;
    arqueoDetalle: ConteoDenominaciones;
  };
}

/**
 * Función validadora del modelo de datos para generación de comprobantes y PDFs oficiales
 */
export function validarIntegridadComprobanteArqueo(data: ComprobanteArqueoDataModel): {
  esValido: boolean;
  errores: string[];
} {
  const errores: string[] = [];

  // 1. Validación de Cabecera Empresarial
  if (!data.empresa.razonSocial || data.empresa.razonSocial.trim().length < 2) {
    errores.push('Razón social de la empresa faltante o inválida.');
  }
  if (!data.empresa.nit || data.empresa.nit.trim().length < 3) {
    errores.push('NIT de la empresa faltante.');
  }

  // 2. Validación de Sesión y Fechas
  if (!data.sesion.id || data.sesion.id.trim() === '') {
    errores.push('Identificador único de sesión requerido para trazabilidad.');
  }
  if (!data.sesion.fechaApertura || isNaN(Date.parse(data.sesion.fechaApertura))) {
    errores.push('Fecha de apertura inválida.');
  }
  if (data.sesion.estado === 'CERRADA' && (!data.sesion.fechaCierre || isNaN(Date.parse(data.sesion.fechaCierre)))) {
    errores.push('Fecha de cierre requerida para sesiones cerradas.');
  }

  // 3. Validación de Cálculos Numéricos en COP
  const saldoEsperadoCalculado = 
    Math.round(data.sesion.montoApertura) + 
    Math.round(data.sesion.totalCobrosEfectivo) + 
    Math.round(data.sesion.totalIngresos) - 
    Math.round(data.sesion.totalEgresos);

  if (saldoEsperadoCalculado !== Math.round(data.sesion.saldoEsperado)) {
    errores.push(`Discrepancia en saldo esperado: calculado $${saldoEsperadoCalculado} vs reportado $${data.sesion.saldoEsperado}`);
  }

  // 4. Verificación del Conteo Físico por Denominaciones
  const totalFisicoCalculado = calcularTotalFisicoArqueo(data.sesion.arqueoDetalle);
  if (totalFisicoCalculado !== Math.round(data.sesion.montoCierreFisico)) {
    errores.push(`Discrepancia en conteo físico: sumatoria de billetes/monedas $${totalFisicoCalculado} no coincide con monto físico reportado $${data.sesion.montoCierreFisico}`);
  }

  // 5. Verificación de Descuadre
  const balance = calcularBalanceSesionCaja({
    montoApertura: data.sesion.montoApertura,
    totalCobrosEfectivo: data.sesion.totalCobrosEfectivo,
    totalIngresosCaja: data.sesion.totalIngresos,
    totalEgresosCaja: data.sesion.totalEgresos,
    montoFisicoContado: data.sesion.montoCierreFisico
  });

  if (balance.diferencia !== data.sesion.diferencia) {
    errores.push(`Diferencia de arqueo inválida: calculada $${balance.diferencia} vs reportada $${data.sesion.diferencia}`);
  }

  if (balance.clasificacionDescuadre !== data.sesion.clasificacionDescuadre) {
    errores.push(`Clasificación de descuadre errónea: calculada ${balance.clasificacionDescuadre} vs reportada ${data.sesion.clasificacionDescuadre}`);
  }

  // 6. Justificación obligatoria en descuadres
  if (balance.requiereJustificacion && (!data.sesion.motivoDescuadre || data.sesion.motivoDescuadre.trim().length < 3)) {
    errores.push('El comprobante presenta un descuadre sin justificación registrada.');
  }

  return {
    esValido: errores.length === 0,
    errores
  };
}

describe('Validación de Integridad y Veracidad de Comprobantes de Arqueo PDF / Ticket', () => {
  const modeloValido: ComprobanteArqueoDataModel = {
    empresa: {
      razonSocial: 'FerreOn ERP & Maquinarias S.A.S.',
      nit: '901.884.221-5',
      direccion: 'Calle 45 # 22 - 18',
      ciudad: 'Bucaramanga',
      telefono: '(607) 645-1234'
    },
    sesion: {
      id: 'c24d9705-472a-4712-89c6-442673b8a244',
      usuarioNombre: 'Carlos Morales (Cajero Mostrador)',
      usuarioDocumento: '1.098.765.432',
      estado: 'CERRADA',
      fechaApertura: '2026-09-14T08:00:00Z',
      fechaCierre: '2026-09-14T17:00:00Z',
      montoApertura: 100000,
      totalCobrosEfectivo: 350000,
      totalIngresos: 20000,
      totalEgresos: 40000,
      saldoEsperado: 430000, // 100k + 350k + 20k - 40k = 430k
      montoCierreFisico: 430000,
      diferencia: 0,
      clasificacionDescuadre: 'CUADRADO',
      arqueoDetalle: {
        billetes: {
          '100000': 3, // 300,000
          '50000': 2,  // 100,000
          '20000': 1,  // 20,000
          '10000': 1   // 10,000
        },
        monedas: {} // Total: 430,000 COP
      }
    }
  };

  it('debe aprobar con éxito un comprobante con todos los campos, cálculos y firmas correctas', () => {
    const validacion = validarIntegridadComprobanteArqueo(modeloValido);
    expect(validacion.esValido).toBe(true);
    expect(validacion.errores).toEqual([]);
  });

  it('debe detectar y reportar inconsistencia si la sumatoria de billetes no coincide con el físico reportado', () => {
    const modeloInconsistente = JSON.parse(JSON.stringify(modeloValido));
    // Cambiamos el conteo de billetes para que sume 330k en vez de 430k
    modeloInconsistente.sesion.arqueoDetalle.billetes['100000'] = 2; // -100k

    const validacion = validarIntegridadComprobanteArqueo(modeloInconsistente);
    expect(validacion.esValido).toBe(false);
    expect(validacion.errores.some(e => e.includes('Discrepancia en conteo físico'))).toBe(true);
  });

  it('debe exigir motivo de justificación cuando existe un faltante o sobrante', () => {
    const modeloConDescuadre = JSON.parse(JSON.stringify(modeloValido));
    modeloConDescuadre.sesion.montoCierreFisico = 410000; // Faltan 20k
    modeloConDescuadre.sesion.diferencia = -20000;
    modeloConDescuadre.sesion.clasificacionDescuadre = 'FALTANTE';
    modeloConDescuadre.sesion.arqueoDetalle.billetes['20000'] = 0; // Ajusta conteo a 410k
    modeloConDescuadre.sesion.motivoDescuadre = null; // Sin justificación

    const validacion = validarIntegridadComprobanteArqueo(modeloConDescuadre);
    expect(validacion.esValido).toBe(false);
    expect(validacion.errores.some(e => e.includes('justificación'))).toBe(true);
  });

  it('debe aprobar un comprobante con descuadre justificado correctamente', () => {
    const modeloConDescuadreJustificado = JSON.parse(JSON.stringify(modeloValido));
    modeloConDescuadreJustificado.sesion.montoCierreFisico = 410000;
    modeloConDescuadreJustificado.sesion.diferencia = -20000;
    modeloConDescuadreJustificado.sesion.clasificacionDescuadre = 'FALTANTE';
    modeloConDescuadreJustificado.sesion.arqueoDetalle.billetes['20000'] = 0;
    modeloConDescuadreJustificado.sesion.motivoDescuadre = 'Diferencia en cambio de billete de $50.000 entregado en contrato #441';

    const validacion = validarIntegridadComprobanteArqueo(modeloConDescuadreJustificado);
    expect(validacion.esValido).toBe(true);
    expect(validacion.errores).toHaveLength(0);
  });
});
