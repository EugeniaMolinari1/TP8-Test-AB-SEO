import { neon } from '@neondatabase/serverless'
import {
  SESSION_WINDOW,
  emptyLog,
  isVariant,
  parseLog,
  serializeLog,
  type ExperimentLog,
  type Variant,
} from '@/lib/experiment'

function connect() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('Falta DATABASE_URL')
  return neon(url)
}

/**
 * Anota una impresión si el visitante no tiene otra en los últimos 30 minutos.
 * El lock por visitante hace que dos requests simultáneos se serialicen: el segundo
 * ve la fila del primero y no inserta. Devuelve true si anotó una impresión nueva.
 */
export async function recordImpression(visitorId: string, variant: Variant): Promise<boolean> {
  const sql = connect()
  const [, inserted] = await sql.transaction((tx) => [
    tx`select pg_advisory_xact_lock(hashtextextended(${visitorId}::text, 0))`,
    tx`
      insert into events (visitor_id, variant, type)
      select ${visitorId}::text, ${variant}::text, 'impression'
      where not exists (
        select 1 from events
        where visitor_id = ${visitorId}::text
          and type = 'impression'
          and created_at > now() - make_interval(secs => ${SESSION_WINDOW}::int)
      )
      returning id`,
  ])
  return inserted.length > 0
}

/**
 * Anota la conversión del visitante. El índice único parcial one_conversion_per_visitor
 * deja pasar una sola por visitante. Devuelve true si es la primera.
 */
export async function recordConversion(visitorId: string, variant: Variant): Promise<boolean> {
  const sql = connect()
  const inserted = await sql`
    insert into events (visitor_id, variant, type)
    values (${visitorId}::text, ${variant}::text, 'conversion')
    on conflict do nothing
    returning id`
  return inserted.length > 0
}

/** Cuenta los eventos por variante. Lo leído pasa por parseLog antes de usarse. */
export async function readLog(): Promise<ExperimentLog> {
  const sql = connect()
  const rows = await sql`
    select variant, type, count(*)::int as total
    from events
    group by variant, type`
  const log = emptyLog()
  for (const row of rows) {
    if (!isVariant(row.variant)) continue
    if (row.type === 'impression') log[row.variant].impressions = row.total
    if (row.type === 'conversion') log[row.variant].conversions = row.total
  }
  return parseLog(serializeLog(log))
}
