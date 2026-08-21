import type {
  InterviewPrep,
  InterviewPrepQuestion,
  JobAnalysis,
} from '../../../src/types/jobAnalysis'
import type { ImportedJobDetails } from '../../../src/types/jobApplication'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isNonEmptyString)
}

function isInterviewQuestion(value: unknown): value is InterviewPrepQuestion {
  if (!isRecord(value)) return false
  return isNonEmptyString(value.question)
    && isStringArray(value.answerFocus)
    && value.answerFocus.length >= 2
    && value.answerFocus.length <= 4
}

function isQuestionArray(
  value: unknown,
  expectedLength: number,
): value is InterviewPrepQuestion[] {
  return Array.isArray(value)
    && value.length === expectedLength
    && value.every(isInterviewQuestion)
    && new Set(value.map((item) => item.question.trim())).size === value.length
}

const chineseSectionHeadings = new Set([
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

function isSectionHeading(value: string) {
  const heading = value.trim()
  return chineseSectionHeadings.has(heading.replace(/:$/, ''))
    || (heading.length > 0
    && heading.length <= 60
    && heading === heading.toUpperCase()
    && /[A-Z]/.test(heading))
}

export function hasProfessionalSummary(tailoredResume: string) {
  const lines = tailoredResume.trim().split('\n')
  const headingIndex = lines.findIndex(
    (line) => ['PROFESSIONAL SUMMARY', '专业摘要'].includes(
      line.trim().replace(/:$/, ''),
    ),
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

export function parseTailoredResume(content: string): string {
  let value: unknown

  try {
    value = JSON.parse(content)
  } catch {
    throw new Error('DeepSeek returned invalid JSON.')
  }

  if (!isRecord(value) || !isNonEmptyString(value.tailoredResume)) {
    throw new Error('DeepSeek returned an empty tailored resume.')
  }

  return value.tailoredResume.trim()
}

export function parseImportedJobDetails(content: string): ImportedJobDetails {
  let value: unknown

  try {
    value = JSON.parse(content)
  } catch {
    throw new Error('DeepSeek returned invalid JSON.')
  }

  if (
    !isRecord(value)
    || !isNonEmptyString(value.companyName)
    || !isNonEmptyString(value.jobTitle)
    || !isNonEmptyString(value.jobDescription)
  ) {
    throw new Error('DeepSeek returned incomplete job details.')
  }

  return {
    companyName: value.companyName.trim(),
    jobTitle: value.jobTitle.trim(),
    jobDescription: value.jobDescription.trim(),
  }
}

export function parseInterviewPrep(content: string): InterviewPrep {
  let value: unknown

  try {
    value = JSON.parse(content)
  } catch {
    throw new Error('DeepSeek returned invalid JSON.')
  }

  if (
    !isRecord(value)
    || !isQuestionArray(value.technicalQuestions, 5)
    || !isQuestionArray(value.behavioralQuestions, 3)
  ) {
    throw new Error('DeepSeek returned invalid interview preparation.')
  }

  return {
    technicalQuestions: value.technicalQuestions.map((item) => ({
      question: item.question.trim(),
      answerFocus: item.answerFocus.map((focus) => focus.trim()),
    })),
    behavioralQuestions: value.behavioralQuestions.map((item) => ({
      question: item.question.trim(),
      answerFocus: item.answerFocus.map((focus) => focus.trim()),
    })),
  }
}
