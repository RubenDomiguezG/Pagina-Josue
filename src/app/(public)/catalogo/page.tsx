import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { Package2, Search, SlidersHorizontal } from 'lucide-react'

interface SearchParams {
  categoria?: string
  buscar?: string
  precio?: string
}

export default async function CatalogoPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const session = await getSession()
  const isMayorista = session?.tipoCliente === 'MAYORISTA'

  const where: Record<string, unknown> = { activo: true }
  if (params.categoria) where.categoriaId = params.categoria
  if (params.buscar) {
    where.OR = [
      { nombre: { contains: params.buscar } },
      { sku: { contains: params.buscar } },
      { descripcion: { contains: params.buscar } },
    ]
  }

  const [productos, categorias] = await Promise.all([
    prisma.producto.findMany({
      where,
      include: {
        categoria: true,
        inventarios: { select: { stock: true } },
      },
      orderBy: { nombre: 'asc' },
    }),
    prisma.categoria.findMany({ orderBy: { nombre: 'asc' } }),
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Catálogo de Productos</h1>
        <p className="text-gray-500 mt-1">
          {productos.length} productos disponibles
          {isMayorista && ' · Precios mayoristas'}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar filters */}
        <aside className="w-full lg:w-56 shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-20">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
              <SlidersHorizontal size={16} />
              Filtros
            </div>

            {/* Search */}
            <form method="GET" className="mb-5">
              {params.categoria && (
                <input type="hidden" name="categoria" value={params.categoria} />
              )}
              <div className="relative">
                <input
                  name="buscar"
                  type="text"
                  defaultValue={params.buscar}
                  placeholder="Buscar productos..."
                  className="w-full rounded-lg border border-gray-300 pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
              <button type="submit" className="mt-2 w-full bg-amber-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-amber-600">
                Buscar
              </button>
            </form>

            {/* Categories */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Categorías</p>
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/catalogo"
                    className={`block px-3 py-2 rounded-lg text-sm transition-colors ${!params.categoria ? 'bg-amber-500 text-white font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    Todas las categorías
                  </Link>
                </li>
                {categorias.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={`/catalogo?categoria=${cat.id}${params.buscar ? `&buscar=${params.buscar}` : ''}`}
                      className={`block px-3 py-2 rounded-lg text-sm transition-colors ${params.categoria === cat.id ? 'bg-amber-500 text-white font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      {cat.nombre}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>

        {/* Product grid */}
        <div className="flex-1">
          {isMayorista && (
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800 font-medium flex items-center gap-2">
              <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">MAYORISTA</span>
              Estás viendo precios especiales de mayoreo
            </div>
          )}

          {productos.length === 0 ? (
            <div className="text-center py-20">
              <Package2 size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-gray-500 font-medium">No se encontraron productos</h3>
              <Link href="/catalogo" className="mt-3 text-amber-600 text-sm hover:underline inline-block">
                Ver todos los productos
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {productos.map((producto) => {
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
                        <Package2 size={40} className="text-gray-300" />
                      )}
                      {stockTotal === 0 && (
                        <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                          Agotado
                        </span>
                      )}
                      {stockTotal > 0 && stockTotal <= 5 && (
                        <span className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                          Últimas unidades
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-amber-600 font-medium mb-1">{producto.categoria.nombre}</p>
                      <h3 className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2 group-hover:text-amber-700">
                        {producto.nombre}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5 font-mono">SKU: {producto.sku}</p>
                      <div className="mt-2">
                        <p className="text-base font-bold text-gray-900">{formatCurrency(precio)}</p>
                        {isMayorista && (
                          <p className="text-xs text-gray-400 line-through">{formatCurrency(producto.precioMinorista)}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
