import { useState, useEffect, useRef } from 'react'
import { Search } from 'lucide-react'

export default function SearchInput({ value, onChange, placeholder = 'Search...' }) {
  const [local, setLocal] = useState(value || '')
  const timerRef = useRef(null)

  useEffect(() => {
    setLocal(value || '')
  }, [value])

  function handleChange(e) {
    const val = e.target.value
    setLocal(val)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => onChange(val), 300)
  }

  useEffect(() => {
    return () => clearTimeout(timerRef.current)
  }, [])

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        value={local}
        onChange={handleChange}
        placeholder={placeholder}
        className="border border-gray-300 rounded-md pl-9 pr-3 py-2 text-sm text-gray-900 w-full
          focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
          placeholder:text-gray-400"
      />
    </div>
  )
}
