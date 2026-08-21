import { useEmpresaStore } from '../../infrastructure/state/empresaStore';

export function useCurrencyFormatter() {
  const { config } = useEmpresaStore();

  const formatearMoneda = (valor: number) => {
    return new Intl.NumberFormat(config.moneda.locale, {
      style: 'currency',
      currency: config.moneda.codigo,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(valor);
  };

  return { formatearMoneda, monedaConfig: config.moneda };
}
