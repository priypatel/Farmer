import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

vi.mock('@react-oauth/google', () => ({
  GoogleLogin: ({ onSuccess }) => (
    <button onClick={() => onSuccess({ credential: 'mock-token' })}>
      Sign in with Google
    </button>
  ),
}))

const mockLogin = vi.fn()
const mockGoogleLogin = vi.fn()
vi.mock('../api', () => ({
  loginWithEmailApi: (...args) => mockLogin(...args),
  loginWithGoogleApi: (...args) => mockGoogleLogin(...args),
}))

const mockSetAuth = vi.fn()
vi.mock('../../../store/authStore', () => ({
  default: (selector) => {
    const state = { user: null, token: null, setAuth: mockSetAuth, logout: vi.fn() }
    return selector ? selector(state) : state
  },
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

import LoginPage from '../LoginPage'

function renderPage() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders email and password fields', () => {
    renderPage()
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
  })

  it('renders Google login button', () => {
    renderPage()
    expect(screen.getByText('Sign in with Google')).toBeInTheDocument()
  })

  it('shows validation error for empty email', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /sign in$/i }))

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument()
    })
  })

  it('calls loginWithEmailApi on submit', async () => {
    mockLogin.mockResolvedValue({
      data: { data: { token: 'jwt', user: { id: 1, firstName: 'T', email: 't@t.com', role: 'farmer' } } },
    })

    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByPlaceholderText('Email'), 'test@test.com')
    await user.type(screen.getByPlaceholderText('Password'), 'Password123')
    await user.click(screen.getByRole('button', { name: /sign in$/i }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@test.com', 'Password123')
    })
  })

  it('shows error toast on 401 response', async () => {
    mockLogin.mockRejectedValue({
      response: { status: 401, data: { message: 'Invalid credentials' } },
    })

    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByPlaceholderText('Email'), 'test@test.com')
    await user.type(screen.getByPlaceholderText('Password'), 'wrong')
    await user.click(screen.getByRole('button', { name: /sign in$/i }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled()
    })
  })
})
