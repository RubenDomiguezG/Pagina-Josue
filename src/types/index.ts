export type Role = 'ADMIN' | 'VENDEDOR' | 'ALMACEN' | 'CLIENTE'
export type TipoCliente = 'MINORISTA' | 'MAYORISTA'
export type EstadoPedido = 'PENDIENTE' | 'CONFIRMADO' | 'EN_PROCESO' | 'ENVIADO' | 'ENTREGADO' | 'CANCELADO'
export type EstadoTransferencia = 'PENDIENTE' | 'COMPLETADA' | 'CANCELADA'
export type TipoVenta = 'MOSTRADOR' | 'EN_LINEA'

export interface SessionUser {
  id: string
  email: string
  nombre: string
  role: Role
  tipoCliente: TipoCliente
  sucursalId?: string | null
}

export interface CartItem {
  productoId: string
  nombre: string
  sku: string
  precio: number
  cantidad: number
  imagenUrl: string
  stock: number
}

export interface ProductoConStock {
  id: string
  nombre: string
  descripcion: string
  sku: string
  precioMinorista: number
  precioMayorista: number
  imagenUrl: string
  activo: boolean
  categoriaId: string
  categoria: { id: string; nombre: string; slug: string; icono: string }
  inventarios: { sucursalId: string; stock: number; stockMinimo: number }[]
  stockTotal: number
}
