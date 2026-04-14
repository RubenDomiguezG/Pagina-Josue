import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const user = await prisma.user.update({
    where: { id },
    data: {
      nombre: body.nombre,
      email: body.email,
      role: body.role,
      tipoCliente: body.tipoCliente,
      activo: body.activo,
      sucursalId: body.sucursalId || null,
    },
    select: { id: true, nombre: true, email: true, role: true, tipoCliente: true, activo: true, sucursalId: true },
  })
  return NextResponse.json(user)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.user.update({ where: { id }, data: { activo: false } })
  return NextResponse.json({ ok: true })
}
