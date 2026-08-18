import { describe, expect, it } from 'vitest'
import { mockJobAnalysis } from '../../../src/mocks/jobAnalysis'
import type { JobDescriptionInput } from '../../../src/types/jobApplication'
import { MockAIProvider } from './MockAIProvider'

describe('MockAIProvider', () => {
  it('returns a stable analysis with the supplied company and job title', async () => {
    const input: JobDescriptionInput = {
      companyName: '  Northstar Labs  ',
      jobTitle: '  Frontend Developer  ',
      jobDescription: 'Build accessible React applications.',
      resumeText: 'React and TypeScript experience.',
    }

    const result = await new MockAIProvider().analyze(input)

    expect(result).toEqual({
      ...mockJobAnalysis,
      companyName: 'Northstar Labs',
      jobTitle: 'Frontend Developer',
      tailoredResume: `React and TypeScript experience.

TARGET ROLE
Frontend Developer at Northstar Labs`,
    })
  })
})
