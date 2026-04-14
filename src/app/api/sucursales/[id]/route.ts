import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const sucursal = await prisma.sucursal.update({
    where: { id },
    data: { nombre: body.nombre, direccion: body.direccion, telefono: body.telefono, activa: body.activa },
  })
  return NextResponse.json(sucursal)
}
