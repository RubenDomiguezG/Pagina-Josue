import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [ventasHoy, pedidosPendientes, productosBajoStock, ventasRecientes, topProductos] = await Promise.all([
    prisma.venta.aggregate({
      where: { creadoEn: { gte: today } },
      _count: true,
      _sum: { total: true },
    }),
    prisma.pedido.count({ where: { estado: 'PENDIENTE' } }),
    prisma.inventario.count({ where: { stock: { lte: prisma.inventario.fields.stockMinimo } } }),
    prisma.venta.findMany({
      take: 10,
      orderBy: { creadoEn: 'desc' },
      include: { sucursal: { select: { nombre: true } }, vendedor: { select: { nombre: true } }, items: true },
    }),
    prisma.ventaItem.groupBy({
      by: ['productoId'],
      _sum: { cantidad: true },
      orderBy: { _sum: { cantidad: 'desc' } },
      take: 5,
    }),
  ])

  return NextResponse.json({
    ventasHoy: { count: ventasHoy._count, total: ventasHoy._sum.total ?? 0 },
    pedidosPendientes,
    productosBajoStock,
    ventasRecientes,
    topProductos,
  })
}
