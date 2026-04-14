import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const cliente = await prisma.cliente.findUnique({ where: { userId: session.id } })
  if (!cliente) return NextResponse.json([])

  const pedidos = await prisma.pedido.findMany({
    where: { clienteId: cliente.id },
    include: {
      items: { include: { producto: { select: { nombre: true, sku: true, imagenUrl: true } } } },
    },
    orderBy: { creadoEn: 'desc' },
  })

  return NextResponse.json(pedidos)
}
