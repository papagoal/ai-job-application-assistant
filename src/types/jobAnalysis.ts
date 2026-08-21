import type { AIOutputLanguage, DeepSeekModel } from './jobApplication'

export interface InterviewPrepQuestion {
  question: string
  answerFocus: string[]
}

export interface InterviewPrep {
  technicalQuestions: InterviewPrepQuestion[]
  behavioralQuestions: InterviewPrepQuestion[]
}

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
  outputLanguage?: AIOutputLanguage
  aiModel?: DeepSeekModel
  interviewPrep?: InterviewPrep
}
