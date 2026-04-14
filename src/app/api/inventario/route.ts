import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sucursalId = searchParams.get('sucursalId')
  const bajStock = searchParams.get('bajStock') === 'true'

  const inventarios = await prisma.inventario.findMany({
    where: {
      ...(sucursalId ? { sucursalId } : {}),
    },
    include: {
      producto: { include: { categoria: true } },
      sucursal: true,
    },
    orderBy: { producto: { nombre: 'asc' } },
  })

  const result = bajStock
    ? inventarios.filter((inv) => inv.stock <= inv.stockMinimo)
    : inventarios

  return NextResponse.json(result)
}

export async function PUT(request: NextRequest) {
  const body = await request.json()
  const { productoId, sucursalId, stock, stockMinimo } = body

  const inventario = await prisma.inventario.upsert({
    where: { productoId_sucursalId: { productoId, sucursalId } },
    update: { stock: Number(stock), stockMinimo: Number(stockMinimo ?? 5) },
    create: { productoId, sucursalId, stock: Number(stock), stockMinimo: Number(stockMinimo ?? 5) },
  })

  return NextResponse.json(inventario)
}
