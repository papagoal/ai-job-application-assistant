import { describe, expect, it } from 'vitest'
import { mockJobAnalysis } from '../../../src/mocks/jobAnalysis'
import { parseJobAnalysis } from './parseJobAnalysis'

describe('parseJobAnalysis', () => {
  it('parses a complete analysis response', () => {
    expect(parseJobAnalysis(JSON.stringify(mockJobAnalysis))).toEqual(mockJobAnalysis)
  })

  it.each([0, 100])('accepts the boundary match score %i', (matchScore) => {
    const content = JSON.stringify({ ...mockJobAnalysis, matchScore })

    expect(parseJobAnalysis(content).matchScore).toBe(matchScore)
  })

  it.each([-1, 101])('rejects the out-of-range match score %i', (matchScore) => {
    const content = JSON.stringify({ ...mockJobAnalysis, matchScore })

    expect(() => parseJobAnalysis(content)).toThrow(
      'DeepSeek returned an analysis with missing fields.',
    )
  })

  it('rejects invalid JSON', () => {
    expect(() => parseJobAnalysis('{not-json')).toThrow(
      'DeepSeek returned invalid JSON.',
    )
  })

  it('rejects a response with missing fields', () => {
    const content = JSON.stringify({
      companyName: mockJobAnalysis.companyName,
      jobTitle: mockJobAnalysis.jobTitle,
      matchScore: mockJobAnalysis.matchScore,
    })

    expect(() => parseJobAnalysis(content)).toThrow(
      'DeepSeek returned an analysis with missing fields.',
    )
  })

  it('rejects empty entries in string arrays', () => {
    const content = JSON.stringify({
      ...mockJobAnalysis,
      matchingSkills: ['React', ''],
    })

    expect(() => parseJobAnalysis(content)).toThrow(
      'DeepSeek returned an analysis with missing fields.',
    )
  })
})
