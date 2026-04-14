'use client'
import { useState, useEffect, useTransition } from 'react'
import { formatDate } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { Plus, Edit, MapPin, Phone } from 'lucide-react'

interface Sucursal {
  id: string
  nombre: string
  direccion: string
  telefono: string
  activa: boolean
  creadoEn: string
}

const defaultForm = { nombre: '', direccion: '', telefono: '' }

export default function SucursalesPage() {
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editSuc, setEditSuc] = useState<Sucursal | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [isPending, startTransition] = useTransition()
  const { showToast } = useToast()

  function load() {
    fetch('/api/sucursales').then((r) => r.json()).then((d) => {
      setSucursales(d)
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [])

  function openNew() {
    setEditSuc(null)
    setForm(defaultForm)
    setModal(true)
  }

  function openEdit(s: Sucursal) {
    setEditSuc(s)
    setForm({ nombre: s.nombre, direccion: s.direccion, telefono: s.telefono })
    setModal(true)
  }

  function submit() {
    startTransition(async () => {
      const url = editSuc ? `/api/sucursales/${editSuc.id}` : '/api/sucursales'
      const method = editSuc ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        showToast(editSuc ? 'Sucursal actualizada' : 'Sucursal creada', 'success')
        setModal(false)
        load()
      } else {
        showToast('Error al guardar', 'error')
      }
    })
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sucursales</h1>
          <p className="text-gray-500 mt-1">{sucursales.length} sucursales registradas</p>
        </div>
        <button onClick={openNew} className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600 flex items-center gap-2">
          <Plus size={16} />
          Nueva Sucursal
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400">Cargando...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {sucursales.map((suc) => (
            <Card key={suc.id}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{suc.nombre}</h3>
                  <Badge variant={suc.activa ? 'success' : 'default'} className="mt-1">
                    {suc.activa ? 'Activa' : 'Inactiva'}
                  </Badge>
                </div>
                <button onClick={() => openEdit(suc)} className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg">
                  <Edit size={16} />
                </button>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="mt-0.5 shrink-0 text-gray-400" />
                  <span>{suc.direccion}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={14} className="shrink-0 text-gray-400" />
                  <span>{suc.telefono}</span>
                </div>
              </div>
              <p className="mt-4 text-xs text-gray-400">Alta: {formatDate(suc.creadoEn)}</p>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editSuc ? 'Editar Sucursal' : 'Nueva Sucursal'} size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la sucursal *</label>
            <input value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
              placeholder="Ej. Sucursal Centro"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección *</label>
            <input value={form.direccion} onChange={(e) => setForm((p) => ({ ...p, direccion: e.target.value }))}
              placeholder="Calle, número, colonia, ciudad"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input value={form.telefono} onChange={(e) => setForm((p) => ({ ...p, telefono: e.target.value }))}
              placeholder="55 1234 5678"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          {editSuc && (
            <div className="flex items-center gap-2">
              <input type="checkbox" id="activa" checked={true}
                className="rounded accent-amber-500" readOnly />
              <label htmlFor="activa" className="text-sm text-gray-700">Sucursal activa</label>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModal(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
              Cancelar
            </button>
            <button onClick={submit} disabled={isPending || !form.nombre || !form.direccion}
              className="flex-1 bg-amber-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-60">
              {isPending ? 'Guardando...' : editSuc ? 'Guardar Cambios' : 'Crear Sucursal'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
