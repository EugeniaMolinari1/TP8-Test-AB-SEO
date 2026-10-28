import type { Metadata } from 'next'
import { cookies, headers } from 'next/headers'
import Link from 'next/link'
import { Landing } from '@/components/landing'
import {
  CANONICAL_PATH,
  COOKIE,
  DESCRIPTION_RANGE,
  TITLE_RANGE,
  VARIANTS,
  characterCount,
  inRange,
  isVariant,
  type Variant,
} from '@/lib/experiment'

type PracticaPageProps = {
  searchParams: Promise<{ preview?: string | string[] }>
}
function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

// Mismo nombre que el header que escribe proxy.ts.
const VARIANT_HEADER = 'x-lab-variant'

type View = { variant: Variant; preview: Variant | null }

// Qué copy se muestra. El preview manda y no es la asignación. Si no hay preview, vale lo que
// asignó el proxy en este request (primer request, crawlers) y después la cookie. Sin ninguna
// de las dos (por ejemplo un prefetch) queda el control.
async function resolveView(searchParams: PracticaPageProps['searchParams']): Promise<View> {
  const requested = firstParam((await searchParams).preview)
  if (isVariant(requested)) return { variant: requested, preview: requested }

  const fromProxy = (await headers()).get(VARIANT_HEADER)
  if (isVariant(fromProxy)) return { variant: fromProxy, preview: null }

  const fromCookie = (await cookies()).get(COOKIE.variant)?.value
  if (isVariant(fromCookie)) return { variant: fromCookie, preview: null }

  return { variant: 'a', preview: null }
}

export async function generateMetadata({ searchParams }: PracticaPageProps): Promise<Metadata> {
  const { variant, preview } = await resolveView(searchParams)
  const copy = VARIANTS[variant]
  return {
    // absolute: el crawler ve el title de la variante, sin el sufijo del layout.
    title: { absolute: copy.seoTitle },
    description: copy.seoDescription,
    // Una sola URL indexable, sin query ni variante.
    alternates: { canonical: CANONICAL_PATH },
    robots: preview ? { index: false, follow: false } : { index: true, follow: true },
  }
}

export default async function PracticaPage({ searchParams }: PracticaPageProps) {
  const { variant, preview } = await resolveView(searchParams)
  const copy = VARIANTS[variant]
  const titleLength = characterCount(copy.seoTitle)
  const descriptionLength = characterCount(copy.seoDescription)

  return (
    <main id="contenido" className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-10 md:py-14">
      <p className="font-mono text-[0.7rem] tracking-[0.16em] text-muted-foreground uppercase">
        Laboratorio 01
      </p>
      <p className="border-b border-border pb-4 text-sm text-muted-foreground">
        {preview
          ? `Estás viendo el copy ${preview.toUpperCase()} por query. No persiste, no cambia tu asignación, no cuenta como visita y esta vista lleva noindex.`
          : `Copy ${variant.toUpperCase()} asignado a este visitante. Se mantiene al recargar.`}
      </p>
      <Landing variant={variant} />
      <div className="flex flex-wrap gap-2">
        <Link href="/practica?preview=a" className="rounded-md border border-border px-3 py-1.5 text-sm">
          Ver copy A
        </Link>
        <Link href="/practica?preview=b" className="rounded-md border border-border px-3 py-1.5 text-sm">
          Ver copy B
        </Link>
        <Link href="/bitacora" className="rounded-md border border-border px-3 py-1.5 text-sm">
          Bitácora
        </Link>
      </div>
      <section className="flex flex-col gap-4">
        <h2 className="font-serif text-2xl">Metadatos publicados</h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1 border-b border-border pb-3">
            <dt className="font-mono text-[0.7rem] tracking-[0.14em] text-muted-foreground uppercase">
              Title de {variant.toUpperCase()}
            </dt>
            <dd>{copy.seoTitle}</dd>
            <dd className="font-mono text-sm text-muted-foreground">
              {titleLength} caracteres · {inRange(titleLength, TITLE_RANGE) ? 'dentro de 50–60' : 'fuera de rango'}
            </dd>
          </div>
          <div className="flex flex-col gap-1 border-b border-border pb-3">
            <dt className="font-mono text-[0.7rem] tracking-[0.14em] text-muted-foreground uppercase">
              Description de {variant.toUpperCase()}
            </dt>
            <dd>{copy.seoDescription}</dd>
            <dd className="font-mono text-sm text-muted-foreground">
              {descriptionLength} caracteres ·{' '}
              {inRange(descriptionLength, DESCRIPTION_RANGE) ? 'dentro de 140–160' : 'fuera de rango'}
            </dd>
          </div>
        </dl>
      </section>
    </main>
  )
}
