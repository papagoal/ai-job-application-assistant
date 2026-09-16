import { useState } from 'react'
import { Link } from 'react-router-dom'
import { startProCheckout } from '../services/billingService'

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
  const [isStartingCheckout, setIsStartingCheckout] = useState(false)
  const [error, setError] = useState('')

  async function handleUpgrade() {
    setError('')
    setIsStartingCheckout(true)
    try {
      await startProCheckout()
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
          <button className="submit-button pricing-action" type="button" disabled={isStartingCheckout} onClick={handleUpgrade}>
            {isStartingCheckout ? 'Opening checkout…' : 'Upgrade to Pro'}
          </button>
          {error && <p className="field-error" role="alert">{error}</p>}
        </article>
      </div>
    </section>
  )
}

export default PricingPage
