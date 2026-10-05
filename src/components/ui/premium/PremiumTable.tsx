'use client';

import React, { useState } from 'react';
import { Search, Filter, Plus, MoreVertical, Check, ChevronLeft, ChevronRight } from 'lucide-react';

export interface PremiumUserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Pending' | 'Offline';
  avatarInitials: string;
  avatarBg?: string;
}

const DEFAULT_USERS: PremiumUserItem[] = [
  { id: '1', name: 'Ajay Sharma', email: 'ajay.sharma@gmail.com', role: 'UI Designer', status: 'Active', avatarInitials: 'AS', avatarBg: 'bg-indigo-600' },
  { id: '2', name: 'Mariana López', email: 'm.lopez@empresa.com', role: 'Frontend Lead', status: 'Active', avatarInitials: 'ML', avatarBg: 'bg-emerald-600' },
  { id: '3', name: 'Carlos Mendoza', email: 'cmendoza@constructora.com', role: 'Operador WMS', status: 'Pending', avatarInitials: 'CM', avatarBg: 'bg-amber-600' },
  { id: '4', name: 'Valeria Rivas', email: 'v.rivas@seguridad.io', role: 'Auditor Financiero', status: 'Offline', avatarInitials: 'VR', avatarBg: 'bg-rose-600' },
  { id: '5', name: 'Felipe Duarte', email: 'f.duarte@alquileres.com', role: 'Gerente Comercial', status: 'Active', avatarInitials: 'FD', avatarBg: 'bg-sky-600' },
];

export function PremiumTable({
  users = DEFAULT_USERS,
  onAddUser,
}: {
  users?: PremiumUserItem[];
  onAddUser?: () => void;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Pending' | 'Offline'>('All');

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredUsers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredUsers.map((u) => u.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const getStatusBadge = (status: PremiumUserItem['status']) => {
    switch (status) {
      case 'Active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Pending
          </span>
        );
      case 'Offline':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Offline
          </span>
        );
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-card overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-slate-50/50 border-b border-slate-200">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search users by name, email or role..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2.5 justify-end">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="appearance-none bg-white text-slate-700 border border-slate-200 rounded-xl px-3.5 py-2 pr-8 text-xs font-semibold hover:bg-slate-50 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Offline">Offline</option>
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            type="button"
            onClick={onAddUser}
            className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs sm:text-sm px-4 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Premium Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-indigo-600 text-white text-xs font-semibold tracking-wider uppercase border-b border-indigo-700/50">
              <th className="py-3.5 px-4 w-10 text-center">
                <input
                  type="checkbox"
                  checked={filteredUsers.length > 0 && selectedIds.length === filteredUsers.length}
                  onChange={toggleSelectAll}
                  className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                  aria-label="Select all users"
                />
              </th>
              <th className="py-3.5 px-4">User</th>
              <th className="py-3.5 px-4">Role</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  No users found matching the search criteria.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => {
                const isSelected = selectedIds.includes(user.id);
                return (
                  <tr
                    key={user.id}
                    className={`transition-all duration-150 hover:bg-indigo-50/40 hover:-translate-y-0.5 cursor-pointer ${
                      isSelected ? 'bg-indigo-50/60' : 'bg-white'
                    }`}
                  >
                    <td className="py-4 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(user.id)}
                        className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                        aria-label={`Select user ${user.name}`}
                      />
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-9 h-9 rounded-full ${
                            user.avatarBg || 'bg-indigo-600'
                          } text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0`}
                        >
                          {user.avatarInitials}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 leading-snug truncate">
                            {user.name}
                          </p>
                          <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-medium text-slate-600">
                      {user.role}
                    </td>
                    <td className="py-4 px-4">{getStatusBadge(user.status)}</td>
                    <td className="py-4 px-4 text-right">
                      <button
                        type="button"
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                        aria-label={`Actions for ${user.name}`}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="p-3.5 px-5 bg-slate-50/70 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-slate-500">
        <span>
          Showing <strong className="text-slate-800">{filteredUsers.length}</strong> of{' '}
          <strong className="text-slate-800">{users.length}</strong> users ({selectedIds.length} selected)
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-40"
            disabled
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2.5 py-1 rounded-md bg-indigo-600 text-white font-bold text-xs">
            1
          </span>
          <button
            type="button"
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-40"
            disabled
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
