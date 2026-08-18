export type ApplicationStatus = 'Draft' | 'Applied' | 'Interview'

export interface ApplicationSummary {
  id: string
  companyName: string
  jobTitle: string
  matchScore: number
  status: ApplicationStatus
  createdAt: string
}

export interface SavedApplication extends ApplicationSummary {
  analysis: import('./jobAnalysis').JobAnalysis
  jobDescription: string
  resumeText: string
}
