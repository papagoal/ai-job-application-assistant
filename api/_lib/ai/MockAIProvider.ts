import { mockJobAnalysis } from '../../../src/mocks/jobAnalysis.js'
import type { JobAnalysis } from '../../../src/types/jobAnalysis'
import type {
  ImportedJobDetails,
  JobDetailsExtractionInput,
  JobDescriptionInput,
  ResumeRegenerationInput,
} from '../../../src/types/jobApplication'
import type { AIProvider } from './AIProvider'

export class MockAIProvider implements AIProvider {
  analyze(input: JobDescriptionInput): Promise<JobAnalysis> {
    const companyName = input.companyName.trim()
    const jobTitle = input.jobTitle.trim()
    const outputLanguage = input.outputLanguage ?? 'en'
    const tailoredResume = outputLanguage === 'zh'
      ? `专业摘要\n${input.resumeText.trim()}\n\n目标职位\n${companyName} ${jobTitle}`
      : `PROFESSIONAL SUMMARY\n${input.resumeText.trim()}\n\nTARGET ROLE\n${jobTitle} at ${companyName}`

    return Promise.resolve({
      ...mockJobAnalysis,
      companyName,
      jobTitle,
      scoreSummary: outputLanguage === 'zh' ? '模拟匹配结果' : mockJobAnalysis.scoreSummary,
      scoreDescription: outputLanguage === 'zh'
        ? '这是用于本地开发的中文模拟分析。'
        : mockJobAnalysis.scoreDescription,
      suggestions: outputLanguage === 'zh'
        ? ['根据职位要求调整简历重点。']
        : mockJobAnalysis.suggestions,
      coverLetter: outputLanguage === 'zh'
        ? `尊敬的招聘经理：\n\n我希望申请 ${companyName} 的 ${jobTitle} 职位。`
        : mockJobAnalysis.coverLetter,
      tailoredResume,
      outputLanguage,
    })
  }

  regenerateResume(input: ResumeRegenerationInput): Promise<string> {
    const companyName = input.companyName.trim()
    const jobTitle = input.jobTitle.trim()

    if ((input.outputLanguage ?? 'en') === 'zh') {
      return Promise.resolve(
        `专业摘要\n这是为 ${companyName} 的 ${jobTitle} 职位重新生成的简历版本。\n\n核心技能\n${input.resumeText.trim()}`,
      )
    }

    return Promise.resolve(
      `PROFESSIONAL SUMMARY\nThis refreshed resume targets the ${jobTitle} role at ${companyName}.\n\nCORE SKILLS\n${input.resumeText.trim()}`,
    )
  }

  extractJobDetails(input: JobDetailsExtractionInput): Promise<ImportedJobDetails> {
    return Promise.resolve({
      companyName: 'Northstar Labs',
      jobTitle: 'Frontend Developer',
      jobDescription: input.pageText.trim(),
    })
  }
}
