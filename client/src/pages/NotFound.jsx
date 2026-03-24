import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-text-primary mb-4">404</h1>
        <p className="text-lg text-text-secondary mb-6">Page not found</p>
        <Link
          to="/"
          className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark font-medium"
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}
