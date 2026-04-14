import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDateTime, ESTADO_PEDIDO_LABELS, ESTADO_PEDIDO_COLORS } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'
import { Package2, ChevronRight } from 'lucide-react'

export default async function MisPedidosPage() {
  const session = await requireAuth()

  const cliente = await prisma.cliente.findUnique({ where: { userId: session.id } })
  const pedidos = cliente
    ? await prisma.pedido.findMany({
        where: { clienteId: cliente.id },
        include: {
          items: { include: { producto: { select: { nombre: true, sku: true, imagenUrl: true } } } },
        },
        orderBy: { creadoEn: 'desc' },
      })
    : []

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/cuenta" className="hover:text-gray-700">Mi Cuenta</Link>
          <ChevronRight size={14} />
          <span className="text-gray-900 font-medium">Mis Pedidos</span>
        </nav>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Mis Pedidos</h1>
          <p className="text-gray-500 mt-1">{pedidos.length} pedidos realizados</p>
        </div>

        {pedidos.length === 0 ? (
          <Card className="text-center py-16">
            <Package2 size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-gray-500 font-medium mb-2">Aún no tienes pedidos</h3>
            <p className="text-gray-400 text-sm mb-6">Explora nuestro catálogo y realiza tu primera compra</p>
            <Link href="/catalogo" className="bg-amber-500 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-amber-600 inline-block">
              Ver Catálogo
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {pedidos.map((pedido) => (
              <Card key={pedido.id} padding={false}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-xs text-gray-400">Fecha</p>
                      <p className="text-sm font-medium text-gray-900">{formatDateTime(pedido.creadoEn)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Total</p>
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(pedido.total)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Pago</p>
                      <p className="text-sm text-gray-700 capitalize">{pedido.metodoPago}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${ESTADO_PEDIDO_COLORS[pedido.estado]}`}>
                    {ESTADO_PEDIDO_LABELS[pedido.estado]}
                  </span>
                </div>

                {/* Items */}
                <div className="px-6 py-4">
                  <div className="space-y-3">
                    {pedido.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                          {item.producto.imagenUrl ? (
                            <img src={item.producto.imagenUrl} alt={item.producto.nombre} className="w-full h-full object-cover" />
                          ) : (
                            <Package2 size={16} className="text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.producto.nombre}</p>
                          <p className="text-xs text-gray-400">×{item.cantidad} · {formatCurrency(item.precio)} c/u</p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 shrink-0">
                          {formatCurrency(item.precio * item.cantidad)}
                        </p>
                      </div>
                    ))}
                  </div>

                  {pedido.direccion && (
                    <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
                      <span className="font-medium">Entrega:</span> {pedido.direccion}
                      {pedido.ciudad && `, ${pedido.ciudad}`}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
