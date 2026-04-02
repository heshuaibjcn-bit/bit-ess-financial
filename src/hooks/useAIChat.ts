/**
 * useAIChat - React hook for AI chat functionality
 *
 * Manages AI chat state and operations
 */

import { useCallback, useRef, useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useCalculationStore } from '@/stores/calculationStore';
import { useProjectStore } from '@/stores/projectStore';
import { aiChatService } from '@/services/ai';
import { buildSystemPrompt, buildUserPrompt, extractConversationSummary } from '@/services/ai';
import { buildProjectContext } from '@/services/ai';
import type { ChatMessage, QuickPrompt } from '@/types/ai';

/**
 * Hook for AI chat functionality
 */
export function useAIChat() {
  // UI state
  const chatMessages = useUIStore((state) => state.chatMessages);
  const isAiThinking = useUIStore((state) => state.isAiThinking);
  const chatError = useUIStore((state) => state.chatError);
  const chatErrorType = useUIStore((state) => state.chatErrorType);

  // Store actions
  const addChatMessage = useUIStore((state) => state.addChatMessage);
  const updateChatMessage = useUIStore((state) => state.updateChatMessage);
  const updateMessageStreamingState = useUIStore((state) => state.updateMessageStreamingState);
  const clearChatMessages = useUIStore((state) => state.clearChatMessages);
  const setIsAiThinking = useUIStore((state) => state.setIsAiThinking);
  const setChatError = useUIStore((state) => state.setChatError);
  const setChatErrorType = useUIStore((state) => state.setChatErrorType);
  const clearChatError = useUIStore((state) => state.clearChatError);

  // Get current project and calculation result
  const result = useCalculationStore((state) => state.result);
  const benchmarkComparison = useCalculationStore((state) => state.benchmarkComparison);
  const currentProject = useProjectStore((state) => state.currentProject);
  const language = useUIStore((state) => state.language);

  // Ref to track current streaming message ID
  const streamingMessageIdRef = useRef<string | null>(null);

  // Ref to track timeout for cleanup
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Generate unique message ID
   */
  const generateMessageId = (): string => {
    return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  };

  /**
   * Send message to AI
   */
  const sendMessage = useCallback(async (userMessage: string): Promise<void> => {
    if (!currentProject || !result) {
      setChatError('Please complete the project calculation first');
      setChatErrorType('invalid_request');
      return;
    }

    clearChatError();
    setIsAiThinking(true);

    // Add user message
    const userMsg: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };
    addChatMessage(userMsg);

    // Build context
    const context = buildProjectContext(currentProject, result, benchmarkComparison);

    // Build prompts
    const systemPrompt = buildSystemPrompt(language);

    // Check if we have conversation history
    let userPrompt: string;
    if (chatMessages.length > 0) {
      const conversationSummary = extractConversationSummary(
        [
          ...chatMessages.map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: userMessage }
        ],
        language
      );
      userPrompt = conversationSummary;
    } else {
      userPrompt = buildUserPrompt(userMessage, context, language);
    }

    // Create assistant message placeholder for streaming
    const assistantMsg: ChatMessage = {
      id: generateMessageId(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };
    addChatMessage(assistantMsg);
    streamingMessageIdRef.current = assistantMsg.id;

    try {
      // Stream response with timeout
      let fullContent = '';

      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutRef.current = setTimeout(() => {
          reject(new Error('AI response timeout (30s) - please try again'));
        }, 30000); // 30 second timeout
      });

      // Create stream promise
      const streamPromise = (async () => {
        for await (const event of aiChatService.sendMessageStream(systemPrompt, userPrompt)) {
          if (event.type === 'text' && event.data) {
            fullContent += event.data;
            updateChatMessage(assistantMsg.id, fullContent);
          } else if (event.type === 'error' && event.error) {
            setChatError(event.error);
            setChatErrorType('unknown');
            break;
          } else if (event.type === 'done') {
            // Mark streaming complete - update content and clear streaming flag
            updateChatMessage(assistantMsg.id, fullContent);
            updateMessageStreamingState(assistantMsg.id, false);
            break;
          }
        }
        return fullContent;
      })();

      // Race between stream and timeout
      await Promise.race([streamPromise, timeoutPromise]);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get AI response';
      setChatError(errorMessage);
      setChatErrorType('unknown');

      // Update message with error and clear streaming flag
      updateChatMessage(assistantMsg.id, `Error: ${errorMessage}`);
      updateMessageStreamingState(assistantMsg.id, false);
    } finally {
      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      setIsAiThinking(false);
      streamingMessageIdRef.current = null;
    }
  }, [
    currentProject,
    result,
    benchmarkComparison,
    chatMessages,
    language,
    addChatMessage,
    updateChatMessage,
    setIsAiThinking,
    setChatError,
    setChatErrorType,
    clearChatError,
  ]);

  /**
   * Clear chat history
   */
  const clearChat = useCallback((): void => {
    clearChatMessages();
    clearChatError();
  }, [clearChatMessages, clearChatError]);

  /**
   * Retry last message
   */
  const retryLastMessage = useCallback(async (): Promise<void> => {
    const lastUserMessage = [...chatMessages]
      .reverse()
      .find(msg => msg.role === 'user');

    if (lastUserMessage) {
      // Remove last assistant message if exists
      const lastAssistantMessage = [...chatMessages]
        .reverse()
        .find(msg => msg.role === 'assistant');

      if (lastAssistantMessage && streamingMessageIdRef.current !== lastAssistantMessage.id) {
        // For now, we just send a new message
        // In a full implementation, we'd remove the last assistant message
      }

      await sendMessage(lastUserMessage.content);
    }
  }, [chatMessages, sendMessage]);

  // Cleanup on unmount - clear any pending timeout
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  return {
    // State
    messages: chatMessages,
    isThinking: isAiThinking,
    error: chatError,
    errorType: chatErrorType,

    // Computed
    hasMessages: chatMessages.length > 0,
    lastMessage: chatMessages[chatMessages.length - 1] || null,

    // Actions
    sendMessage,
    clearChat,
    retryLastMessage,
  };
}

/**
 * Hook for quick prompts
 */
export function useQuickPrompts(): QuickPrompt[] {
  const language = useUIStore((state) => state.language);

  // Import here to avoid circular dependency
  const { QUICK_PROMPTS_ZH, QUICK_PROMPTS_EN } = require('@/types/ai');

  return language === 'zh' ? QUICK_PROMPTS_ZH : QUICK_PROMPTS_EN;
}

export default useAIChat;
