import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { TrendingUp, Package, DollarSign, ShoppingCart } from 'lucide-react'

export default async function ReportesPage() {
  await requireAdmin()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [ventasMes, ventasAnio, topProductos, ventasPorSucursal, ventasDiarias] = await Promise.all([
    prisma.venta.aggregate({
      where: { creadoEn: { gte: startOfMonth }, estado: 'COMPLETADA' },
      _sum: { total: true },
      _count: true,
    }),
    prisma.venta.aggregate({
      where: { creadoEn: { gte: startOfYear }, estado: 'COMPLETADA' },
      _sum: { total: true },
      _count: true,
    }),
    prisma.ventaItem.groupBy({
      by: ['productoId'],
      _sum: { cantidad: true, precio: true },
      orderBy: { _sum: { cantidad: 'desc' } },
      take: 10,
    }),
    prisma.venta.groupBy({
      by: ['sucursalId'],
      where: { creadoEn: { gte: startOfMonth }, estado: 'COMPLETADA' },
      _sum: { total: true },
      _count: true,
    }),
    prisma.venta.findMany({
      where: { creadoEn: { gte: last30 }, estado: 'COMPLETADA' },
      select: { creadoEn: true, total: true },
      orderBy: { creadoEn: 'asc' },
    }),
  ])

  // Enrich top products
  const prodIds = topProductos.map((t) => t.productoId)
  const productos = await prisma.producto.findMany({
    where: { id: { in: prodIds } },
    select: { id: true, nombre: true, sku: true, precioMinorista: true },
  })
  const prodMap = new Map(productos.map((p) => [p.id, p]))

  // Enrich sucursales
  const sucIds = ventasPorSucursal.map((v) => v.sucursalId)
  const sucursales = await prisma.sucursal.findMany({
    where: { id: { in: sucIds } },
    select: { id: true, nombre: true },
  })
  const sucMap = new Map(sucursales.map((s) => [s.id, s]))

  // Group daily sales
  const dailyMap = new Map<string, number>()
  for (const v of ventasDiarias) {
    const key = v.creadoEn.toISOString().split('T')[0]
    dailyMap.set(key, (dailyMap.get(key) ?? 0) + v.total)
  }
  const dailyData = [...dailyMap.entries()].map(([date, total]) => ({ date, total }))

  const maxDaily = Math.max(...dailyData.map((d) => d.total), 1)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
        <p className="text-gray-500 mt-1">Análisis de ventas e ingresos</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {[
          { title: 'Ventas este mes', value: ventasMes._count, sub: formatCurrency(ventasMes._sum.total ?? 0), icon: ShoppingCart, color: 'text-amber-600 bg-amber-50' },
          { title: 'Ingresos este mes', value: formatCurrency(ventasMes._sum.total ?? 0), sub: `${ventasMes._count} transacciones`, icon: DollarSign, color: 'text-green-600 bg-green-50' },
          { title: 'Ventas este año', value: ventasAnio._count, sub: formatCurrency(ventasAnio._sum.total ?? 0), icon: TrendingUp, color: 'text-blue-600 bg-blue-50' },
          { title: 'Ingresos este año', value: formatCurrency(ventasAnio._sum.total ?? 0), sub: `${ventasAnio._count} transacciones`, icon: Package, color: 'text-purple-600 bg-purple-50' },
        ].map((stat) => (
          <div key={stat.title} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">{stat.title}</p>
                <p className="mt-1 text-xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <stat.icon size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Daily chart (last 30 days) */}
        <div className="xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Ventas Últimos 30 Días</CardTitle>
            </CardHeader>
            {dailyData.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">Sin datos de ventas</div>
            ) : (
              <div className="flex items-end gap-1 h-40 overflow-x-auto">
                {dailyData.map((d) => (
                  <div key={d.date} className="flex flex-col items-center gap-1 flex-1 min-w-4 group relative">
                    <div
                      className="bg-amber-400 rounded-t w-full hover:bg-amber-500 transition-colors cursor-pointer"
                      style={{ height: `${(d.total / maxDaily) * 100}%`, minHeight: '4px' }}
                    />
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                      {formatDate(d.date)}: {formatCurrency(d.total)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Sales by branch */}
        <Card>
          <CardHeader>
            <CardTitle>Ventas por Sucursal</CardTitle>
          </CardHeader>
          {ventasPorSucursal.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">Sin datos</div>
          ) : (
            <div className="space-y-4">
              {ventasPorSucursal.map((vs) => {
                const suc = sucMap.get(vs.sucursalId)
                const totalMes = ventasMes._sum.total ?? 1
                const pct = Math.round(((vs._sum.total ?? 0) / totalMes) * 100)
                return (
                  <div key={vs.sucursalId}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{suc?.nombre ?? 'Sucursal'}</span>
                      <span className="text-gray-500">{pct}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full">
                      <div className="h-2 bg-amber-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>{vs._count} ventas</span>
                      <span>{formatCurrency(vs._sum.total ?? 0)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Top products */}
      <Card className="mt-6" padding={false}>
        <CardHeader className="px-6 pt-6 pb-4">
          <CardTitle>Top 10 Productos Más Vendidos</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-t border-gray-100">
              <tr>
                {['#', 'Producto', 'SKU', 'P. Menudeo', 'Unidades vendidas'].map((h) => (
                  <th key={h} className="text-left text-xs font-medium text-gray-500 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topProductos.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Sin datos de ventas</td></tr>
              ) : (
                topProductos.map((tp, i) => {
                  const prod = prodMap.get(tp.productoId)
                  return (
                    <tr key={tp.productoId} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${i < 3 ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{prod?.nombre ?? 'Producto desconocido'}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 font-mono">{prod?.sku ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{prod ? formatCurrency(prod.precioMinorista) : '—'}</td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900">{tp._sum.cantidad ?? 0} uds</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
