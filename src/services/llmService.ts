import OpenAI from 'openai'
import type { ChatMessage, ChapterPreview } from '../types'
import { CHAPTER_PREVIEW_SYSTEM_PROMPT, createChapterPreviewUserPrompt } from './prompts'

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

/**
 * Centralized error handler for OpenAI API errors.
 * Converts OpenAI API errors into LLMServiceError with appropriate messages.
 */
function handleOpenAIError(error: unknown, settings: LLMSettings): never {
  if (error instanceof LLMServiceError) {
    throw error
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

  if (error instanceof SyntaxError) {
    throw new LLMServiceError('Failed to parse AI response. Please try again.', 'PARSE_ERROR')
  }

  throw new LLMServiceError('Failed to connect to the API. Please check your network connection.', 'NETWORK_ERROR')
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
    handleOpenAIError(error, settings)
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

  // Truncate chapter content if too long (aim for ~8000 tokens max, roughly 32000 chars)
  const maxContentLength = 32000
  const truncatedContent = chapterContent.length > maxContentLength
    ? chapterContent.slice(0, maxContentLength) + '\n\n[Content truncated for length...]'
    : chapterContent

  const userPrompt = createChapterPreviewUserPrompt(bookTitle, bookAuthor, chapterLabel, truncatedContent)

  try {
    const response = await client.chat.completions.create({
      model: settings.model,
      messages: [
        { role: 'system', content: CHAPTER_PREVIEW_SYSTEM_PROMPT },
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
    handleOpenAIError(error, settings)
  }
}

