import { getSession } from '@/lib/auth'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar user={session ? { nombre: session.nombre, role: session.role } : null} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
