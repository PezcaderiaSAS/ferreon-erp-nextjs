'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  ShieldCheck, 
  AlertTriangle, 
  Search, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  ExternalLink,
  ChevronRight,
  Shield,
  Layers,
  Sparkles,
  Lock,
  CalendarPlus,
  Clock,
  Sliders
} from 'lucide-react';
import { 
  obtenerDirectorioEmpresasAction, 
  obtenerUsuariosPorEmpresaAction, 
  cambiarEstadoUsuarioAction, 
  cambiarEstadoSuscripcionEmpresaAction,
  EmpresaDirectorioItem, 
  UsuarioTenantItem 
} from '@/app/actions/ultraadmin';
import { GestionModulosModal } from './GestionModulosModal';
import { ExtenderLicenciaModal } from './ExtenderLicenciaModal';

export default function UltraAdminEmpresasPage() {
  const [empresas, setEmpresas] = useState<EmpresaDirectorioItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroSuscripcion, setFiltroSuscripcion] = useState<string>('todos');

  // Estado para el modal/drawer de inspección de usuarios
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<EmpresaDirectorioItem | null>(null);
  const [usuariosTenant, setUsuariosTenant] = useState<UsuarioTenantItem[]>([]);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(false);
  const [procesandoAccion, setProcesandoAccion] = useState(false);

  // Estados para modales de gobernanza UltraAdmin
  const [empresaModulos, setEmpresaModulos] = useState<EmpresaDirectorioItem | null>(null);
  const [empresaLicencia, setEmpresaLicencia] = useState<EmpresaDirectorioItem | null>(null);

  const handleModulosActualizados = (empresaId: string, nuevosModulos: any) => {
    setEmpresas(prev => prev.map(e => e.id === empresaId ? { ...e, modulos_activos: nuevosModulos } : e));
    if (empresaSeleccionada?.id === empresaId) {
      setEmpresaSeleccionada(prev => prev ? { ...prev, modulos_activos: nuevosModulos } : null);
    }
  };

  const handleLicenciaActualizada = () => {
    cargarDirectorio();
  };

  // Cargar directorio inicial
  const cargarDirectorio = async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await obtenerDirectorioEmpresasAction();
      if (res.success && res.empresas) {
        setEmpresas(res.empresas);
      } else {
        setError(res.error || 'No se pudo cargar el directorio de empresas');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDirectorio();
  }, []);

  // Cargar usuarios al seleccionar empresa
  const handleSeleccionarEmpresa = async (empresa: EmpresaDirectorioItem) => {
    setEmpresaSeleccionada(empresa);
    setCargandoUsuarios(true);
    try {
      const res = await obtenerUsuariosPorEmpresaAction(empresa.id);
      if (res.success && res.usuarios) {
        setUsuariosTenant(res.usuarios);
      } else {
        alert(res.error || 'Error al obtener usuarios del tenant');
      }
    } catch (err: any) {
      alert(err.message || 'Error de comunicación');
    } finally {
      setCargandoUsuarios(false);
    }
  };

  // Alternar estado de usuario (Activo / Inactivo)
  const handleToggleEstadoUsuario = async (usuario: UsuarioTenantItem) => {
    if (!empresaSeleccionada) return;
    const nuevoEstado = usuario.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    const confirmar = confirm(`¿Estás seguro de cambiar el estado de "${usuario.nombre}" a ${nuevoEstado}?`);
    if (!confirmar) return;

    setProcesandoAccion(true);
    try {
      const res = await cambiarEstadoUsuarioAction({
        membershipId: usuario.membershipId,
        empresaId: empresaSeleccionada.id,
        nuevoEstado,
      });

      if (res.success) {
        // Actualizar estado local en memoria
        setUsuariosTenant(prev => prev.map(u => 
          u.membershipId === usuario.membershipId ? { ...u, estado: nuevoEstado } : u
        ));
        // Refrescar conteo en listado general
        cargarDirectorio();
      } else {
        alert(res.error || 'No se pudo actualizar el estado del usuario');
      }
    } catch (err: any) {
      alert(err.message || 'Error en la petición');
    } finally {
      setProcesandoAccion(false);
    }
  };

  // Cambiar estado de suscripción del tenant
  const handleCambiarSuscripcion = async (empresaId: string, nuevoStatus: any) => {
    setProcesandoAccion(true);
    try {
      const res = await cambiarEstadoSuscripcionEmpresaAction({
        empresaId,
        nuevoStatus,
      });
      if (res.success) {
        setEmpresas(prev => prev.map(e => e.id === empresaId ? { ...e, subscription_status: nuevoStatus } : e));
        if (empresaSeleccionada && empresaSeleccionada.id === empresaId) {
          setEmpresaSeleccionada({ ...empresaSeleccionada, subscription_status: nuevoStatus });
        }
      } else {
        alert(res.error || 'Error al actualizar suscripción');
      }
    } catch (err: any) {
      alert(err.message || 'Error');
    } finally {
      setProcesandoAccion(false);
    }
  };

  // Filtros de búsqueda
  const empresasFiltradas = empresas.filter(e => {
    const matchTexto = 
      e.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (e.nit && e.nit.toLowerCase().includes(busqueda.toLowerCase())) ||
      e.slug.toLowerCase().includes(busqueda.toLowerCase());
    
    const matchSuscripcion = 
      filtroSuscripcion === 'todos' || e.subscription_status === filtroSuscripcion;

    return matchTexto && matchSuscripcion;
  });

  // Métricas globales
  const totalEmpresas = empresas.length;
  const empresasActivas = empresas.filter(e => e.subscription_status === 'active').length;
  const totalUsuariosGlobal = empresas.reduce((acc, e) => acc + e.totalUsuarios, 0);
  const totalUsuariosActivos = empresas.reduce((acc, e) => acc + e.usuariosActivos, 0);

  return (
    <div className="min-h-screen text-slate-100 p-4 sm:p-6 lg:p-8 relative">
      {/* Resplandor decorativo de fondo */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        
        {/* Encabezado Principal */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-sky-500 rounded-xl shadow-lg shadow-indigo-500/20">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                    Gobernanza UltraAdmin
                  </h1>
                  <span className="px-2.5 py-0.5 text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                    Plataforma SaaS
                  </span>
                </div>
                <p className="text-sm text-slate-400 mt-0.5">
                  Directorio transversal de empresas (tenants) y supervisión global de usuarios activos e inactivos.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={cargarDirectorio}
              disabled={cargando}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-sm font-semibold text-slate-200 shadow-sm transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
              Sincronizar
            </button>
          </div>
        </div>

        {/* Tarjetas de Métricas de Plataforma */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Empresas Registradas</span>
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{totalEmpresas}</span>
              <span className="text-xs text-indigo-400 font-medium">Tenants activos en plataforma</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Suscripciones Activas</span>
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-400">{empresasActivas}</span>
              <span className="text-xs text-slate-400">de {totalEmpresas} empresas</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Usuarios Global</span>
              <div className="p-2 bg-sky-500/10 text-sky-400 rounded-lg">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{totalUsuariosGlobal}</span>
              <span className="text-xs text-sky-400 font-medium">Cuentas vinculadas</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Usuarios Activos</span>
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                <Shield className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-400">{totalUsuariosActivos}</span>
              <span className="text-xs text-slate-400">
                {totalUsuariosGlobal > 0 ? `${Math.round((totalUsuariosActivos / totalUsuariosGlobal) * 100)}% de operatividad` : '0%'}
              </span>
            </div>
          </div>
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <div className="p-4 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-xl flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por Nombre, NIT o Slug..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Estado Suscripción:</span>
            {['todos', 'active', 'trialing', 'past_due', 'canceled'].map((st) => (
              <button
                key={st}
                onClick={() => setFiltroSuscripcion(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  filtroSuscripcion === st
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {st === 'todos' ? 'Todos' : st === 'active' ? 'Activo' : st === 'trialing' ? 'Trial' : st === 'past_due' ? 'En Mora' : 'Cancelado'}
              </button>
            ))}
          </div>
        </div>

        {/* Mensaje de Error si aplica */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-300 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tabla de Empresas (Tenants) */}
        <div className="rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden">
          <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white">Directorio Central de Inquilinos (Tenants)</h2>
            </div>
            <span className="text-xs font-semibold text-slate-400">
              {empresasFiltradas.length} empresas encontradas
            </span>
          </div>

          {cargando ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
              <span>Cargando base de datos de inquilinos...</span>
            </div>
          ) : empresasFiltradas.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              No se encontraron empresas con los criterios seleccionados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800/80 bg-slate-950/40 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Empresa / Razón Social</th>
                    <th className="py-3.5 px-4">Slug Identificador</th>
                    <th className="py-3.5 px-4">Licencia & Vigencia</th>
                    <th className="py-3.5 px-4">Módulos ERP</th>
                    <th className="py-3.5 px-4">Usuarios (Activos / Total)</th>
                    <th className="py-3.5 px-4 text-right">Acciones de Plataforma</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {empresasFiltradas.map((emp) => {
                    const isSelected = empresaSeleccionada?.id === emp.id;

                    const estadoLicenciaConfig: Record<string, { badge: string; text: string }> = {
                      ACTIVA: { badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', text: 'Activa' },
                      POR_VENCER: { badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30', text: 'Por Vencer' },
                      EN_GRACIA: { badge: 'bg-orange-500/15 text-orange-400 border-orange-500/30', text: 'En Gracia' },
                      VENCIDA: { badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30', text: 'Vencida' },
                    };
                    const licInfo = estadoLicenciaConfig[emp.estadoLicencia] || estadoLicenciaConfig.ACTIVA;

                    const modulosActivosCount = Object.values(emp.modulos_activos || {}).filter(Boolean).length;

                    return (
                      <tr 
                        key={emp.id}
                        className={`hover:bg-slate-800/40 transition-colors ${
                          isSelected ? 'bg-indigo-500/10' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white flex items-center gap-2">
                            <span>{emp.nombre}</span>
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            NIT: {emp.nit || 'No registrado'}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-xs text-slate-300">
                          {emp.slug}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${licInfo.badge}`}>
                                {licInfo.text}
                              </span>
                              <span className="text-xs font-semibold text-slate-200">
                                {emp.diasRestantes > 0 
                                  ? `${emp.diasRestantes}d restantes` 
                                  : emp.estadoLicencia === 'EN_GRACIA'
                                  ? `Gracia (${emp.dias_gracia}d)`
                                  : 'Expirada'}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400">
                              {emp.subscription_ends_at 
                                ? `Vence: ${emp.subscription_ends_at.split('T')[0]}`
                                : emp.trial_ends_at
                                ? `Trial: ${emp.trial_ends_at.split('T')[0]}`
                                : 'Sin fecha'}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => setEmpresaModulos(emp)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 transition-all hover:text-white"
                            title="Configurar módulos de este tenant"
                          >
                            <Sliders className="w-3.5 h-3.5 text-brand-salmon" />
                            <span>{modulosActivosCount}/9 Módulos</span>
                          </button>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{emp.usuariosActivos}</span>
                            <span className="text-xs text-slate-400">/ {emp.totalUsuarios}</span>
                            {emp.usuariosInactivos > 0 && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-semibold">
                                {emp.usuariosInactivos} inactivos
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEmpresaLicencia(emp)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-all"
                              title="Extender días de licencia o asignar contrato"
                            >
                              <CalendarPlus className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Extender</span>
                            </button>

                            <button
                              onClick={() => handleSeleccionarEmpresa(emp)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                isSelected
                                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                              }`}
                            >
                              <span>Usuarios</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Sección de Detalle: Visor de Usuarios de la Empresa Seleccionada */}
        {empresaSeleccionada && (
          <div className="rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-indigo-500/30 shadow-2xl p-6 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-lg font-bold text-white">
                    Usuarios Asociados: <span className="text-indigo-300">{empresaSeleccionada.nombre}</span>
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Tenant ID: <span className="font-mono text-slate-300">{empresaSeleccionada.id}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Estado de Empresa:</span>
                <select
                  value={empresaSeleccionada.subscription_status}
                  onChange={(e) => handleCambiarSuscripcion(empresaSeleccionada.id, e.target.value)}
                  disabled={procesandoAccion}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="active">Activo</option>
                  <option value="trialing">Trial</option>
                  <option value="past_due">En Mora (Past Due)</option>
                  <option value="canceled">Cancelado</option>
                </select>
              </div>
            </div>

            {cargandoUsuarios ? (
              <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
                <span>Cargando lista de usuarios del tenant...</span>
              </div>
            ) : usuariosTenant.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                Esta empresa no cuenta con usuarios vinculados actualmente.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {usuariosTenant.map((usr) => {
                  const esActivo = usr.estado === 'ACTIVO';

                  return (
                    <div
                      key={usr.membershipId}
                      className={`p-4 rounded-xl border transition-all ${
                        esActivo
                          ? 'bg-slate-800/40 border-slate-700/60'
                          : 'bg-rose-950/20 border-rose-500/20 opacity-80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={usr.avatarUrl}
                            alt={usr.nombre}
                            className="w-10 h-10 rounded-full border border-slate-700 bg-slate-800"
                          />
                          <div>
                            <h4 className="font-bold text-white text-sm leading-tight">{usr.nombre}</h4>
                            <span className="text-xs text-slate-400">{usr.email}</span>
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          esActivo
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                        }`}>
                          {usr.estado}
                        </span>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Rol Asignado</span>
                          <span className="font-semibold text-indigo-300">{usr.rol}</span>
                        </div>

                        <button
                          onClick={() => handleToggleEstadoUsuario(usr)}
                          disabled={procesandoAccion}
                          className={`px-3 py-1 rounded-lg font-bold transition-all text-xs ${
                            esActivo
                              ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30'
                          }`}
                        >
                          {esActivo ? 'Suspender' : 'Reactivar'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Modales de Gobernanza UltraAdmin */}
        <GestionModulosModal
          isOpen={!!empresaModulos}
          empresa={empresaModulos}
          onClose={() => setEmpresaModulos(null)}
          onModuloActualizado={handleModulosActualizados}
        />

        <ExtenderLicenciaModal
          isOpen={!!empresaLicencia}
          empresa={empresaLicencia}
          onClose={() => setEmpresaLicencia(null)}
          onLicenciaActualizada={handleLicenciaActualizada}
        />

      </div>
    </div>
  );
}
