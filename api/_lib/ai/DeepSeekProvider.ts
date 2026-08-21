import type { InterviewPrep, JobAnalysis } from '../../../src/types/jobAnalysis'
import type {
  DeepSeekModel,
  ImportedJobDetails,
  JobDetailsExtractionInput,
  JobDescriptionInput,
  ResumeRegenerationInput,
} from '../../../src/types/jobApplication'
import type { AIProvider } from './AIProvider'
import { buildAnalysisPrompt } from './buildAnalysisPrompt.js'
import { buildJobDetailsPrompt } from './buildJobDetailsPrompt.js'
import { buildInterviewPrepPrompt } from './buildInterviewPrepPrompt.js'
import { buildResumeRegenerationPrompt } from './buildResumeRegenerationPrompt.js'
import {
  hasProfessionalSummary,
  parseImportedJobDetails,
  parseInterviewPrep,
  parseJobAnalysis,
  parseTailoredResume,
} from './parseJobAnalysis.js'

interface DeepSeekChatCompletion {
  choices?: Array<{
    message?: {
      content?: string | null
    }
  }>
}

interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export class DeepSeekProvider implements AIProvider {
  private readonly apiKey: string
  private readonly model: DeepSeekModel

  constructor(apiKey: string, model: DeepSeekModel = 'deepseek-v4-flash') {
    this.apiKey = apiKey
    this.model = model
  }

  private async complete(messages: DeepSeekMessage[]) {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        thinking: { type: 'disabled' },
        response_format: { type: 'json_object' },
        max_tokens: 5000,
        stream: false,
      }),
    })

    if (!response.ok) {
      throw new Error(`DeepSeek request failed with status ${response.status}.`)
    }

    const completion = (await response.json()) as DeepSeekChatCompletion
    const content = completion.choices?.[0]?.message?.content

    if (!content) throw new Error('DeepSeek returned an empty response.')
    return content
  }

  async analyze(input: JobDescriptionInput): Promise<JobAnalysis> {
    const outputLanguage = input.outputLanguage ?? 'en'
    const summaryHeading = outputLanguage === 'zh' ? '专业摘要' : 'PROFESSIONAL SUMMARY'
    const prompt = buildAnalysisPrompt(input)
    const messages: DeepSeekMessage[] = [
      { role: 'system', content: prompt.system },
      { role: 'user', content: prompt.user },
    ]
    let content = await this.complete(messages)
    let analysis = parseJobAnalysis(content)

    if (!analysis.tailoredResume || !hasProfessionalSummary(analysis.tailoredResume)) {
      content = await this.complete([
        ...messages,
        { role: 'assistant', content },
        {
          role: 'user',
          content: `Correct the complete JSON response. The tailoredResume must begin with a non-empty ${summaryHeading} section containing two or three newly written sentences tailored to the supplied job description and written in the requested output language. Use only verified facts from the supplied resume and do not copy resume sentences verbatim. Return only the corrected complete JSON object.`,
        },
      ])
      analysis = parseJobAnalysis(content)

      if (!analysis.tailoredResume || !hasProfessionalSummary(analysis.tailoredResume)) {
        throw new Error('DeepSeek returned a tailored resume without a professional summary.')
      }
    }

    return {
      ...analysis,
      companyName: input.companyName.trim(),
      jobTitle: input.jobTitle.trim(),
      outputLanguage,
      aiModel: this.model,
    }
  }

  async regenerateResume(input: ResumeRegenerationInput): Promise<string> {
    const outputLanguage = input.outputLanguage ?? 'en'
    const summaryHeading = outputLanguage === 'zh' ? '专业摘要' : 'PROFESSIONAL SUMMARY'
    const prompt = buildResumeRegenerationPrompt(input)
    const messages: DeepSeekMessage[] = [
      { role: 'system', content: prompt.system },
      { role: 'user', content: prompt.user },
    ]
    let content = await this.complete(messages)
    let tailoredResume = parseTailoredResume(content)

    if (!hasProfessionalSummary(tailoredResume)) {
      content = await this.complete([
        ...messages,
        { role: 'assistant', content },
        {
          role: 'user',
          content: `Correct the JSON response. The tailoredResume must begin with a non-empty ${summaryHeading} section containing two or three newly written sentences in the requested output language. Use only verified facts from the supplied original resume. Return only the corrected complete JSON object.`,
        },
      ])
      tailoredResume = parseTailoredResume(content)

      if (!hasProfessionalSummary(tailoredResume)) {
        throw new Error('DeepSeek returned a tailored resume without a professional summary.')
      }
    }

    return tailoredResume
  }

  async extractJobDetails(
    input: JobDetailsExtractionInput,
  ): Promise<ImportedJobDetails> {
    const prompt = buildJobDetailsPrompt(input)
    const content = await this.complete([
      { role: 'system', content: prompt.system },
      { role: 'user', content: prompt.user },
    ])

    return parseImportedJobDetails(content)
  }

  async generateInterviewPrep(input: JobDescriptionInput): Promise<InterviewPrep> {
    const prompt = buildInterviewPrepPrompt(input)
    const content = await this.complete([
      { role: 'system', content: prompt.system },
      { role: 'user', content: prompt.user },
    ])

    return parseInterviewPrep(content)
  }
}
