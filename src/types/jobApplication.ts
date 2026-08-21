export type AIOutputLanguage = 'en' | 'zh'
export type DeepSeekModel = 'deepseek-v4-flash' | 'deepseek-v4-pro'

export interface JobDescriptionInput {
  companyName: string
  jobTitle: string
  jobDescription: string
  resumeText: string
  outputLanguage?: AIOutputLanguage
  aiModel?: DeepSeekModel
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
