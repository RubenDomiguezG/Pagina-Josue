import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? 'ferreteria-secret-key'
)

export async function proxy(request: NextRequest) {
  const token = request.cookies.get('ferreteria_session')?.value
  const { pathname } = request.nextUrl

  // Protect /admin routes
  if (pathname.startsWith('/admin')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login?next=/admin', request.url))
    }
    try {
      const { payload } = await jwtVerify(token, SECRET)
      const user = (payload as { user: { role: string } }).user
      if (!['ADMIN', 'VENDEDOR', 'ALMACEN'].includes(user.role)) {
        return NextResponse.redirect(new URL('/', request.url))
      }
    } catch {
      return NextResponse.redirect(new URL('/login?next=/admin', request.url))
    }
  }

  // Protect /cuenta routes
  if (pathname.startsWith('/cuenta')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login?next=/cuenta', request.url))
    }
    try {
      await jwtVerify(token, SECRET)
    } catch {
      return NextResponse.redirect(new URL('/login?next=/cuenta', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/cuenta/:path*'],
}
