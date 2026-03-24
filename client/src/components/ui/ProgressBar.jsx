export default function ProgressBar({ current, total, unit }) {
  const pct = total > 0 ? Math.min((current / total) * 100, 100) : 0

  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">
        {current} / {total} {unit}
      </p>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-primary rounded-full h-2 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
