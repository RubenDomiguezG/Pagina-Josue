import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const pedido = await prisma.pedido.update({
    where: { id },
    data: { estado: body.estado },
  })
  return NextResponse.json(pedido)
}
