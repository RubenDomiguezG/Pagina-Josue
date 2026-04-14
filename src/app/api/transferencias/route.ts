import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const transferencias = await prisma.transferencia.findMany({
    include: {
      sucursalOrigen: { select: { id: true, nombre: true } },
      sucursalDestino: { select: { id: true, nombre: true } },
    },
    orderBy: { creadoEn: 'desc' },
    take: 50,
  })
  return NextResponse.json(transferencias)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { productoId, sucursalOrigenId, sucursalDestinoId, cantidad, notas } = body

  if (!productoId || !sucursalOrigenId || !sucursalDestinoId || !cantidad) {
    return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 })
  }

  // Check origin stock
  const origen = await prisma.inventario.findUnique({
    where: { productoId_sucursalId: { productoId, sucursalId: sucursalOrigenId } },
  })
  if (!origen || origen.stock < Number(cantidad)) {
    return NextResponse.json({ error: 'Stock insuficiente en sucursal origen' }, { status: 400 })
  }

  // Perform transfer in transaction
  const [transferencia] = await prisma.$transaction([
    prisma.transferencia.create({
      data: { productoId, sucursalOrigenId, sucursalDestinoId, cantidad: Number(cantidad), notas: notas ?? '', estado: 'COMPLETADA' },
    }),
    prisma.inventario.update({
      where: { productoId_sucursalId: { productoId, sucursalId: sucursalOrigenId } },
      data: { stock: { decrement: Number(cantidad) } },
    }),
    prisma.inventario.upsert({
      where: { productoId_sucursalId: { productoId, sucursalId: sucursalDestinoId } },
      update: { stock: { increment: Number(cantidad) } },
      create: { productoId, sucursalId: sucursalDestinoId, stock: Number(cantidad), stockMinimo: 5 },
    }),
  ])

  return NextResponse.json(transferencia, { status: 201 })
}
