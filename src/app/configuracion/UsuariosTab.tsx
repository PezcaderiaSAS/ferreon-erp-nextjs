"use client";

import { X, Plus, Edit2 } from 'lucide-react';


import React, { useState, useEffect } from 'react';
import { RoleType } from '../../core/domain/entities/usuario';

const AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Mimi&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Nala&backgroundColor=c2e8c2'
];

const ROLES: { value: RoleType; label: string }[] = [
  { value: 'SUPERADMIN', label: 'Super Administrador' },
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'OPERADOR_BODEGA', label: 'Operador de Bodega' },
  { value: 'FACTURACION_CARTERA', label: 'Facturación y Cartera' },
  { value: 'CONSULTOR_AUDITOR', label: 'Consultor / Auditor' }
];

type UsuarioData = {
  id: string;
  nombre: string;
  email: string;
  rol: RoleType;
  avatarUrl: string;
};

export function UsuariosTab() {
  const [usuarios, setUsuarios] = useState<UsuarioData[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    rol: 'ADMIN' as RoleType,
    avatarUrl: AVATARS[0]
  });

  const fetchUsuarios = async () => {
    try {
      const res = await fetch('/api/usuarios');
      if (!res.ok) throw new Error('Error al obtener usuarios');
      const data = await res.json();
      setUsuarios(data.usuarios || []);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('No se pudo cargar la lista de usuarios. Verifica tus permisos.');
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
    try {
      const url = '/api/usuarios';
      const method = editingUserId ? 'PUT' : 'POST';
      const bodyPayload = editingUserId 
        ? { id: editingUserId, nombre: formData.nombre, rol: formData.rol, avatarUrl: formData.avatarUrl }
        : { email: formData.email, nombre: formData.nombre, rol: formData.rol, avatarUrl: formData.avatarUrl };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || (editingUserId ? 'Error al actualizar el usuario' : 'Error al crear el usuario'));
      }

      await fetchUsuarios(); // Refrescar la lista de usuarios
      setIsCreating(false);
      setEditingUserId(null);
      setFormData({ nombre: '', email: '', rol: 'ADMIN', avatarUrl: AVATARS[0] });
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (usuario: UsuarioData) => {
    setEditingUserId(usuario.id);
    setFormData({
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      avatarUrl: usuario.avatarUrl
    });
    setIsCreating(true);
  };

  const handleCancelClick = () => {
    setIsCreating(false);
    setEditingUserId(null);
    setFormData({ nombre: '', email: '', rol: 'ADMIN', avatarUrl: AVATARS[0] });
  };

  if (isInitializing) {
    return (
      <div className="flex justify-center items-center h-48 bg-white rounded-xl shadow-card border border-slate-200">
        <div className="w-8 h-8 border-4 border-brand-salmon border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {errorMsg && (
        <div className="w-full bg-red-50 text-red-600 text-sm p-4 rounded-xl border border-red-100 flex items-center justify-between">
          <span>{errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-700">
            <X className="text-lg w-5 h-5" />
          </button>
        </div>
      )}

      <div className="flex justify-between items-center bg-white rounded-xl shadow-card border border-slate-200 p-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Gestión de Usuarios y Roles</h2>
          <p className="text-sm text-slate-500">Administra el acceso y los permisos del sistema.</p>
        </div>
        <button 
          onClick={() => {
            setEditingUserId(null);
            setFormData({ nombre: '', email: '', rol: 'ADMIN', avatarUrl: AVATARS[0] });
            setIsCreating(true);
          }}
          className="px-4 py-2 bg-brand-salmon text-white rounded-lg text-sm font-medium hover:bg-brand-salmonDark transition-colors flex items-center gap-2"
        >
          <Plus className="text-sm w-5 h-5" />
          Nuevo Usuario
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleSubmit} className="bg-slate-50 rounded-xl border border-slate-200 p-6 flex flex-col gap-6">
          <h3 className="text-lg font-semibold text-slate-800">{editingUserId ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">Nombre Completo</label>
              <input 
                type="text" 
                required 
                value={formData.nombre}
                onChange={e => setFormData({...formData, nombre: e.target.value})}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-salmon/50" 
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">Correo Electrónico</label>
              <input 
                type="email" 
                required 
                disabled={!!editingUserId}
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-salmon/50 disabled:bg-slate-100 disabled:text-slate-500" 
              />
            </div>
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-sm font-medium text-slate-700">Rol de Acceso</label>
              <select 
                value={formData.rol}
                onChange={e => setFormData({...formData, rol: e.target.value as RoleType})}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-salmon/50"
              >
                {ROLES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700">Seleccionar Avatar</label>
            <div className="flex gap-4">
              {AVATARS.map((avatar, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setFormData({...formData, avatarUrl: avatar})}
                  className={`w-16 h-16 rounded-full cursor-pointer border-4 transition-all duration-200 overflow-hidden ${
                    formData.avatarUrl === avatar ? 'border-brand-salmon scale-110 shadow-md' : 'border-transparent hover:scale-105 hover:shadow-sm opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={avatar} alt={`Avatar ${idx + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button 
              type="button" 
              onClick={handleCancelClick}
              disabled={isSubmitting}
              className="px-4 py-2 text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-4 py-2 bg-brand-salmon text-white rounded-lg text-sm font-medium hover:bg-brand-salmonDark transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
              {editingUserId ? 'Guardar Cambios' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-card border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-600">
              <th className="px-6 py-4">Usuario</th>
              <th className="px-6 py-4">Rol</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {usuarios.map(u => (
              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 bg-slate-100">
                    <img src={u.avatarUrl} alt={u.nombre} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-900 text-sm">{u.nombre}</span>
                    <span className="text-xs text-slate-500">{u.email}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                    {ROLES.find(r => r.value === u.rol)?.label || u.rol}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => handleEditClick(u)}
                    className="text-slate-400 hover:text-brand-salmon transition-colors"
                  >
                    <Edit2 className="text-xl w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
            {usuarios.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-slate-500 text-sm">
                  No hay usuarios registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
