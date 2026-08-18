import { mockJobAnalysis } from '../../../src/mocks/jobAnalysis.js'
import type { JobAnalysis } from '../../../src/types/jobAnalysis'
import type { JobDescriptionInput } from '../../../src/types/jobApplication'
import type { AIProvider } from './AIProvider'

export class MockAIProvider implements AIProvider {
  analyze(input: JobDescriptionInput): Promise<JobAnalysis> {
    const companyName = input.companyName.trim()
    const jobTitle = input.jobTitle.trim()

    return Promise.resolve({
      ...mockJobAnalysis,
      companyName,
      jobTitle,
      tailoredResume: `${input.resumeText.trim()}\n\nTARGET ROLE\n${jobTitle} at ${companyName}`,
    })
  }
}
