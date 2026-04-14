import Link from 'next/link'
import { Phone, MapPin, Mail, Package2 } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-amber-500 text-white p-1.5 rounded-lg">
                <Package2 size={20} />
              </div>
              <span className="font-bold text-white text-lg">Ferretería Josué</span>
            </div>
            <p className="text-sm leading-relaxed text-gray-400 max-w-xs">
              Tu ferretería de confianza con más de 20 años al servicio. Atendemos ventas al menudeo y mayoreo para profesionales de la construcción.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Navegación</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-amber-400 transition-colors">Inicio</Link></li>
              <li><Link href="/catalogo" className="hover:text-amber-400 transition-colors">Catálogo</Link></li>
              <li><Link href="/carrito" className="hover:text-amber-400 transition-colors">Carrito</Link></li>
              <li><Link href="/cuenta/pedidos" className="hover:text-amber-400 transition-colors">Mis Pedidos</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contacto</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2"><Phone size={14} /><span>55 1234 5678</span></li>
              <li className="flex items-center gap-2"><Mail size={14} /><span>ventas@ferreteriaJosue.mx</span></li>
              <li className="flex items-start gap-2">
                <MapPin size={14} className="mt-0.5 shrink-0" />
                <span>Sucursal Centro: Av. Juárez 100, Col. Centro</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={14} className="mt-0.5 shrink-0" />
                <span>Sucursal Norte: Blvd. Norte 500, Col. Industrial</span>
              </li>
            </ul>
          </div>
        </div>

        <hr className="border-gray-700 my-8" />
        <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500">
          <p>© 2024 Ferretería Josué. Todos los derechos reservados.</p>
          <p className="mt-2 sm:mt-0">Ventas al menudeo y mayoreo</p>
        </div>
      </div>
    </footer>
  )
}
