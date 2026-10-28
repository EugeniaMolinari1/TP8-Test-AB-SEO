import type { Metadata } from 'next'
import Link from 'next/link'
import { readLog } from '@/lib/event-store'
import {
  HASH_EXAMPLE_ID,
  TEST_CASE,
  VARIANTS,
  assignVariant,
  conversionRate,
  emptyLog,
  formatCount,
  formatPoints,
  formatRate,
  rateGap,
  type ExperimentLog,
  type Variant,
} from '@/lib/experiment'

export const metadata: Metadata = {
  title: 'Bitácora',
  robots: { index: false, follow: false },
}

// Los conteos salen de la base en cada request: la página no se prerenderiza en el build.
export const dynamic = 'force-dynamic'

const ROWS: Variant[] = ['a', 'b']

function RateTable({ log, caption }: { log: ExperimentLog; caption: string }) {
  return (
    <table className="w-full text-left text-sm">
      <caption className="mb-3 text-left text-muted-foreground">{caption}</caption>
      <thead>
        <tr className="border-b border-border">
          <th className="py-2 font-medium">Variante</th>
          <th className="py-2 font-medium">Impresiones</th>
          <th className="py-2 font-medium">Conversiones</th>
          <th className="py-2 font-medium">Tasa</th>
        </tr>
      </thead>
      <tbody>
        {ROWS.map((variant) => (
          <tr key={variant} className="border-b border-border">
            <td className="py-3">
              {variant.toUpperCase()} · {VARIANTS[variant].name}
            </td>
            <td className="py-3 font-mono">{formatCount(log[variant].impressions)}</td>
            <td className="py-3 font-mono">{formatCount(log[variant].conversions)}</td>
            <td className="py-3 font-mono">{formatRate(conversionRate(log[variant]))}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default async function BitacoraPage() {
  let log = emptyLog()
  let unavailable = false
  try {
    log = await readLog()
  } catch {
    unavailable = true
  }

  const hashRuns = [assignVariant(HASH_EXAMPLE_ID), assignVariant(HASH_EXAMPLE_ID), assignVariant(HASH_EXAMPLE_ID)]

  return (
    <main id="contenido" className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-10 md:py-14">
      <p className="font-mono text-[0.7rem] tracking-[0.16em] text-muted-foreground uppercase">
        Bitácora del experimento
      </p>
      <h1 className="max-w-2xl font-serif text-4xl tracking-tight text-balance md:text-5xl">
        Impresiones, conversiones y tasa por variante.
      </h1>
      <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
        La tasa es conversiones divididas por impresiones; sin impresiones no hay tasa. Una diferencia entre variantes no es una prueba: no se declara ganador.
      </p>

      <section className="flex flex-col gap-4">
        <h2 className="font-serif text-2xl">Registro real</h2>
        {unavailable ? (
          <p className="text-sm text-muted-foreground">
            No se pudo leer el registro de eventos. Los valores de abajo no son un conteo real.
          </p>
        ) : null}
        <RateTable log={log} caption="Eventos guardados en la base, por variante." />
        <p className="font-mono text-sm">B − A = {formatPoints(rateGap(log))}</p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-serif text-2xl">Caso de prueba fijo</h2>
        <RateTable
          log={TEST_CASE}
          caption="Cohorte fija: no sale de ninguna sesión y da lo mismo aunque nadie haya entrado."
        />
        <p className="font-mono text-sm">B − A = {formatPoints(rateGap(TEST_CASE))}</p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-serif text-2xl">Asignación estable</h2>
        <p className="font-mono text-sm">
          assignVariant({`'${HASH_EXAMPLE_ID}'`}) → {hashRuns[0].toUpperCase()}
        </p>
        <p className="font-mono text-sm text-muted-foreground">
          FNV-1a de 32 bits · {hashRuns.length} llamadas: {hashRuns.map((run) => run.toUpperCase()).join(', ')}
        </p>
      </section>

      <Link href="/practica" className="text-sm text-muted-foreground underline">
        Volver a la landing
      </Link>
    </main>
  )
}
