'use client'
import { useState, useEffect, useTransition } from 'react'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { Plus, Search, ShoppingCart } from 'lucide-react'

interface Venta {
  id: string
  clienteNombre: string
  total: number
  tipo: string
  estado: string
  creadoEn: string
  sucursal: { nombre: string }
  vendedor: { nombre: string }
  items: { cantidad: number; precio: number; producto: { nombre: string; sku: string } }[]
}

interface Producto {
  id: string
  nombre: string
  sku: string
  precioMinorista: number
  precioMayorista: number
  inventarios: { stock: number; sucursalId: string }[]
}

interface Sucursal { id: string; nombre: string }

interface VentaItem { productoId: string; nombre: string; cantidad: number; precio: number }

export default function VentasPage() {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [buscar, setBuscar] = useState('')
  const [sucursalFiltro, setSucursalFiltro] = useState('')
  const [isPending, startTransition] = useTransition()
  const { showToast } = useToast()

  // New sale form
  const [form, setForm] = useState({
    sucursalId: '',
    clienteNombre: '',
    tipo: 'MOSTRADOR',
    notas: '',
  })
  const [items, setItems] = useState<VentaItem[]>([])
  const [buscarProd, setBuscarProd] = useState('')

  function load() {
    const qs = new URLSearchParams()
    if (sucursalFiltro) qs.set('sucursalId', sucursalFiltro)
    Promise.all([
      fetch(`/api/ventas?${qs}`).then((r) => r.json()),
      fetch('/api/productos?activo=true').then((r) => r.json()),
      fetch('/api/sucursales').then((r) => r.json()),
    ]).then(([v, p, s]) => {
      setVentas(v)
      setProductos(p)
      setSucursales(s)
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [sucursalFiltro])

  const prodFiltrados = buscarProd
    ? productos.filter((p) => p.nombre.toLowerCase().includes(buscarProd.toLowerCase()) || p.sku.includes(buscarProd))
    : []

  function addItem(prod: Producto) {
    const stock = prod.inventarios.find((i) => i.sucursalId === form.sucursalId)?.stock ?? 0
    setItems((prev) => {
      const ex = prev.find((i) => i.productoId === prod.id)
      if (ex) return prev.map((i) => i.productoId === prod.id ? { ...i, cantidad: Math.min(i.cantidad + 1, stock) } : i)
      return [...prev, { productoId: prod.id, nombre: prod.nombre, cantidad: 1, precio: prod.precioMinorista }]
    })
    setBuscarProd('')
  }

  function submitVenta() {
    if (!form.sucursalId || items.length === 0) {
      showToast('Selecciona sucursal y agrega productos', 'error')
      return
    }
    startTransition(async () => {
      const res = await fetch('/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, items }),
      })
      if (res.ok) {
        showToast('Venta registrada exitosamente', 'success')
        setModal(false)
        setItems([])
        setForm({ sucursalId: '', clienteNombre: '', tipo: 'MOSTRADOR', notas: '' })
        load()
      } else {
        showToast('Error al registrar la venta', 'error')
      }
    })
  }

  const total = items.reduce((s, i) => s + i.precio * i.cantidad, 0)
  const ventasFiltradas = ventas.filter((v) =>
    !buscar || v.clienteNombre.toLowerCase().includes(buscar.toLowerCase()) || v.vendedor.nombre.toLowerCase().includes(buscar.toLowerCase())
  )

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ventas</h1>
          <p className="text-gray-500 mt-1">{ventas.length} ventas registradas</p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600 flex items-center gap-2"
        >
          <Plus size={16} />
          Registrar Venta
        </button>
      </div>

      {/* Filters */}
      <Card className="mb-5">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <input value={buscar} onChange={(e) => setBuscar(e.target.value)}
              placeholder="Buscar por cliente o vendedor..."
              className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
          <select value={sucursalFiltro} onChange={(e) => setSucursalFiltro(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500">
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
                {['Fecha', 'Cliente', 'Sucursal', 'Vendedor', 'Tipo', 'Items', 'Total', 'Estado'].map((h) => (
                  <th key={h} className="text-left text-xs font-medium text-gray-500 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">Cargando...</td></tr>
              ) : ventasFiltradas.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">Sin resultados</td></tr>
              ) : (
                ventasFiltradas.map((venta) => (
                  <tr key={venta.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDateTime(venta.creadoEn)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{venta.clienteNombre}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{venta.sucursal.nombre}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{venta.vendedor.nombre}</td>
                    <td className="px-4 py-3">
                      <Badge variant={venta.tipo === 'MOSTRADOR' ? 'default' : 'info'}>
                        {venta.tipo === 'MOSTRADOR' ? 'Mostrador' : 'En línea'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{venta.items.reduce((s, i) => s + i.cantidad, 0)} uds</td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900">{formatCurrency(venta.total)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={venta.estado === 'COMPLETADA' ? 'success' : 'danger'}>
                        {venta.estado === 'COMPLETADA' ? 'Completada' : 'Cancelada'}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* New sale modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Registrar Venta" size="xl">
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal *</label>
              <select value={form.sucursalId} onChange={(e) => setForm((p) => ({ ...p, sucursalId: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500">
                <option value="">Seleccionar...</option>
                {sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de venta</label>
              <select value={form.tipo} onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500">
                <option value="MOSTRADOR">Mostrador</option>
                <option value="EN_LINEA">En línea</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
            <input value={form.clienteNombre} onChange={(e) => setForm((p) => ({ ...p, clienteNombre: e.target.value }))}
              placeholder="Público General"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>

          {/* Product search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Agregar productos</label>
            <div className="relative">
              <input value={buscarProd} onChange={(e) => setBuscarProd(e.target.value)}
                placeholder="Buscar por nombre o SKU..."
                className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            {prodFiltrados.length > 0 && (
              <ul className="mt-1 border border-gray-200 rounded-lg overflow-hidden shadow-lg max-h-48 overflow-y-auto">
                {prodFiltrados.slice(0, 8).map((p) => (
                  <li key={p.id}>
                    <button onClick={() => addItem(p)}
                      className="w-full text-left px-4 py-2.5 hover:bg-amber-50 flex justify-between items-center text-sm border-b border-gray-100 last:border-0">
                      <span><span className="font-medium">{p.nombre}</span> <span className="text-gray-400 font-mono text-xs">{p.sku}</span></span>
                      <span className="text-amber-700 font-semibold">{formatCurrency(p.precioMinorista)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Items */}
          {items.length > 0 && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Producto</th>
                    <th className="text-center px-3 py-2 text-xs font-medium text-gray-500">Cant.</th>
                    <th className="text-right px-3 py-2 text-xs font-medium text-gray-500">Precio</th>
                    <th className="text-right px-3 py-2 text-xs font-medium text-gray-500">Subtotal</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item) => (
                    <tr key={item.productoId}>
                      <td className="px-3 py-2 font-medium text-gray-900">{item.nombre}</td>
                      <td className="px-3 py-2 text-center">
                        <input type="number" min="1" value={item.cantidad}
                          onChange={(e) => setItems((p) => p.map((i) => i.productoId === item.productoId ? { ...i, cantidad: Number(e.target.value) } : i))}
                          className="w-16 rounded border border-gray-300 px-2 py-1 text-center text-sm focus:outline-none focus:ring-1 focus:ring-amber-500" />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input type="number" step="0.01" min="0" value={item.precio}
                          onChange={(e) => setItems((p) => p.map((i) => i.productoId === item.productoId ? { ...i, precio: Number(e.target.value) } : i))}
                          className="w-24 rounded border border-gray-300 px-2 py-1 text-right text-sm focus:outline-none focus:ring-1 focus:ring-amber-500" />
                      </td>
                      <td className="px-3 py-2 text-right font-semibold">{formatCurrency(item.precio * item.cantidad)}</td>
                      <td className="px-3 py-2">
                        <button onClick={() => setItems((p) => p.filter((i) => i.productoId !== item.productoId))}
                          className="text-red-400 hover:text-red-600 text-xs">✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={3} className="px-3 py-2 text-right font-bold text-gray-700">Total:</td>
                    <td className="px-3 py-2 text-right font-bold text-gray-900">{formatCurrency(total)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={() => setModal(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
              Cancelar
            </button>
            <button onClick={submitVenta} disabled={isPending || items.length === 0}
              className="flex-1 bg-amber-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-50 flex items-center justify-center gap-2">
              <ShoppingCart size={16} />
              {isPending ? 'Registrando...' : `Registrar Venta · ${formatCurrency(total)}`}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
