// Workout dates are calendar days ("YYYY-MM-DD"), not instants. Everything here
// works in the user's local calendar so a workout never shifts a day because
// of UTC parsing.

export const WEIGHT_UNIT = 'kg'

/** Local calendar date as "YYYY-MM-DD". */
export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function today(): string {
  return toISODate(new Date())
}

/** Parse "YYYY-MM-DD" as a local date (new Date("2026-10-01") would be UTC). */
export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(iso: string, days: number): string {
  const d = parseISODate(iso)
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

/** Monday of the week containing the date (matches Postgres date_trunc('week')). */
export function startOfWeek(iso: string): string {
  const daysSinceMonday = (parseISODate(iso).getDay() + 6) % 7
  return addDays(iso, -daysSinceMonday)
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = {}): string {
  return parseISODate(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...opts,
  })
}

export function formatShortDate(iso: string): string {
  return parseISODate(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

const numberFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 })
const compactFormat = new Intl.NumberFormat(undefined, {
  notation: 'compact',
  maximumFractionDigits: 1,
})

export function formatNumber(n: number | string): string {
  return numberFormat.format(Number(n))
}

export function formatCompact(n: number): string {
  return compactFormat.format(n)
}

export function formatWeight(n: number | string): string {
  return `${formatNumber(n)} ${WEIGHT_UNIT}`
}

export function muscleGroupLabel(group: string): string {
  const label = group.replace(/_/g, ' ')
  return label.charAt(0).toUpperCase() + label.slice(1)
}
