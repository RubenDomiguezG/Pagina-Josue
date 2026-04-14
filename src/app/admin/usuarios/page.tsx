'use client'
import { useState, useEffect, useTransition } from 'react'
import { formatDate, ROLE_LABELS } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { Plus, Edit, UserX } from 'lucide-react'

interface Usuario {
  id: string
  nombre: string
  email: string
  role: string
  tipoCliente: string
  activo: boolean
  sucursalId: string | null
  creadoEn: string
  sucursal: { nombre: string } | null
}

interface Sucursal { id: string; nombre: string }

const ROLES = ['ADMIN', 'VENDEDOR', 'ALMACEN', 'CLIENTE']
const TIPOS = ['MINORISTA', 'MAYORISTA']

const defaultForm = { nombre: '', email: '', password: '', role: 'CLIENTE', tipoCliente: 'MINORISTA', sucursalId: '' }

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editUser, setEditUser] = useState<Usuario | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [isPending, startTransition] = useTransition()
  const { showToast } = useToast()

  function load() {
    Promise.all([
      fetch('/api/usuarios').then((r) => r.json()),
      fetch('/api/sucursales').then((r) => r.json()),
    ]).then(([u, s]) => {
      setUsuarios(u)
      setSucursales(s)
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [])

  function openNew() {
    setEditUser(null)
    setForm(defaultForm)
    setModal(true)
  }

  function openEdit(user: Usuario) {
    setEditUser(user)
    setForm({ nombre: user.nombre, email: user.email, password: '', role: user.role, tipoCliente: user.tipoCliente, sucursalId: user.sucursalId ?? '' })
    setModal(true)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
  }

  function submit() {
    startTransition(async () => {
      const url = editUser ? `/api/usuarios/${editUser.id}` : '/api/usuarios'
      const method = editUser ? 'PUT' : 'POST'
      const body = editUser ? { nombre: form.nombre, email: form.email, role: form.role, tipoCliente: form.tipoCliente, sucursalId: form.sucursalId || null, activo: true } : form
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        showToast(editUser ? 'Usuario actualizado' : 'Usuario creado', 'success')
        setModal(false)
        load()
      } else {
        const d = await res.json()
        showToast(d.error ?? 'Error', 'error')
      }
    })
  }

  function deactivate(id: string) {
    startTransition(async () => {
      await fetch(`/api/usuarios/${id}`, { method: 'DELETE' })
      showToast('Usuario desactivado', 'success')
      load()
    })
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-500 mt-1">{usuarios.length} usuarios registrados</p>
        </div>
        <button onClick={openNew} className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600 flex items-center gap-2">
          <Plus size={16} />
          Nuevo Usuario
        </button>
      </div>

      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Nombre', 'Correo', 'Rol', 'Tipo Cliente', 'Sucursal', 'Registro', 'Estado', ''].map((h) => (
                  <th key={h} className="text-left text-xs font-medium text-gray-500 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">Cargando...</td></tr>
              ) : (
                usuarios.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-gray-800 text-white rounded-full h-8 w-8 flex items-center justify-center text-sm font-bold shrink-0">
                          {u.nombre.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{u.nombre}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant={u.role === 'ADMIN' ? 'danger' : u.role === 'VENDEDOR' ? 'secondary' : u.role === 'ALMACEN' ? 'info' : 'default'}>
                        {ROLE_LABELS[u.role] ?? u.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{u.tipoCliente}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{u.sucursal?.nombre ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{formatDate(u.creadoEn)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={u.activo ? 'success' : 'default'}>{u.activo ? 'Activo' : 'Inactivo'}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(u)} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg">
                          <Edit size={14} />
                        </button>
                        {u.activo && (
                          <button onClick={() => deactivate(u.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                            <UserX size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title={editUser ? 'Editar Usuario' : 'Nuevo Usuario'} size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
            <input name="nombre" value={form.nombre} onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
            <input name="email" type="email" value={form.email} onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          {!editUser && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input name="password" type="password" value={form.password} onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
              <select name="role" value={form.role} onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500">
                {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r] ?? r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Cliente</label>
              <select name="tipoCliente" value={form.tipoCliente} onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500">
                {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal asignada</label>
            <select name="sucursalId" value={form.sucursalId} onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500">
              <option value="">Sin sucursal</option>
              {sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModal(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
              Cancelar
            </button>
            <button onClick={submit} disabled={isPending}
              className="flex-1 bg-amber-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-60">
              {isPending ? 'Guardando...' : editUser ? 'Guardar Cambios' : 'Crear Usuario'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
