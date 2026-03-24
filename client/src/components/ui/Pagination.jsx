import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ page, limit, total, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const isFirst = page <= 1
  const isLast = page >= totalPages

  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-sm text-gray-500">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={isFirst}
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-700
            hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed
            flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          Prev
        </button>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={isLast}
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-700
            hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed
            flex items-center gap-1"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
