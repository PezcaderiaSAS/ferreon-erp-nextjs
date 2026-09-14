import { describe, it, expect } from 'vitest';
import { 
  calcularTotalFisicoArqueo, 
  calcularBalanceSesionCaja, 
  validarDisponibilidadEgreso,
  ConteoDenominaciones,
  DatosFlujoEfectivoSesion
} from '../../src/core/services/calculoCajaArqueo';

describe('Motor Matemático de Arqueo de Caja y Control de Efectivo POS (COP)', () => {
  describe('1. Cálculo de Conteo Físico por Denominaciones', () => {
    it('debe calcular exactamente 0 si no se ingresan billetes ni monedas', () => {
      const conteoVacio: ConteoDenominaciones = {
        billetes: {},
        monedas: {}
      };
      expect(calcularTotalFisicoArqueo(conteoVacio)).toBe(0);
    });

    it('debe calcular correctamente la sumatoria de billetes colombianos', () => {
      const conteoBilletes: ConteoDenominaciones = {
        billetes: {
          '100000': 3, // 300,000
          '50000': 4,  // 200,000
          '20000': 5,  // 100,000
          '10000': 2,  // 20,000
          '5000': 6,   // 30,000
          '2000': 10   // 20,000
        },
        monedas: {}
      };
      // Total esperado billetes: 670,000 COP
      expect(calcularTotalFisicoArqueo(conteoBilletes)).toBe(670000);
    });

    it('debe calcular correctamente la sumatoria de monedas colombianas', () => {
      const conteoMonedas: ConteoDenominaciones = {
        billetes: {},
        monedas: {
          '1000': 15, // 15,000
          '500': 20,  // 10,000
          '200': 25,  // 5,000
          '100': 30,  // 3,000
          '50': 40    // 2,000
        }
      };
      // Total esperado monedas: 35,000 COP
      expect(calcularTotalFisicoArqueo(conteoMonedas)).toBe(35000);
    });

    it('debe totalizar con precisión la combinación de billetes y monedas', () => {
      const conteoMixto: ConteoDenominaciones = {
        billetes: {
          '50000': 2, // 100,000
          '10000': 1  // 10,000
        },
        monedas: {
          '1000': 5,  // 5,000
          '500': 2    // 1,000
        }
      };
      // Total: 116,000 COP
      expect(calcularTotalFisicoArqueo(conteoMixto)).toBe(116000);
    });

    it('debe ignorar valores negativos o cantidades no numéricas tratándolos de forma segura', () => {
      const conteoInseguro: ConteoDenominaciones = {
        billetes: {
          '100000': -2 as any, // Debe ignorar o tratar como 0
          '50000': 1
        },
        monedas: {
          '500': 4
        }
      };
      expect(calcularTotalFisicoArqueo(conteoInseguro)).toBe(52000);
    });
  });

  describe('2. Balance Teórico y Detección de Descuadres', () => {
    it('debe calcular un arqueo CUADRADO cuando el físico coincide exactamente con el teórico', () => {
      const flujo: DatosFlujoEfectivoSesion = {
        montoApertura: 100000,
        totalCobrosEfectivo: 450000,
        totalIngresosCaja: 50000,
        totalEgresosCaja: 80000,
        montoFisicoContado: 520000 // 100k + 450k + 50k - 80k = 520k
      };

      const balance = calcularBalanceSesionCaja(flujo);

      expect(balance.saldoEsperado).toBe(520000);
      expect(balance.montoFisicoContado).toBe(520000);
      expect(balance.diferencia).toBe(0);
      expect(balance.clasificacionDescuadre).toBe('CUADRADO');
      expect(balance.requiereJustificacion).toBe(false);
    });

    it('debe clasificar FALTANTE cuando el conteo físico es menor al esperado en caja', () => {
      const flujo: DatosFlujoEfectivoSesion = {
        montoApertura: 200000,
        totalCobrosEfectivo: 300000,
        totalIngresosCaja: 0,
        totalEgresosCaja: 50000, // Esperado: 450,000
        montoFisicoContado: 430000 // Faltan 20,000
      };

      const balance = calcularBalanceSesionCaja(flujo);

      expect(balance.saldoEsperado).toBe(450000);
      expect(balance.diferencia).toBe(-20000);
      expect(balance.clasificacionDescuadre).toBe('FALTANTE');
      expect(balance.requiereJustificacion).toBe(true);
    });

    it('debe clasificar SOBRANTE cuando el conteo físico supera el saldo esperado', () => {
      const flujo: DatosFlujoEfectivoSesion = {
        montoApertura: 150000,
        totalCobrosEfectivo: 250000,
        totalIngresosCaja: 0,
        totalEgresosCaja: 0, // Esperado: 400,000
        montoFisicoContado: 415000 // Sobran 15,000
      };

      const balance = calcularBalanceSesionCaja(flujo);

      expect(balance.saldoEsperado).toBe(400000);
      expect(balance.diferencia).toBe(15000);
      expect(balance.clasificacionDescuadre).toBe('SOBRANTE');
      expect(balance.requiereJustificacion).toBe(true);
    });
  });

  describe('3. Validación de Disponibilidad de Efectivo para Egresos Menores', () => {
    it('debe aprobar un egreso cuando hay suficiente efectivo disponible en caja', () => {
      const validacion = validarDisponibilidadEgreso({
        montoApertura: 100000,
        totalCobrosEfectivo: 200000,
        totalIngresosCaja: 20000,
        totalEgresosPrevios: 50000, // Disponible actual: 270,000
        montoEgresoSolicitado: 70000
      });

      expect(validacion.esValido).toBe(true);
      expect(validacion.efectivoDisponible).toBe(270000);
      expect(validacion.saldoRestante).toBe(200000);
    });

    it('debe rechazar un egreso cuando supera el efectivo disponible en caja', () => {
      const validacion = validarDisponibilidadEgreso({
        montoApertura: 50000,
        totalCobrosEfectivo: 30000,
        totalIngresosCaja: 0,
        totalEgresosPrevios: 20000, // Disponible actual: 60,000
        montoEgresoSolicitado: 80000 // Solicita 80,000 -> Faltan 20,000
      });

      expect(validacion.esValido).toBe(false);
      expect(validacion.efectivoDisponible).toBe(60000);
      expect(validacion.error).toContain('insuficiente');
    });
  });
});
