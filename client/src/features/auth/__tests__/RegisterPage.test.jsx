import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

// Mock Google OAuth
vi.mock('@react-oauth/google', () => ({
  GoogleLogin: ({ onSuccess }) => (
    <button onClick={() => onSuccess({ credential: 'mock-token' })}>
      Sign up with Google
    </button>
  ),
}))

// Mock auth API
const mockRegister = vi.fn()
const mockGoogleLogin = vi.fn()
vi.mock('../api', () => ({
  registerWithEmailApi: (...args) => mockRegister(...args),
  loginWithGoogleApi: (...args) => mockGoogleLogin(...args),
}))

// Mock auth store
const mockSetAuth = vi.fn()
vi.mock('../../../store/authStore', () => ({
  default: (selector) => {
    const state = { user: null, token: null, setAuth: mockSetAuth, logout: vi.fn() }
    return selector ? selector(state) : state
  },
}))

// Mock navigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

import RegisterPage from '../RegisterPage'

function renderPage() {
  return render(
    <MemoryRouter>
      <RegisterPage />
    </MemoryRouter>
  )
}

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all 6 fields', () => {
    renderPage()
    expect(screen.getByPlaceholderText('First Name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Phone')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument() // role select
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Confirm')).toBeInTheDocument()
  })

  it('renders Google login button', () => {
    renderPage()
    expect(screen.getByText('Sign up with Google')).toBeInTheDocument()
  })

  it('shows validation error for empty email submit', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument()
    })
  })

  it('shows password mismatch error', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByPlaceholderText('Password'), 'Password123')
    await user.type(screen.getByPlaceholderText('Confirm'), 'Different456')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(screen.getByText('Passwords must match')).toBeInTheDocument()
    })
  })

  it('calls registerWithEmailApi with correct payload on valid submit', async () => {
    mockRegister.mockResolvedValue({
      data: { data: { token: 'jwt-token', user: { id: 1, firstName: 'Test', email: 'test@test.com', role: 'farmer' } } },
    })

    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByPlaceholderText('First Name'), 'Test')
    await user.type(screen.getByPlaceholderText('Email'), 'test@test.com')
    await user.selectOptions(screen.getByRole('combobox'), 'farmer')
    await user.type(screen.getByPlaceholderText('Password'), 'Password123')
    await user.type(screen.getByPlaceholderText('Confirm'), 'Password123')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        'Test', '', 'test@test.com', 'farmer', 'Password123', 'Password123'
      )
    })
  })

  it('navigates to /demand for farmer role on success', async () => {
    mockRegister.mockResolvedValue({
      data: { data: { token: 'jwt', user: { id: 1, firstName: 'F', email: 'f@t.com', role: 'farmer' } } },
    })

    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByPlaceholderText('First Name'), 'F')
    await user.type(screen.getByPlaceholderText('Email'), 'f@t.com')
    await user.selectOptions(screen.getByRole('combobox'), 'farmer')
    await user.type(screen.getByPlaceholderText('Password'), 'Password123')
    await user.type(screen.getByPlaceholderText('Confirm'), 'Password123')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/demand')
    })
  })

  it('navigates to /dashboard for admin role on success', async () => {
    mockRegister.mockResolvedValue({
      data: { data: { token: 'jwt', user: { id: 2, firstName: 'A', email: 'a@t.com', role: 'admin' } } },
    })

    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByPlaceholderText('First Name'), 'A')
    await user.type(screen.getByPlaceholderText('Email'), 'a@t.com')
    await user.selectOptions(screen.getByRole('combobox'), 'admin')
    await user.type(screen.getByPlaceholderText('Password'), 'Password123')
    await user.type(screen.getByPlaceholderText('Confirm'), 'Password123')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })
})
