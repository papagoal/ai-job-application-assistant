import type { InterviewPrep, JobAnalysis } from '../../../src/types/jobAnalysis'
import type {
  ImportedJobDetails,
  JobDetailsExtractionInput,
  JobDescriptionInput,
  ResumeRegenerationInput,
} from '../../../src/types/jobApplication'

export interface AIProvider {
  analyze(input: JobDescriptionInput): Promise<JobAnalysis>
  regenerateResume(input: ResumeRegenerationInput): Promise<string>
  extractJobDetails(input: JobDetailsExtractionInput): Promise<ImportedJobDetails>
  generateInterviewPrep(input: JobDescriptionInput): Promise<InterviewPrep>
}
