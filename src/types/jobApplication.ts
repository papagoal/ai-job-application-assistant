export type AIOutputLanguage = 'en' | 'zh'

export interface JobDescriptionInput {
  companyName: string
  jobTitle: string
  jobDescription: string
  resumeText: string
  outputLanguage?: AIOutputLanguage
}

export interface ResumeRegenerationInput extends JobDescriptionInput {
  currentTailoredResume: string
}

export interface JobDetailsExtractionInput {
  sourceUrl: string
  pageText: string
}

export interface ImportedJobDetails {
  companyName: string
  jobTitle: string
  jobDescription: string
}
