'use client'

import { useState, useTransition } from 'react'
import { recordConversion, type ConversionStatus } from '@/app/practica/actions'

const MESSAGES: Record<ConversionStatus, string> = {
  recorded: 'Listo: tu clic quedó anotado como conversión.',
  already: 'Tu conversión ya estaba anotada. Otro clic no suma.',
  preview: 'Esto es una vista previa: el clic no se anota.',
  rejected: 'No hay una asignación válida para este visitante: el clic no se anota.',
  error: 'No se pudo anotar el clic. Probá de nuevo.',
}

export function Cta({ label }: { label: string }) {
  const [result, setResult] = useState<ConversionStatus | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            const { status } = await recordConversion()
            setResult(status)
          })
        }}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {label}
      </button>
      <p className="max-w-md text-sm text-muted-foreground">
        {result ? MESSAGES[result] : 'La conversión se anota solo acá. Cargar la página no cuenta.'}
      </p>
    </div>
  )
}
