import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const estado = searchParams.get('estado')

  const pedidos = await prisma.pedido.findMany({
    where: { ...(estado ? { estado } : {}) },
    include: {
      cliente: { include: { user: { select: { nombre: true, email: true } } } },
      items: { include: { producto: { select: { id: true, nombre: true, sku: true } } } },
    },
    orderBy: { creadoEn: 'desc' },
    take: 100,
  })
  return NextResponse.json(pedidos)
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'CLIENTE') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await request.json()
  const { items, direccion, ciudad, telefono, metodoPago, notas } = body

  if (!items?.length || !direccion) {
    return NextResponse.json({ error: 'Items y dirección son requeridos' }, { status: 400 })
  }

  // Find or create cliente record
  let cliente = await prisma.cliente.findUnique({ where: { userId: session.id } })
  if (!cliente) {
    cliente = await prisma.cliente.create({
      data: { userId: session.id, tipoCliente: session.tipoCliente },
    })
  }

  const total = items.reduce((sum: number, item: { precio: number; cantidad: number }) => sum + item.precio * item.cantidad, 0)

  const pedido = await prisma.pedido.create({
    data: {
      clienteId: cliente.id,
      total,
      direccion,
      ciudad: ciudad ?? '',
      telefono: telefono ?? '',
      metodoPago: metodoPago ?? 'transferencia',
      notas: notas ?? '',
      estado: 'PENDIENTE',
      items: {
        create: items.map((item: { productoId: string; cantidad: number; precio: number }) => ({
          productoId: item.productoId,
          cantidad: item.cantidad,
          precio: item.precio,
        })),
      },
    },
    include: { items: true },
  })

  return NextResponse.json(pedido, { status: 201 })
}
