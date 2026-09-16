// @vitest-environment happy-dom

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import LandingPage from './LandingPage'

afterEach(cleanup)

describe('LandingPage', () => {
  it('explains the product and offers one primary starting action', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', {
      name: 'Turn every job posting into a stronger application.',
      level: 1,
    })).toBeTruthy()
    expect(screen.getAllByRole('link', { name: 'Try RoleLumi free' })).toHaveLength(1)
    expect(screen.getByRole('link', { name: 'Try RoleLumi free' }).getAttribute('href'))
      .toBe('/applications/new')
    expect(screen.getAllByRole('link', { name: 'Open workspace' })[0]?.getAttribute('href'))
      .toBe('/dashboard')
  })

  it('presents the workflow and core product capabilities', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Add the role' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'See your match' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Prepare to apply' })).toBeTruthy()
    expect(screen.getByText('Match analysis')).toBeTruthy()
    expect(screen.getByText('Tailored resume')).toBeTruthy()
    expect(screen.getByText('Application writing')).toBeTruthy()
    expect(screen.getByText('Job tracker')).toBeTruthy()
  })
})
