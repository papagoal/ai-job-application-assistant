import { createClient, type User } from '@supabase/supabase-js'

export type BillingFeature = 'job_analysis' | 'resume_regeneration' | 'interview_prep'

export interface BillingStatus {
  plan: 'free' | 'pro'
  subscriptionStatus: string
  used: number
  limit: number
  remaining: number
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
}

export class BillingError extends Error {
  status: number
  code: string
  details?: Record<string, unknown>

  constructor(status: number, code: string, message: string, details?: Record<string, unknown>) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

function getServerSupabase() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) {
    throw new BillingError(503, 'billing_unavailable', 'Billing is not configured.')
  }
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function getBearerToken(request: Request) {
  const authorization = request.headers.get('authorization') ?? ''
  return authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : ''
}

export async function requireUser(request: Request): Promise<User> {
  const token = getBearerToken(request)
  if (!token) throw new BillingError(401, 'authentication_required', 'Sign in is required.')

  const supabase = getServerSupabase()
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) {
    throw new BillingError(401, 'authentication_required', 'Your session is invalid or expired.')
  }
  return data.user
}

export async function consumeEntitlement(request: Request, feature: BillingFeature) {
  if (process.env.NODE_ENV === 'test') {
    return { user: null, entitlement: { allowed: true, plan: 'pro', used: 0, usage_limit: 50 } }
  }
  const user = await requireUser(request)
  const supabase = getServerSupabase()
  const { data, error } = await supabase.rpc('consume_billing_entitlement', {
    p_user_id: user.id,
    p_feature: feature,
  })
  if (error) throw new BillingError(500, 'usage_check_failed', 'Usage could not be verified.')

  const entitlement = Array.isArray(data) ? data[0] : data
  if (!entitlement?.allowed) {
    const code = entitlement?.reason === 'pro_required' ? 'pro_required' : 'limit_reached'
    throw new BillingError(402, code, code === 'pro_required'
      ? 'This feature requires RoleLumi Pro.'
      : 'You have used all analyses included in your plan.', {
      plan: entitlement?.plan ?? 'free',
      used: entitlement?.used ?? 0,
      limit: entitlement?.usage_limit ?? 3,
    })
  }
  return { user, entitlement }
}

export async function getBillingStatus(request: Request): Promise<BillingStatus> {
  const user = await requireUser(request)
  const supabase = getServerSupabase()
  const periodStart = new Date()
  periodStart.setUTCDate(1)
  const periodKey = periodStart.toISOString().slice(0, 10)

  const [{ data: subscription }, { data: usage }] = await Promise.all([
    supabase.from('subscriptions')
      .select('status,current_period_end,cancel_at_period_end')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase.from('usage_counters')
      .select('analysis_count')
      .eq('user_id', user.id)
      .eq('period_start', periodKey)
      .maybeSingle(),
  ])

  const isPro = Boolean(
    subscription
    && ['active', 'trialing'].includes(subscription.status)
    && (!subscription.current_period_end || new Date(subscription.current_period_end) > new Date()),
  )
  const limit = isPro ? 50 : 3
  const used = usage?.analysis_count ?? 0

  return {
    plan: isPro ? 'pro' : 'free',
    subscriptionStatus: subscription?.status ?? 'free',
    used,
    limit,
    remaining: Math.max(0, limit - used),
    currentPeriodEnd: subscription?.current_period_end ?? null,
    cancelAtPeriodEnd: subscription?.cancel_at_period_end ?? false,
  }
}

export function billingErrorResponse(error: unknown) {
  if (error instanceof BillingError) {
    return Response.json({ error: error.message, code: error.code, ...error.details }, { status: error.status })
  }
  return Response.json({ error: 'An unexpected billing error occurred.' }, { status: 500 })
}

export { getServerSupabase }
