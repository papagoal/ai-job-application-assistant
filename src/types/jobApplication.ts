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
