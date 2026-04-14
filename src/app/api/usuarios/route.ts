import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  const usuarios = await prisma.user.findMany({
    select: { id: true, nombre: true, email: true, role: true, tipoCliente: true, activo: true, sucursalId: true, creadoEn: true, sucursal: { select: { nombre: true } } },
    orderBy: { creadoEn: 'desc' },
  })
  return NextResponse.json(usuarios)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { nombre, email, password, role, tipoCliente, sucursalId } = body

  if (!nombre || !email || !password) {
    return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 })
  }

  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) return NextResponse.json({ error: 'Email ya existe' }, { status: 400 })

  const hashed = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { nombre, email, password: hashed, role: role ?? 'CLIENTE', tipoCliente: tipoCliente ?? 'MINORISTA', sucursalId: sucursalId || null },
    select: { id: true, nombre: true, email: true, role: true, tipoCliente: true, activo: true, sucursalId: true, creadoEn: true },
  })

  if (role === 'CLIENTE' || !role) {
    await prisma.cliente.create({ data: { userId: user.id, tipoCliente: user.tipoCliente } })
  }

  return NextResponse.json(user, { status: 201 })
}
