'use client'
import { useState, useEffect, useTransition } from 'react'
import { formatCurrency } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { Search, AlertTriangle, Package, Edit, ArrowLeftRight } from 'lucide-react'

interface InventarioItem {
  id: string
  stock: number
  stockMinimo: number
  sucursal: { id: string; nombre: string }
  producto: {
    id: string
    nombre: string
    sku: string
    precioMinorista: number
    precioMayorista: number
    categoria: { nombre: string }
  }
}

interface Sucursal { id: string; nombre: string }

export default function InventarioPage() {
  const [inventario, setInventario] = useState<InventarioItem[]>([])
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [buscar, setBuscar] = useState('')
  const [soloAlertas, setSoloAlertas] = useState(false)
  const [sucursalFiltro, setSucursalFiltro] = useState('')
  const [loading, setLoading] = useState(true)
  const [editModal, setEditModal] = useState<InventarioItem | null>(null)
  const [transferModal, setTransferModal] = useState(false)
  const [editStock, setEditStock] = useState({ stock: 0, stockMinimo: 5 })
  const [transfer, setTransfer] = useState({ productoId: '', sucursalOrigenId: '', sucursalDestinoId: '', cantidad: 1, notas: '' })
  const [isPending, startTransition] = useTransition()
  const { showToast } = useToast()

  function load() {
    const qs = new URLSearchParams()
    if (sucursalFiltro) qs.set('sucursalId', sucursalFiltro)
    Promise.all([
      fetch(`/api/inventario?${qs}`).then((r) => r.json()),
      fetch('/api/sucursales').then((r) => r.json()),
    ]).then(([inv, suc]) => {
      setInventario(inv)
      setSucursales(suc)
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [sucursalFiltro])

  const filtered = inventario.filter((i) => {
    const matchSearch = !buscar ||
      i.producto.nombre.toLowerCase().includes(buscar.toLowerCase()) ||
      i.producto.sku.toLowerCase().includes(buscar.toLowerCase())
    const matchAlerta = !soloAlertas || i.stock <= i.stockMinimo
    return matchSearch && matchAlerta
  })

  function openEdit(item: InventarioItem) {
    setEditModal(item)
    setEditStock({ stock: item.stock, stockMinimo: item.stockMinimo })
  }

  function handleSaveStock() {
    if (!editModal) return
    startTransition(async () => {
      const res = await fetch('/api/inventario', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productoId: editModal.producto.id, sucursalId: editModal.sucursal.id, ...editStock }),
      })
      if (res.ok) {
        showToast('Stock actualizado', 'success')
        setEditModal(null)
        load()
      } else {
        showToast('Error al actualizar', 'error')
      }
    })
  }

  function handleTransfer() {
    startTransition(async () => {
      const res = await fetch('/api/transferencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transfer),
      })
      if (res.ok) {
        showToast('Transferencia completada', 'success')
        setTransferModal(false)
        load()
      } else {
        const d = await res.json()
        showToast(d.error ?? 'Error en la transferencia', 'error')
      }
    })
  }

  const alertasCount = inventario.filter((i) => i.stock <= i.stockMinimo).length

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
          <p className="text-gray-500 mt-1">{inventario.length} registros · {alertasCount} con stock bajo</p>
        </div>
        <button
          onClick={() => setTransferModal(true)}
          className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 flex items-center gap-2"
        >
          <ArrowLeftRight size={16} />
          Transferir Stock
        </button>
      </div>

      {alertasCount > 0 && (
        <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle size={20} className="text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            <strong>{alertasCount} productos</strong> tienen stock igual o por debajo del mínimo establecido.
          </p>
          <button onClick={() => setSoloAlertas(!soloAlertas)} className="ml-auto text-sm text-amber-700 font-medium underline">
            {soloAlertas ? 'Ver todos' : 'Filtrar alertas'}
          </button>
        </div>
      )}

      {/* Filters */}
      <Card className="mb-5">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <input
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              placeholder="Buscar por nombre o SKU..."
              className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
          <select
            value={sucursalFiltro}
            onChange={(e) => setSucursalFiltro(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
          >
            <option value="">Todas las sucursales</option>
            {sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Producto', 'SKU', 'Categoría', 'Sucursal', 'Stock', 'Mínimo', 'P. Menudeo', 'P. Mayoreo', 'Estado', ''].map((h) => (
                  <th key={h} className="text-left text-xs font-medium text-gray-500 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-400">Cargando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-400">Sin resultados</td></tr>
              ) : (
                filtered.map((item) => {
                  const enAlerta = item.stock <= item.stockMinimo
                  return (
                    <tr key={item.id} className={`hover:bg-gray-50 ${enAlerta ? 'bg-red-50/30' : ''}`}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-40">
                        <span className="line-clamp-2">{item.producto.nombre}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 font-mono">{item.producto.sku}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.producto.categoria.nombre}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.sucursal.nombre}</td>
                      <td className="px-4 py-3">
                        <span className={`font-bold text-sm ${item.stock === 0 ? 'text-red-600' : enAlerta ? 'text-amber-600' : 'text-gray-900'}`}>
                          {item.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{item.stockMinimo}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(item.producto.precioMinorista)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(item.producto.precioMayorista)}</td>
                      <td className="px-4 py-3">
                        {item.stock === 0
                          ? <Badge variant="danger">Agotado</Badge>
                          : enAlerta
                          ? <Badge variant="warning">Bajo</Badge>
                          : <Badge variant="success">Normal</Badge>}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => openEdit(item)} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                          <Edit size={15} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit stock modal */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Editar Stock" size="sm">
        {editModal && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="font-medium text-gray-900 text-sm">{editModal.producto.nombre}</p>
              <p className="text-xs text-gray-500">{editModal.sucursal.nombre}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock actual</label>
              <input type="number" min="0" value={editStock.stock}
                onChange={(e) => setEditStock((p) => ({ ...p, stock: Number(e.target.value) }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock mínimo</label>
              <input type="number" min="0" value={editStock.stockMinimo}
                onChange={(e) => setEditStock((p) => ({ ...p, stockMinimo: Number(e.target.value) }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditModal(null)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={handleSaveStock} disabled={isPending}
                className="flex-1 bg-amber-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-60">
                {isPending ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Transfer modal */}
      <Modal open={transferModal} onClose={() => setTransferModal(false)} title="Transferir Stock entre Sucursales" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
            <select value={transfer.productoId} onChange={(e) => setTransfer((p) => ({ ...p, productoId: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500">
              <option value="">Seleccionar producto</option>
              {[...new Map(inventario.map((i) => [i.producto.id, i.producto])).values()].map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal Origen</label>
              <select value={transfer.sucursalOrigenId} onChange={(e) => setTransfer((p) => ({ ...p, sucursalOrigenId: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500">
                <option value="">Origen</option>
                {sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal Destino</label>
              <select value={transfer.sucursalDestinoId} onChange={(e) => setTransfer((p) => ({ ...p, sucursalDestinoId: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500">
                <option value="">Destino</option>
                {sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
            <input type="number" min="1" value={transfer.cantidad}
              onChange={(e) => setTransfer((p) => ({ ...p, cantidad: Number(e.target.value) }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <input type="text" value={transfer.notas}
              onChange={(e) => setTransfer((p) => ({ ...p, notas: e.target.value }))}
              placeholder="Motivo de la transferencia..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setTransferModal(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
              Cancelar
            </button>
            <button onClick={handleTransfer} disabled={isPending || !transfer.productoId || !transfer.sucursalOrigenId || !transfer.sucursalDestinoId}
              className="flex-1 bg-amber-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-50">
              {isPending ? 'Transfiriendo...' : 'Confirmar Transferencia'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
