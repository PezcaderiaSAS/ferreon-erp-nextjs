import { create, persist, createJSONStorage } from '../../lib/zustand';
import { EmpresaConfig, DEFAULT_EMPRESA_CONFIG } from '../../core/domain/entities/empresa-config';

interface EmpresaState {
  config: EmpresaConfig;
  actualizarConfig: (nuevaConfig: Partial<EmpresaConfig>) => void;
}

export const useEmpresaStore = create<EmpresaState>()(
  persist(
    (set) => ({
      config: DEFAULT_EMPRESA_CONFIG,
      actualizarConfig: (nuevaConfig) => 
        set((state) => ({ config: { ...state.config, ...nuevaConfig } })),
    }),
    {
      name: 'ferreon-empresa-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), 
    }
  )
);
