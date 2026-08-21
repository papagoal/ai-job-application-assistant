import type { JobAnalysis } from '../../../src/types/jobAnalysis'
import type {
  JobDescriptionInput,
  ResumeRegenerationInput,
} from '../../../src/types/jobApplication'

export interface AIProvider {
  analyze(input: JobDescriptionInput): Promise<JobAnalysis>
  regenerateResume(input: ResumeRegenerationInput): Promise<string>
}
