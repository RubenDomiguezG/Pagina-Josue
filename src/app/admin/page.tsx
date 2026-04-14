import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { formatCurrency, formatDateTime, ESTADO_PEDIDO_COLORS, ESTADO_PEDIDO_LABELS } from '@/lib/utils'
import StatCard from '@/components/ui/StatCard'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { ShoppingCart, DollarSign, Package, AlertTriangle, ClipboardList } from 'lucide-react'
import Link from 'next/link'

export default async function AdminDashboard() {
  await requireAdmin()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [ventasHoy, pedidosPendientes, inventarios, ventasRecientes, pedidosRecientes] = await Promise.all([
    prisma.venta.aggregate({
      where: { creadoEn: { gte: today } },
      _count: true,
      _sum: { total: true },
    }),
    prisma.pedido.count({ where: { estado: 'PENDIENTE' } }),
    prisma.inventario.findMany({
      include: { producto: { select: { nombre: true } }, sucursal: { select: { nombre: true } } },
    }),
    prisma.venta.findMany({
      take: 8,
      orderBy: { creadoEn: 'desc' },
      include: {
        sucursal: { select: { nombre: true } },
        vendedor: { select: { nombre: true } },
        items: { select: { cantidad: true } },
      },
    }),
    prisma.pedido.findMany({
      take: 5,
      orderBy: { creadoEn: 'desc' },
      include: { cliente: { include: { user: { select: { nombre: true } } } }, items: { select: { cantidad: true } } },
    }),
  ])

  const productosBajoStock = inventarios.filter((i) => i.stock <= i.stockMinimo)
  const ingresoHoy = ventasHoy._sum.total ?? 0

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          {new Intl.DateTimeFormat('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date())}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <StatCard
          title="Ventas hoy"
          value={ventasHoy._count}
          icon={ShoppingCart}
          color="amber"
        />
        <StatCard
          title="Ingresos hoy"
          value={formatCurrency(ingresoHoy)}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Pedidos pendientes"
          value={pedidosPendientes}
          icon={ClipboardList}
          color="blue"
        />
        <StatCard
          title="Productos bajo stock"
          value={productosBajoStock.length}
          icon={AlertTriangle}
          color={productosBajoStock.length > 0 ? 'red' : 'green'}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent sales */}
        <div className="xl:col-span-2">
          <Card padding={false}>
            <CardHeader className="px-6 pt-6 pb-4">
              <CardTitle>Ventas Recientes</CardTitle>
              <Link href="/admin/ventas" className="text-sm text-amber-600 hover:text-amber-700">Ver todas</Link>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-t border-gray-100">
                    <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Fecha</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Sucursal</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Vendedor</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Items</th>
                    <th className="text-right text-xs font-medium text-gray-500 px-6 py-3">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {ventasRecientes.map((venta) => (
                    <tr key={venta.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-xs text-gray-500">{formatDateTime(venta.creadoEn)}</td>
                      <td className="px-6 py-3 text-sm text-gray-700">{venta.sucursal.nombre}</td>
                      <td className="px-6 py-3 text-sm text-gray-700">{venta.vendedor.nombre}</td>
                      <td className="px-6 py-3 text-sm text-gray-500">{venta.items.reduce((s, i) => s + i.cantidad, 0)} uds</td>
                      <td className="px-6 py-3 text-sm font-semibold text-gray-900 text-right">{formatCurrency(venta.total)}</td>
                    </tr>
                  ))}
                  {ventasRecientes.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">No hay ventas registradas hoy</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Alerts + Pending orders */}
        <div className="space-y-5">
          {/* Low stock alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                <span className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-amber-500" />
                  Stock Bajo
                </span>
              </CardTitle>
              <Link href="/admin/inventario" className="text-xs text-amber-600 hover:text-amber-700">Ver inventario</Link>
            </CardHeader>
            {productosBajoStock.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Todo el inventario en nivel normal</p>
            ) : (
              <ul className="space-y-2">
                {productosBajoStock.slice(0, 6).map((inv) => (
                  <li key={inv.id} className="flex items-center justify-between text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{inv.producto.nombre}</p>
                      <p className="text-xs text-gray-400">{inv.sucursal.nombre}</p>
                    </div>
                    <Badge variant={inv.stock === 0 ? 'danger' : 'warning'}>
                      {inv.stock === 0 ? 'Agotado' : `${inv.stock} uds`}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Pending orders */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pedidos Pendientes</CardTitle>
              <Link href="/admin/pedidos" className="text-xs text-amber-600 hover:text-amber-700">Ver todos</Link>
            </CardHeader>
            {pedidosRecientes.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Sin pedidos pendientes</p>
            ) : (
              <ul className="space-y-3">
                {pedidosRecientes.map((pedido) => (
                  <li key={pedido.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium text-gray-800">{pedido.cliente.user.nombre}</p>
                      <p className="text-xs text-gray-400">{formatCurrency(pedido.total)}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_PEDIDO_COLORS[pedido.estado]}`}>
                      {ESTADO_PEDIDO_LABELS[pedido.estado]}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
