import type { JobAnalysis } from '../../../src/types/jobAnalysis'
import type { JobDescriptionInput } from '../../../src/types/jobApplication'

export interface AIProvider {
  analyze(input: JobDescriptionInput): Promise<JobAnalysis>
}
