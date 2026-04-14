'use client'
import { useState, useEffect, useTransition } from 'react'
import { formatCurrency, formatDateTime, ESTADO_PEDIDO_LABELS, ESTADO_PEDIDO_COLORS } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { Eye } from 'lucide-react'

interface Pedido {
  id: string
  total: number
  estado: string
  direccion: string
  ciudad: string
  telefono: string
  metodoPago: string
  creadoEn: string
  cliente: { user: { nombre: string; email: string } }
  items: { cantidad: number; precio: number; producto: { nombre: string; sku: string } }[]
}

const ESTADOS = ['PENDIENTE', 'CONFIRMADO', 'EN_PROCESO', 'ENVIADO', 'ENTREGADO', 'CANCELADO']

export default function PedidosAdminPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [selected, setSelected] = useState<Pedido | null>(null)
  const [isPending, startTransition] = useTransition()
  const { showToast } = useToast()

  function load() {
    const qs = filtroEstado ? `?estado=${filtroEstado}` : ''
    fetch(`/api/pedidos${qs}`).then((r) => r.json()).then((d) => {
      setPedidos(d)
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [filtroEstado])

  function updateEstado(id: string, estado: string) {
    startTransition(async () => {
      const res = await fetch(`/api/pedidos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado }),
      })
      if (res.ok) {
        showToast('Estado actualizado', 'success')
        if (selected?.id === id) setSelected((p) => p ? { ...p, estado } : null)
        load()
      } else {
        showToast('Error al actualizar', 'error')
      }
    })
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pedidos en Línea</h1>
        <p className="text-gray-500 mt-1">{pedidos.length} pedidos</p>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button
          onClick={() => setFiltroEstado('')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!filtroEstado ? 'bg-gray-900 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
        >
          Todos
        </button>
        {ESTADOS.map((estado) => (
          <button
            key={estado}
            onClick={() => setFiltroEstado(estado)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filtroEstado === estado ? 'bg-gray-900 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
          >
            {ESTADO_PEDIDO_LABELS[estado]}
          </button>
        ))}
      </div>

      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Fecha', 'Cliente', 'Artículos', 'Total', 'Método pago', 'Estado', 'Acción', ''].map((h) => (
                  <th key={h} className="text-left text-xs font-medium text-gray-500 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">Cargando...</td></tr>
              ) : pedidos.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">Sin pedidos</td></tr>
              ) : (
                pedidos.map((pedido) => (
                  <tr key={pedido.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDateTime(pedido.creadoEn)}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{pedido.cliente.user.nombre}</p>
                      <p className="text-xs text-gray-400">{pedido.cliente.user.email}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{pedido.items.reduce((s, i) => s + i.cantidad, 0)} uds</td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900">{formatCurrency(pedido.total)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 capitalize">{pedido.metodoPago}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_PEDIDO_COLORS[pedido.estado]}`}>
                        {ESTADO_PEDIDO_LABELS[pedido.estado]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={pedido.estado}
                        onChange={(e) => updateEstado(pedido.id, e.target.value)}
                        disabled={isPending}
                        className="text-xs rounded border border-gray-300 px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        {ESTADOS.map((e) => <option key={e} value={e}>{ESTADO_PEDIDO_LABELS[e]}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setSelected(pedido)} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg">
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Order detail modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Detalle del Pedido" size="lg">
        {selected && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-medium text-gray-500 mb-1">Cliente</p>
                <p className="font-semibold text-gray-900">{selected.cliente.user.nombre}</p>
                <p className="text-gray-500">{selected.cliente.user.email}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-medium text-gray-500 mb-1">Entrega</p>
                <p className="font-medium text-gray-900">{selected.direccion}</p>
                {selected.ciudad && <p className="text-gray-500">{selected.ciudad}</p>}
                {selected.telefono && <p className="text-gray-500">{selected.telefono}</p>}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Productos</p>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Producto</th>
                      <th className="text-center px-3 py-2 text-xs font-medium text-gray-500">Cant.</th>
                      <th className="text-right px-3 py-2 text-xs font-medium text-gray-500">Precio</th>
                      <th className="text-right px-3 py-2 text-xs font-medium text-gray-500">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selected.items.map((item, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2">
                          <p className="font-medium">{item.producto.nombre}</p>
                          <p className="text-xs text-gray-400 font-mono">{item.producto.sku}</p>
                        </td>
                        <td className="px-3 py-2 text-center">{item.cantidad}</td>
                        <td className="px-3 py-2 text-right">{formatCurrency(item.precio)}</td>
                        <td className="px-3 py-2 text-right font-semibold">{formatCurrency(item.precio * item.cantidad)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={3} className="px-3 py-2 text-right font-bold">Total:</td>
                      <td className="px-3 py-2 text-right font-bold text-gray-900">{formatCurrency(selected.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Actualizar estado</label>
              <select
                value={selected.estado}
                onChange={(e) => updateEstado(selected.id, e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {ESTADOS.map((e) => <option key={e} value={e}>{ESTADO_PEDIDO_LABELS[e]}</option>)}
              </select>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
