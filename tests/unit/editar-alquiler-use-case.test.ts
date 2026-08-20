import { describe, beforeEach, it, expect, vi, Mocked } from 'vitest';
import { EditarAlquilerUseCase, EditarAlquilerDTO } from "../../src/core/application/use-cases/editar-alquiler.use-case";
import { IAlquilerRepository } from "../../src/core/domain/repositories/alquiler-repository.interface";
import { AlquilerEntity } from "../../src/core/domain/entities/alquiler";

describe('EditarAlquilerUseCase', () => {
  let mockRepo: Mocked<IAlquilerRepository>;
  let useCase: EditarAlquilerUseCase;

  beforeEach(() => {
    mockRepo = {
      findById: vi.fn(),
      save: vi.fn(),
      findAll: vi.fn(),
    } as any;
    useCase = new EditarAlquilerUseCase(mockRepo);
  });

  it('debe reconstruir los totales y el subtotal con valores precisos (sin decimales)', async () => {
    const alquilerMock = new AlquilerEntity(
      'ALQ-123',
      101,
      'CLI-123',
      'Cliente Test',
      'ACTIVO',
      0, 0, 0, 0, 0, 0, 0, 'Efectivo', 'Activa', undefined, undefined, 'sistema'
    );
    mockRepo.findById.mockResolvedValue(alquilerMock);
    mockRepo.save.mockImplementation(async (a) => a);

    const dto: EditarAlquilerDTO = {
      alquilerId: 'ALQ-123',
      fleteEntrega: 35000,
      fleteRecogida: 35000,
      deposito: 50000,
      garantiaMonto: 300000,
      items: [
        {
          itemId: 'EQ-001',
          cantidad: 2,
          tarifaAplicada: 45000,
          pesoKilos: 250,
          diasContratados: 3,
          fechaInicio: '2026-08-19',
          fechaFin: '2026-08-22'
        }
      ]
    };

    const result = await useCase.execute(dto);

    // subtotal línea: 2 * 45000 * 3 = 270000
    expect(result.subtotalEquipos).toBe(270000);
    // fletes = 70000
    // subtotal general = 340000
    expect(result.subtotalGeneral).toBe(340000);
    // total (restando deposito) = 340000 - 50000 = 290000
    expect(result.total).toBe(290000);

    // No decimals check
    expect(Number.isInteger(result.subtotalEquipos)).toBe(true);
    expect(Number.isInteger(result.subtotalGeneral)).toBe(true);
    expect(Number.isInteger(result.total)).toBe(true);
  });

  it('debe arrojar error si se edita en estado FINALIZADO', async () => {
    const alquilerMock = new AlquilerEntity(
      'ALQ-123',
      101,
      'CLI-123',
      'Cliente Test',
      'FINALIZADO',
      0, 0, 0, 0, 0, 0, 0, 'Efectivo', 'Liberada', undefined, undefined, 'sistema'
    );
    mockRepo.findById.mockResolvedValue(alquilerMock);

    const dto: EditarAlquilerDTO = {
      alquilerId: 'ALQ-123',
      deposito: 0,
      garantiaMonto: 0,
      items: [
        {
          itemId: 'EQ-001',
          cantidad: 1,
          tarifaAplicada: 45000,
          pesoKilos: 250,
          diasContratados: 3,
          fechaInicio: '2026-08-19'
        }
      ]
    };

    await expect(useCase.execute(dto)).rejects.toThrow('No se puede editar un alquiler en estado FINALIZADO');
  });
});
