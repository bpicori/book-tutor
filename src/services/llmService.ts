import OpenAI from 'openai'
import type { ChatMessage } from '../types'

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

