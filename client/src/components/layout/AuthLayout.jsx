export default function AuthLayout({ children, image = '/login.png' }) {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl flex rounded-2xl shadow-2xl overflow-hidden min-h-[560px]">

        {/* Left — Image */}
        <div className="hidden lg:flex w-[45%] bg-white items-center justify-center p-6">
          <img
            src={image}
            alt="illustration"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Right — Form */}
        <div className="flex-1 bg-white flex items-center justify-center p-10 border-l border-gray-100">
          <div className="w-full max-w-sm">
            {children}
          </div>
        </div>

      </div>
    </div>
  )
}
