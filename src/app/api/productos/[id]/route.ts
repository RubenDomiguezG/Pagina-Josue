import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const producto = await prisma.producto.findUnique({
    where: { id },
    include: { categoria: true, inventarios: { include: { sucursal: true } } },
  })
  if (!producto) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json(producto)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const producto = await prisma.producto.update({
    where: { id },
    data: {
      nombre: body.nombre,
      descripcion: body.descripcion,
      sku: body.sku,
      precioMinorista: Number(body.precioMinorista),
      precioMayorista: Number(body.precioMayorista),
      imagenUrl: body.imagenUrl,
      activo: body.activo,
      categoriaId: body.categoriaId,
    },
    include: { categoria: true, inventarios: true },
  })
  return NextResponse.json(producto)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.producto.update({ where: { id }, data: { activo: false } })
  return NextResponse.json({ ok: true })
}
