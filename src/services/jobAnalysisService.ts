import type {
  InterviewPrep,
  InterviewPrepQuestion,
  JobAnalysis,
} from '../types/jobAnalysis'
import type {
  ImportedJobDetails,
  JobDescriptionInput,
  ResumeRegenerationInput,
} from '../types/jobApplication'
import { getAccessToken } from './authService'

export class JobAnalysisApiError extends Error {
  status: number
  code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

async function apiHeaders() {
  const token = await getAccessToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function requireOk(response: Response, fallbackMessage: string) {
  if (response.ok) return
  const result = await response.json().catch(() => ({})) as { code?: string; error?: string }
  throw new JobAnalysisApiError(
    response.status,
    result.code ?? 'request_failed',
    result.error ?? fallbackMessage,
  )
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isInterviewQuestion(value: unknown): value is InterviewPrepQuestion {
  if (typeof value !== 'object' || value === null) return false
  const question = value as Record<string, unknown>
  return isNonEmptyString(question.question)
    && Array.isArray(question.answerFocus)
    && question.answerFocus.length >= 2
    && question.answerFocus.length <= 4
    && question.answerFocus.every(isNonEmptyString)
}

function isInterviewPrep(value: unknown): value is InterviewPrep {
  if (typeof value !== 'object' || value === null) return false
  const prep = value as Record<string, unknown>
  return Array.isArray(prep.technicalQuestions)
    && prep.technicalQuestions.length === 5
    && prep.technicalQuestions.every(isInterviewQuestion)
    && Array.isArray(prep.behavioralQuestions)
    && prep.behavioralQuestions.length === 3
    && prep.behavioralQuestions.every(isInterviewQuestion)
}

export async function importJobDetails(url: string): Promise<ImportedJobDetails> {
  const response = await fetch('/api/import-job', {
    method: 'POST',
    headers: await apiHeaders(),
    body: JSON.stringify({ url }),
  })

  await requireOk(response, `Job import failed with status ${response.status}.`)

  const result = (await response.json()) as Record<string, unknown>
  if (
    !isNonEmptyString(result.companyName)
    || !isNonEmptyString(result.jobTitle)
    || !isNonEmptyString(result.jobDescription)
  ) {
    throw new Error('Job import returned incomplete details.')
  }

  return {
    companyName: result.companyName.trim(),
    jobTitle: result.jobTitle.trim(),
    jobDescription: result.jobDescription.trim(),
  }
}

export async function generateInterviewPrep(
  input: JobDescriptionInput,
): Promise<InterviewPrep> {
  const response = await fetch('/api/generate-interview-prep', {
    method: 'POST',
    headers: await apiHeaders(),
    body: JSON.stringify(input),
  })

  await requireOk(response, `Interview preparation failed with status ${response.status}.`)

  const result = (await response.json()) as unknown
  if (!isInterviewPrep(result)) {
    throw new Error('Interview preparation returned an invalid result.')
  }

  return result
}

export async function analyzeJob(input: JobDescriptionInput): Promise<JobAnalysis> {
  const response = await fetch('/api/analyze-job', {
    method: 'POST',
    headers: await apiHeaders(),
    body: JSON.stringify(input),
  })

  await requireOk(response, `Analysis request failed with status ${response.status}.`)

  return (await response.json()) as JobAnalysis
}

export async function regenerateTailoredResume(
  input: ResumeRegenerationInput,
): Promise<string> {
  const response = await fetch('/api/regenerate-resume', {
    method: 'POST',
    headers: await apiHeaders(),
    body: JSON.stringify(input),
  })

  await requireOk(response, `Resume regeneration failed with status ${response.status}.`)

  const result = (await response.json()) as { tailoredResume?: unknown }
  if (typeof result.tailoredResume !== 'string' || !result.tailoredResume.trim()) {
    throw new Error('Resume regeneration returned an empty result.')
  }

  return result.tailoredResume.trim()
}
