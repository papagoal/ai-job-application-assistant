import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockJobAnalysis } from '../../../src/mocks/jobAnalysis'
import type { JobDescriptionInput } from '../../../src/types/jobApplication'
import { DeepSeekProvider } from './DeepSeekProvider'

const input: JobDescriptionInput = {
  companyName: 'Northstar Labs',
  jobTitle: 'Frontend Developer',
  jobDescription: 'Build accessible React applications.',
  resumeText: 'React and TypeScript experience.',
}

function completion(analysis: typeof mockJobAnalysis) {
  return new Response(JSON.stringify({
    choices: [{ message: { content: JSON.stringify(analysis) } }],
  }))
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('DeepSeekProvider', () => {
  it('returns the first response when it contains an AI-written summary', async () => {
    const fetchMock = vi.fn().mockResolvedValue(completion(mockJobAnalysis))
    vi.stubGlobal('fetch', fetchMock)

    const result = await new DeepSeekProvider('test-key').analyze(input)

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(result.tailoredResume).toContain('Frontend developer experienced')
  })

  it('asks DeepSeek to correct an empty professional summary once', async () => {
    const emptySummary = {
      ...mockJobAnalysis,
      tailoredResume: `PROFESSIONAL SUMMARY

SKILLS
React`,
    }
    const correctedSummary = {
      ...mockJobAnalysis,
      tailoredResume: `PROFESSIONAL SUMMARY
Frontend developer whose React experience aligns with this role.

SKILLS
React`,
    }
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(completion(emptySummary))
      .mockResolvedValueOnce(completion(correctedSummary))
    vi.stubGlobal('fetch', fetchMock)

    const result = await new DeepSeekProvider('test-key').analyze(input)

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(result.tailoredResume).toContain('aligns with this role')
    const retryRequest = JSON.parse(
      String(fetchMock.mock.calls[1]?.[1]?.body),
    ) as { messages: Array<{ content: string }> }
    expect(retryRequest.messages.at(-1)?.content).toContain(
      'two or three newly written sentences tailored to the supplied job description',
    )
  })

  it('rejects a second response that still has no professional summary', async () => {
    const emptySummary = {
      ...mockJobAnalysis,
      tailoredResume: `PROFESSIONAL SUMMARY

SKILLS
React`,
    }
    vi.stubGlobal('fetch', vi.fn().mockImplementation(
      () => Promise.resolve(completion(emptySummary)),
    ))

    await expect(new DeepSeekProvider('test-key').analyze(input)).rejects.toThrow(
      'DeepSeek returned a tailored resume without a professional summary.',
    )
  })
})
