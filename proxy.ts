import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  COOKIE,
  SESSION_WINDOW,
  THIRTY_DAYS,
  assignVariant,
  cookieOptions,
  isVariant,
} from '@/lib/experiment'
import { recordImpression } from '@/lib/event-store'

// Header interno con el que el proxy le pasa la variante a la página en el primer request,
// cuando la cookie recién se está escribiendo y todavía no viaja en el request.
const VARIANT_HEADER = 'x-lab-variant'

// Aproximación por User-Agent: no verifica identidad, solo reconoce crawlers conocidos.
const CRAWLER_PATTERN =
  /googlebot|bingbot|duckduckbot|baiduspider|yandexbot|applebot|slurp|crawler|spider/i

export async function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)
  // Nunca confiar en un header que venga del cliente.
  requestHeaders.delete(VARIANT_HEADER)

  // Solo un GET puede asignar visitante. El POST de una acción (el clic del CTA) pasa tal cual:
  // si el proxy le inventara cookies, un cliente sin cookies válidas terminaría convirtiendo.
  if (request.method !== 'GET') {
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  // ?preview=a|b es solo para ver un copy: no lee ni escribe cookies, no cuenta.
  if (isVariant(request.nextUrl.searchParams.get('preview'))) {
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  // Los crawlers no conservan cookies: ven siempre el control, en la misma URL y con el mismo canonical.
  // No se les asigna visitante ni se les anota impresión. No es cloaking: no hay un mensaje distinto
  // para el buscador con fines de ranking, es el control fijo.
  if (CRAWLER_PATTERN.test(request.headers.get('user-agent') ?? '')) {
    requestHeaders.set(VARIANT_HEADER, 'a')
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  const existingVisitor = request.cookies.get(COOKIE.visitor)?.value
  const existingVariant = request.cookies.get(COOKIE.variant)?.value

  const visitorId = existingVisitor || crypto.randomUUID()
  const variant = isVariant(existingVariant) ? existingVariant : assignVariant(visitorId)

  requestHeaders.set(VARIANT_HEADER, variant)
  const response = NextResponse.next({ request: { headers: requestHeaders } })

  const secure = request.nextUrl.protocol === 'https:'

  if (!existingVisitor || !isVariant(existingVariant)) {
    const options = cookieOptions(secure, THIRTY_DAYS)
    response.cookies.set(COOKIE.visitor, visitorId, options)
    response.cookies.set(COOKIE.variant, variant, options)
  }

  // Una impresión por sesión de 30 minutos. Los previews y los crawlers ya salieron más arriba,
  // y los prefetch de Next ni llegan hasta acá (ver el matcher).
  if (!request.cookies.has(COOKIE.impressed)) {
    try {
      await recordImpression(visitorId, variant)
      response.cookies.set(COOKIE.impressed, '1', cookieOptions(secure, SESSION_WINDOW))
    } catch {
      // Si la base no responde la landing igual carga; sin cookie, la próxima visita reintenta.
      console.error('No se pudo anotar la impresión')
    }
  }

  return response
}

export const config = {
  // Next no expone sus headers internos de prefetch dentro del proxy, así que se excluyen acá:
  // un <Link> que precarga /practica no es una visita.
  matcher: [
    {
      source: '/practica',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
