import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const categoria = searchParams.get('categoria')
  const buscar = searchParams.get('buscar')
  const activo = searchParams.get('activo')
  const limit = parseInt(searchParams.get('limit') ?? '50')

  const where: Record<string, unknown> = {}
  if (activo !== null) where.activo = activo !== 'false'
  if (categoria) where.categoriaId = categoria
  if (buscar) {
    where.OR = [
      { nombre: { contains: buscar } },
      { sku: { contains: buscar } },
      { descripcion: { contains: buscar } },
    ]
  }

  const productos = await prisma.producto.findMany({
    where,
    take: limit,
    include: {
      categoria: true,
      inventarios: { include: { sucursal: { select: { id: true, nombre: true } } } },
    },
    orderBy: { nombre: 'asc' },
  })

  return NextResponse.json(productos)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { nombre, descripcion, sku, precioMinorista, precioMayorista, imagenUrl, categoriaId } = body

  if (!nombre || !sku || !precioMinorista || !precioMayorista || !categoriaId) {
    return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 })
  }

  const producto = await prisma.producto.create({
    data: { nombre, descripcion: descripcion ?? '', sku, precioMinorista: Number(precioMinorista), precioMayorista: Number(precioMayorista), imagenUrl: imagenUrl ?? '', categoriaId },
    include: { categoria: true, inventarios: true },
  })

  return NextResponse.json(producto, { status: 201 })
}
