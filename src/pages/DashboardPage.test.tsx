// @vitest-environment happy-dom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { mockJobAnalysis } from '../mocks/jobAnalysis'
import { getApplications } from '../services/persistenceService'
import type { SavedApplication } from '../types/application'
import DashboardPage from './DashboardPage'

vi.mock('../services/persistenceService', () => ({
  getApplications: vi.fn(),
}))

const mockedGetApplications = vi.mocked(getApplications)

const applications: SavedApplication[] = [
  {
    id: 'northstar-frontend',
    companyName: 'Northstar Labs',
    jobTitle: 'Frontend Developer',
    matchScore: 82,
    status: 'Draft',
    createdAt: 'Aug 15, 2026',
    analysis: mockJobAnalysis,
    jobDescription: 'React role',
    resumeText: 'React resume',
    notes: 'Follow up with Jane next Tuesday about the technical interview.',
  },
  {
    id: 'acme-react',
    companyName: 'Acme Studio',
    jobTitle: 'React Developer',
    matchScore: 74,
    status: 'Applied',
    createdAt: 'Aug 12, 2026',
    analysis: mockJobAnalysis,
    jobDescription: 'React role',
    resumeText: 'React resume',
    notes: '',
  },
  {
    id: 'pixelworks-ui',
    companyName: 'Pixelworks',
    jobTitle: 'UI Engineer',
    matchScore: 91,
    status: 'Interview',
    createdAt: 'Aug 8, 2026',
    analysis: mockJobAnalysis,
    jobDescription: 'UI role',
    resumeText: 'UI resume',
    notes: '',
  },
]

function renderPage() {
  render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  mockedGetApplications.mockResolvedValue(applications)
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('DashboardPage', () => {
  it('searches and filters saved applications', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Northstar Labs')
    expect(screen.getByText('Showing 3 of 3')).toBeTruthy()

    await user.type(screen.getByLabelText('Search applications'), 'Acme')

    expect(screen.getByText('Acme Studio')).toBeTruthy()
    expect(screen.getByText('Showing 1 of 3')).toBeTruthy()
    expect(screen.queryByText('Northstar Labs')).toBeNull()
    expect(screen.queryByText('Pixelworks')).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Clear' }))
    await user.click(screen.getByRole('button', { name: 'Applied' }))

    expect(screen.getByText('Acme Studio')).toBeTruthy()
    expect(screen.queryByText('Northstar Labs')).toBeNull()
    expect(screen.queryByText('Pixelworks')).toBeNull()
  })

  it('sorts applications by highest match score', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Northstar Labs')

    await user.selectOptions(screen.getByLabelText('Sort by'), 'highest-match')

    const cards = screen.getAllByRole('article')
    expect(cards.map((card) => card.querySelector('.company-name')?.textContent)).toEqual([
      'Pixelworks',
      'Northstar Labs',
      'Acme Studio',
    ])
  })

  it('switches between card and concise table views', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Northstar Labs')

    await user.click(screen.getByRole('button', { name: 'Table view' }))

    expect(screen.getByRole('region', { name: 'Application table' })).toBeTruthy()
    expect(screen.getByRole('columnheader', { name: 'Company' })).toBeTruthy()
    expect(screen.getByRole('columnheader', { name: 'Position' })).toBeTruthy()
    expect(screen.getByRole('columnheader', { name: 'Status' })).toBeTruthy()
    expect(screen.getByRole('columnheader', { name: 'Date' })).toBeTruthy()
    expect(screen.getByRole('columnheader', { name: 'Notes' })).toBeTruthy()
    expect(screen.getByText(/Follow up with Jane/)).toBeTruthy()
    expect(screen.queryAllByRole('article')).toHaveLength(0)

    await user.click(screen.getByRole('button', { name: 'Card view' }))
    expect(screen.getAllByRole('article')).toHaveLength(3)
    expect(screen.queryByRole('region', { name: 'Application table' })).toBeNull()
  })
})
