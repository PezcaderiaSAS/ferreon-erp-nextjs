import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useLedgerStore } from '../../src/infrastructure/state/ledgerStore';
import { generarIdempotencyKey } from '../../src/core/domain/entities/ledger';

describe('Validación Inmutable y Partida Doble del Ledger', () => {
  beforeEach(() => {
    // Resetear el store antes de cada prueba
    useLedgerStore.setState({
      accounts: [],
      wallets: [],
      isLoading: false,
      error: null
    });
  });

  describe('Partida Doble (Débito = Crédito)', () => {
    it('debe rechazar transacciones donde la suma no sea 0', async () => {
      const { procesarTransaccionOptimista } = useLedgerStore.getState();
      
      const entradasDescuadradas = [
        { account_id: 'caja-1', amount: 50000 },
        { account_id: 'ingreso-1', amount: -40000 } // Descuadre de 10000
      ];

      const resultado = await procesarTransaccionOptimista('Prueba Descuadre', 'ref-123', entradasDescuadradas);
      
      expect(resultado).toBe(false);
      expect(useLedgerStore.getState().error).toBe('La transacción está descuadrada.');
    });

    it('debe aceptar transacciones donde la suma sea exactamente 0', async () => {
      const { procesarTransaccionOptimista } = useLedgerStore.getState();
      
      const entradasCuadradas = [
        { account_id: 'caja-1', amount: 50000 },
        { account_id: 'ingreso-1', amount: -50000 } // Cuadre perfecto
      ];

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const resultado = await procesarTransaccionOptimista('Prueba Cuadrada', 'ref-123', entradasCuadradas);
      
      expect(resultado).toBe(true);
      expect(useLedgerStore.getState().error).toBeNull();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Idempotencia y Referencias', () => {
    it('debe generar llaves de idempotencia únicas por día para la misma operación', () => {
      const key1 = generarIdempotencyKey('ledger', 'insert', 'id-unico');
      const today = new Date().toISOString().split('T')[0];
      
      expect(key1).toBe(`ledger_insert_id-unico_${today}`);
    });
  });

  describe('Cálculo de ROI (Mock)', () => {
    it('debe calcular correctamente el porcentaje de retorno basado en ingresos y costos', () => {
      const { getROI } = useLedgerStore.getState();
      const roiData = getROI('equipo-test');

      // 1500000 Ingresos, 450000 Costos -> Ganancia: 1050000
      // ROI % = (1050000 / 450000) * 100 = 233.33%
      expect(roiData.ingresos).toBe(1500000);
      expect(roiData.costos).toBe(450000);
      expect(roiData.roi).toBeCloseTo(233.33, 2);
    });
  });
});
