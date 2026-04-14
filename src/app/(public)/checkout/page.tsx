'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import { useToast } from '@/components/ui/Toast'
import { formatCurrency } from '@/lib/utils'
import { CreditCard, Banknote, Package2, CheckCircle } from 'lucide-react'

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart()
  const { showToast } = useToast()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    metodoPago: 'transferencia',
    notas: '',
  })

  if (items.length === 0 && !success) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <Package2 size={48} className="mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Carrito vacío</h2>
        <Link href="/catalogo" className="text-amber-600 hover:underline">Ir al catálogo</Link>
      </div>
    )
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="bg-green-50 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Pedido realizado!</h2>
        <p className="text-gray-500 mb-8">Hemos recibido tu pedido. Te contactaremos pronto para confirmar.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/cuenta/pedidos" className="bg-amber-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-amber-600">
            Ver mis pedidos
          </Link>
          <Link href="/catalogo" className="border border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-50">
            Seguir comprando
          </Link>
        </div>
      </div>
    )
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      try {
        const res = await fetch('/api/pedidos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: items.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad, precio: i.precio })),
            direccion: form.direccion,
            ciudad: form.ciudad,
            telefono: form.telefono,
            metodoPago: form.metodoPago,
            notas: form.notas,
          }),
        })

        if (res.ok) {
          clearCart()
          setSuccess(true)
        } else {
          const data = await res.json()
          if (res.status === 401) {
            showToast('Inicia sesión para completar tu pedido', 'error')
            router.push('/login?next=/checkout')
          } else {
            showToast(data.error ?? 'Error al procesar el pedido', 'error')
          }
        }
      } catch {
        showToast('Error de conexión. Inténtalo de nuevo.', 'error')
      }
    })
  }

  const metodosPago = [
    { value: 'transferencia', label: 'Transferencia bancaria', icon: Banknote },
    { value: 'efectivo', label: 'Pago en tienda / Efectivo', icon: Banknote },
    { value: 'tarjeta', label: 'Tarjeta de crédito/débito', icon: CreditCard },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Finalizar Compra</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Contact */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-5">Datos de Contacto</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
                  <input name="nombre" value={form.nombre} onChange={handleChange} required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Juan Pérez" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
                  <input name="telefono" value={form.telefono} onChange={handleChange} required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="55 1234 5678" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="tu@correo.com" />
                </div>
              </div>
            </div>

            {/* Shipping */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-5">Dirección de Entrega</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección completa *</label>
                  <input name="direccion" value={form.direccion} onChange={handleChange} required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Calle, número, colonia" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad / Municipio</label>
                  <input name="ciudad" value={form.ciudad} onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Ciudad de México" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas de entrega</label>
                  <textarea name="notas" value={form.notas} onChange={handleChange} rows={2}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                    placeholder="Instrucciones especiales, referencias, etc." />
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-5">Método de Pago</h2>
              <div className="space-y-3">
                {metodosPago.map((mp) => (
                  <label
                    key={mp.value}
                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                      form.metodoPago === mp.value
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="metodoPago"
                      value={mp.value}
                      checked={form.metodoPago === mp.value}
                      onChange={handleChange}
                      className="accent-amber-500"
                    />
                    <mp.icon size={18} className="text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">{mp.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-amber-500 text-white py-3.5 rounded-xl font-semibold hover:bg-amber-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 text-base"
            >
              {isPending ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Procesando...
                </>
              ) : (
                <>Confirmar Pedido · {formatCurrency(total)}</>
              )}
            </button>
          </form>
        </div>

        {/* Summary */}
        <div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sticky top-20">
            <h2 className="text-lg font-bold text-gray-900 mb-5">Tu Pedido</h2>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {items.map((item) => (
                <div key={item.productoId} className="flex justify-between text-sm">
                  <span className="text-gray-600 flex-1 pr-2">{item.nombre} <span className="text-gray-400">×{item.cantidad}</span></span>
                  <span className="font-medium shrink-0">{formatCurrency(item.precio * item.cantidad)}</span>
                </div>
              ))}
            </div>
            <hr className="my-4 border-gray-100" />
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>Envío</span>
              <span className="text-green-600 font-medium">Por confirmar</span>
            </div>
            <hr className="my-3 border-gray-100" />
            <div className="flex justify-between font-bold text-lg text-gray-900">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
