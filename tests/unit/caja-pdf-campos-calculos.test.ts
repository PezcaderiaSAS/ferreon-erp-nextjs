import { describe, it, expect } from 'vitest';
import {
  construirComprobanteArqueoCompleto,
  validarCamposComprobanteArqueo,
  validarCalculosComprobanteArqueo,
  generarHashAuditoriaComprobante,
  generarHTMLComprobanteArqueo,
  ComprobanteArqueoCompleto
} from '@/core/services/calculoCajaArqueo';

describe('Auditoría Integral de Comprobante PDF de Arqueo y Cierre de Caja', () => {
  const datosSesionBase = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    usuarioId: 'usr-cajero-01',
    cajeroNombre: 'Carlos Andrés Rodríguez',
    cajeroEmail: 'carlos.rodriguez@ferreon.com',
    sucursal: 'Bodega Principal - Centro',
    fechaApertura: '2026-09-14T08:00:00Z',
    fechaCierre: '2026-09-14T17:30:00Z',
    estado: 'CERRADA' as const,
    montoApertura: 200000,
    observaciones: 'Turno sin anomalías matutinas.',
    arqueoDetalle: {
      billetes: {
        '100000': 3, // $300.000
        '50000': 4,  // $200.000
        '20000': 5,  // $100.000
        '10000': 10, // $100.000
        '5000': 8,   // $40.000
        '2000': 10   // $20.000
      }, // Subtotal billetes = $760.000
      monedas: {
        '1000': 15, // $15.000
        '500': 20,  // $10.000
        '200': 15,  // $3.000
        '100': 15,  // $1.500
        '50': 10    // $500
      } // Subtotal monedas = $30.000
    } // Total Físico = $790.000
  };

  const movimientosMock = [
    {
      id: 'mov-1',
      tipo: 'INGRESO',
      monto: 50000,
      concepto: 'Inyección de sencillo billetes pequeños',
      created_at: '2026-09-14T10:15:00Z'
    },
    {
      id: 'mov-2',
      tipo: 'EGRESO',
      monto: 35000,
      concepto: 'Compra de bolsas y cinta para embalaje',
      beneficiario: 'Papelería El Sol',
      created_at: '2026-09-14T12:45:00Z'
    },
    {
      id: 'mov-3',
      tipo: 'EGRESO',
      monto: 25000,
      concepto: 'Transporte de mensajería entrega urgente',
      beneficiario: 'Servicio Domicilios Express',
      created_at: '2026-09-14T15:20:00Z'
    }
  ];

  // Flujo:
  // Apertura: $200.000
  // Cobros: $600.000
  // Ingresos: $50.000
  // Egresos: $35.000 + $25.000 = $60.000
  // Saldo Esperado = 200.000 + 600.000 + 50.000 - 60.000 = $790.000
  // Físico = $790.000
  // Diferencia = $0 (CUADRADO)

  it('1. Debe construir el comprobante completo con todos los campos y cálculos calculados', () => {
    const comprobante = construirComprobanteArqueoCompleto({
      sesion: datosSesionBase,
      totalCobrosEfectivo: 600000,
      cantidadCobros: 8,
      movimientos: movimientosMock
    });

    expect(comprobante).toBeDefined();
    expect(comprobante.empresa.razonSocial).toBe('FERREON ERP & APPFRIOS PEZCA');
    expect(comprobante.empresa.nit).toBe('901.884.221-5');
    expect(comprobante.sesion.cajeroNombre).toBe('Carlos Andrés Rodríguez');
    expect(comprobante.flujo.montoApertura).toBe(200000);
    expect(comprobante.flujo.totalCobrosEfectivo).toBe(600000);
    expect(comprobante.flujo.cantidadCobros).toBe(8);
    expect(comprobante.flujo.totalIngresosCaja).toBe(50000);
    expect(comprobante.flujo.totalEgresosCaja).toBe(60000);
    expect(comprobante.flujo.saldoEsperado).toBe(790000);

    expect(comprobante.arqueoFisico.subtotalBilletes).toBe(760000);
    expect(comprobante.arqueoFisico.subtotalMonedas).toBe(30000);
    expect(comprobante.arqueoFisico.totalFisico).toBe(790000);

    expect(comprobante.cuadre.diferencia).toBe(0);
    expect(comprobante.cuadre.clasificacion).toBe('CUADRADO');
    expect(comprobante.hashAuditoria).toMatch(/^ARQ-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  });

  it('2. Debe validar la presencia de cada campo requerido en el comprobante', () => {
    const comprobante = construirComprobanteArqueoCompleto({
      sesion: datosSesionBase,
      totalCobrosEfectivo: 600000,
      cantidadCobros: 8,
      movimientos: movimientosMock
    });

    const resultadoValidacion = validarCamposComprobanteArqueo(comprobante);
    expect(resultadoValidacion.esValido).toBe(true);
    expect(resultadoValidacion.errores).toHaveLength(0);
  });

  it('3. Debe rechazar el comprobante si faltan campos obligatorios de empresa o sesión', () => {
    const comprobanteBase = construirComprobanteArqueoCompleto({
      sesion: datosSesionBase
    });

    const comprobanteIncompleto: ComprobanteArqueoCompleto = {
      ...comprobanteBase,
      empresa: {
        ...comprobanteBase.empresa,
        razonSocial: '',
        nit: ''
      },
      sesion: {
        ...comprobanteBase.sesion,
        id: '',
        cajeroNombre: ''
      }
    };

    const resultado = validarCamposComprobanteArqueo(comprobanteIncompleto);
    expect(resultado.esValido).toBe(false);
    expect(resultado.errores.some(e => e.includes('Razón social'))).toBe(true);
    expect(resultado.errores.some(e => e.includes('NIT'))).toBe(true);
    expect(resultado.errores.some(e => e.includes('ID de la sesión'))).toBe(true);
    expect(resultado.errores.some(e => e.includes('Nombre del cajero'))).toBe(true);
  });

  it('4. Debe exigir justificación obligatoria si el cuadre presenta diferencia (descuadre)', () => {
    // Sesión con faltante pero sin justificación
    const comprobanteConFaltante = construirComprobanteArqueoCompleto({
      sesion: {
        ...datosSesionBase,
        motivoDescuadre: '' // Sin justificación
      },
      totalCobrosEfectivo: 650000, // Saldo esperado será 840.000 vs Físico 790.000 -> Faltante $50.000
      movimientos: movimientosMock
    });

    const validacionCampos = validarCamposComprobanteArqueo(comprobanteConFaltante);
    expect(validacionCampos.esValido).toBe(false);
    expect(validacionCampos.errores.some(e => e.includes('justificación'))).toBe(true);
  });

  it('5. Debe verificar matemáticamente cada cálculo del desglose de billetes', () => {
    const comprobante = construirComprobanteArqueoCompleto({
      sesion: datosSesionBase,
      totalCobrosEfectivo: 600000,
      movimientos: movimientosMock
    });

    const validacionCalculos = validarCalculosComprobanteArqueo(comprobante);
    expect(validacionCalculos.esValido).toBe(true);
    expect(validacionCalculos.inconsistencias).toHaveLength(0);
    expect(validacionCalculos.detallesVerificacion.sumaBilletesCorrecta).toBe(true);
    expect(validacionCalculos.detallesVerificacion.sumaMonedasCorrecta).toBe(true);
    expect(validacionCalculos.detallesVerificacion.totalFisicoCorrecto).toBe(true);
    expect(validacionCalculos.detallesVerificacion.saldoEsperadoCorrecto).toBe(true);
    expect(validacionCalculos.detallesVerificacion.diferenciaCorrecta).toBe(true);
    expect(validacionCalculos.detallesVerificacion.clasificacionCoherente).toBe(true);
  });

  it('6. Debe detectar una inconsistencia matemática si un subtotal de billetes fue alterado', () => {
    const comprobante = construirComprobanteArqueoCompleto({
      sesion: datosSesionBase,
      totalCobrosEfectivo: 600000,
      movimientos: movimientosMock
    });

    // Simulamos alteración de cálculo
    comprobante.arqueoFisico.billetes[0].subtotal = 999999; // Corrupción

    const validacion = validarCalculosComprobanteArqueo(comprobante);
    expect(validacion.esValido).toBe(false);
    expect(validacion.inconsistencias.some(i => i.includes('Subtotal billete'))).toBe(true);
  });

  it('7. Debe detectar una inconsistencia si el saldo esperado no coincide con la fórmula de flujo', () => {
    const comprobante = construirComprobanteArqueoCompleto({
      sesion: datosSesionBase,
      totalCobrosEfectivo: 600000,
      movimientos: movimientosMock
    });

    // Alteramos el saldo esperado de forma artificial
    comprobante.flujo.saldoEsperado = 500000; // Erróneo frente a 790.000

    const validacion = validarCalculosComprobanteArqueo(comprobante);
    expect(validacion.esValido).toBe(false);
    expect(validacion.inconsistencias.some(i => i.includes('Saldo esperado inconsistente'))).toBe(true);
  });

  it('8. Debe calcular correctamente sobrante cuando el dinero contado supera el saldo esperado', () => {
    const comprobante = construirComprobanteArqueoCompleto({
      sesion: {
        ...datosSesionBase,
        motivoDescuadre: 'Cliente dejó propina voluntaria no registrada.'
      },
      totalCobrosEfectivo: 570000, // Esperado: 200k + 570k + 50k - 60k = 760k. Físico = 790k -> Sobrante $30.000
      movimientos: movimientosMock
    });

    expect(comprobante.cuadre.diferencia).toBe(30000);
    expect(comprobante.cuadre.clasificacion).toBe('SOBRANTE');

    const validacion = validarCalculosComprobanteArqueo(comprobante);
    expect(validacion.esValido).toBe(true);
    expect(validacion.detallesVerificacion.clasificacionCoherente).toBe(true);
  });

  it('9. Debe generar el HTML para impresión tanto en formato Ticket 80mm como Hoja Carta', () => {
    const comprobante = construirComprobanteArqueoCompleto({
      sesion: datosSesionBase,
      totalCobrosEfectivo: 600000,
      movimientos: movimientosMock
    });

    const htmlTicket = generarHTMLComprobanteArqueo(comprobante, 'TICKET_80MM');
    const htmlCarta = generarHTMLComprobanteArqueo(comprobante, 'CARTA');

    // Verificar contenido esencial en ambos formatos
    expect(htmlTicket).toContain('80mm');
    expect(htmlTicket).toContain('FERREON ERP & APPFRIOS PEZCA');
    expect(htmlTicket).toContain('901.884.221-5');
    expect(htmlTicket).toContain('Carlos Andrés Rodríguez');
    expect(htmlTicket).toContain(comprobante.hashAuditoria);

    expect(htmlCarta).toContain('ACTA OFICIAL DE ARQUEO Y CIERRE POS');
    expect(htmlCarta).toContain('Liquidación del Flujo de Efectivo');
    expect(htmlCarta).toContain('Conteo Físico Real');
    expect(htmlCarta).toContain('Entregado por');
    expect(htmlCarta).toContain('Recibido por');
  });

  it('10. Debe generar hashes de auditoría determinísticos e idénticos para datos idénticos', () => {
    const hash1 = generarHashAuditoriaComprobante('sesion-abc', '2026-09-14T17:00:00Z', 500000, 0);
    const hash2 = generarHashAuditoriaComprobante('sesion-abc', '2026-09-14T17:00:00Z', 500000, 0);
    const hashDiferente = generarHashAuditoriaComprobante('sesion-abc', '2026-09-14T17:00:00Z', 500001, 1);

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hashDiferente);
    expect(hash1.startsWith('ARQ-SESI')).toBe(true);
  });
});
