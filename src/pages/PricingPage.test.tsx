// @vitest-environment happy-dom

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { loadBillingStatus } from '../services/billingService'
import PricingPage from './PricingPage'

vi.mock('../services/billingService', () => ({
  loadBillingStatus: vi.fn(),
  openCustomerPortal: vi.fn(),
  startProCheckout: vi.fn(),
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('PricingPage', () => {
  it('offers subscription management to Pro users instead of another checkout', async () => {
    vi.mocked(loadBillingStatus).mockResolvedValue({
      plan: 'pro',
      subscriptionStatus: 'active',
      used: 0,
      limit: 50,
      remaining: 50,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    })

    render(<MemoryRouter><PricingPage /></MemoryRouter>)

    expect(await screen.findByRole('button', { name: 'Manage subscription' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Upgrade to Pro' })).toBeNull()
  })
})
