import { billingErrorResponse, BillingError, getServerSupabase, requireUser } from './_lib/billing.js'
import { getRequestOrigin, stripeRequest } from './_lib/stripe.js'

interface StripeCheckoutSession { url: string | null }

export default {
  async fetch(request: Request) {
    if (request.method !== 'POST') {
      return Response.json({ error: 'Method not allowed.' }, { status: 405, headers: { Allow: 'POST' } })
    }

    try {
      const user = await requireUser(request)
      if (user.is_anonymous || !user.email) {
        throw new BillingError(403, 'connected_account_required', 'Connect an email or Google account before upgrading.')
      }

      const priceId = process.env.STRIPE_PRO_PRICE_ID
      if (!priceId) throw new BillingError(503, 'stripe_unavailable', 'The Pro price is not configured.')

      const supabase = getServerSupabase()
      const { data: subscription } = await supabase.from('subscriptions')
        .select('stripe_customer_id')
        .eq('user_id', user.id)
        .maybeSingle()

      const origin = getRequestOrigin(request)
      const body = new URLSearchParams({
        mode: 'subscription',
        'line_items[0][price]': priceId,
        'line_items[0][quantity]': '1',
        client_reference_id: user.id,
        'metadata[user_id]': user.id,
        'subscription_data[metadata][user_id]': user.id,
        success_url: `${origin}/account?checkout=success`,
        cancel_url: `${origin}/pricing?checkout=cancelled`,
        allow_promotion_codes: 'true',
      })
      if (subscription?.stripe_customer_id) body.set('customer', subscription.stripe_customer_id)
      else body.set('customer_email', user.email)

      const session = await stripeRequest<StripeCheckoutSession>('checkout/sessions', body)
      if (!session.url) throw new BillingError(502, 'stripe_request_failed', 'Stripe did not return a checkout URL.')
      return Response.json({ url: session.url })
    } catch (error) {
      return billingErrorResponse(error)
    }
  },
}
