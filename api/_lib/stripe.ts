import { BillingError } from './billing.js'

function getStripeSecretKey() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new BillingError(503, 'stripe_unavailable', 'Stripe is not configured.')
  return key
}

export async function stripeRequest<T>(path: string, body?: URLSearchParams): Promise<T> {
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      Authorization: `Bearer ${getStripeSecretKey()}`,
      ...(body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
    },
    body,
  })
  const result = await response.json() as T & { error?: { message?: string } }
  if (!response.ok) {
    throw new BillingError(502, 'stripe_request_failed', result.error?.message ?? 'Stripe request failed.')
  }
  return result
}

export function getRequestOrigin(request: Request) {
  const configuredOrigin = process.env.APP_URL?.replace(/\/$/, '')
  if (configuredOrigin) return configuredOrigin
  return new URL(request.url).origin
}

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function verifyStripeSignature(payload: string, signatureHeader: string) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) throw new BillingError(503, 'stripe_unavailable', 'Stripe webhook is not configured.')

  const entries = signatureHeader.split(',').map((part) => part.split('='))
  const timestamp = entries.find(([key]) => key === 't')?.[1]
  const signatures = entries.filter(([key]) => key === 'v1').map(([, value]) => value)
  if (!timestamp || signatures.length === 0) return false
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const digest = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${timestamp}.${payload}`),
  )
  const expected = toHex(digest)
  return signatures.some((signature) => signature.length === expected.length
    && signature.split('').every((character, index) => character === expected[index]))
}
