import { describe, it, expect } from 'vitest';
import { 
  evaluarSemaforoVencimientoCXP,
  procesarAbonoCuentaPagar,
  validarEgresoCajaParaAbono,
  generarAsientoContableAbonoProveedor,
  CuentaPagarEstado
} from '../../src/core/services/cartera-proveedores.service';

describe('Cartera de Proveedores & Cuentas por Pagar (CXP)', () => {
  describe('evaluarSemaforoVencimientoCXP', () => {
    it('debe retornar AL_DIA si faltan más de 5 días para el vencimiento', () => {
      const fechaActual = '2026-09-17';
      const fechaVencimiento = '2026-09-30'; // 13 días restantes
      const resultado = evaluarSemaforoVencimientoCXP(fechaVencimiento, fechaActual);

      expect(resultado.estadoSemaforo).toBe('AL_DIA');
      expect(resultado.diasRestantes).toBe(13);
      expect(resultado.diasMora).toBe(0);
    });

    it('debe retornar POR_VENCER si faltan entre 0 y 5 días', () => {
      const fechaActual = '2026-09-17';
      const fechaVencimiento = '2026-09-20'; // 3 días restantes
      const resultado = evaluarSemaforoVencimientoCXP(fechaVencimiento, fechaActual);

      expect(resultado.estadoSemaforo).toBe('POR_VENCER');
      expect(resultado.diasRestantes).toBe(3);
      expect(resultado.diasMora).toBe(0);
    });

    it('debe retornar VENCIDA y contabilizar días de mora si la fecha ya expiró', () => {
      const fechaActual = '2026-09-17';
      const fechaVencimiento = '2026-09-10'; // 7 días vencida
      const resultado = evaluarSemaforoVencimientoCXP(fechaVencimiento, fechaActual);

      expect(resultado.estadoSemaforo).toBe('VENCIDA');
      expect(resultado.diasRestantes).toBe(0);
      expect(resultado.diasMora).toBe(7);
    });
  });

  describe('procesarAbonoCuentaPagar', () => {
    it('debe actualizar el saldo y marcar estado ABONADA_PARCIAL en abonos parciales', () => {
      const cuentaActual = {
        id: 'cxp-001',
        montoTotal: 5000000,
        saldoPendiente: 5000000,
        estado: 'PENDIENTE' as CuentaPagarEstado
      };

      const resultado = procesarAbonoCuentaPagar(cuentaActual, 2000000);

      expect(resultado.nuevoSaldoPendiente).toBe(3000000);
      expect(resultado.nuevoEstado).toBe('ABONADA_PARCIAL');
      expect(resultado.totalAbonadoAcumulado).toBe(2000000);
    });

    it('debe saldar completamente la cuenta y marcar estado PAGADA si el abono cubre el total restante', () => {
      const cuentaActual = {
        id: 'cxp-001',
        montoTotal: 5000000,
        saldoPendiente: 3000000,
        estado: 'ABONADA_PARCIAL' as CuentaPagarEstado
      };

      const resultado = procesarAbonoCuentaPagar(cuentaActual, 3000000);

      expect(resultado.nuevoSaldoPendiente).toBe(0);
      expect(resultado.nuevoEstado).toBe('PAGADA');
      expect(resultado.totalAbonadoAcumulado).toBe(5000000);
    });

    it('debe rechazar abonos que superen el saldo pendiente', () => {
      const cuentaActual = {
        id: 'cxp-001',
        montoTotal: 5000000,
        saldoPendiente: 1500000,
        estado: 'ABONADA_PARCIAL' as CuentaPagarEstado
      };

      expect(() => {
        procesarAbonoCuentaPagar(cuentaActual, 2000000);
      }).toThrow('El monto del abono ($2.000.000) no puede exceder el saldo pendiente ($1.500.000)');
    });

    it('debe rechazar abonos de valor cero o negativo', () => {
      const cuentaActual = {
        id: 'cxp-001',
        montoTotal: 5000000,
        saldoPendiente: 5000000,
        estado: 'PENDIENTE' as CuentaPagarEstado
      };

      expect(() => {
        procesarAbonoCuentaPagar(cuentaActual, 0);
      }).toThrow('El monto del abono debe ser un entero positivo mayor a cero');

      expect(() => {
        procesarAbonoCuentaPagar(cuentaActual, -50000);
      }).toThrow('El monto del abono debe ser un entero positivo mayor a cero');
    });
  });

  describe('validarEgresoCajaParaAbono', () => {
    it('debe validar exitosamente cuando hay sesión de caja abierta y saldo suficiente', () => {
      const validacion = validarEgresoCajaParaAbono({
        metodoPago: 'EFECTIVO',
        montoAbono: 500000,
        sesionCajaActiva: { id: 'caja-123', saldoEfectivoDisponible: 1200000 }
      });

      expect(validacion.esValido).toBe(true);
    });

    it('debe fallar si el método es EFECTIVO y no hay sesión de caja activa', () => {
      const validacion = validarEgresoCajaParaAbono({
        metodoPago: 'EFECTIVO',
        montoAbono: 500000,
        sesionCajaActiva: null
      });

      expect(validacion.esValido).toBe(false);
      expect(validacion.error).toContain('Se requiere una sesión de caja activa');
    });

    it('debe fallar si el efectivo disponible en caja es insuficiente', () => {
      const validacion = validarEgresoCajaParaAbono({
        metodoPago: 'EFECTIVO',
        montoAbono: 800000,
        sesionCajaActiva: { id: 'caja-123', saldoEfectivoDisponible: 300000 }
      });

      expect(validacion.esValido).toBe(false);
      expect(validacion.error).toContain('Fondos en efectivo insuficientes');
    });

    it('debe permitir pagos por TRANSFERENCIA sin exigir caja de mostrador', () => {
      const validacion = validarEgresoCajaParaAbono({
        metodoPago: 'TRANSFERENCIA',
        montoAbono: 2500000,
        sesionCajaActiva: null,
        referenciaBancaria: 'TRX-987654'
      });

      expect(validacion.esValido).toBe(true);
    });
  });

  describe('generarAsientoContableAbonoProveedor', () => {
    it('debe generar partida doble balanceada (Débitos = Créditos) para abonos a proveedores', () => {
      const asiento = generarAsientoContableAbonoProveedor({
        transactionId: 'txn-777',
        montoAbono: 1500000,
        cuentaProveedoresPasivoId: 'acc-cxp-2205',
        cuentaTesoreriaOrigenId: 'acc-caja-1105',
        numeroComprobante: 'CE-2026-0001',
        proveedorNombre: 'Andamios del Valle S.A.S.'
      });

      expect(asiento).toHaveLength(2);

      // Débito a Proveedores (disminución de pasivo)
      expect(asiento[0].account_id).toBe('acc-cxp-2205');
      expect(asiento[0].debit).toBe(1500000);
      expect(asiento[0].credit).toBe(0);

      // Crédito a Caja/Banco (disminución de activo tesorería)
      expect(asiento[1].account_id).toBe('acc-caja-1105');
      expect(asiento[1].debit).toBe(0);
      expect(asiento[1].credit).toBe(1500000);

      // Suma Débito === Suma Crédito
      const sumaDebitos = asiento.reduce((acc, it) => acc + it.debit, 0);
      const sumaCreditos = asiento.reduce((acc, it) => acc + it.credit, 0);
      expect(sumaDebitos).toBe(sumaCreditos);
    });
  });
});
