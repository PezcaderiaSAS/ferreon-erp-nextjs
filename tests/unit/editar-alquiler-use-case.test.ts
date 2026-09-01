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

  it('debe reconstruir los totalEstimadoes y el subtotalEstimado con valores precisos (sin decimales)', async () => {
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
          
          fechaFinEstimada: '2026-08-22',
          fechaInicio: '2026-08-19',
          // fechaFin: '2026-08-22'
        }
      ]
    };

    const result = await useCase.execute(dto);

    // subtotalEstimado línea: 2 * 45000 * 3 = 270000
    expect(result.subtotalEquiposEstimado).toBe(270000);
    // fletes = 70000
    // subtotalEstimado general = 340000
    expect(result.subtotalGeneralEstimado).toBe(340000);
    // totalEstimado (restando deposito) = 340000 - 50000 = 290000
    expect(result.totalEstimado).toBe(290000);

    // No decimals check
    expect(Number.isInteger(result.subtotalEquiposEstimado)).toBe(true);
    expect(Number.isInteger(result.subtotalGeneralEstimado)).toBe(true);
    expect(Number.isInteger(result.totalEstimado)).toBe(true);
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
          
          fechaFinEstimada: new Date().toISOString(),
          fechaInicio: '2026-08-19'
        }
      ]
    };

    await expect(useCase.execute(dto)).rejects.toThrow('No se puede editar un alquiler en estado FINALIZADO');
  });
});
