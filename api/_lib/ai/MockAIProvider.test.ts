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
      outputLanguage: 'en',
      tailoredResume: `PROFESSIONAL SUMMARY
React and TypeScript experience.

TARGET ROLE
Frontend Developer at Northstar Labs`,
    })
  })

  it('returns Chinese mock content when requested', async () => {
    const result = await new MockAIProvider().analyze({
      companyName: 'Northstar Labs',
      jobTitle: 'Frontend Developer',
      jobDescription: 'Build accessible React applications.',
      resumeText: 'React and TypeScript experience.',
      outputLanguage: 'zh',
    })

    expect(result.outputLanguage).toBe('zh')
    expect(result.scoreSummary).toBe('模拟匹配结果')
    expect(result.tailoredResume).toContain('专业摘要')
    expect(result.coverLetter).toContain('尊敬的招聘经理')
  })

  it('returns a refreshed tailored resume without returning a full analysis', async () => {
    const currentTailoredResume = `PROFESSIONAL SUMMARY
Existing resume draft.`
    const result = await new MockAIProvider().regenerateResume({
      companyName: 'Northstar Labs',
      jobTitle: 'Frontend Developer',
      jobDescription: 'Build accessible React applications.',
      resumeText: 'React and TypeScript experience.',
      currentTailoredResume,
      outputLanguage: 'en',
    })

    expect(result).toContain('PROFESSIONAL SUMMARY')
    expect(result).toContain('Frontend Developer role at Northstar Labs')
    expect(result).not.toBe(currentTailoredResume)
  })

  it('returns stable imported job details for local development', async () => {
    const result = await new MockAIProvider().extractJobDetails({
      sourceUrl: 'https://jobs.example.com/frontend-developer',
      pageText: 'Public job listing text.',
    })

    expect(result).toEqual({
      companyName: 'Northstar Labs',
      jobTitle: 'Frontend Developer',
      jobDescription: 'Public job listing text.',
    })
  })
})
