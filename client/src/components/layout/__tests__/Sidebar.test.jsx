import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

let mockStoreState = {}

vi.mock('../../../store/authStore', () => ({
  default: (selector) => {
    if (selector) return selector(mockStoreState)
    return mockStoreState
  },
}))

import Sidebar from '../Sidebar'

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows admin navigation items for admin user', () => {
    mockStoreState = {
      user: { id: 1, firstName: 'Admin', role: 'admin' },
      logout: vi.fn(),
    }

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    )

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Farmers')).toBeInTheDocument()
    expect(screen.getByText('Demand Planning')).toBeInTheDocument()
    expect(screen.getByText('Reports')).toBeInTheDocument()
    expect(screen.getByText('Inventory')).toBeInTheDocument()
    expect(screen.getByText('Logout')).toBeInTheDocument()
  })

  it('shows farmer navigation items only for farmer user', () => {
    mockStoreState = {
      user: { id: 2, firstName: 'Farmer', role: 'farmer' },
      logout: vi.fn(),
    }

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    )

    expect(screen.getByText('Demand Planning')).toBeInTheDocument()
    expect(screen.getByText('Notifications')).toBeInTheDocument()
    expect(screen.getByText('Logout')).toBeInTheDocument()
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
    expect(screen.queryByText('Farmers')).not.toBeInTheDocument()
    expect(screen.queryByText('Reports')).not.toBeInTheDocument()
    expect(screen.queryByText('Inventory')).not.toBeInTheDocument()
  })

  it('shows confirmation modal when logout is clicked', async () => {
    const user = userEvent.setup()
    mockStoreState = {
      user: { id: 1, firstName: 'Admin', role: 'admin' },
      logout: vi.fn(),
    }

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    )

    await user.click(screen.getByText('Logout'))

    expect(screen.getByText('Confirm Logout')).toBeInTheDocument()
    expect(screen.getByText('Are you sure you want to log out?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('closes modal when Cancel is clicked', async () => {
    const user = userEvent.setup()
    mockStoreState = {
      user: { id: 1, firstName: 'Admin', role: 'admin' },
      logout: vi.fn(),
    }

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    )

    await user.click(screen.getByText('Logout'))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByText('Confirm Logout')).not.toBeInTheDocument()
  })
})
