'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Printer,
  ArrowRightCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  AlertTriangle,
  Building,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { useEmpresaStore } from '@/infrastructure/state/empresaStore';
import { useClienteStore } from '@/infrastructure/state/clienteStore';
import { useBodegaStore } from '@/infrastructure/state/bodegaStore';
import {
  obtenerCotizacionesAction,
  convertirCotizacionAContratoAction,
  actualizarEstadoCotizacionAction,
} from '@/app/actions/cotizaciones';
import { CrearCotizacionModal } from '@/app/components/cotizaciones/CrearCotizacionModal';
import { VisorDocumentoPDFModal } from '@/app/components/pdf/VisorDocumentoPDFModal';
import { DocumentoPDFPayload } from '@/core/services/pdf-factura-generator.service';
import Link from 'next/link';

export default function CotizacionesPage() {
  const { config: empresaConfig } = useEmpresaStore();
  const [cotizaciones, setCotizaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [busqueda, setBusqueda] = useState<string>('');
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');

  // Modales
  const [showCrearModal, setShowCrearModal] = useState<boolean>(false);
  const [documentoParaPDF, setDocumentoParaPDF] = useState<DocumentoPDFPayload | null>(null);
  const [procesandoId, setProcesandoId] = useState<string | null>(null);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const [res, cliRes, eqRes] = await Promise.allSettled([
        obtenerCotizacionesAction(),
        fetch('/api/clientes', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)),
        fetch('/api/equipos', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)),
      ]);

      if (res.status === 'fulfilled' && res.value.success && Array.isArray(res.value.data)) {
        setCotizaciones(res.value.data);
      }
      if (cliRes.status === 'fulfilled' && cliRes.value?.success && Array.isArray(cliRes.value.data)) {
        useClienteStore.getState().setClientes(cliRes.value.data);
      }
      if (eqRes.status === 'fulfilled' && eqRes.value?.success && Array.isArray(eqRes.value.data)) {
        useBodegaStore.getState().setEquipos(eqRes.value.data);
      }
    } catch (err) {
      console.error('Error cargando cotizaciones:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const formatearCOP = (valor: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(Math.round(valor));
  };

  // Filtrado y Búsqueda
  const cotizacionesFiltradas = useMemo(() => {
    return cotizaciones.filter((cot) => {
      const coincideEstado =
        filtroEstado === 'TODOS' ? true : cot.estado === filtroEstado;
      const texto = `${cot.consecutivo} ${cot.cliente_nombre} ${cot.obra_nombre || ''}`.toLowerCase();
      const coincideBusqueda = texto.includes(busqueda.toLowerCase().trim());
      return coincideEstado && coincideBusqueda;
    });
  }, [cotizaciones, filtroEstado, busqueda]);

  // Cálculos de KPIs
  const kpis = useMemo(() => {
    const totalCotizado = cotizaciones.reduce((acc, c) => acc + (Number(c.total) || 0), 0);
    const convertidas = cotizaciones.filter((c) => c.estado === 'CONVERTIDA');
    const aprobadas = cotizaciones.filter((c) => c.estado === 'APROBADA');
    const pendientes = cotizaciones.filter((c) => c.estado === 'BORRADOR' || c.estado === 'ENVIADA');
    const tasaConversion =
      cotizaciones.length > 0
        ? Math.round((convertidas.length / cotizaciones.length) * 100)
        : 0;

    return {
      totalCotizado,
      convertidasCount: convertidas.length,
      aprobadasCount: aprobadas.length,
      pendientesCount: pendientes.length,
      tasaConversion,
    };
  }, [cotizaciones]);

  // Handlers
  const handleVerPDF = (cot: any) => {
    const payload: DocumentoPDFPayload = {
      tipo: 'COTIZACION',
      consecutivo: cot.consecutivo,
      fechaEmision: cot.fecha_emision || cot.created_at || new Date().toISOString(),
      fechaVencimiento: cot.fecha_vencimiento,
      clienteNombre: cot.cliente_nombre || 'Cliente',
      clienteNit: cot.cliente_documento || 'Sin NIT',
      clienteTelefono: cot.cliente_telefono || '',
      clienteEmail: cot.cliente_email || '',
      obraNombre: cot.obra_nombre || '',
      obraDireccion: cot.obra_direccion || '',
      items: (cot.cotizaciones_detalles || []).map((d: any) => ({
        cantidad: d.cantidad,
        nombre: d.equipos?.nombre || 'Equipo',
        codigo: d.equipos?.codigo || '',
        fechaInicio: cot.fecha_emision || new Date().toISOString(),
        fechaFin: new Date(Date.now() + (d.dias || 1) * 24 * 60 * 60 * 1000).toISOString(),
        dias: d.dias || 1,
        tarifaDiaria: Number(d.tarifa_diaria || 0),
        subtotal: Number(d.subtotal || 0),
      })),
      subtotalEquipos: Number(cot.subtotal || 0),
      fleteEntrega: Number(cot.valor_transporte || 0),
      fleteRecogida: 0,
      subtotalGeneral: Number(cot.subtotal || 0) + Number(cot.valor_transporte || 0),
      aplicaIva: cot.aplica_iva,
      tasaIva: Number(cot.tasa_iva || 19),
      valorIva: Number(cot.valor_iva || 0),
      aplicaRetefuente: cot.aplica_retefuente,
      tasaRetefuente: Number(cot.tasa_retefuente || 2.5),
      valorRetefuente: Number(cot.valor_retefuente || 0),
      aplicaReteica: cot.aplica_reteica,
      tasaReteica: Number(cot.tasa_reteica || 0.966),
      valorReteica: Number(cot.valor_reteica || 0),
      depositoAplicado: Number(cot.deposito_garantia || 0),
      totalPagar: Number(cot.total || 0),
      observaciones: cot.observaciones || '',
      empresa: empresaConfig,
    };

    setDocumentoParaPDF(payload);
  };

  const handleConvertir = async (cot: any) => {
    if (
      !confirm(
        `¿Desea convertir la Cotización ${cot.consecutivo} a un Contrato de Alquiler en firme?\n\nSe validará disponibilidad en bodega y se generará el contrato de inmediato.`
      )
    ) {
      return;
    }

    setProcesandoId(cot.id);
    try {
      const res = await convertirCotizacionAContratoAction({ cotizacionId: cot.id });
      if (!res.success) {
        alert(`No se pudo formalizar el contrato:\n\n${res.error}`);
        return;
      }

      await cargarDatos();
      alert(
        `¡Cotización convertida con éxito!\n\nSe generó el Contrato de Alquiler ALQ-${
          res.data?.consecutivo || res.data?.alquilerId
        } y se ha descontado el stock de bodega.`
      );
    } catch (err: any) {
      alert(`Error inesperado: ${err.message}`);
    } finally {
      setProcesandoId(null);
    }
  };

  const handleCambiarEstado = async (id: string, nuevoEstado: string) => {
    try {
      const res = await actualizarEstadoCotizacionAction(id, nuevoEstado);
      if (!res.success) {
        alert(`Error al actualizar estado: ${res.error}`);
        return;
      }
      cargarDatos();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto w-full">
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Cotizaciones de Obra
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-blue-800">
              Comercial & Proyectos
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Presupuesta maquinaria con impuestos seleccionables y formaliza contratos de alquiler en 1 clic.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={cargarDatos}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
            title="Recargar listado"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
          <Link
            href="/alquileres"
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-blue-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5"
          >
            <span>Ver Flujo Alquileres</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <button
            type="button"
            onClick={() => setShowCrearModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Cotización</span>
          </button>
        </div>
      </div>

      {/* KPIS COMERCIALES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Cotizado</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">
            {formatearCOP(kpis.totalCotizado)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">En {cotizaciones.length} propuestas registradas</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Tasa de Conversión</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-700 font-mono">
            {kpis.tasaConversion}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">{kpis.convertidasCount} convertidas a contrato</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Aprobadas por Formalizar</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-black text-amber-700 font-mono">
            {kpis.aprobadasCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Listas para despacho en bodega</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Propuestas Abiertas</span>
            <FileSpreadsheet className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-black text-purple-700 font-mono">
            {kpis.pendientesCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Borradores y ofertas en negociación</div>
        </div>
      </div>

      {/* CONTROLES Y FILTROS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
            {['TODOS', 'BORRADOR', 'APROBADA', 'CONVERTIDA'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFiltroEstado(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filtroEstado === st
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {st === 'TODOS' ? 'Todas' : st}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por cliente, COT o proyecto..."
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
            />
          </div>
        </div>

        {/* TABLA */}
        <div className="overflow-x-auto min-h-[350px]">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-semibold">
              <tr>
                <th className="py-3 px-4">Consecutivo</th>
                <th className="py-3 px-4">Cliente & Proyecto</th>
                <th className="py-3 px-4">Fecha Emisión</th>
                <th className="py-3 px-4 text-right">Subtotal Base</th>
                <th className="py-3 px-4">Impuestos</th>
                <th className="py-3 px-4 text-right">Total Presupuestado</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {cotizacionesFiltradas.map((cot: any) => {
                const tieneIva = Boolean(cot.aplica_iva && cot.valor_iva > 0);
                const tieneRetefuente = Boolean(cot.aplica_retefuente && cot.valor_retefuente > 0);
                const tieneReteica = Boolean(cot.aplica_reteica && cot.valor_reteica > 0);
                const isConvertida = cot.estado === 'CONVERTIDA';
                const isProcessing = procesandoId === cot.id;

                return (
                  <tr key={cot.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                      <span className="px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-md">
                        {cot.consecutivo}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">{cot.cliente_nombre}</div>
                      {cot.obra_nombre && (
                        <div className="text-[11px] text-slate-600 flex items-center gap-1 mt-0.5">
                          <Building className="w-3 h-3 text-slate-400" />
                          <span>{cot.obra_nombre}</span>
                        </div>
                      )}
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {cot.cotizaciones_detalles?.length || 0} maquinaria(s) • Flete: {formatearCOP(cot.valor_transporte || 0)}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{new Date(cot.fecha_emision || cot.created_at).toLocaleDateString('es-CO')}</div>
                      {cot.fecha_vencimiento && (
                        <div className="text-[10px] text-amber-700">
                          Vence: {new Date(cot.fecha_vencimiento).toLocaleDateString('es-CO')}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-700">
                      {formatearCOP(cot.subtotal || 0)}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[170px]">
                        {tieneIva && (
                          <span className="px-1.5 py-0.5 rounded bg-blue-100/80 text-blue-800 text-[10px] font-bold">
                            IVA +{formatearCOP(cot.valor_iva)}
                          </span>
                        )}
                        {tieneRetefuente && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-100/80 text-amber-800 text-[10px] font-bold">
                            RteFte -{formatearCOP(cot.valor_retefuente)}
                          </span>
                        )}
                        {tieneReteica && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-100/80 text-emerald-800 text-[10px] font-bold">
                            ICA -{formatearCOP(cot.valor_reteica)}
                          </span>
                        )}
                        {!tieneIva && !tieneRetefuente && !tieneReteica && (
                          <span className="text-[11px] text-slate-400">Sin retenciones</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 text-sm">
                      {formatearCOP(cot.total || 0)}
                    </td>

                    <td className="py-3.5 px-4">
                      <select
                        disabled={isConvertida}
                        value={cot.estado}
                        onChange={(e) => handleCambiarEstado(cot.id, e.target.value)}
                        className={`text-[11px] font-bold rounded-lg border-0 py-1 pl-2 pr-6 shadow-2xs cursor-pointer ${
                          isConvertida
                            ? 'bg-emerald-100 text-emerald-800 cursor-default'
                            : cot.estado === 'APROBADA'
                            ? 'bg-blue-100 text-blue-800'
                            : cot.estado === 'RECHAZADA'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <option value="BORRADOR">Borrador</option>
                        <option value="ENVIADA">Enviada</option>
                        <option value="APROBADA">Aprobada</option>
                        <option value="RECHAZADA">Rechazada</option>
                        {isConvertida && <option value="CONVERTIDA">Convertida</option>}
                      </select>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleVerPDF(cot)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                          title="Imprimir / Exportar Documento PDF"
                        >
                          <Printer className="w-3.5 h-3.5 text-blue-600" />
                          <span>PDF</span>
                        </button>

                        {!isConvertida ? (
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleConvertir(cot)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                            title="Formalizar inmediatamente en contrato de alquiler y reservar inventario"
                          >
                            {isProcessing ? (
                              <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                            ) : (
                              <ArrowRightCircle className="w-3.5 h-3.5" />
                            )}
                            <span>Convertir a Contrato</span>
                          </button>
                        ) : (
                          <Link
                            href="/alquileres"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-md transition-colors"
                            title="Ver contrato en el módulo de alquileres"
                          >
                            <CheckCircle className="w-3 h-3" />
                            <span>Contrato #{cot.alquiler_id}</span>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {cotizacionesFiltradas.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <FileSpreadsheet className="w-9 h-9 mx-auto text-slate-400 mb-2" />
                    <p className="font-semibold text-slate-700 text-sm">No se encontraron cotizaciones</p>
                    <p className="text-xs text-slate-400 mt-1">Crea una nueva propuesta comercial para comenzar.</p>
                    <button
                      type="button"
                      onClick={() => setShowCrearModal(true)}
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
                    >
                      <Plus className="w-4 h-4" />
                      Nueva Cotización
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CREAR */}
      <CrearCotizacionModal
        isOpen={showCrearModal}
        onClose={() => setShowCrearModal(false)}
        onCotizacionCreada={(nuevaCot) => {
          cargarDatos();
          if (nuevaCot) {
            handleVerPDF(nuevaCot);
          }
        }}
      />

      {/* VISOR DOCUMENTO PDF */}
      {documentoParaPDF && (
        <VisorDocumentoPDFModal
          isOpen={true}
          onClose={() => setDocumentoParaPDF(null)}
          documento={documentoParaPDF}
        />
      )}
    </div>
  );
}
