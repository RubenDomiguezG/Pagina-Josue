'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Package, ShoppingCart, Users, Building2,
  BarChart3, ClipboardList, ArrowLeftRight, LogOut, Menu, X, Package2
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface AdminSidebarProps {
  user: { nombre: string; role: string }
}

export default function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/admin/inventario', label: 'Inventario', icon: Package },
    { href: '/admin/ventas', label: 'Ventas', icon: ShoppingCart },
    { href: '/admin/pedidos', label: 'Pedidos Online', icon: ClipboardList },
    { href: '/admin/transferencias', label: 'Transferencias', icon: ArrowLeftRight },
    { href: '/admin/usuarios', label: 'Usuarios', icon: Users, adminOnly: true },
    { href: '/admin/sucursales', label: 'Sucursales', icon: Building2, adminOnly: true },
    { href: '/admin/reportes', label: 'Reportes', icon: BarChart3 },
  ]

  const isActive = (item: { href: string; exact?: boolean }) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href)

  const filteredItems = navItems.filter(
    (item) => !item.adminOnly || user.role === 'ADMIN'
  )

  return (
    <aside
      className={cn(
        'flex flex-col bg-gray-900 text-white min-h-screen transition-all duration-300 shrink-0',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="bg-amber-500 p-1.5 rounded-lg">
              <Package2 size={18} />
            </div>
            <div>
              <p className="font-bold text-sm leading-none">Ferretería</p>
              <p className="text-xs text-amber-400 leading-none">Panel Admin</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors ml-auto"
        >
          {collapsed ? <Menu size={18} /> : <X size={18} />}
        </button>
      </div>

      {/* User info */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 text-white rounded-full h-8 w-8 flex items-center justify-center text-sm font-bold shrink-0">
              {user.nombre.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user.nombre}</p>
              <p className="text-xs text-gray-400">{user.role}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {filteredItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isActive(item)
                ? 'bg-amber-500 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700',
              collapsed && 'justify-center'
            )}
            title={collapsed ? item.label : undefined}
          >
            <item.icon size={18} className="shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-gray-700">
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-red-600/20 transition-colors w-full',
              collapsed && 'justify-center'
            )}
            title={collapsed ? 'Cerrar Sesión' : undefined}
          >
            <LogOut size={18} className="shrink-0" />
            {!collapsed && <span>Cerrar Sesión</span>}
          </button>
        </form>
      </div>
    </aside>
  )
}
