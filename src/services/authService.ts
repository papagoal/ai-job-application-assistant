import type { User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from './supabaseClient'

function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  return supabase
}

export { isSupabaseConfigured }

export async function getCurrentUser(): Promise<User | null> {
  const client = requireSupabase()
  const { data: sessionData, error: sessionError } = await client.auth.getSession()
  if (sessionError) throw sessionError
  if (!sessionData.session) return null

  const { data, error } = await client.auth.getUser()
  if (error) throw error
  return data.user
}

export async function connectGuestAccount(email: string): Promise<void> {
  const client = requireSupabase()
  const { data: sessionData, error: sessionError } = await client.auth.getSession()
  if (sessionError) throw sessionError

  let user = sessionData.session?.user
  if (!user) {
    const { data, error } = await client.auth.signInAnonymously()
    if (error) throw error
    user = data.user ?? undefined
  }

  if (!user) throw new Error('A guest account could not be created.')
  if (!user.is_anonymous) throw new Error('This account already has an email address.')

  const { error } = await client.auth.updateUser({ email })
  if (error) throw error
}

export async function sendExistingAccountMagicLink(email: string): Promise<void> {
  const client = requireSupabase()
  const { error } = await client.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/account`,
      shouldCreateUser: false,
    },
  })
  if (error) throw error
}

export async function signOut(): Promise<void> {
  const client = requireSupabase()
  const { error } = await client.auth.signOut()
  if (error) throw error
}

export function subscribeToAuthChanges(onChange: (user: User | null) => void) {
  const client = requireSupabase()
  const { data } = client.auth.onAuthStateChange((_event, session) => {
    onChange(session?.user ?? null)
  })

  return () => data.subscription.unsubscribe()
}
