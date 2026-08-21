import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Cliente } from '../../core/domain/entities/cliente';

interface ClienteState {
  clientes: Cliente[];
  setClientes: (clientes: Cliente[]) => void;
  agregarCliente: (cliente: Cliente) => void;
  updateCliente: (cliente: Cliente) => void;
}

const CLIENTES_INICIALES: Cliente[] = [
  {
    id: '1',
    nit: '900.123.456-1',
    nombre: 'Constructora Omega S.A.',
    contacto: '555-0102',
    email: 'contacto@constructoraomega.com',
    direccion: 'Calle 100 # 15-20, Bogotá',
    nivel_riesgo: 'Bajo',
    creado_en: new Date()
  },
  {
    id: '2',
    nit: '800.987.654-3',
    nombre: 'Ingeniería & Proyectos Andes',
    contacto: '555-0899',
    email: 'operaciones@andesing.com',
    direccion: 'Av. El Dorado # 68C-51, Bogotá',
    nivel_riesgo: 'Medio',
    creado_en: new Date()
  },
  {
    id: '3',
    nit: '71.234.567',
    nombre: 'Juan Carlos Rodríguez',
    contacto: '310-555-4321',
    email: 'jcrodriguez@gmail.com',
    direccion: 'Carrera 7 # 45-12, Bogotá',
    nivel_riesgo: 'Bajo',
    creado_en: new Date()
  }
];

export const useClienteStore = create<ClienteState>()(
  persist(
    (set) => ({
      clientes: CLIENTES_INICIALES,
      setClientes: (clientes) => set({ clientes }),
      agregarCliente: (cliente) => set((state) => ({ clientes: [...state.clientes, cliente] })),
      updateCliente: (cliente) => set((state) => ({
        clientes: state.clientes.map((c) => (c.id === cliente.id ? cliente : c))
      }))
    }),
    {
      name: 'cliente-storage',
      partialize: (state) => ({ clientes: state.clientes })
    }
  )
);
