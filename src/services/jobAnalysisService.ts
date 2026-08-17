import { mockJobAnalysis } from '../mocks/jobAnalysis'
import type { JobAnalysis } from '../types/jobAnalysis'
import type { JobDescriptionInput } from '../types/jobApplication'

export async function analyzeJob(input: JobDescriptionInput): Promise<JobAnalysis> {
  return Promise.resolve({
    ...mockJobAnalysis,
    companyName: input.companyName.trim(),
    jobTitle: input.jobTitle.trim(),
  })
}
