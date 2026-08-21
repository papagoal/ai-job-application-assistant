import { describe, expect, it } from 'vitest'
import { withProfessionalSummary } from './tailoredResume'

describe('withProfessionalSummary', () => {
  const profileSummary = 'Full-stack developer focused on reliable product delivery.'

  it('fills an empty generated professional summary from the profile', () => {
    const resume = `PROFESSIONAL SUMMARY

TECHNICAL SKILLS
React, TypeScript`

    expect(withProfessionalSummary(resume, profileSummary)).toContain(
      `PROFESSIONAL SUMMARY\n${profileSummary}\n\nTECHNICAL SKILLS`,
    )
  })

  it('does not duplicate an existing generated professional summary', () => {
    const resume = `PROFESSIONAL SUMMARY
Existing tailored summary.

TECHNICAL SKILLS
React, TypeScript`

    expect(withProfessionalSummary(resume, profileSummary)).toBe(resume)
  })

  it('adds the profile summary when the generated resume omits the section', () => {
    const resume = `TECHNICAL SKILLS
React, TypeScript`

    expect(withProfessionalSummary(resume, profileSummary)).toBe(
      `PROFESSIONAL SUMMARY\n${profileSummary}\n\n${resume}`,
    )
  })
})
