import { requireAdmin } from '@/lib/auth'
import AdminSidebar from '@/components/layout/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin()
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar user={{ nombre: session.nombre, role: session.role }} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
