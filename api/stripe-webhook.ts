import { billingErrorResponse, BillingError, getServerSupabase } from './_lib/billing.js'
import { stripeRequest, verifyStripeSignature } from './_lib/stripe.js'

interface StripeObject {
  id: string
  customer?: string
  subscription?: string
  client_reference_id?: string
  status?: string
  metadata?: { user_id?: string }
  items?: { data?: Array<{ price?: { id?: string }; current_period_end?: number }> }
  current_period_end?: number
  cancel_at_period_end?: boolean
}

interface StripeEvent {
  id: string
  type: string
  data: { object: StripeObject }
}

async function syncSubscription(subscription: StripeObject, fallbackUserId?: string) {
  const userId = subscription.metadata?.user_id ?? fallbackUserId
  if (!userId) throw new BillingError(400, 'missing_user_id', 'Stripe subscription has no RoleLumi user ID.')

  const periodEnd = subscription.current_period_end
    ?? subscription.items?.data?.[0]?.current_period_end
  const supabase = getServerSupabase()
  const { error } = await supabase.from('subscriptions').upsert({
    user_id: userId,
    stripe_customer_id: subscription.customer ?? null,
    stripe_subscription_id: subscription.id,
    status: subscription.status ?? 'incomplete',
    price_id: subscription.items?.data?.[0]?.price?.id ?? null,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancel_at_period_end: subscription.cancel_at_period_end ?? false,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
  if (error) throw error
}

export default {
  async fetch(request: Request) {
    if (request.method !== 'POST') {
      return Response.json({ error: 'Method not allowed.' }, { status: 405, headers: { Allow: 'POST' } })
    }

    try {
      const payload = await request.text()
      const signature = request.headers.get('stripe-signature') ?? ''
      if (!await verifyStripeSignature(payload, signature)) {
        throw new BillingError(400, 'invalid_signature', 'Invalid Stripe signature.')
      }

      const event = JSON.parse(payload) as StripeEvent
      const supabase = getServerSupabase()
      const { data: existing } = await supabase.from('stripe_events')
        .select('event_id')
        .eq('event_id', event.id)
        .maybeSingle()
      if (existing) return Response.json({ received: true, duplicate: true })

      const object = event.data.object
      if (event.type === 'checkout.session.completed' && object.subscription) {
        const subscription = await stripeRequest<StripeObject>(`subscriptions/${object.subscription}`)
        await syncSubscription(subscription, object.client_reference_id ?? object.metadata?.user_id)
      } else if (event.type.startsWith('customer.subscription.')) {
        await syncSubscription(object)
      }

      const { error } = await supabase.from('stripe_events').insert({
        event_id: event.id,
        event_type: event.type,
      })
      if (error) throw error
      return Response.json({ received: true })
    } catch (error) {
      return billingErrorResponse(error)
    }
  },
}
