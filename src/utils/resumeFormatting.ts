export interface ResumeContentBlock {
  type: 'heading' | 'subheading' | 'paragraph' | 'bullet'
  text: string
}

const chineseResumeSectionHeadings = new Set([
  '专业摘要',
  '核心技能',
  '技术技能',
  '专业技能',
  '技能专长',
  '工作经历',
  '工作经验',
  '职业经历',
  '项目经历',
  '项目经验',
  '教育背景',
  '教育经历',
  '证书与认证',
  '语言能力',
  '目标职位',
])

const inlineBulletPattern = /\s+-\s+(?=(?:Achieved|Added|Administered|Analyzed|Architected|Automated|Built|Collaborated|Configured|Contributed|Created|Delivered|Designed|Developed|Directed|Drove|Enhanced|Established|Expanded|Generated|Implemented|Improved|Increased|Integrated|Introduced|Launched|Led|Maintained|Managed|Mentored|Migrated|Modernized|Optimized|Owned|Partnered|Produced|Reduced|Refactored|Researched|Resolved|Secured|Shipped|Simplified|Spearheaded|Streamlined|Supported|Tested|Translated|Used|Validated|Worked)\b)/gi

export function isResumeSectionHeading(value: string) {
  const heading = value.trim()
  return chineseResumeSectionHeadings.has(heading.replace(/:$/, ''))
    || (heading.length > 0
    && heading.length <= 60
    && heading === heading.toUpperCase()
    && /[A-Z]/.test(heading))
}

function isResumeEntryHeading(value: string) {
  return (value.match(/\s\|\s/g)?.length ?? 0) >= 2
}

function expandInlineBullets(line: string) {
  const parts = line.split(inlineBulletPattern).map((part) => part.trim()).filter(Boolean)
  if (parts.length <= 1) return [line]

  return [parts[0], ...parts.slice(1).map((part) => `- ${part}`)]
}

export function toResumeContentBlocks(content: string): ResumeContentBlock[] {
  const blocks: ResumeContentBlock[] = []
  let paragraphLines: string[] = []

  const flushParagraph = () => {
    if (!paragraphLines.length) return
    blocks.push({ type: 'paragraph', text: paragraphLines.join(' ') })
    paragraphLines = []
  }

  for (const rawLine of content.trim().split('\n')) {
    const trimmedLine = rawLine.trim()
    if (!trimmedLine) {
      flushParagraph()
      continue
    }

    for (const line of expandInlineBullets(trimmedLine)) {
      if (isResumeSectionHeading(line)) {
        flushParagraph()
        blocks.push({ type: 'heading', text: line })
      } else if (/^[-*•]\s+/.test(line)) {
        flushParagraph()
        blocks.push({ type: 'bullet', text: line.replace(/^[-*•]\s+/, '') })
      } else if (isResumeEntryHeading(line)) {
        flushParagraph()
        blocks.push({ type: 'subheading', text: line })
      } else {
        paragraphLines.push(line)
      }
    }
  }

  flushParagraph()
  return blocks
}
