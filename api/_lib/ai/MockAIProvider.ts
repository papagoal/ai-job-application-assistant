import { mockJobAnalysis } from '../../../src/mocks/jobAnalysis.js'
import type { JobAnalysis } from '../../../src/types/jobAnalysis'
import type { JobDescriptionInput } from '../../../src/types/jobApplication'
import type { AIProvider } from './AIProvider'

export class MockAIProvider implements AIProvider {
  analyze(input: JobDescriptionInput): Promise<JobAnalysis> {
    return Promise.resolve({
      ...mockJobAnalysis,
      companyName: input.companyName.trim(),
      jobTitle: input.jobTitle.trim(),
    })
  }
}
