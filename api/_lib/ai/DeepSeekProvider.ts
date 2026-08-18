import type { JobAnalysis } from '../../../src/types/jobAnalysis'
import type { JobDescriptionInput } from '../../../src/types/jobApplication'
import type { AIProvider } from './AIProvider'
import { buildAnalysisPrompt } from './buildAnalysisPrompt.js'
import { parseJobAnalysis } from './parseJobAnalysis.js'

interface DeepSeekChatCompletion {
  choices?: Array<{
    message?: {
      content?: string | null
    }
  }>
}

export class DeepSeekProvider implements AIProvider {
  private readonly apiKey: string
  private readonly model: string

  constructor(apiKey: string, model = 'deepseek-v4-flash') {
    this.apiKey = apiKey
    this.model = model
  }

  async analyze(input: JobDescriptionInput): Promise<JobAnalysis> {
    const prompt = buildAnalysisPrompt(input)
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: prompt.system },
          { role: 'user', content: prompt.user },
        ],
        thinking: { type: 'disabled' },
        response_format: { type: 'json_object' },
        max_tokens: 2500,
        stream: false,
      }),
    })

    if (!response.ok) {
      throw new Error(`DeepSeek request failed with status ${response.status}.`)
    }

    const completion = (await response.json()) as DeepSeekChatCompletion
    const content = completion.choices?.[0]?.message?.content

    if (!content) throw new Error('DeepSeek returned an empty response.')

    const analysis = parseJobAnalysis(content)

    return {
      ...analysis,
      companyName: input.companyName.trim(),
      jobTitle: input.jobTitle.trim(),
    }
  }
}
