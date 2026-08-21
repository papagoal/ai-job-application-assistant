import { describe, expect, it } from 'vitest'
import { mockJobAnalysis } from '../../../src/mocks/jobAnalysis'
import { hasProfessionalSummary, parseJobAnalysis } from './parseJobAnalysis'

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

  it('rejects a response without a tailored resume', () => {
    const analysisWithoutTailoredResume = { ...mockJobAnalysis }
    delete analysisWithoutTailoredResume.tailoredResume

    expect(() => parseJobAnalysis(JSON.stringify(analysisWithoutTailoredResume))).toThrow(
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

describe('hasProfessionalSummary', () => {
  it('accepts a populated professional summary section', () => {
    expect(hasProfessionalSummary(`PROFESSIONAL SUMMARY
Frontend developer aligned with this role.

SKILLS
React`)).toBe(true)
  })

  it.each([
    `PROFESSIONAL SUMMARY

SKILLS
React`,
    `SKILLS
React`,
  ])('rejects a missing or empty professional summary', (tailoredResume) => {
    expect(hasProfessionalSummary(tailoredResume)).toBe(false)
  })

  it('accepts a non-empty Chinese professional summary', () => {
    expect(hasProfessionalSummary(`专业摘要
具备 React 与 TypeScript 项目经验。

技术技能
React`)).toBe(true)
  })
})
