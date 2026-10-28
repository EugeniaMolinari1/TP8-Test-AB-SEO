import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Inicio',
  robots: { index: false, follow: false },
}

const FILES = [
  ['proxy.ts', 'Asigna visitante y variante, y anota una impresión por sesión.'],
  ['lib/experiment.ts', 'Hash, tasa y validación del log, con el copy, la oferta y el caso de prueba.'],
  ['app/practica/page.tsx', 'Publica title, description y un canonical único.'],
  ['app/practica/actions.ts', 'Una conversión por visitante, solo con el CTA.'],
  ['app/bitacora/page.tsx', 'Muestra la tasa por variante y el caso fijo, sin declarar ganador.'],
]

export default function HomePage() {
  return (
    <main id="contenido" className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-14">
      <p className="font-mono text-[0.7rem] tracking-[0.16em] text-muted-foreground uppercase">
        Laboratorio 01 · Taller Norte
      </p>
      <h1 className="font-serif text-4xl leading-tight tracking-tight text-balance md:text-5xl">
        Una landing, dos mensajes, una sola URL indexable.
      </h1>
      <p className="text-lg leading-relaxed text-muted-foreground">
        Taller Norte es una escuela de oficios ficticia. El experimento cambia el mensaje, no la oferta: cada persona ve siempre el mismo copy y el buscador encuentra una sola URL.
      </p>
      <div className="flex flex-wrap gap-2">
        <Link href="/practica" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          Abrir la landing
        </Link>
        <Link href="/bitacora" className="rounded-md border border-border px-4 py-2 text-sm">
          Abrir la bitácora
        </Link>
      </div>
      <ol className="flex flex-col gap-4">
        {FILES.map(([path, detail], index) => (
          <li key={path} className="flex flex-col gap-1 border-t border-border pt-3">
            <span className="font-mono text-[0.7rem] tracking-[0.14em] text-muted-foreground uppercase">
              0{index + 1}
            </span>
            <code className="font-mono text-sm">{path}</code>
            <span className="text-sm text-muted-foreground">{detail}</span>
          </li>
        ))}
      </ol>
    </main>
  )
}
