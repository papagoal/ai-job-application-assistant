// @vitest-environment happy-dom

import type { User } from '@supabase/supabase-js'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import {
  getCurrentUser,
  signOut,
  subscribeToAuthChanges,
} from '../services/authService'
import AppLayout from './AppLayout'

vi.mock('../services/authService', () => ({
  getCurrentUser: vi.fn(),
  isSupabaseConfigured: true,
  signOut: vi.fn(),
  subscribeToAuthChanges: vi.fn(),
}))

const mockedGetCurrentUser = vi.mocked(getCurrentUser)
const mockedSignOut = vi.mocked(signOut)
const mockedSubscribeToAuthChanges = vi.mocked(subscribeToAuthChanges)
const connectedUser = {
  email: 'candidate@example.com',
  is_anonymous: false,
  user_metadata: {
    full_name: 'Candidate Name',
  },
} as unknown as User

function renderLayout() {
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<p>Dashboard content</p>} />
          <Route path="profile" element={<p>Profile content</p>} />
          <Route path="account" element={<p>Account content</p>} />
          <Route path="applications/new" element={<p>New application content</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  mockedGetCurrentUser.mockResolvedValue(connectedUser)
  mockedSignOut.mockResolvedValue()
  mockedSubscribeToAuthChanges.mockReturnValue(vi.fn())
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('AppLayout sidebar', () => {
  it('shows primary navigation and the signed-in user', async () => {
    renderLayout()

    expect(screen.getByRole('link', { name: 'RoleLumi' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'New Application' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Profile & Resume' })).toBeTruthy()
    expect(await screen.findByText('Candidate Name')).toBeTruthy()
    expect(screen.getByText('candidate@example.com')).toBeTruthy()
  })

  it('closes the mobile menu after navigating', async () => {
    const user = userEvent.setup()
    renderLayout()

    const menuButton = screen.getByRole('button', { name: 'Open navigation' })
    await user.click(menuButton)
    expect(menuButton.getAttribute('aria-expanded')).toBe('true')

    await user.click(screen.getByRole('link', { name: 'Profile & Resume' }))

    expect(menuButton.getAttribute('aria-expanded')).toBe('false')
    expect(screen.getByText('Profile content')).toBeTruthy()
  })

  it('opens the account menu and logs out a connected account', async () => {
    const user = userEvent.setup()
    renderLayout()

    const accountTrigger = await screen.findByRole('button', {
      name: 'Open account menu for Candidate Name',
    })
    await user.click(accountTrigger)

    expect(screen.getByRole('navigation', { name: 'Account menu' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Account' })).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Log out' }))

    expect(mockedSignOut).toHaveBeenCalledTimes(1)
    expect(await screen.findByText('Account content')).toBeTruthy()
  })

  it('keeps logout hidden in a guest workspace', async () => {
    const user = userEvent.setup()
    mockedGetCurrentUser.mockResolvedValue({
      is_anonymous: true,
      user_metadata: {},
    } as unknown as User)
    renderLayout()

    const accountTrigger = await screen.findByRole('button', {
      name: 'Open account menu for Guest workspace',
    })
    await user.click(accountTrigger)

    expect(screen.getByRole('link', { name: 'Account' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Log out' })).toBeNull()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('navigation', { name: 'Account menu' })).toBeNull()
  })
})
