'use client'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import { formatCurrency } from '@/lib/utils'
import { Trash2, Plus, Minus, ShoppingCart, Package2, ArrowRight } from 'lucide-react'

export default function CarritoPage() {
  const { items, removeItem, updateQuantity, total, clearCart } = useCart()

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <ShoppingCart size={64} className="mx-auto text-gray-200 mb-6" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Tu carrito está vacío</h2>
        <p className="text-gray-500 mb-6">Agrega productos desde nuestro catálogo</p>
        <Link
          href="/catalogo"
          className="bg-amber-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-amber-600 transition-colors inline-flex items-center gap-2"
        >
          <Package2 size={18} />
          Ver Catálogo
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Carrito de Compras
          <span className="ml-2 text-base font-normal text-gray-500">({items.length} {items.length === 1 ? 'producto' : 'productos'})</span>
        </h1>
        <button
          onClick={clearCart}
          className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1"
        >
          <Trash2 size={14} />
          Vaciar carrito
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.productoId}
              className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-4"
            >
              {/* Image */}
              <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                {item.imagenUrl ? (
                  <img src={item.imagenUrl} alt={item.nombre} className="w-full h-full object-cover" />
                ) : (
                  <Package2 size={28} className="text-gray-300" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm leading-tight">{item.nombre}</h3>
                <p className="text-xs text-gray-400 font-mono mt-0.5">SKU: {item.sku}</p>
                <p className="text-sm font-bold text-gray-900 mt-1">{formatCurrency(item.precio)}</p>
              </div>

              {/* Quantity */}
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden shrink-0">
                <button
                  onClick={() => updateQuantity(item.productoId, item.cantidad - 1)}
                  className="p-2 hover:bg-gray-50 transition-colors"
                >
                  <Minus size={14} />
                </button>
                <span className="px-3 py-2 text-sm font-semibold min-w-10 text-center">{item.cantidad}</span>
                <button
                  onClick={() => updateQuantity(item.productoId, item.cantidad + 1)}
                  disabled={item.cantidad >= item.stock}
                  className="p-2 hover:bg-gray-50 transition-colors disabled:opacity-40"
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Subtotal */}
              <div className="text-right shrink-0 ml-2">
                <p className="font-bold text-gray-900">{formatCurrency(item.precio * item.cantidad)}</p>
                <button
                  onClick={() => removeItem(item.productoId)}
                  className="mt-1 text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                >
                  <Trash2 size={12} />
                  Quitar
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sticky top-20">
            <h2 className="text-lg font-bold text-gray-900 mb-5">Resumen del Pedido</h2>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.productoId} className="flex justify-between text-sm text-gray-600">
                  <span className="truncate flex-1 pr-2">{item.nombre} ×{item.cantidad}</span>
                  <span className="font-medium shrink-0">{formatCurrency(item.precio * item.cantidad)}</span>
                </div>
              ))}
            </div>
            <hr className="my-4 border-gray-200" />
            <div className="flex justify-between font-bold text-lg text-gray-900">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Envío calculado al momento del pago</p>

            <Link
              href="/checkout"
              className="mt-6 w-full bg-amber-500 text-white py-3 rounded-xl font-semibold hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
            >
              Proceder al Pago
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/catalogo"
              className="mt-3 w-full border border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              Seguir comprando
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
