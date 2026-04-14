import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import bcrypt from 'bcryptjs'
import path from 'path'

const dbPath = path.resolve(process.cwd(), 'dev.db')
const adapter = new PrismaLibSql({ url: `file:${dbPath}` })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  // Categorías
  const categorias = await Promise.all([
    prisma.categoria.upsert({ where: { slug: 'herramientas' }, update: {}, create: { nombre: 'Herramientas', slug: 'herramientas', icono: 'wrench' } }),
    prisma.categoria.upsert({ where: { slug: 'plomeria' }, update: {}, create: { nombre: 'Plomería', slug: 'plomeria', icono: 'droplets' } }),
    prisma.categoria.upsert({ where: { slug: 'electricidad' }, update: {}, create: { nombre: 'Electricidad', slug: 'electricidad', icono: 'zap' } }),
    prisma.categoria.upsert({ where: { slug: 'pinturas' }, update: {}, create: { nombre: 'Pinturas', slug: 'pinturas', icono: 'paint-bucket' } }),
    prisma.categoria.upsert({ where: { slug: 'materiales' }, update: {}, create: { nombre: 'Materiales de Construcción', slug: 'materiales', icono: 'hard-hat' } }),
    prisma.categoria.upsert({ where: { slug: 'seguridad' }, update: {}, create: { nombre: 'Seguridad', slug: 'seguridad', icono: 'shield' } }),
  ])

  const [catHerr, catPlom, catElec, catPint, catMat, catSeg] = categorias
  console.log('✅ Categorías creadas')

  // Sucursales
  const [sucCentro, sucNorte] = await Promise.all([
    prisma.sucursal.upsert({
      where: { id: 'suc-centro' },
      update: {},
      create: { id: 'suc-centro', nombre: 'Sucursal Centro', direccion: 'Av. Juárez 100, Col. Centro, CDMX', telefono: '55 1234 5600', activa: true },
    }),
    prisma.sucursal.upsert({
      where: { id: 'suc-norte' },
      update: {},
      create: { id: 'suc-norte', nombre: 'Sucursal Norte', direccion: 'Blvd. Norte 500, Col. Industrial, CDMX', telefono: '55 1234 5700', activa: true },
    }),
  ])
  console.log('✅ Sucursales creadas')

  // Usuarios
  const [admin, vendedor, almacen, clienteMin, clienteMay] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@ferreteria.com' },
      update: {},
      create: { nombre: 'Administrador Principal', email: 'admin@ferreteria.com', password: await bcrypt.hash('admin123', 10), role: 'ADMIN', tipoCliente: 'MINORISTA', sucursalId: sucCentro.id },
    }),
    prisma.user.upsert({
      where: { email: 'vendedor@ferreteria.com' },
      update: {},
      create: { nombre: 'Carlos Vendedor', email: 'vendedor@ferreteria.com', password: await bcrypt.hash('vendedor123', 10), role: 'VENDEDOR', tipoCliente: 'MINORISTA', sucursalId: sucCentro.id },
    }),
    prisma.user.upsert({
      where: { email: 'almacen@ferreteria.com' },
      update: {},
      create: { nombre: 'María Almacén', email: 'almacen@ferreteria.com', password: await bcrypt.hash('almacen123', 10), role: 'ALMACEN', tipoCliente: 'MINORISTA', sucursalId: sucNorte.id },
    }),
    prisma.user.upsert({
      where: { email: 'cliente@ferreteria.com' },
      update: {},
      create: { nombre: 'Juan Cliente', email: 'cliente@ferreteria.com', password: await bcrypt.hash('cliente123', 10), role: 'CLIENTE', tipoCliente: 'MINORISTA' },
    }),
    prisma.user.upsert({
      where: { email: 'mayorista@ferreteria.com' },
      update: {},
      create: { nombre: 'Constructora López S.A.', email: 'mayorista@ferreteria.com', password: await bcrypt.hash('mayor123', 10), role: 'CLIENTE', tipoCliente: 'MAYORISTA' },
    }),
  ])

  // Cliente records
  for (const user of [clienteMin, clienteMay]) {
    await prisma.cliente.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, tipoCliente: user.tipoCliente },
    })
  }
  console.log('✅ Usuarios creados')

  // Productos
  const productosDef = [
    // Herramientas
    { nombre: 'Martillo de Carpintero 16oz', sku: 'HER-001', pMin: 185, pMay: 145, cat: catHerr.id },
    { nombre: 'Juego de Desarmadores 6 pzas', sku: 'HER-002', pMin: 220, pMay: 175, cat: catHerr.id },
    { nombre: 'Taladro Percutor 1/2" 750W', sku: 'HER-003', pMin: 1850, pMay: 1480, cat: catHerr.id },
    { nombre: 'Nivel de Burbuja 24"', sku: 'HER-004', pMin: 145, pMay: 110, cat: catHerr.id },
    { nombre: 'Pinza de Presión 10"', sku: 'HER-005', pMin: 165, pMay: 130, cat: catHerr.id },
    { nombre: 'Llave Española 8" Cromada', sku: 'HER-006', pMin: 95, pMay: 72, cat: catHerr.id },
    { nombre: 'Cinta Métrica 5m', sku: 'HER-007', pMin: 89, pMay: 68, cat: catHerr.id },
    // Plomería
    { nombre: 'Tubo PVC 4" x 6m', sku: 'PLO-001', pMin: 285, pMay: 225, cat: catPlom.id },
    { nombre: 'Codo PVC 4" 90°', sku: 'PLO-002', pMin: 18, pMay: 13, cat: catPlom.id },
    { nombre: 'Llave de Paso 1/2" Bronce', sku: 'PLO-003', pMin: 125, pMay: 95, cat: catPlom.id },
    { nombre: 'Manguera Flexible 1/2" x 1m', sku: 'PLO-004', pMin: 45, pMay: 34, cat: catPlom.id },
    { nombre: 'Flotador para WC Universal', sku: 'PLO-005', pMin: 65, pMay: 48, cat: catPlom.id },
    { nombre: 'Sifón para Lavabo', sku: 'PLO-006', pMin: 85, pMay: 65, cat: catPlom.id },
    // Electricidad
    { nombre: 'Cable THW 12 AWG x m', sku: 'ELE-001', pMin: 18, pMay: 13, cat: catElec.id },
    { nombre: 'Clavija Doble con Tierra', sku: 'ELE-002', pMin: 35, pMay: 25, cat: catElec.id },
    { nombre: 'Contacto Triple con Tierra', sku: 'ELE-003', pMin: 85, pMay: 65, cat: catElec.id },
    { nombre: 'Interruptor Sencillo Bticino', sku: 'ELE-004', pMin: 45, pMay: 34, cat: catElec.id },
    { nombre: 'Foco LED 9W Luz Fría', sku: 'ELE-005', pMin: 55, pMay: 40, cat: catElec.id },
    { nombre: 'Cinta Aislante 3M 19mm', sku: 'ELE-006', pMin: 28, pMay: 21, cat: catElec.id },
    { nombre: 'Multicontacto 6 tomas c/supresor', sku: 'ELE-007', pMin: 285, pMay: 220, cat: catElec.id },
    // Pinturas
    { nombre: 'Pintura Vinílica Blanca 4L', sku: 'PIN-001', pMin: 320, pMay: 250, cat: catPint.id },
    { nombre: 'Esmalte Anticorrosivo 1L', sku: 'PIN-002', pMin: 185, pMay: 145, cat: catPint.id },
    { nombre: 'Rodillo de Felpa 23cm', sku: 'PIN-003', pMin: 65, pMay: 48, cat: catPint.id },
    { nombre: 'Brocha Cerda Natural 3"', sku: 'PIN-004', pMin: 45, pMay: 33, cat: catPint.id },
    { nombre: 'Sellador Acrílico Transparente 300ml', sku: 'PIN-005', pMin: 95, pMay: 72, cat: catPint.id },
    // Materiales
    { nombre: 'Saco de Cemento Portland 50kg', sku: 'MAT-001', pMin: 185, pMay: 155, cat: catMat.id },
    { nombre: 'Block de Concreto 15x20x40cm', sku: 'MAT-002', pMin: 12, pMay: 9, cat: catMat.id },
    { nombre: 'Varilla de Hierro 3/8" x 12m', sku: 'MAT-003', pMin: 185, pMay: 148, cat: catMat.id },
    { nombre: 'Grava para Concreto 1/2" Bulto', sku: 'MAT-004', pMin: 65, pMay: 50, cat: catMat.id },
    { nombre: 'Perfil Angular 1" x 6m', sku: 'MAT-005', pMin: 245, pMay: 195, cat: catMat.id },
    // Seguridad
    { nombre: 'Casco de Seguridad HDPE Blanco', sku: 'SEG-001', pMin: 145, pMay: 110, cat: catSeg.id },
    { nombre: 'Guantes de Carnaza Par', sku: 'SEG-002', pMin: 65, pMay: 48, cat: catSeg.id },
    { nombre: 'Lentes de Seguridad Transparentes', sku: 'SEG-003', pMin: 35, pMay: 26, cat: catSeg.id },
    { nombre: 'Tapones Auditivos x10 pares', sku: 'SEG-004', pMin: 45, pMay: 33, cat: catSeg.id },
  ]

  const productos = []
  for (const p of productosDef) {
    const prod = await prisma.producto.upsert({
      where: { sku: p.sku },
      update: {},
      create: { nombre: p.nombre, sku: p.sku, precioMinorista: p.pMin, precioMayorista: p.pMay, categoriaId: p.cat, descripcion: `${p.nombre} de alta calidad. SKU: ${p.sku}.` },
    })
    productos.push(prod)
  }
  console.log(`✅ ${productos.length} productos creados`)

  // Inventario
  for (const prod of productos) {
    const stockCentro = Math.floor(Math.random() * 50) + 5
    const stockNorte = Math.floor(Math.random() * 50) + 3

    await prisma.inventario.upsert({
      where: { productoId_sucursalId: { productoId: prod.id, sucursalId: sucCentro.id } },
      update: {},
      create: { productoId: prod.id, sucursalId: sucCentro.id, stock: stockCentro, stockMinimo: 5 },
    })
    await prisma.inventario.upsert({
      where: { productoId_sucursalId: { productoId: prod.id, sucursalId: sucNorte.id } },
      update: {},
      create: { productoId: prod.id, sucursalId: sucNorte.id, stock: stockNorte, stockMinimo: 5 },
    })
  }
  console.log('✅ Inventario creado')

  // Ventas de demostración
  const now = new Date()
  for (let i = 0; i < 20; i++) {
    const daysAgo = Math.floor(Math.random() * 30)
    const fecha = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
    const sucursal = Math.random() > 0.5 ? sucCentro : sucNorte
    const vendedorId = Math.random() > 0.5 ? admin.id : vendedor.id
    const numItems = Math.floor(Math.random() * 3) + 1
    const itemsProd = productos.sort(() => Math.random() - 0.5).slice(0, numItems)

    const items = itemsProd.map((p) => ({
      productoId: p.id,
      cantidad: Math.floor(Math.random() * 5) + 1,
      precio: p.precioMinorista,
    }))
    const total = items.reduce((s, i) => s + i.precio * i.cantidad, 0)

    await prisma.venta.create({
      data: {
        sucursalId: sucursal.id,
        vendedorId,
        clienteNombre: ['Juan García', 'María López', 'Pedro Martínez', 'Ana Rodríguez', 'Público General'][Math.floor(Math.random() * 5)],
        total,
        tipo: 'MOSTRADOR',
        estado: 'COMPLETADA',
        creadoEn: fecha,
        items: { create: items },
      },
    })
  }
  console.log('✅ Ventas de demostración creadas')

  // Pedidos de demostración
  const clienteRecord = await prisma.cliente.findUnique({ where: { userId: clienteMin.id } })
  const mayorRecord = await prisma.cliente.findUnique({ where: { userId: clienteMay.id } })

  if (clienteRecord && mayorRecord) {
    for (const clienteRec of [clienteRecord, mayorRecord]) {
      for (let j = 0; j < 3; j++) {
        const estados = ['PENDIENTE', 'CONFIRMADO', 'ENVIADO', 'ENTREGADO']
        const estado = estados[Math.floor(Math.random() * estados.length)]
        const numItems = Math.floor(Math.random() * 3) + 1
        const itemsProd = productos.sort(() => Math.random() - 0.5).slice(0, numItems)
        const isMay = clienteRec.tipoCliente === 'MAYORISTA'
        const items = itemsProd.map((p) => ({
          productoId: p.id,
          cantidad: Math.floor(Math.random() * 4) + 1,
          precio: isMay ? p.precioMayorista : p.precioMinorista,
        }))
        const total = items.reduce((s, i) => s + i.precio * i.cantidad, 0)
        const daysAgo = Math.floor(Math.random() * 15)
        const fecha = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)

        await prisma.pedido.create({
          data: {
            clienteId: clienteRec.id,
            total,
            estado,
            direccion: 'Calle Revolución 400, Col. Del Valle',
            ciudad: 'Ciudad de México',
            telefono: '55 9876 5432',
            metodoPago: ['transferencia', 'efectivo', 'tarjeta'][Math.floor(Math.random() * 3)],
            creadoEn: fecha,
            items: { create: items },
          },
        })
      }
    }
    console.log('✅ Pedidos de demostración creados')
  }

  console.log('\n🎉 Base de datos poblada exitosamente!')
  console.log('\n📋 Cuentas de acceso:')
  console.log('  admin@ferreteria.com     / admin123     → ADMIN')
  console.log('  vendedor@ferreteria.com  / vendedor123  → VENDEDOR')
  console.log('  almacen@ferreteria.com   / almacen123   → ALMACEN')
  console.log('  cliente@ferreteria.com   / cliente123   → CLIENTE MINORISTA')
  console.log('  mayorista@ferreteria.com / mayor123     → CLIENTE MAYORISTA')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
