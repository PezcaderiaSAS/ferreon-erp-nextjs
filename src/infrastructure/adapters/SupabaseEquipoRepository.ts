import { Equipo } from '../../core/domain/entities/equipo';
import { EquipoRepository } from '../../core/domain/repositories/EquipoRepository';
import { createClient } from '../persistence/supabase/client';

export class SupabaseEquipoRepository implements EquipoRepository {
  private supabase = createClient();

  async obtenerTodos(): Promise<Equipo[]> {
    const { data, error } = await this.supabase
      .from('equipos')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.error('Error fetching equipos:', error);
      throw new Error(error.message);
    }

    return data as Equipo[];
  }

  async crear(equipo: Omit<Equipo, 'id' | 'creado_en'>): Promise<Equipo> {
    const { data, error } = await this.supabase
      .from('equipos')
      .insert([
        {
          codigo: equipo.sku || (equipo as any).codigo,
          nombre: equipo.nombre,
          categoria: equipo.categoria,
          tarifa_diaria: (equipo as any).tarifa_diaria ?? (equipo as any).tarifaDiaria ?? 0,
          stock_total: (equipo as any).stock_total ?? (equipo as any).stockTotal ?? 0,
          stock_disponible: (equipo as any).stock_disponible ?? (equipo as any).stockDisponible ?? 0,
          stock_en_obra: 0,
          stock_mantenimiento: 0,
          estado: 'Activo',
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating equipo:', error);
      throw new Error(error.message);
    }

    return data as Equipo;
  }
}
