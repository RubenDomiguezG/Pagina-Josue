import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const sucursales = await prisma.sucursal.findMany({ orderBy: { nombre: 'asc' } })
  return NextResponse.json(sucursales)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const sucursal = await prisma.sucursal.create({
    data: { nombre: body.nombre, direccion: body.direccion, telefono: body.telefono ?? '' },
  })
  return NextResponse.json(sucursal, { status: 201 })
}
