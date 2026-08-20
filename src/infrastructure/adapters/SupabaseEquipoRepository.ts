import { Equipo } from '../../core/domain/entities/equipo';
import { EquipoRepository } from '../../core/domain/repositories/EquipoRepository';
import { createClient } from '../persistence/supabase/client';

export class SupabaseEquipoRepository implements EquipoRepository {
  private supabase = createClient();

  async obtenerTodos(): Promise<Equipo[]> {
    const { data, error } = await this.supabase
      .from('equipos')
      .select('*')
      .order('creado_en', { ascending: false });

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
          sku: equipo.sku,
          nombre: equipo.nombre,
          categoria: equipo.categoria,
          estado: equipo.estado,
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
