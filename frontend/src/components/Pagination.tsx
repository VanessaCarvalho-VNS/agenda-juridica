import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface PaginationProps {
  page: number
  totalPages: number
  total: number
  limit: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, total, limit, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null
  const from = (page - 1) * limit + 1
  const to   = Math.min(page * limit, total)

  const pages: (number | '...')[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push('...')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
    if (page < totalPages - 2) pages.push('...')
    pages.push(totalPages)
  }

  const btn = (label: React.ReactNode, target: number, disabled: boolean, active = false) => (
    <button
      key={String(label) + target}
      onClick={() => !disabled && onPageChange(target)}
      disabled={disabled}
      className={`min-w-[36px] h-9 px-2 rounded-lg text-sm font-medium flex items-center justify-center transition-all border ${
        active
          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
          : disabled
            ? 'text-slate-300 border-transparent cursor-not-allowed'
            : 'text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 pt-4 border-t border-slate-100 mt-2">
      <p className="text-sm text-slate-500">
        Exibindo <span className="font-medium text-slate-700">{from}–{to}</span> de{' '}
        <span className="font-medium text-slate-700">{total}</span> registros
      </p>
      <div className="flex items-center gap-1">
        {btn(<ChevronsLeft  className="w-4 h-4" />, 1,          page === 1)}
        {btn(<ChevronLeft   className="w-4 h-4" />, page - 1,   page === 1)}
        {pages.map((p, i) =>
          p === '...'
            ? <span key={`d${i}`} className="px-1 text-slate-400 text-sm select-none">…</span>
            : btn(p, p as number, false, p === page)
        )}
        {btn(<ChevronRight  className="w-4 h-4" />, page + 1,   page === totalPages)}
        {btn(<ChevronsRight className="w-4 h-4" />, totalPages, page === totalPages)}
      </div>
    </div>
  )
}
