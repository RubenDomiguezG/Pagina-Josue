import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { User, Package, LogOut, ShoppingBag } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

export default async function CuentaPage() {
  const session = await requireAuth()

  const cliente = await prisma.cliente.findUnique({ where: { userId: session.id } })
  const pedidosCount = cliente
    ? await prisma.pedido.count({ where: { clienteId: cliente.id } })
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Mi Cuenta</h1>
          <p className="text-gray-500 mt-1">Gestiona tu perfil y pedidos</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile card */}
          <div className="md:col-span-2">
            <Card>
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-gray-800 text-white rounded-full h-16 w-16 flex items-center justify-center text-2xl font-bold">
                  {session.nombre.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{session.nombre}</h2>
                  <p className="text-gray-500">{session.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={session.tipoCliente === 'MAYORISTA' ? 'info' : 'default'}>
                      {session.tipoCliente}
                    </Badge>
                    <Badge variant="default">{session.role}</Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-500 text-xs font-medium mb-1">Tipo de cliente</p>
                  <p className="font-semibold text-gray-900">{session.tipoCliente}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-500 text-xs font-medium mb-1">Pedidos realizados</p>
                  <p className="font-semibold text-gray-900">{pedidosCount}</p>
                </div>
              </div>

              {session.tipoCliente === 'MINORISTA' && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
                  <p className="font-medium mb-1">¿Eres contratista o tienes un negocio?</p>
                  <p className="text-blue-600 text-xs">Contáctanos para solicitar acceso a precios de mayoreo.</p>
                </div>
              )}
            </Card>
          </div>

          {/* Quick actions */}
          <div className="space-y-3">
            <Link href="/cuenta/pedidos"
              className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-4 hover:border-amber-400 hover:shadow-sm transition-all group">
              <div className="bg-amber-50 text-amber-600 p-2 rounded-lg group-hover:bg-amber-500 group-hover:text-white transition-colors">
                <ShoppingBag size={20} />
              </div>
              <div>
                <p className="font-medium text-gray-900">Mis Pedidos</p>
                <p className="text-xs text-gray-500">{pedidosCount} pedidos</p>
              </div>
            </Link>

            <Link href="/catalogo"
              className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-4 hover:border-amber-400 hover:shadow-sm transition-all group">
              <div className="bg-amber-50 text-amber-600 p-2 rounded-lg group-hover:bg-amber-500 group-hover:text-white transition-colors">
                <Package size={20} />
              </div>
              <div>
                <p className="font-medium text-gray-900">Catálogo</p>
                <p className="text-xs text-gray-500">Ver productos</p>
              </div>
            </Link>

            <form action="/api/auth/logout" method="POST">
              <button type="submit"
                className="w-full flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-4 hover:border-red-300 hover:bg-red-50 transition-all group text-left">
                <div className="bg-red-50 text-red-500 p-2 rounded-lg group-hover:bg-red-500 group-hover:text-white transition-colors">
                  <LogOut size={20} />
                </div>
                <div>
                  <p className="font-medium text-red-600">Cerrar Sesión</p>
                  <p className="text-xs text-gray-400">Salir de tu cuenta</p>
                </div>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
