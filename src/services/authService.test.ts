// @vitest-environment happy-dom

import type { User } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const authMocks = vi.hoisted(() => ({
  linkIdentity: vi.fn(),
  signOut: vi.fn(),
  signInWithOAuth: vi.fn(),
}))

vi.mock('./supabaseClient', () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: authMocks,
  },
}))

import { continueWithGoogle, signInToExistingGoogleAccount } from './authService'

beforeEach(() => {
  vi.clearAllMocks()
  authMocks.linkIdentity.mockResolvedValue({ data: {}, error: null })
  authMocks.signOut.mockResolvedValue({ error: null })
  authMocks.signInWithOAuth.mockResolvedValue({ data: {}, error: null })
})

describe('signInToExistingGoogleAccount', () => {
  it('leaves the current session before starting regular Google OAuth', async () => {
    await signInToExistingGoogleAccount()

    expect(authMocks.signOut).toHaveBeenCalledOnce()
    expect(authMocks.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/account` },
    })
  })
})

describe('continueWithGoogle', () => {
  it('links Google to an active user so the user ID and data are preserved', async () => {
    const guestUser = { is_anonymous: true } as User

    await continueWithGoogle(guestUser)

    expect(authMocks.linkIdentity).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/account` },
    })
    expect(authMocks.signInWithOAuth).not.toHaveBeenCalled()
  })

  it('starts regular Google OAuth when there is no active user', async () => {
    await continueWithGoogle(null)

    expect(authMocks.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/account` },
    })
    expect(authMocks.linkIdentity).not.toHaveBeenCalled()
  })
})
