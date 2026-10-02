import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  loadBillingStatus,
  openCustomerPortal,
  startProCheckout,
  type BillingStatus,
} from '../services/billingService'

const freeFeatures = [
  '3 job analyses per month',
  '1 resume profile',
  'Application tracking',
  'PDF export',
]

const proFeatures = [
  '50 job analyses per month',
  'Resume and cover letter regeneration',
  'AI interview preparation',
  'Customer portal for subscription management',
]

function PricingPage() {
  const [billing, setBilling] = useState<BillingStatus | null>(null)
  const [isBillingLoading, setIsBillingLoading] = useState(true)
  const [isStartingCheckout, setIsStartingCheckout] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    void loadBillingStatus()
      .then(setBilling)
      .catch((billingError) => setError(
        billingError instanceof Error ? billingError.message : 'Plan details could not be loaded.',
      ))
      .finally(() => setIsBillingLoading(false))
  }, [])

  async function handleUpgrade() {
    setError('')
    setIsStartingCheckout(true)
    try {
      if (billing?.plan === 'pro') await openCustomerPortal()
      else await startProCheckout()
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : 'Checkout could not be opened.')
      setIsStartingCheckout(false)
    }
  }

  return (
    <section className="pricing-page">
      <div className="page-heading pricing-heading">
        <div>
          <p className="eyebrow">Plans</p>
          <h1>Choose the pace that fits your job search.</h1>
          <p className="page-description">Start free. Upgrade when you need more AI assistance.</p>
        </div>
      </div>

      <div className="pricing-grid">
        <article className="pricing-card">
          <p className="pricing-plan">Free</p>
          <p className="pricing-price"><strong>CA$0</strong><span>/month</span></p>
          <ul>{freeFeatures.map((feature) => <li key={feature}>{feature}</li>)}</ul>
          <Link className="secondary-action pricing-action" to="/applications/new">Continue free</Link>
        </article>

        <article className="pricing-card pricing-card-featured">
          <span className="pricing-badge">Recommended</span>
          <p className="pricing-plan">Pro</p>
          <p className="pricing-price"><strong>CA$9.99</strong><span>/month</span></p>
          <ul>{proFeatures.map((feature) => <li key={feature}>{feature}</li>)}</ul>
          <button
            className="submit-button pricing-action"
            type="button"
            disabled={isBillingLoading || isStartingCheckout || !billing}
            onClick={handleUpgrade}
          >
            {isBillingLoading
              ? 'Checking plan…'
              : isStartingCheckout
                ? billing?.plan === 'pro' ? 'Opening portal…' : 'Opening checkout…'
                : billing?.plan === 'pro' ? 'Manage subscription' : 'Upgrade to Pro'}
          </button>
          {error && <p className="field-error" role="alert">{error}</p>}
        </article>
      </div>
    </section>
  )
}

export default PricingPage
