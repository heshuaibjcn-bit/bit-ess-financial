/**
 * StreamHandler - Handle streaming responses from AI services
 *
 * Manages SSE (Server-Sent Events) streaming for AI responses
 */

import type { StreamEvent } from '@/types/ai';

/**
 * Parse SSE stream from response
 */
export async function* parseSSEStream(
  response: Response
): AsyncGenerator<StreamEvent, void, unknown> {
  if (!response.body) {
    yield { type: 'error', error: 'Response body is empty' };
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        yield { type: 'done' };
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE messages
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        const trimmedLine = line.trim();

        if (!trimmedLine || trimmedLine.startsWith(':')) {
          // Skip empty lines and comments
          continue;
        }

        if (trimmedLine === 'data: [DONE]') {
          yield { type: 'done' };
          return;
        }

        if (trimmedLine.startsWith('data: ')) {
          try {
            const data = JSON.parse(trimmedLine.slice(6));

            // Handle different API response formats
            if (data.type === 'error') {
              yield { type: 'error', error: data.error?.message || 'Unknown error' };
            } else if (data.delta?.content) {
              // Anthropic-style format
              yield { type: 'text', data: data.delta.content };
            } else if (data.choices?.[0]?.delta?.content) {
              // OpenAI-style format
              yield { type: 'text', data: data.choices[0].delta.content };
            } else if (data.content) {
              // Direct content
              yield { type: 'text', data: data.content };
            } else if (typeof data === 'string') {
              // Plain string
              yield { type: 'text', data };
            }
          } catch (e) {
            // If not JSON, treat as plain text after 'data: '
            const textContent = trimmedLine.slice(6);
            if (textContent) {
              yield { type: 'text', data: textContent };
            }
          }
        }
      }
    }
  } catch (error) {
    yield {
      type: 'error',
      error: error instanceof Error ? error.message : 'Stream processing error',
    };
  } finally {
    reader.releaseLock();
  }
}

/**
 * Accumulate streaming content
 */
export class StreamAccumulator {
  private content = '';
  private chunkCount = 0;

  addChunk(chunk: string): void {
    this.content += chunk;
    this.chunkCount++;
  }

  getContent(): string {
    return this.content;
  }

  getChunkCount(): number {
    return this.chunkCount;
  }

  reset(): void {
    this.content = '';
    this.chunkCount = 0;
  }

  isEmpty(): boolean {
    return this.content.length === 0;
  }
}

/**
 * Mock stream for testing/demo
 */
export async function* createMockStream(
  response: string,
  chunkDelay: number = 30,
  signal?: AbortSignal
): AsyncGenerator<StreamEvent, void, unknown> {
  const words = response.split(' ');

  for (let i = 0; i < words.length; i++) {
    // Check if aborted
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    await new Promise((resolve) => setTimeout(resolve, chunkDelay));
    yield { type: 'text', data: words[i] + (i < words.length - 1 ? ' ' : '') };
  }

  yield { type: 'done' };
}

/**
 * Stream timeout wrapper
 */
export async function withStreamTimeout<T>(
  generator: AsyncGenerator<T>,
  timeoutMs: number,
  onTimeout?: () => void
): Promise<T | null> {
  let timeoutId: NodeJS.Timeout | null = null;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      if (onTimeout) onTimeout();
      reject(new Error(`Stream timeout after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([
      (async () => {
        for await (const item of generator) {
          return item;
        }
        throw new Error('Stream ended without data');
      })(),
      timeoutPromise,
    ]);

    return result;
  } catch (error) {
    if (error instanceof Error && error.message.includes('timeout')) {
      return null;
    }
    throw error;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}
