import { describe, expect, it } from 'vitest'
import { toResumeContentBlocks } from './resumeFormatting'

describe('toResumeContentBlocks', () => {
  it('separates inline experience bullets without splitting date ranges', () => {
    const blocks = toResumeContentBlocks(`EXPERIENCE
Independent Software Projects | Toronto, ON | Nov 2023 - Present - Built and shipped web applications. - Designed responsive interfaces.
AIRM Consulting Ltd. | Winnipeg, MB | Jun 2019 - Oct 2023 Software Developer - Developed full-stack features. - Added automated tests.`)

    expect(blocks).toEqual([
      { type: 'heading', text: 'EXPERIENCE' },
      {
        type: 'subheading',
        text: 'Independent Software Projects | Toronto, ON | Nov 2023 - Present',
      },
      { type: 'bullet', text: 'Built and shipped web applications.' },
      { type: 'bullet', text: 'Designed responsive interfaces.' },
      {
        type: 'subheading',
        text: 'AIRM Consulting Ltd. | Winnipeg, MB | Jun 2019 - Oct 2023 Software Developer',
      },
      { type: 'bullet', text: 'Developed full-stack features.' },
      { type: 'bullet', text: 'Added automated tests.' },
    ])
  })

  it('keeps ordinary wrapped prose together', () => {
    expect(toResumeContentBlocks(`PROFESSIONAL SUMMARY
Frontend developer with practical React experience
and a focus on accessible interfaces.`)).toEqual([
      { type: 'heading', text: 'PROFESSIONAL SUMMARY' },
      {
        type: 'paragraph',
        text: 'Frontend developer with practical React experience and a focus on accessible interfaces.',
      },
    ])
  })
})
