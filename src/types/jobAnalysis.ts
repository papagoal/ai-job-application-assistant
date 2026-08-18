export interface JobAnalysis {
  companyName: string
  jobTitle: string
  matchScore: number
  scoreSummary: string
  scoreDescription: string
  matchingSkills: string[]
  missingSkills: string[]
  suggestions: string[]
  coverLetter: string
  tailoredResume?: string
}
