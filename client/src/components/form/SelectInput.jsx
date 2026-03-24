export default function SelectInput({ options, value, onChange, onBlur, name, placeholder, disabled }) {
  return (
    <select
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      disabled={disabled}
      className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 w-full
        focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
        disabled:bg-gray-100 disabled:cursor-not-allowed"
    >
      {placeholder && (
        <option value="">{placeholder}</option>
      )}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}
