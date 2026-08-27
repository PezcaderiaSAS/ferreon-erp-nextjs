import { IClienteRepository, HistorialCompletoCliente } from '../../core/domain/repositories/cliente-repository.interface';
import { ClienteEntity } from '../../core/domain/entities/cliente';
import { createClient } from '../persistence/supabase/client';

export class SupabaseClienteRepository implements IClienteRepository {
  private supabase = createClient();

  async findById(id: string): Promise<ClienteEntity | null> {
    const { data, error } = await this.supabase
      .from('clientes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw new Error(`Error fetching cliente by ID: ${error.message}`);
    }

    if (!data) return null;
    return this.mapToEntity(data);
  }

  async findByNit(nitCedula: string): Promise<ClienteEntity | null> {
    const { data, error } = await this.supabase
      .from('clientes')
      .select('*')
      .eq('nit_cedula', nitCedula)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Error fetching cliente by NIT: ${error.message}`);
    }

    if (!data) return null;
    return this.mapToEntity(data);
  }

  async findAll(): Promise<ClienteEntity[]> {
    const { data, error } = await this.supabase
      .from('clientes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error fetching clientes: ${error.message}`);
    }

    return (data || []).map(this.mapToEntity);
  }

  async save(cliente: ClienteEntity): Promise<ClienteEntity> {
    const { data, error } = await this.supabase
      .from('clientes')
      .insert([{
        nit_cedula: cliente.nitCedula,
        nombre: cliente.nombre,
        telefono: cliente.telefono,
        email: cliente.email,
        direccion: cliente.direccion,
        activo: cliente.activo
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Error saving cliente: ${error.message}`);
    }

    return this.mapToEntity(data);
  }

  async update(cliente: ClienteEntity): Promise<ClienteEntity> {
    const { data, error } = await this.supabase
      .from('clientes')
      .update({
        nit_cedula: cliente.nitCedula,
        nombre: cliente.nombre,
        telefono: cliente.telefono,
        email: cliente.email,
        direccion: cliente.direccion,
        activo: cliente.activo
      })
      .eq('id', cliente.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating cliente: ${error.message}`);
    }

    return this.mapToEntity(data);
  }

  async getHistorialCompleto(id: string): Promise<HistorialCompletoCliente | null> {
    throw new Error('Not implemented yet in frontend Supabase adapter');
  }

  private mapToEntity(row: any): ClienteEntity {
    return new ClienteEntity(
      row.id,
      row.nit_cedula,
      row.nombre,
      row.telefono,
      row.email,
      row.direccion,
      row.activo,
      row.created_at ? new Date(row.created_at) : undefined,
      row.updated_at ? new Date(row.updated_at) : undefined,
      row.deleted_at ? new Date(row.deleted_at) : null,
      row.deleted_by
    );
  }
}
