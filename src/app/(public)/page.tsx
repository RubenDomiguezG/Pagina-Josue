import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { formatCurrency } from '@/lib/utils'
import {
  Wrench, Zap, Droplets, PaintBucket, HardHat, Shield,
  ChevronRight, Star, Truck, Phone, Package2, ShoppingBag
} from 'lucide-react'

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  herramientas: Wrench,
  electricidad: Zap,
  plomeria: Droplets,
  pinturas: PaintBucket,
  materiales: HardHat,
  seguridad: Shield,
}

export default async function HomePage() {
  const session = await getSession()
  const isMayorista = session?.tipoCliente === 'MAYORISTA'

  const [categorias, productosDestacados] = await Promise.all([
    prisma.categoria.findMany({ orderBy: { nombre: 'asc' } }),
    prisma.producto.findMany({
      where: { activo: true },
      take: 8,
      include: {
        categoria: true,
        inventarios: true,
      },
      orderBy: { nombre: 'asc' },
    }),
  ])

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-400 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <Package2 size={16} />
              Ventas al menudeo y mayoreo
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-6">
              Todo lo que necesitas para{' '}
              <span className="text-amber-400">tu obra o negocio</span>
            </h1>
            <p className="text-gray-300 text-lg mb-8 leading-relaxed">
              Más de 20 años siendo tu ferretería de confianza. Herramientas, materiales de construcción, plomería, electricidad y mucho más.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/catalogo"
                className="bg-amber-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-amber-600 transition-colors flex items-center gap-2"
              >
                <ShoppingBag size={20} />
                Ver Catálogo
              </Link>
              {!session && (
                <Link
                  href="/registro"
                  className="border border-gray-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors"
                >
                  Cuenta Mayorista
                </Link>
              )}
            </div>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-3 gap-6 border-t border-gray-700 pt-8">
              {[
                { value: '2,000+', label: 'Productos' },
                { value: '2', label: 'Sucursales' },
                { value: '20+', label: 'Años de experiencia' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-bold text-amber-400">{stat.value}</p>
                  <p className="text-sm text-gray-400 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Categorías</h2>
              <p className="text-gray-500 mt-1">Encuentra lo que necesitas por departamento</p>
            </div>
            <Link href="/catalogo" className="text-amber-600 font-medium hover:text-amber-700 flex items-center gap-1 text-sm">
              Ver todo <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categorias.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.slug] ?? Package2
              return (
                <Link
                  key={cat.id}
                  href={`/catalogo?categoria=${cat.id}`}
                  className="group flex flex-col items-center gap-3 p-5 bg-white rounded-2xl border border-gray-200 hover:border-amber-400 hover:shadow-md transition-all text-center"
                >
                  <div className="bg-amber-50 text-amber-600 p-3 rounded-xl group-hover:bg-amber-500 group-hover:text-white transition-colors">
                    <Icon size={24} />
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{cat.nombre}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Productos Destacados</h2>
              <p className="text-gray-500 mt-1">
                {isMayorista ? 'Precios mayoristas aplicados' : 'Precios al menudeo'}
              </p>
            </div>
            <Link href="/catalogo" className="text-amber-600 font-medium hover:text-amber-700 flex items-center gap-1 text-sm">
              Ver todos <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {productosDestacados.map((producto) => {
              const precio = isMayorista ? producto.precioMayorista : producto.precioMinorista
              const stockTotal = producto.inventarios.reduce((s, i) => s + i.stock, 0)
              return (
                <Link
                  key={producto.id}
                  href={`/catalogo/${producto.id}`}
                  className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-gray-300 transition-all"
                >
                  <div className="aspect-square bg-gray-100 flex items-center justify-center relative">
                    {producto.imagenUrl ? (
                      <img src={producto.imagenUrl} alt={producto.nombre} className="w-full h-full object-cover" />
                    ) : (
                      <Package2 size={48} className="text-gray-300" />
                    )}
                    {isMayorista && (
                      <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                        Mayoreo
                      </span>
                    )}
                    {stockTotal === 0 && (
                      <span className="absolute inset-0 bg-white/70 flex items-center justify-center text-sm font-medium text-gray-500">
                        Sin stock
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-amber-600 font-medium mb-1">{producto.categoria.nombre}</p>
                    <h3 className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2 group-hover:text-amber-700">
                      {producto.nombre}
                    </h3>
                    <p className="mt-2 text-lg font-bold text-gray-900">{formatCurrency(precio)}</p>
                    {isMayorista && (
                      <p className="text-xs text-gray-400 line-through">{formatCurrency(producto.precioMinorista)}</p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { icon: Truck, title: 'Entrega a domicilio', desc: 'Envíos a todo el área metropolitana en 24-48 hrs' },
              { icon: Star, title: 'Calidad garantizada', desc: 'Productos de las mejores marcas del mercado' },
              { icon: Phone, title: 'Atención personalizada', desc: 'Asesoría técnica gratuita en tienda y por teléfono' },
            ].map((feat) => (
              <div key={feat.title} className="flex items-start gap-4">
                <div className="bg-amber-500 text-white p-3 rounded-xl shrink-0">
                  <feat.icon size={22} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{feat.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA mayorista */}
      {!session && (
        <section className="py-16 bg-amber-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-3">¿Eres contratista o tienes un negocio?</h2>
            <p className="text-amber-100 mb-6">Regístrate como cliente mayorista y accede a precios especiales en todos nuestros productos.</p>
            <Link
              href="/registro"
              className="bg-white text-amber-600 px-8 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Abrir cuenta mayorista
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
