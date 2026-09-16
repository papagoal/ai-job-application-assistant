import { billingErrorResponse, BillingError, getServerSupabase, requireUser } from './_lib/billing.js'
import { getRequestOrigin, stripeRequest } from './_lib/stripe.js'

interface StripePortalSession { url: string }

export default {
  async fetch(request: Request) {
    if (request.method !== 'POST') {
      return Response.json({ error: 'Method not allowed.' }, { status: 405, headers: { Allow: 'POST' } })
    }
    try {
      const user = await requireUser(request)
      const supabase = getServerSupabase()
      const { data } = await supabase.from('subscriptions')
        .select('stripe_customer_id')
        .eq('user_id', user.id)
        .maybeSingle()
      if (!data?.stripe_customer_id) {
        throw new BillingError(404, 'subscription_not_found', 'No Stripe subscription was found.')
      }

      const body = new URLSearchParams({
        customer: data.stripe_customer_id,
        return_url: `${getRequestOrigin(request)}/account`,
      })
      const session = await stripeRequest<StripePortalSession>('billing_portal/sessions', body)
      return Response.json({ url: session.url })
    } catch (error) {
      return billingErrorResponse(error)
    }
  },
}
