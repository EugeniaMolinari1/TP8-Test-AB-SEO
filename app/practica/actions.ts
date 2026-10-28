'use server'

import { cookies, headers } from 'next/headers'
import { recordConversion as storeConversion } from '@/lib/event-store'
import { COOKIE, isVariant } from '@/lib/experiment'

export type ConversionStatus = 'recorded' | 'already' | 'preview' | 'rejected' | 'error'

// La acción llega por POST desde la página que hizo el clic, así que el Referer trae su query.
// Si la página era un ?preview=, o no se puede confirmar de dónde viene, no se anota nada.
async function cameFrom(): Promise<'preview' | 'page' | 'unknown'> {
  const referer = (await headers()).get('referer')
  if (!referer) return 'unknown'
  try {
    return isVariant(new URL(referer).searchParams.get('preview')) ? 'preview' : 'page'
  } catch {
    return 'unknown'
  }
}

export async function recordConversion(): Promise<{ status: ConversionStatus }> {
  const origin = await cameFrom()
  if (origin === 'preview') return { status: 'preview' }
  if (origin === 'unknown') return { status: 'rejected' }

  const jar = await cookies()
  const visitorId = jar.get(COOKIE.visitor)?.value
  const variant = jar.get(COOKIE.variant)?.value
  if (!visitorId || visitorId.length > 100 || !isVariant(variant)) return { status: 'rejected' }

  try {
    const first = await storeConversion(visitorId, variant)
    return { status: first ? 'recorded' : 'already' }
  } catch {
    console.error('No se pudo anotar la conversión')
    return { status: 'error' }
  }
}
