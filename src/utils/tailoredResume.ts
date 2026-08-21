export function isSectionHeading(value: string) {
  const heading = value.trim()
  return heading.length > 0
    && heading.length <= 60
    && heading === heading.toUpperCase()
    && /[A-Z]/.test(heading)
}

export function withProfessionalSummary(content: string, professionalSummary: string) {
  const fallbackSummary = professionalSummary.trim()
  if (!fallbackSummary) return content

  const lines = content.trim().split('\n')
  const summaryHeadingIndex = lines.findIndex(
    (line) => line.trim().replace(/:$/, '') === 'PROFESSIONAL SUMMARY',
  )

  if (summaryHeadingIndex === -1) {
    return `PROFESSIONAL SUMMARY\n${fallbackSummary}\n\n${content.trim()}`
  }

  const nextHeadingIndex = lines.findIndex(
    (line, index) => index > summaryHeadingIndex && isSectionHeading(line),
  )
  const summarySectionEnd = nextHeadingIndex === -1 ? lines.length : nextHeadingIndex
  const hasGeneratedSummary = lines
    .slice(summaryHeadingIndex + 1, summarySectionEnd)
    .some((line) => line.trim().length > 0)

  if (hasGeneratedSummary) return content

  lines.splice(summaryHeadingIndex + 1, 0, fallbackSummary)
  return lines.join('\n')
}
