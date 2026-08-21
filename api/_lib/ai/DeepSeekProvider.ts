import type { JobAnalysis } from '../../../src/types/jobAnalysis'
import type { JobDescriptionInput } from '../../../src/types/jobApplication'
import type { AIProvider } from './AIProvider'
import { buildAnalysisPrompt } from './buildAnalysisPrompt.js'
import { hasProfessionalSummary, parseJobAnalysis } from './parseJobAnalysis.js'

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
  private readonly model: string

  constructor(apiKey: string, model = 'deepseek-v4-flash') {
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
          content: `Correct the complete JSON response. The tailoredResume must begin with a non-empty PROFESSIONAL SUMMARY containing two or three newly written sentences tailored to the supplied job description. Use only verified facts from the supplied resume and do not copy resume sentences verbatim. Return only the corrected complete JSON object.`,
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
    }
  }
}
