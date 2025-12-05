import OpenAI from 'openai'
import type { ChatMessage, ChapterPreview } from '../types'

export interface LLMSettings {
  apiKey: string
  baseUrl: string
  model: string
}

export class LLMServiceError extends Error {
  readonly code?: string

  constructor(message: string, code?: string) {
    super(message)
    this.name = 'LLMServiceError'
    this.code = code
  }
}

function createClient(settings: LLMSettings): OpenAI {
  if (!settings.apiKey) {
    throw new LLMServiceError('API key is not configured. Please add your API key in Settings.', 'NO_API_KEY')
  }

  return new OpenAI({
    apiKey: settings.apiKey,
    baseURL: settings.baseUrl || 'https://api.openai.com/v1',
    dangerouslyAllowBrowser: true,
  })
}

export async function* streamChat(
  messages: ChatMessage[],
  settings: LLMSettings,
  systemPrompt?: string
): AsyncGenerator<string, void, unknown> {
  const client = createClient(settings)

  const formattedMessages: OpenAI.ChatCompletionMessageParam[] = []

  if (systemPrompt) {
    formattedMessages.push({ role: 'system', content: systemPrompt })
  }

  for (const msg of messages) {
    formattedMessages.push({
      role: msg.role,
      content: msg.content,
    })
  }

  try {
    const stream = await client.chat.completions.create({
      model: settings.model,
      messages: formattedMessages,
      stream: true,
    })

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content
      if (content) {
        yield content
      }
    }
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      if (error.status === 401) {
        throw new LLMServiceError('Invalid API key. Please check your API key in Settings.', 'INVALID_API_KEY')
      }
      if (error.status === 429) {
        throw new LLMServiceError('Rate limit exceeded. Please try again later.', 'RATE_LIMIT')
      }
      if (error.status === 404) {
        throw new LLMServiceError(`Model "${settings.model}" not found. Please check your model name.`, 'MODEL_NOT_FOUND')
      }
      throw new LLMServiceError(error.message || 'An error occurred while communicating with the API.', 'API_ERROR')
    }
    throw new LLMServiceError('Failed to connect to the API. Please check your network connection.', 'NETWORK_ERROR')
  }
}

interface PreviewResponse {
  themes: string[]
  keyConcepts: string[]
  toneAndStyle?: string
  characters?: string[]
  definitions?: Array<{ term: string; definition: string }>
  guidingQuestions: string[]
}

export async function generateChapterPreview(
  bookTitle: string,
  bookAuthor: string,
  chapterLabel: string,
  chapterContent: string,
  settings: LLMSettings
): Promise<Omit<ChapterPreview, 'chapterHref' | 'chapterLabel' | 'generatedAt'>> {
  const client = createClient(settings)

  const systemPrompt = `You are an expert reading guide assistant. Your task is to analyze the provided chapter content and generate a reading preview that helps readers prepare for and engage more deeply with the material.

IMPORTANT GUIDELINES:
- For FICTION: Avoid plot spoilers. Focus on themes, tone, atmosphere, and what readers should pay attention to.
- For NON-FICTION: Focus on key arguments, concepts, and frameworks introduced in this chapter.
- Keep each item concise but meaningful (1-2 sentences max per item).
- Generate content that primes the reader's attention without giving away key revelations.
- Base your analysis on the actual chapter content provided.

You must respond with a valid JSON object with the following structure:
{
  "themes": ["theme 1", "theme 2"],
  "keyConcepts": ["concept 1", "concept 2"],
  "toneAndStyle": "Optional: description of tone, pacing, or narrative style",
  "characters": ["Optional: character introductions for fiction"],
  "definitions": [{"term": "term", "definition": "definition"}],
  "guidingQuestions": ["question 1", "question 2"]
}

Required fields: themes, keyConcepts, guidingQuestions
Optional fields: toneAndStyle, characters, definitions

Provide 2-4 items for themes, keyConcepts.
Provide 1-2 guiding questions that help the reader think critically about the content.
Only include characters for fiction works where new or important characters appear.
Only include definitions if there are important terms or concepts that need explanation.`

  // Truncate chapter content if too long (aim for ~8000 tokens max, roughly 32000 chars)
  const maxContentLength = 32000
  const truncatedContent = chapterContent.length > maxContentLength
    ? chapterContent.slice(0, maxContentLength) + '\n\n[Content truncated for length...]'
    : chapterContent

  const userPrompt = `Generate a reading preview for:

Book: "${bookTitle}" by ${bookAuthor}
Chapter: "${chapterLabel}"

CHAPTER CONTENT:
---
${truncatedContent}
---

Based on the chapter content above, create a preview that will help orient and prime the reader. Remember to respond with valid JSON only.`

  try {
    const response = await client.chat.completions.create({
      model: settings.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new LLMServiceError('Empty response from AI. Please try again.', 'EMPTY_RESPONSE')
    }

    const parsed: PreviewResponse = JSON.parse(content)

    // Validate required fields
    if (!parsed.themes || !Array.isArray(parsed.themes)) {
      parsed.themes = []
    }
    if (!parsed.keyConcepts || !Array.isArray(parsed.keyConcepts)) {
      parsed.keyConcepts = []
    }
    if (!parsed.guidingQuestions || !Array.isArray(parsed.guidingQuestions)) {
      parsed.guidingQuestions = []
    }

    return {
      themes: parsed.themes,
      keyConcepts: parsed.keyConcepts,
      toneAndStyle: parsed.toneAndStyle,
      characters: parsed.characters,
      definitions: parsed.definitions,
      guidingQuestions: parsed.guidingQuestions,
    }
  } catch (error) {
    if (error instanceof LLMServiceError) {
      throw error
    }
    if (error instanceof SyntaxError) {
      throw new LLMServiceError('Failed to parse AI response. Please try again.', 'PARSE_ERROR')
    }
    if (error instanceof OpenAI.APIError) {
      if (error.status === 401) {
        throw new LLMServiceError('Invalid API key. Please check your API key in Settings.', 'INVALID_API_KEY')
      }
      if (error.status === 429) {
        throw new LLMServiceError('Rate limit exceeded. Please try again later.', 'RATE_LIMIT')
      }
      if (error.status === 404) {
        throw new LLMServiceError(`Model "${settings.model}" not found. Please check your model name.`, 'MODEL_NOT_FOUND')
      }
      throw new LLMServiceError(error.message || 'An error occurred while communicating with the API.', 'API_ERROR')
    }
    throw new LLMServiceError('Failed to generate preview. Please check your network connection.', 'NETWORK_ERROR')
  }
}

