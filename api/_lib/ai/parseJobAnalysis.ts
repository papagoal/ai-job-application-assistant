import type { JobAnalysis } from '../../../src/types/jobAnalysis'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isNonEmptyString)
}

function isSectionHeading(value: string) {
  const heading = value.trim()
  return heading.length > 0
    && heading.length <= 60
    && heading === heading.toUpperCase()
    && /[A-Z]/.test(heading)
}

export function hasProfessionalSummary(tailoredResume: string) {
  const lines = tailoredResume.trim().split('\n')
  const headingIndex = lines.findIndex(
    (line) => line.trim().replace(/:$/, '') === 'PROFESSIONAL SUMMARY',
  )
  if (headingIndex === -1) return false

  const nextHeadingIndex = lines.findIndex(
    (line, index) => index > headingIndex && isSectionHeading(line),
  )
  const sectionEnd = nextHeadingIndex === -1 ? lines.length : nextHeadingIndex

  return lines
    .slice(headingIndex + 1, sectionEnd)
    .some((line) => line.trim().length > 0)
}

export function parseJobAnalysis(content: string): JobAnalysis {
  let value: unknown

  try {
    value = JSON.parse(content)
  } catch {
    throw new Error('DeepSeek returned invalid JSON.')
  }

  if (!isRecord(value)) throw new Error('DeepSeek returned an invalid analysis object.')

  const isValid =
    isNonEmptyString(value.companyName) &&
    isNonEmptyString(value.jobTitle) &&
    typeof value.matchScore === 'number' &&
    Number.isFinite(value.matchScore) &&
    value.matchScore >= 0 &&
    value.matchScore <= 100 &&
    isNonEmptyString(value.scoreSummary) &&
    isNonEmptyString(value.scoreDescription) &&
    isStringArray(value.matchingSkills) &&
    isStringArray(value.missingSkills) &&
    isStringArray(value.suggestions) &&
    isNonEmptyString(value.coverLetter) &&
    isNonEmptyString(value.tailoredResume)

  if (!isValid) throw new Error('DeepSeek returned an analysis with missing fields.')

  return value as unknown as JobAnalysis
}
