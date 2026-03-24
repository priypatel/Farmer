export default function DateRangePicker({ startDate, endDate, onStartChange, onEndChange }) {
  const inputClass = `border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900
    focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-full`

  return (
    <div className="flex items-end gap-2">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
        <input
          type="date"
          value={startDate || ''}
          onChange={(e) => onStartChange(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
        <input
          type="date"
          value={endDate || ''}
          onChange={(e) => onEndChange(e.target.value)}
          min={startDate || undefined}
          className={inputClass}
        />
      </div>
    </div>
  )
}
