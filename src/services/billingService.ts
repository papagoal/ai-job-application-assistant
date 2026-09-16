import { getAccessToken } from './authService'

export interface BillingStatus {
  plan: 'free' | 'pro'
  subscriptionStatus: string
  used: number
  limit: number
  remaining: number
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
}

async function authorizedFetch(path: string, method: 'GET' | 'POST') {
  const token = await getAccessToken()
  if (!token) throw new Error('Cloud account is not configured.')
  const response = await fetch(path, {
    method,
    headers: { Authorization: `Bearer ${token}` },
  })
  const result = await response.json() as { url?: string; error?: string }
  if (!response.ok) throw new Error(result.error ?? 'Billing request failed.')
  return result
}

export async function loadBillingStatus() {
  return await authorizedFetch('/api/billing-status', 'GET') as unknown as BillingStatus
}

export async function startProCheckout() {
  const result = await authorizedFetch('/api/create-checkout-session', 'POST')
  if (!result.url) throw new Error('Checkout URL was not returned.')
  window.location.assign(result.url)
}

export async function openCustomerPortal() {
  const result = await authorizedFetch('/api/create-customer-portal', 'POST')
  if (!result.url) throw new Error('Customer portal URL was not returned.')
  window.location.assign(result.url)
}
