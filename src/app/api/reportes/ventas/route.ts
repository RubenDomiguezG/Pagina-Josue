import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const periodo = searchParams.get('periodo') ?? 'mensual'
  const sucursalId = searchParams.get('sucursalId')

  const now = new Date()
  let desde: Date

  if (periodo === 'diario') {
    desde = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30)
  } else {
    desde = new Date(now.getFullYear() - 1, now.getMonth(), 1)
  }

  const ventas = await prisma.venta.findMany({
    where: {
      creadoEn: { gte: desde },
      ...(sucursalId ? { sucursalId } : {}),
      estado: 'COMPLETADA',
    },
    select: { creadoEn: true, total: true, tipo: true },
    orderBy: { creadoEn: 'asc' },
  })

  return NextResponse.json(ventas)
}
