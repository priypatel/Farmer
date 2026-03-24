import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

export default function MultiSelect({ options, value = [], onChange, placeholder = 'Select...' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function toggle(val) {
    const num = Number(val)
    const next = value.includes(num)
      ? value.filter((v) => v !== num)
      : [...value, num]
    onChange(next)
  }

  const selectedCount = value.length

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 w-full
          focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
          flex items-center justify-between bg-white"
      >
        <span className={selectedCount === 0 ? 'text-gray-400' : ''}>
          {selectedCount === 0 ? placeholder : `${selectedCount} selected`}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {options.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={value.includes(Number(opt.value))}
                onChange={() => toggle(opt.value)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              {opt.label}
            </label>
          ))}
          {options.length === 0 && (
            <p className="px-3 py-2 text-sm text-gray-400">No options</p>
          )}
        </div>
      )}
    </div>
  )
}
