import { billingErrorResponse, getBillingStatus } from './_lib/billing.js'

export default {
  async fetch(request: Request) {
    if (request.method !== 'GET') {
      return Response.json({ error: 'Method not allowed.' }, { status: 405, headers: { Allow: 'GET' } })
    }
    try {
      return Response.json(await getBillingStatus(request))
    } catch (error) {
      return billingErrorResponse(error)
    }
  },
}
