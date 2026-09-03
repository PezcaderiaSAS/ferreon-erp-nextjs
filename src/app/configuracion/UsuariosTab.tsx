"use client";

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Edit2, 
  Trash2, 
  Ban, 
  CheckCircle2, 
  PauseCircle, 
  PlayCircle, 
  ShieldAlert, 
  ShieldCheck, 
  UserCheck, 
  AlertTriangle,
  Lock,
  Mail,
  User,
  Shield
} from 'lucide-react';
import { RoleType } from '../../core/domain/entities/usuario';

const AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Mimi&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Nala&backgroundColor=c2e8c2'
];

const ROLES: { value: RoleType; label: string; desc: string }[] = [
  { value: 'SUPERADMIN', label: 'Super Administrador', desc: 'Control total de la empresa, facturación y usuarios' },
  { value: 'ADMIN', label: 'Administrador', desc: 'Gestión de bodega, clientes, contratos y reportes' },
  { value: 'OPERADOR_BODEGA', label: 'Operador de Bodega', desc: 'Gestión de stock, entregas y devoluciones de equipos' },
  { value: 'FACTURACION_CARTERA', label: 'Facturación y Cartera', desc: 'Emisión de facturas y cobro de cartera' },
  { value: 'CONSULTOR_AUDITOR', label: 'Consultor / Auditor', desc: 'Acceso de solo lectura para auditoría' }
];

type EstadoUsuario = 'ACTIVO' | 'INACTIVO' | 'BLOQUEADO';

type UsuarioData = {
  id: string;
  membershipId: number;
  nombre: string;
  email: string;
  rol: RoleType;
  estado: EstadoUsuario;
  avatarUrl: string;
  ultimoAcceso?: string | null;
  esCurrentUser?: boolean;
};

export function UsuariosTab() {
  const [usuarios, setUsuarios] = useState<UsuarioData[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal de confirmación de eliminación o bloqueo
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'DELETE' | 'BLOCK' | 'DEACTIVATE';
    usuario: UsuarioData | null;
  }>({
    isOpen: false,
    type: 'DELETE',
    usuario: null,
  });

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'ADMIN' as RoleType,
    avatarUrl: AVATARS[0]
  });

  const fetchUsuarios = async () => {
    try {
      const res = await fetch('/api/usuarios');
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error al obtener usuarios');
      }
      const data = await res.json();
      setUsuarios(data.usuarios || []);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'No se pudo cargar la lista de usuarios.');
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const url = '/api/usuarios';
      const method = editingUserId ? 'PUT' : 'POST';
      const bodyPayload = editingUserId 
        ? { id: editingUserId, nombre: formData.nombre, rol: formData.rol, avatarUrl: formData.avatarUrl }
        : { email: formData.email, password: formData.password || undefined, nombre: formData.nombre, rol: formData.rol, avatarUrl: formData.avatarUrl };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || (editingUserId ? 'Error al actualizar el usuario' : 'Error al crear el usuario'));
      }

      setSuccessMsg(resData.mensaje || (editingUserId ? 'Usuario actualizado con éxito' : 'Usuario registrado con éxito'));
      await fetchUsuarios();
      setIsCreating(false);
      setEditingUserId(null);
      setFormData({ nombre: '', email: '', password: '', rol: 'ADMIN', avatarUrl: AVATARS[0] });
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cambiar estado (Activar, Desactivar, Bloquear)
  const handleToggleStatus = async (usuario: UsuarioData, nuevoEstado: EstadoUsuario) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/usuarios', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: usuario.id, estado: nuevoEstado })
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Error al cambiar estado');

      setSuccessMsg(resData.mensaje || `Usuario actualizado a ${nuevoEstado}`);
      await fetchUsuarios();
      setConfirmModal({ isOpen: false, type: 'DELETE', usuario: null });
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // Eliminar usuario
  const handleDeleteUser = async (usuario: UsuarioData) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/usuarios?id=${usuario.id}`, {
        method: 'DELETE',
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Error al eliminar usuario');

      setSuccessMsg(resData.mensaje || 'Usuario desvinculado exitosamente');
      await fetchUsuarios();
      setConfirmModal({ isOpen: false, type: 'DELETE', usuario: null });
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleEditClick = (usuario: UsuarioData) => {
    setEditingUserId(usuario.id);
    setFormData({
      nombre: usuario.nombre,
      email: usuario.email,
      password: '',
      rol: usuario.rol,
      avatarUrl: usuario.avatarUrl
    });
    setIsCreating(true);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleCancelClick = () => {
    setIsCreating(false);
    setEditingUserId(null);
    setFormData({ nombre: '', email: '', password: '', rol: 'ADMIN', avatarUrl: AVATARS[0] });
  };

  if (isInitializing) {
    return (
      <div className="flex justify-center items-center h-48 bg-white rounded-2xl shadow-sm border border-slate-200">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      
      {/* Messages */}
      {errorMsg && (
        <div className="w-full bg-red-50 text-red-700 text-sm p-4 rounded-xl border border-red-200 flex items-center justify-between animate-fadeIn shadow-sm">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
          <button type="button" onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-700">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="w-full bg-emerald-50 text-emerald-700 text-sm p-4 rounded-xl border border-emerald-200 flex items-center justify-between animate-fadeIn shadow-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-medium">{successMsg}</span>
          </div>
          <button type="button" onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-700">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Gestión de Usuarios y Roles</h2>
          <p className="text-sm text-slate-500 mt-0.5">Control de acceso, permisos y ciclo de vida de colaboradores en tu empresa.</p>
        </div>
        <button 
          onClick={() => {
            setEditingUserId(null);
            setFormData({ nombre: '', email: '', password: '', rol: 'ADMIN', avatarUrl: AVATARS[0] });
            setIsCreating(true);
            setErrorMsg(null);
          }}
          className="px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-orange-500/20 flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nuevo Usuario
        </button>
      </div>

      {/* Form Drawer / Box */}
      {isCreating && (
        <form onSubmit={handleSubmit} className="bg-slate-50 rounded-2xl border border-slate-200 p-6 sm:p-8 flex flex-col gap-6 animate-fadeIn shadow-inner">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-orange-600" />
              {editingUserId ? 'Editar Colaborador' : 'Registrar Nuevo Colaborador'}
            </h3>
            <button type="button" onClick={handleCancelClick} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">Nombre Completo</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input 
                  type="text" 
                  required 
                  placeholder="Ej: Carlos Mendoza"
                  value={formData.nombre}
                  onChange={e => setFormData({...formData, nombre: e.target.value})}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all" 
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">Correo Electrónico</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input 
                  type="email" 
                  required 
                  disabled={!!editingUserId}
                  placeholder="carlos@empresa.com"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all disabled:bg-slate-100 disabled:text-slate-500" 
                />
              </div>
            </div>

            {!editingUserId && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Contraseña Inicial (Opcional)</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input 
                    type="password" 
                    placeholder="Dejar en blanco para clave temporal"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all" 
                  />
                </div>
              </div>
            )}

            <div className={`flex flex-col gap-1.5 ${editingUserId ? 'md:col-span-2' : ''}`}>
              <label className="text-xs font-bold text-slate-700">Rol y Permisos</label>
              <div className="relative">
                <Shield className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <select 
                  value={formData.rol}
                  onChange={e => setFormData({...formData, rol: e.target.value as RoleType})}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all cursor-pointer"
                >
                  {ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.label} — {r.desc}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 pt-2">
            <label className="text-xs font-bold text-slate-700">Seleccionar Avatar</label>
            <div className="flex flex-wrap gap-4">
              {AVATARS.map((avatar, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setFormData({...formData, avatarUrl: avatar})}
                  className={`w-12 h-12 rounded-full cursor-pointer border-2 transition-all overflow-hidden ${
                    formData.avatarUrl === avatar 
                      ? 'border-orange-500 scale-110 shadow-md ring-2 ring-orange-500/30' 
                      : 'border-transparent hover:scale-105 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={avatar} alt={`Avatar ${idx + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <button 
              type="button" 
              onClick={handleCancelClick}
              disabled={isSubmitting}
              className="px-4 py-2 text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-5 py-2 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-orange-500/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
              {editingUserId ? 'Guardar Cambios' : 'Registrar Usuario'}
            </button>
          </div>
        </form>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4">Usuario</th>
                <th className="px-6 py-4">Rol Asignado</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {usuarios.map(u => {
                const isSelf = u.esCurrentUser;
                return (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                        <img src={u.avatarUrl} alt={u.nombre} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{u.nombre}</span>
                          {isSelf && (
                            <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide bg-orange-100 text-orange-700 rounded-md border border-orange-200">
                              Tú
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-500 font-medium">{u.email}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                        u.rol === 'SUPERADMIN' 
                          ? 'bg-purple-50 text-purple-700 border border-purple-200' 
                          : u.rol === 'ADMIN'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {ROLES.find(r => r.value === u.rol)?.label || u.rol}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {u.estado === 'ACTIVO' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          Activo
                        </span>
                      )}
                      {u.estado === 'INACTIVO' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <PauseCircle className="w-3.5 h-3.5 text-amber-600" />
                          Inactivo
                        </span>
                      )}
                      {u.estado === 'BLOQUEADO' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                          <Ban className="w-3.5 h-3.5 text-red-600" />
                          Bloqueado
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* Botón Editar */}
                        <button 
                          type="button"
                          onClick={() => handleEditClick(u)}
                          title="Editar usuario"
                          className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Botón Desactivar / Activar */}
                        <button 
                          type="button"
                          disabled={isSelf}
                          onClick={() => {
                            if (u.estado === 'ACTIVO') {
                              handleToggleStatus(u, 'INACTIVO');
                            } else {
                              handleToggleStatus(u, 'ACTIVO');
                            }
                          }}
                          title={isSelf ? "No puedes desactivar tu propia cuenta" : (u.estado === 'ACTIVO' ? "Desactivar acceso" : "Reactivar acceso")}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isSelf 
                              ? 'text-slate-300 cursor-not-allowed' 
                              : u.estado === 'ACTIVO'
                              ? 'text-slate-500 hover:text-amber-600 hover:bg-amber-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {u.estado === 'ACTIVO' ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                        </button>

                        {/* Botón Bloquear / Desbloquear */}
                        <button 
                          type="button"
                          disabled={isSelf}
                          onClick={() => {
                            if (u.estado === 'BLOQUEADO') {
                              handleToggleStatus(u, 'ACTIVO');
                            } else {
                              setConfirmModal({ isOpen: true, type: 'BLOCK', usuario: u });
                            }
                          }}
                          title={isSelf ? "No puedes bloquearte a ti mismo" : (u.estado === 'BLOQUEADO' ? "Desbloquear" : "Bloquear acceso")}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isSelf 
                              ? 'text-slate-300 cursor-not-allowed' 
                              : u.estado === 'BLOQUEADO'
                              ? 'text-red-600 bg-red-50 hover:bg-red-100'
                              : 'text-slate-500 hover:text-red-600 hover:bg-red-50'
                          }`}
                        >
                          <Ban className="w-4 h-4" />
                        </button>

                        {/* Botón Eliminar */}
                        <button 
                          type="button"
                          disabled={isSelf}
                          onClick={() => setConfirmModal({ isOpen: true, type: 'DELETE', usuario: u })}
                          title={isSelf ? "No puedes eliminar tu propia cuenta" : "Eliminar de la empresa"}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isSelf ? 'text-slate-300 cursor-not-allowed' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                          }`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                      </div>
                    </td>
                  </tr>
                );
              })}
              {usuarios.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-400">
                    No hay usuarios registrados en esta empresa.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal.isOpen && confirmModal.usuario && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {confirmModal.type === 'DELETE' ? '¿Desvincular Usuario?' : '¿Bloquear Acceso?'}
                </h3>
                <span className="text-xs text-slate-500">{confirmModal.usuario.email}</span>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              {confirmModal.type === 'DELETE' 
                ? `Esta acción eliminará la membresía de "${confirmModal.usuario.nombre}" en tu empresa. El usuario no podrá acceder a este espacio de trabajo.`
                : `Esta acción bloqueará de inmediato a "${confirmModal.usuario.nombre}". No podrá ingresar al sistema hasta que sea desbloqueado por un administrador.`}
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmModal({ isOpen: false, type: 'DELETE', usuario: null })}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirmModal.type === 'DELETE') {
                    handleDeleteUser(confirmModal.usuario!);
                  } else {
                    handleToggleStatus(confirmModal.usuario!, 'BLOQUEADO');
                  }
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-md shadow-red-600/20 transition-all"
              >
                {confirmModal.type === 'DELETE' ? 'Sí, Desvincular' : 'Sí, Bloquear'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
