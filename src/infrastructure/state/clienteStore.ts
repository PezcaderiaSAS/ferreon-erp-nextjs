import { create } from 'zustand';
import { Cliente } from '../../core/domain/entities/Cliente';

interface ClienteState {
  clientes: Cliente[];
  agregarCliente: (cliente: Cliente) => void;
}

export const useClienteStore = create<ClienteState>((set) => ({
  clientes: [
    {
      id: '1',
      nit: '900.123.456-1',
      nombre: 'Constructora Omega S.A.',
      contacto: '555-0102',
      nivel_riesgo: 'Bajo',
      creado_en: new Date()
    }
  ],
  agregarCliente: (cliente) => set((state) => ({ clientes: [...state.clientes, cliente] })),
}));
