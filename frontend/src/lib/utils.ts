import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formata data sem conversão de fuso horário.
 * Lê diretamente os componentes da string "YYYY-MM-DD".
 */
export function fmtDate(value: string | null | undefined): string {
  if (!value) return '-'
  const dateOnly = value.split('T')[0] // garante só "YYYY-MM-DD"
  const parts = dateOnly.split('-')
  if (parts.length !== 3) return '-'
  const [year, month, day] = parts
  return `${day}/${month}/${year}`
}

export function fmtTime(value: string | null | undefined): string {
  if (!value) return ''
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

/** Converte "YYYY-MM-DDTHH:MM:SS" ou "YYYY-MM-DD" para "YYYY-MM-DD" para <input type="date"> */
export function toInputDate(value: string | null | undefined): string {
  if (!value) return ''
  return value.split('T')[0]
}