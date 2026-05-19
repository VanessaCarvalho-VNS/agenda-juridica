import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely format a date string or Date object to pt-BR locale.
 * MySQL returns dates as "YYYY-MM-DD" strings (no timezone suffix).
 * Appending T00:00 avoids UTC-offset shifting the day.
 */
export function fmtDate(value: string | null | undefined): string {
  if (!value) return '-'
  // Already has time component (ISO datetime) — use as-is
  const raw = value.includes('T') ? value : value.split('T')[0] + 'T00:00'
  const d = new Date(raw)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('pt-BR')
}

export function fmtTime(value: string | null | undefined): string {
  if (!value) return ''
  // HH:MM:SS from MySQL → slice to HH:MM
  if (/^\d{2}:\d{2}/.test(value)) return value.slice(0, 5)
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function fmtCurrency(value: number | string | null | undefined): string {
  const n = Number(value)
  if (isNaN(n)) return '-'
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/** Convert "YYYY-MM-DDTHH:MM:SS" or "YYYY-MM-DD" to "YYYY-MM-DD" for <input type="date"> */
export function toInputDate(value: string | null | undefined): string {
  if (!value) return ''
  return value.split('T')[0]
}
