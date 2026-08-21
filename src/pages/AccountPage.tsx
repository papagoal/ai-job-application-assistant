import { useEffect, useState, type FormEvent } from 'react'
import type { User } from '@supabase/supabase-js'
import {
  connectGuestAccount,
  continueWithGoogle,
  getCurrentUser,
  isSupabaseConfigured,
  sendExistingAccountMagicLink,
  signOut,
  subscribeToAuthChanges,
} from '../services/authService'

type PendingAction = 'connect' | 'magic-link' | 'google' | 'sign-out' | null

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.toLowerCase().includes('already registered')) {
    return 'This email already has an account. Use “Sign in to existing account” instead.'
  }

  return error instanceof Error ? error.message : 'Something went wrong. Please try again.'
}

function AccountPage() {
  const [user, setUser] = useState<User | null>(null)
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured)
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isSupabaseConfigured) return

    const unsubscribe = subscribeToAuthChanges(setUser)
    void getCurrentUser()
      .then(setUser)
      .catch((loadError) => setError(getErrorMessage(loadError)))
      .finally(() => setIsLoading(false))

    return unsubscribe
  }, [])

  function resetFeedback() {
    setMessage('')
    setError('')
  }

  async function handleConnect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    resetFeedback()
    setPendingAction('connect')

    try {
      await connectGuestAccount(email.trim())
      setMessage('Check your email and open the confirmation link to finish connecting this account.')
    } catch (connectError) {
      setError(getErrorMessage(connectError))
    } finally {
      setPendingAction(null)
    }
  }

  async function handleMagicLink() {
    resetFeedback()
    setPendingAction('magic-link')

    try {
      await sendExistingAccountMagicLink(email.trim())
      setMessage('If that account exists, a Magic Link has been sent. Open it in this browser to sign in.')
    } catch (magicLinkError) {
      setError(getErrorMessage(magicLinkError))
    } finally {
      setPendingAction(null)
    }
  }

  async function handleSignOut() {
    resetFeedback()
    setPendingAction('sign-out')

    try {
      await signOut()
      setUser(null)
      setMessage('Signed out. The app will create a new guest account when you next save or load cloud data.')
    } catch (signOutError) {
      setError(getErrorMessage(signOutError))
    } finally {
      setPendingAction(null)
    }
  }

  async function handleGoogleSignIn() {
    resetFeedback()
    setPendingAction('google')

    try {
      await continueWithGoogle(user)
    } catch (googleError) {
      setError(getErrorMessage(googleError))
      setPendingAction(null)
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <section className="form-page">
        <div className="page-heading">
          <div>
            <p className="eyebrow">Account</p>
            <h1>Cloud account unavailable</h1>
            <p className="page-description">
              Add the Supabase project URL and publishable key to use email sign-in. Your local browser data still works without them.
            </p>
          </div>
        </div>
      </section>
    )
  }

  if (isLoading) {
    return <p className="account-loading" role="status">Loading account…</p>
  }

  const isConnectedAccount = user && !user.is_anonymous
  const hasGoogleIdentity = user?.identities?.some(
    (identity) => identity.provider === 'google',
  ) ?? false

  return (
    <section className="form-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Account</p>
          <h1>{isConnectedAccount ? 'Your cloud account' : 'Keep your cloud data'}</h1>
          <p className="page-description">
            {isConnectedAccount
              ? 'This browser is signed in and can access the data protected by your account.'
              : 'Connect the current guest account to an email, or sign in to an account you already created.'}
          </p>
        </div>
      </div>

      {isConnectedAccount ? (
        <div className="form-section account-card">
          <div>
            <p className="account-label">Signed in as</p>
            <p className="account-email">{user.email}</p>
          </div>
          <div className="account-card-actions">
            {hasGoogleIdentity ? (
              <span className="google-connected-status">Google connected</span>
            ) : (
              <button
                className="google-sign-in-button account-google-button"
                type="button"
                disabled={pendingAction !== null}
                onClick={handleGoogleSignIn}
              >
                <span className="google-sign-in-mark" aria-hidden="true">G</span>
                {pendingAction === 'google' ? 'Opening Google…' : 'Connect Google'}
              </button>
            )}
            <button
              className="secondary-action account-button"
              type="button"
              disabled={pendingAction !== null}
              onClick={handleSignOut}
            >
              {pendingAction === 'sign-out' ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>
      ) : (
        <form className="profile-form" onSubmit={handleConnect}>
          <div className="form-section">
            <div className="form-section-heading">
              <h2>Connect this guest account</h2>
              <p>A confirmation link will be sent to your email. Your current profile and applications stay with this account.</p>
            </div>

            <div className="form-field">
              <label htmlFor="account-email">Email</label>
              <input
                id="account-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  resetFeedback()
                }}
                placeholder="you@example.com"
              />
            </div>

            <div className="account-actions">
              <button className="submit-button" type="submit" disabled={pendingAction !== null || !email.trim()}>
                {pendingAction === 'connect' ? 'Sending confirmation…' : 'Connect current data to email'}
              </button>
              <button
                className="secondary-action account-button"
                type="button"
                disabled={pendingAction !== null || !email.trim()}
                onClick={handleMagicLink}
              >
                {pendingAction === 'magic-link' ? 'Sending Magic Link…' : 'Sign in to existing account'}
              </button>
            </div>

            <div className="account-divider" aria-hidden="true"><span>or</span></div>

            <button
              className="google-sign-in-button"
              type="button"
              disabled={pendingAction !== null}
              onClick={handleGoogleSignIn}
            >
              <span className="google-sign-in-mark" aria-hidden="true">G</span>
              {pendingAction === 'google' ? 'Opening Google…' : 'Continue with Google'}
            </button>
            <p className="field-hint">
              {user?.is_anonymous
                ? 'Your current profile and applications stay with this account.'
                : 'Sign in or create an account using your Google email.'}
            </p>

            <p className="account-warning">
              Magic Link sign-in to an existing account switches accounts and does not merge
              guest data. Google sign-in keeps the current data when this browser is using a
              guest account.
            </p>
          </div>
        </form>
      )}

      {message && <p className="account-feedback account-success" role="status">{message}</p>}
      {error && <p className="account-feedback account-error" role="alert">{error}</p>}
    </section>
  )
}

export default AccountPage
