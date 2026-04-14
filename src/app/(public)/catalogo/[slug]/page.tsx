'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Package2, ShoppingCart, ChevronRight, Plus, Minus, CheckCircle, AlertCircle } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { useToast } from '@/components/ui/Toast'
import { formatCurrency } from '@/lib/utils'

interface Producto {
  id: string
  nombre: string
  descripcion: string
  sku: string
  precioMinorista: number
  precioMayorista: number
  imagenUrl: string
  activo: boolean
  categoria: { id: string; nombre: string; slug: string }
  inventarios: { sucursalId: string; stock: number; sucursal: { nombre: string } }[]
}

export default function ProductoPage() {
  const params = useParams()
  const [producto, setProducto] = useState<Producto | null>(null)
  const [loading, setLoading] = useState(true)
  const [cantidad, setCantidad] = useState(1)
  const [tipoCliente, setTipoCliente] = useState<'MINORISTA' | 'MAYORISTA'>('MINORISTA')
  const { addItem } = useCart()
  const { showToast } = useToast()

  useEffect(() => {
    fetch(`/api/productos/${params.slug}`)
      .then((r) => r.json())
      .then((data) => {
        setProducto(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))

    // Check session type via cookie presence (simple check)
    fetch('/api/cuenta/pedidos').then((r) => {
      if (r.ok) {
        // logged in - check tipo in session somehow
      }
    })
  }, [params.slug])

  const stockTotal = producto?.inventarios.reduce((s, i) => s + i.stock, 0) ?? 0
  const precio = tipoCliente === 'MAYORISTA' ? (producto?.precioMayorista ?? 0) : (producto?.precioMinorista ?? 0)

  function handleAddToCart() {
    if (!producto) return
    addItem({
      productoId: producto.id,
      nombre: producto.nombre,
      sku: producto.sku,
      precio,
      cantidad,
      imagenUrl: producto.imagenUrl,
      stock: stockTotal,
    })
    showToast(`${producto.nombre} agregado al carrito`, 'success')
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!producto) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <Package2 size={48} className="mx-auto text-gray-300 mb-4" />
        <h2 className="text-gray-500">Producto no encontrado</h2>
        <Link href="/catalogo" className="mt-3 text-amber-600 hover:underline">Volver al catálogo</Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-gray-700">Inicio</Link>
        <ChevronRight size={14} />
        <Link href="/catalogo" className="hover:text-gray-700">Catálogo</Link>
        <ChevronRight size={14} />
        <Link href={`/catalogo?categoria=${producto.categoria.id}`} className="hover:text-gray-700">
          {producto.categoria.nombre}
        </Link>
        <ChevronRight size={14} />
        <span className="text-gray-900 font-medium">{producto.nombre}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Image */}
        <div className="aspect-square bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden">
          {producto.imagenUrl ? (
            <img src={producto.imagenUrl} alt={producto.nombre} className="w-full h-full object-contain p-4" />
          ) : (
            <Package2 size={80} className="text-gray-300" />
          )}
        </div>

        {/* Info */}
        <div>
          <p className="text-sm text-amber-600 font-medium mb-2">{producto.categoria.nombre}</p>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{producto.nombre}</h1>
          <p className="text-sm text-gray-400 font-mono mb-4">SKU: {producto.sku}</p>

          {producto.descripcion && (
            <p className="text-gray-600 mb-6 leading-relaxed">{producto.descripcion}</p>
          )}

          {/* Tipo de precio */}
          <div className="flex gap-2 mb-4">
            {(['MINORISTA', 'MAYORISTA'] as const).map((tipo) => (
              <button
                key={tipo}
                onClick={() => setTipoCliente(tipo)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${tipoCliente === tipo
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'border-gray-300 text-gray-600 hover:border-gray-400'}`}
              >
                {tipo === 'MINORISTA' ? 'Menudeo' : 'Mayoreo'}
              </button>
            ))}
          </div>

          {/* Price */}
          <div className="mb-6">
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(precio)}</p>
            {tipoCliente === 'MAYORISTA' && (
              <p className="text-sm text-gray-400 line-through mt-0.5">
                Precio menudeo: {formatCurrency(producto.precioMinorista)}
              </p>
            )}
          </div>

          {/* Stock per branch */}
          <div className="mb-6 space-y-2">
            {producto.inventarios.map((inv) => (
              <div key={inv.sucursalId} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-4 py-2.5">
                <span className="text-gray-600">{inv.sucursal.nombre}</span>
                <span className={`flex items-center gap-1.5 font-medium ${inv.stock > 0 ? 'text-green-700' : 'text-red-600'}`}>
                  {inv.stock > 0 ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                  {inv.stock > 0 ? `${inv.stock} disponibles` : 'Sin stock'}
                </span>
              </div>
            ))}
          </div>

          {/* Quantity + Add to cart */}
          {stockTotal > 0 ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                  className="p-2.5 hover:bg-gray-100 transition-colors"
                >
                  <Minus size={16} />
                </button>
                <span className="px-4 py-2 font-semibold min-w-12 text-center">{cantidad}</span>
                <button
                  onClick={() => setCantidad(Math.min(stockTotal, cantidad + 1))}
                  className="p-2.5 hover:bg-gray-100 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-amber-500 text-white py-3 px-6 rounded-xl font-semibold hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingCart size={20} />
                Agregar al Carrito
              </button>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm font-medium">
              Producto sin existencias. Consulta disponibilidad próxima.
            </div>
          )}

          <Link
            href="/carrito"
            className="mt-4 flex items-center justify-center gap-2 border border-gray-300 text-gray-700 py-3 px-6 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm"
          >
            Ver carrito
          </Link>
        </div>
      </div>
    </div>
  )
}
