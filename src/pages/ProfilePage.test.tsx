// @vitest-environment happy-dom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getProfile, saveProfile } from '../services/persistenceService'
import ProfilePage from './ProfilePage'

vi.mock('../services/persistenceService', () => ({
  getProfile: vi.fn(),
  saveProfile: vi.fn(),
}))

const mockedGetProfile = vi.mocked(getProfile)
const mockedSaveProfile = vi.mocked(saveProfile)

beforeEach(() => {
  mockedGetProfile.mockResolvedValue(null)
  mockedSaveProfile.mockResolvedValue()
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('ProfilePage', () => {
  it('saves the candidate profile and confirms success', async () => {
    const user = userEvent.setup()
    render(<ProfilePage />)

    await user.type(screen.getByLabelText('Full name'), 'Test Candidate')
    await user.type(screen.getByLabelText('Email'), 'candidate@example.com')
    await user.type(
      screen.getByLabelText('Professional summary'),
      'Frontend developer',
    )
    await user.type(
      screen.getByLabelText('Resume text'),
      'React and TypeScript experience.',
    )
    await user.click(screen.getByRole('button', { name: 'Save profile' }))

    expect((await screen.findByRole('status')).textContent).toContain('Profile saved.')
    expect(mockedSaveProfile).toHaveBeenCalledWith({
      fullName: 'Test Candidate',
      email: 'candidate@example.com',
      professionalSummary: 'Frontend developer',
      resumeText: 'React and TypeScript experience.',
    })
  })

  it('shows a save error without claiming success', async () => {
    mockedSaveProfile.mockRejectedValue(new Error('Save failed'))
    const user = userEvent.setup()
    render(<ProfilePage />)

    await user.type(screen.getByLabelText('Full name'), 'Test Candidate')
    await user.type(screen.getByLabelText('Email'), 'candidate@example.com')
    await user.type(screen.getByLabelText('Resume text'), 'React experience.')
    await user.click(screen.getByRole('button', { name: 'Save profile' }))

    expect((await screen.findByRole('alert')).textContent).toContain(
      'Your profile could not be saved.',
    )
    expect(screen.queryByRole('status')).toBeNull()
  })
})
