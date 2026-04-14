import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sucursalId = searchParams.get('sucursalId')
  const desde = searchParams.get('desde')
  const hasta = searchParams.get('hasta')
  const tipo = searchParams.get('tipo')

  const ventas = await prisma.venta.findMany({
    where: {
      ...(sucursalId ? { sucursalId } : {}),
      ...(tipo ? { tipo } : {}),
      ...(desde || hasta ? {
        creadoEn: {
          ...(desde ? { gte: new Date(desde) } : {}),
          ...(hasta ? { lte: new Date(hasta) } : {}),
        }
      } : {}),
    },
    include: {
      sucursal: { select: { id: true, nombre: true } },
      vendedor: { select: { id: true, nombre: true } },
      items: { include: { producto: { select: { id: true, nombre: true, sku: true } } } },
    },
    orderBy: { creadoEn: 'desc' },
    take: 100,
  })
  return NextResponse.json(ventas)
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()
  const { sucursalId, clienteNombre, items, tipo, notas } = body

  if (!sucursalId || !items?.length) {
    return NextResponse.json({ error: 'Sucursal e ítems son requeridos' }, { status: 400 })
  }

  const total = items.reduce((sum: number, item: { precio: number; cantidad: number }) => sum + item.precio * item.cantidad, 0)

  const venta = await prisma.venta.create({
    data: {
      sucursalId,
      vendedorId: session.id,
      clienteNombre: clienteNombre ?? 'Público General',
      total,
      tipo: tipo ?? 'MOSTRADOR',
      notas: notas ?? '',
      items: {
        create: items.map((item: { productoId: string; cantidad: number; precio: number }) => ({
          productoId: item.productoId,
          cantidad: item.cantidad,
          precio: item.precio,
        })),
      },
    },
    include: { items: true, sucursal: true },
  })

  // Decrease stock for each item
  for (const item of items) {
    await prisma.inventario.updateMany({
      where: { productoId: item.productoId, sucursalId },
      data: { stock: { decrement: item.cantidad } },
    })
  }

  return NextResponse.json(venta, { status: 201 })
}
