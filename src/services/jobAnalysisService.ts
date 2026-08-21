import type { JobAnalysis } from '../types/jobAnalysis'
import type {
  JobDescriptionInput,
  ResumeRegenerationInput,
} from '../types/jobApplication'

export async function analyzeJob(input: JobDescriptionInput): Promise<JobAnalysis> {
  const response = await fetch('/api/analyze-job', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    throw new Error(`Analysis request failed with status ${response.status}.`)
  }

  return (await response.json()) as JobAnalysis
}

export async function regenerateTailoredResume(
  input: ResumeRegenerationInput,
): Promise<string> {
  const response = await fetch('/api/regenerate-resume', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    throw new Error(`Resume regeneration failed with status ${response.status}.`)
  }

  const result = (await response.json()) as { tailoredResume?: unknown }
  if (typeof result.tailoredResume !== 'string' || !result.tailoredResume.trim()) {
    throw new Error('Resume regeneration returned an empty result.')
  }

  return result.tailoredResume.trim()
}
