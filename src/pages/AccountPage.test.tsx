// @vitest-environment happy-dom

import type { User } from '@supabase/supabase-js'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  connectGuestAccount,
  continueWithGoogle,
  getCurrentUser,
  sendExistingAccountMagicLink,
  subscribeToAuthChanges,
} from '../services/authService'
import AccountPage from './AccountPage'

vi.mock('../services/authService', () => ({
  connectGuestAccount: vi.fn(),
  continueWithGoogle: vi.fn(),
  getCurrentUser: vi.fn(),
  isSupabaseConfigured: true,
  sendExistingAccountMagicLink: vi.fn(),
  signOut: vi.fn(),
  subscribeToAuthChanges: vi.fn(),
}))

const mockedConnectGuestAccount = vi.mocked(connectGuestAccount)
const mockedContinueWithGoogle = vi.mocked(continueWithGoogle)
const mockedGetCurrentUser = vi.mocked(getCurrentUser)
const mockedSendExistingAccountMagicLink = vi.mocked(sendExistingAccountMagicLink)
const mockedSubscribeToAuthChanges = vi.mocked(subscribeToAuthChanges)
const guestUser = { is_anonymous: true } as User

beforeEach(() => {
  mockedGetCurrentUser.mockResolvedValue(guestUser)
  mockedSubscribeToAuthChanges.mockReturnValue(vi.fn())
  mockedConnectGuestAccount.mockResolvedValue()
  mockedContinueWithGoogle.mockResolvedValue()
  mockedSendExistingAccountMagicLink.mockResolvedValue()
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('AccountPage Google sign-in', () => {
  it('offers Google sign-in and preserves the active guest account', async () => {
    const user = userEvent.setup()
    render(<AccountPage />)

    const googleButton = await screen.findByRole('button', {
      name: 'Continue with Google',
    })
    expect(screen.getByRole('heading', { name: 'One account, every application.' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Choose how to continue' })).toBeTruthy()
    expect(screen.getByLabelText('Email address')).toBeTruthy()
    expect(screen.getByText(
      'Your current profile and applications stay with this account.',
    )).toBeTruthy()

    await user.click(googleButton)

    expect(mockedContinueWithGoogle).toHaveBeenCalledWith(guestUser)
    expect(screen.getByRole('button', { name: 'Opening Google…' })).toBeTruthy()
  })

  it('lets an existing email account connect Google without signing out', async () => {
    const connectedUser = {
      is_anonymous: false,
      email: 'candidate@example.com',
      identities: [{ provider: 'email' }],
    } as User
    mockedGetCurrentUser.mockResolvedValue(connectedUser)
    const user = userEvent.setup()
    render(<AccountPage />)

    const connectGoogleButton = await screen.findByRole('button', {
      name: 'Connect Google',
    })
    expect(screen.getByRole('heading', { name: 'Signed in successfully' })).toBeTruthy()
    expect(screen.getByText('candidate@example.com')).toBeTruthy()
    await user.click(connectGoogleButton)

    expect(mockedContinueWithGoogle).toHaveBeenCalledWith(connectedUser)
  })
})

describe('AccountPage email access', () => {
  it('distinguishes new account creation from existing account sign-in', async () => {
    const user = userEvent.setup()
    render(<AccountPage />)

    const emailInput = await screen.findByLabelText('Email address')
    await user.type(emailInput, 'new@example.com')

    const createButton = screen.getByRole('button', { name: 'Create account with email' })
    const signInButton = screen.getByRole('button', { name: 'Sign in to existing account' })

    expect(createButton).toBeTruthy()
    expect(createButton.getAttribute('aria-busy')).toBe('false')
    expect(signInButton).toBeTruthy()
    expect(signInButton.getAttribute('aria-busy')).toBe('false')
  })

  it('explains when a Magic Link email does not have an existing account', async () => {
    const user = userEvent.setup()
    mockedSendExistingAccountMagicLink.mockRejectedValue(
      new Error('Signups not allowed for otp'),
    )
    render(<AccountPage />)

    await user.type(await screen.findByLabelText('Email address'), 'new@example.com')
    await user.click(screen.getByRole('button', { name: 'Sign in to existing account' }))

    expect((await screen.findByRole('alert')).textContent).toBe(
      'No existing account was found for this email. Use “Create account with email” first.',
    )
  })
})
