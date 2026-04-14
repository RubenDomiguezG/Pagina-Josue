import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { formatDateTime } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

export default async function TransferenciasPage() {
  await requireAdmin()

  const transferencias = await prisma.transferencia.findMany({
    include: {
      sucursalOrigen: { select: { nombre: true } },
      sucursalDestino: { select: { nombre: true } },
    },
    orderBy: { creadoEn: 'desc' },
    take: 100,
  })

  const productos = await prisma.producto.findMany({
    where: { id: { in: [...new Set(transferencias.map((t) => t.productoId))] } },
    select: { id: true, nombre: true, sku: true },
  })

  const prodMap = new Map(productos.map((p) => [p.id, p]))

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Transferencias</h1>
        <p className="text-gray-500 mt-1">Historial de movimientos de inventario entre sucursales</p>
      </div>

      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Fecha', 'Producto', 'SKU', 'Origen', 'Destino', 'Cantidad', 'Notas', 'Estado'].map((h) => (
                  <th key={h} className="text-left text-xs font-medium text-gray-500 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transferencias.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">Sin transferencias registradas</td></tr>
              ) : (
                transferencias.map((t) => {
                  const prod = prodMap.get(t.productoId)
                  return (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-xs text-gray-500">{formatDateTime(t.creadoEn)}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{prod?.nombre ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 font-mono">{prod?.sku ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{t.sucursalOrigen.nombre}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{t.sucursalDestino.nombre}</td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900">{t.cantidad}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 max-w-32 truncate">{t.notas || '—'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={t.estado === 'COMPLETADA' ? 'success' : t.estado === 'CANCELADA' ? 'danger' : 'warning'}>
                          {t.estado}
                        </Badge>
                      </td>
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
