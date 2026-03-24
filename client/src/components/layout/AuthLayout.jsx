export default function AuthLayout({ children, label }) {
  return (
    <div className="min-h-screen bg-white flex relative">
      {/* Label */}
      <span className="absolute top-6 left-8 text-xs tracking-widest uppercase text-gray-400">
        {label}
      </span>

      {/* Left — Illustration */}
      <div className="hidden lg:flex w-[45%] items-center justify-center p-12">
        <img
          src="/auth-illustration.svg"
          alt="Agricultural illustration"
          className="max-w-full max-h-[500px] object-contain"
          onError={(e) => {
            e.target.style.display = 'none'
          }}
        />
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
