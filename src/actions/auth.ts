'use server'

import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createSession, destroySession } from '@/lib/auth'
import type { SessionUser } from '@/types'

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const next = (formData.get('next') as string) || null

  if (!email || !password) {
    return { error: 'Correo y contraseña son requeridos' }
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !user.activo) {
    return { error: 'Credenciales incorrectas' }
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    return { error: 'Credenciales incorrectas' }
  }

  const sessionUser: SessionUser = {
    id: user.id,
    email: user.email,
    nombre: user.nombre,
    role: user.role as SessionUser['role'],
    tipoCliente: user.tipoCliente as SessionUser['tipoCliente'],
    sucursalId: user.sucursalId,
  }

  await createSession(sessionUser)

  // Redirect by role
  if (next) redirect(next)
  if (['ADMIN', 'VENDEDOR', 'ALMACEN'].includes(user.role)) redirect('/admin')
  redirect('/')
}

export async function registerAction(formData: FormData) {
  const nombre = formData.get('nombre') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!nombre || !email || !password) {
    return { error: 'Todos los campos son requeridos' }
  }
  if (password.length < 6) {
    return { error: 'La contraseña debe tener al menos 6 caracteres' }
  }

  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) {
    return { error: 'El correo ya está registrado' }
  }

  const hashed = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: {
      nombre,
      email,
      password: hashed,
      role: 'CLIENTE',
      tipoCliente: 'MINORISTA',
    },
  })

  await prisma.cliente.create({
    data: { userId: user.id, tipoCliente: 'MINORISTA' },
  })

  const sessionUser: SessionUser = {
    id: user.id,
    email: user.email,
    nombre: user.nombre,
    role: 'CLIENTE',
    tipoCliente: 'MINORISTA',
    sucursalId: null,
  }

  await createSession(sessionUser)
  redirect('/')
}

export async function logoutAction() {
  await destroySession()
  redirect('/login')
}
