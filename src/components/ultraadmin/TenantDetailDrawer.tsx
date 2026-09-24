'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Building2, 
  ShieldCheck, 
  ShieldAlert, 
  Calendar, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Layers, 
  Check, 
  Power,
  RefreshCw,
  Plus
} from 'lucide-react';
import { useUltraAdminStore } from '@/infrastructure/state/ultraAdminStore';
import { 
  aprobarTenantAction, 
  extenderLicenciaEmpresaAction, 
  toggleModuloEmpresaAction,
  obtenerUsuariosPorEmpresaAction,
  cambiarEstadoUsuarioAction,
  UsuarioTenantItem
} from '@/app/actions/ultraadmin';
import { ModuloKey } from '@/core/services/licencias-modulos.service';

const MODULOS_DISPONIBLES: { key: ModuloKey; label: string; desc: string }[] = [
  { key: 'ALQUILERES', label: 'Alquileres', desc: 'Control de contratos, entregas y devoluciones de equipos' },
  { key: 'COTIZACIONES', label: 'Cotizaciones', desc: 'Emisión y conversión de presupuestos comerciales' },
  { key: 'BODEGA', label: 'Bodega / Inventario', desc: 'Gestión de stock, almacenes y kardex' },
  { key: 'COMPRAS', label: 'Compras', desc: 'Órdenes de compra y recepción de insumos' },
  { key: 'CXP', label: 'Cuentas por Pagar', desc: 'Gestión de deudas y pagos a proveedores' },
  { key: 'CAJA', label: 'Caja & Bancos', desc: 'Movimientos de dinero en efectivo y cuentas' },
  { key: 'DEVOLUCIONES', label: 'Devoluciones', desc: 'Devoluciones de materiales y ajustes de inventario' },
  { key: 'SUBCONTRATACIONES', label: 'Subcontrataciones', desc: 'Gestión de equipos subcontratados con terceros' },
  { key: 'FACTURACION', label: 'Facturación Electrónica', desc: 'Emisión de facturas y documentos DIAN' },
];

export function TenantDetailDrawer() {
  const { 
    drawerAbierto, 
    cerrarDrawer, 
    tenantSeleccionado, 
    optimisticUpdateTenant,
    isMutating,
    setMutating 
  } = useUltraAdminStore();

  const [activeTab, setActiveTab] = useState<'info' | 'licencias' | 'usuarios'>('info');
  const [usuarios, setUsuarios] = useState<UsuarioTenantItem[]>([]);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(false);
  const [diasExtenderInput, setDiasExtenderInput] = useState<number>(30);
  const [feedbackMsg, setFeedbackMsg] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  // Cargar usuarios cuando se abre el drawer o cambia de empresa
  useEffect(() => {
    if (drawerAbierto && tenantSeleccionado) {
      cargarUsuariosTenant(tenantSeleccionado.id);
    } else {
      setFeedbackMsg(null);
    }
  }, [drawerAbierto, tenantSeleccionado?.id]);

  const cargarUsuariosTenant = async (empresaId: string) => {
    setCargandoUsuarios(true);
    try {
      const res = await obtenerUsuariosPorEmpresaAction(empresaId);
      if (res.success && res.usuarios) {
        setUsuarios(res.usuarios);
      }
    } catch (err: any) {
      console.error('Error al cargar usuarios:', err);
    } finally {
      setCargandoUsuarios(false);
    }
  };

  const mostrarFeedback = (tipo: 'success' | 'error', texto: string) => {
    setFeedbackMsg({ tipo, texto });
    setTimeout(() => {
      setFeedbackMsg(null);
    }, 4000);
  };

  if (!drawerAbierto || !tenantSeleccionado) return null;

  // Accion 1: Aprobar/Desaprobar Tenant
  const handleToggleAutorizado = async () => {
    if (isMutating) return;
    const nuevoValor = !tenantSeleccionado.autorizado;
    const tenantId = tenantSeleccionado.id;
    const idempotencyKey = crypto.randomUUID();

    // Optimistic Update
    optimisticUpdateTenant(tenantId, { autorizado: nuevoValor });
    setMutating(true);

    try {
      const res = await aprobarTenantAction({
        empresaId: tenantId,
        autorizado: nuevoValor,
        idempotencyKey,
      });

      if (res.success) {
        mostrarFeedback('success', nuevoValor ? 'Tenant autorizado oficialmente' : 'Tenant desautorizado (Modo Prueba activado)');
      } else {
        // Rollback
        optimisticUpdateTenant(tenantId, { autorizado: !nuevoValor });
        mostrarFeedback('error', res.error || 'Error al actualizar autorización');
      }
    } catch (err: any) {
      optimisticUpdateTenant(tenantId, { autorizado: !nuevoValor });
      mostrarFeedback('error', err.message || 'Error de comunicación');
    } finally {
      setMutating(false);
    }
  };

  // Accion 2: Extender Licencia
  const handleExtenderLicencia = async (dias: number) => {
    if (isMutating) return;
    setMutating(true);
    try {
      const res = await extenderLicenciaEmpresaAction({
        empresaId: tenantSeleccionado.id,
        diasExtender: dias,
        motivo: `Extensión manual desde UltraAdmin (+${dias} días)`
      });

      if (res.success && res.nuevaFechaExpiracion) {
        optimisticUpdateTenant(tenantSeleccionado.id, {
          subscription_ends_at: res.nuevaFechaExpiracion,
          subscription_status: 'active',
          estadoLicencia: 'ACTIVA'
        });
        mostrarFeedback('success', `Licencia extendida por ${dias} días con éxito`);
      } else {
        mostrarFeedback('error', res.error || 'Error al extender la licencia');
      }
    } catch (err: any) {
      mostrarFeedback('error', err.message || 'Error inesperado');
    } finally {
      setMutating(false);
    }
  };

  // Accion 3: Alternar Módulo
  const handleToggleModulo = async (moduloKey: ModuloKey) => {
    if (isMutating) return;
    const estadoActual = Boolean(tenantSeleccionado.modulos_activos?.[moduloKey]);
    const nuevoEstado = !estadoActual;
    const empresaId = tenantSeleccionado.id;

    // Optimistic Update
    const modulosActualizados = {
      ...tenantSeleccionado.modulos_activos,
      [moduloKey]: nuevoEstado,
    };
    optimisticUpdateTenant(empresaId, { modulos_activos: modulosActualizados });
    setMutating(true);

    try {
      const res = await toggleModuloEmpresaAction({
        empresaId,
        modulo: moduloKey,
        activo: nuevoEstado,
      });

      if (res.success && res.modulos_activos) {
        optimisticUpdateTenant(empresaId, { modulos_activos: res.modulos_activos });
        mostrarFeedback('success', `Módulo ${moduloKey} ${nuevoEstado ? 'activado' : 'desactivado'}`);
      } else {
        // Rollback
        optimisticUpdateTenant(empresaId, {
          modulos_activos: { ...tenantSeleccionado.modulos_activos, [moduloKey]: estadoActual }
        });
        mostrarFeedback('error', res.error || 'No se pudo cambiar el módulo');
      }
    } catch (err: any) {
      optimisticUpdateTenant(empresaId, {
        modulos_activos: { ...tenantSeleccionado.modulos_activos, [moduloKey]: estadoActual }
      });
      mostrarFeedback('error', err.message || 'Error en la petición');
    } finally {
      setMutating(false);
    }
  };

  // Accion 4: Cambiar estado de usuario
  const handleToggleUsuario = async (usuario: UsuarioTenantItem) => {
    if (isMutating) return;
    const nuevoEstado = usuario.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    setMutating(true);

    try {
      const res = await cambiarEstadoUsuarioAction({
        membershipId: usuario.membershipId,
        empresaId: tenantSeleccionado.id,
        nuevoEstado,
      });

      if (res.success) {
        setUsuarios(prev => prev.map(u => 
          u.membershipId === usuario.membershipId ? { ...u, estado: nuevoEstado } : u
        ));
        mostrarFeedback('success', `Usuario marcado como ${nuevoEstado}`);
      } else {
        mostrarFeedback('error', res.error || 'No se pudo actualizar el estado');
      }
    } catch (err: any) {
      mostrarFeedback('error', err.message || 'Error al cambiar usuario');
    } finally {
      setMutating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col transform transition-transform animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-modal="true"
      >
        {/* Cabecera del Drawer */}
        <div className="px-6 py-5 border-b flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/30 rounded-xl text-blue-400 border border-blue-500/30">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">{tenantSeleccionado.nombre}</h2>
                {tenantSeleccionado.autorizado ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3" /> Aprobada
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <AlertCircle className="w-3 h-3" /> Prueba (No Oficial)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">NIT: {tenantSeleccionado.nit || 'Sin Registrar'} • Slug: {tenantSeleccionado.slug}</p>
            </div>
          </div>
          <button
            onClick={cerrarDrawer}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Cerrar panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert Bar */}
        {feedbackMsg && (
          <div className={`px-6 py-2.5 text-xs font-semibold flex items-center gap-2 transition-all ${
            feedbackMsg.tipo === 'success' ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200' : 'bg-red-50 text-red-800 border-b border-red-200'
          }`}>
            {feedbackMsg.tipo === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
            {feedbackMsg.texto}
          </div>
        )}

        {/* Pestañas de Navegación */}
        <div className="flex border-b bg-slate-50 px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('info')}
            className={`pb-3 px-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'info'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" /> Info & Estado
          </button>
          <button
            onClick={() => setActiveTab('licencias')}
            className={`pb-3 px-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'licencias'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" /> Licencia & Módulos
          </button>
          <button
            onClick={() => setActiveTab('usuarios')}
            className={`pb-3 px-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'usuarios'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" /> Usuarios IAM ({usuarios.length})
          </button>
        </div>

        {/* Contenido Scrolleable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: INFO & ESTADO */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* Bloque Switch de Aprobación */}
              <div className="p-4 rounded-xl border bg-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Estado de Aprobación Oficial</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {tenantSeleccionado.autorizado 
                      ? 'La empresa tiene acceso completo a producción y sus PDFs no llevan marca de agua.' 
                      : 'La empresa está en período de prueba gratuito (14 días). Sus PDFs llevan marca de prueba.'}
                  </p>
                </div>
                <button
                  onClick={handleToggleAutorizado}
                  disabled={isMutating}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                    tenantSeleccionado.autorizado
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-amber-600 text-white hover:bg-amber-700'
                  }`}
                >
                  <Power className="w-4 h-4" />
                  {tenantSeleccionado.autorizado ? 'Autorizado (Activo)' : 'Aprobar Oficialmente'}
                </button>
              </div>

              {/* Ficha Resumen */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 rounded-lg border bg-white">
                  <span className="text-xs text-slate-400 block">Suscripción</span>
                  <span className="text-sm font-bold capitalize text-slate-800">{tenantSeleccionado.subscription_status}</span>
                </div>
                <div className="p-3.5 rounded-lg border bg-white">
                  <span className="text-xs text-slate-400 block">Plan Asignado</span>
                  <span className="text-sm font-bold text-slate-800">{tenantSeleccionado.plan_id || 'Estándar'}</span>
                </div>
                <div className="p-3.5 rounded-lg border bg-white">
                  <span className="text-xs text-slate-400 block">Días de Gracia</span>
                  <span className="text-sm font-bold text-slate-800">{tenantSeleccionado.dias_gracia} días</span>
                </div>
                <div className="p-3.5 rounded-lg border bg-white">
                  <span className="text-xs text-slate-400 block">Registro en Plataforma</span>
                  <span className="text-sm font-bold text-slate-800">
                    {new Date(tenantSeleccionado.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LICENCIA & MODULOS */}
          {activeTab === 'licencias' && (
            <div className="space-y-6">
              {/* Extensión de Licencia */}
              <div className="p-4 rounded-xl border bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Vigencia de la Licencia</h4>
                      <p className="text-xs text-slate-500">
                        Expira el: {tenantSeleccionado.subscription_ends_at ? new Date(tenantSeleccionado.subscription_ends_at).toLocaleDateString() : 'No definida (Trial)'}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    tenantSeleccionado.diasRestantes <= 0 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {tenantSeleccionado.diasRestantes} días restantes
                  </span>
                </div>

                <div className="pt-2 border-t flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-600">Extender cortesía:</span>
                  {[7, 15, 30].map(dias => (
                    <button
                      key={dias}
                      onClick={() => handleExtenderLicencia(dias)}
                      disabled={isMutating}
                      className="px-2.5 py-1 rounded bg-white border text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
                    >
                      +{dias} días
                    </button>
                  ))}
                </div>
              </div>

              {/* Switches de Módulos */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-slate-500" /> Módulos Habilitados para este Tenant
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {MODULOS_DISPONIBLES.map(m => {
                    const activo = Boolean(tenantSeleccionado.modulos_activos?.[m.key]);
                    return (
                      <div 
                        key={m.key} 
                        className={`p-3 rounded-lg border flex items-center justify-between transition-all ${
                          activo ? 'bg-blue-50/50 border-blue-200' : 'bg-white border-slate-200 opacity-60'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900">{m.label}</div>
                          <div className="text-2xs text-slate-500">{m.desc}</div>
                        </div>
                        <button
                          onClick={() => handleToggleModulo(m.key)}
                          disabled={isMutating}
                          className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                            activo ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'
                          }`}
                        >
                          <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: USUARIOS (IAM) */}
          {activeTab === 'usuarios' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-500" /> Usuarios Asignados a la Empresa
                </h4>
                <button
                  onClick={() => cargarUsuariosTenant(tenantSeleccionado.id)}
                  disabled={cargandoUsuarios}
                  className="p-1 rounded text-slate-400 hover:text-slate-600"
                  title="Refrescar lista"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${cargandoUsuarios ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {cargandoUsuarios ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  Cargando usuarios del tenant...
                </div>
              ) : usuarios.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 bg-slate-50 rounded-lg border">
                  No hay usuarios vinculados a este tenant.
                </div>
              ) : (
                <div className="space-y-2">
                  {usuarios.map(u => (
                    <div key={u.id} className="p-3 rounded-lg border bg-white flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-xs font-bold text-slate-600">
                          {u.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">{u.nombre}</div>
                          <div className="text-2xs text-slate-400">{u.email} • Rol: <span className="font-semibold text-slate-700">{u.rol}</span></div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-2xs font-bold ${
                          u.estado === 'ACTIVO' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {u.estado}
                        </span>
                        <button
                          onClick={() => handleToggleUsuario(u)}
                          disabled={isMutating}
                          className="px-2 py-1 rounded border text-2xs font-semibold hover:bg-slate-100 text-slate-700 transition-colors"
                        >
                          {u.estado === 'ACTIVO' ? 'Suspender' : 'Activar'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
