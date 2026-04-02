/**
 * AI Chat Hook Tests
 *
 * Tests for useAIChat hook covering:
 * - sendMessage happy path
 * - Error handling (no project, API errors, timeout)
 * - Stream cancellation
 * - Retry logic
 * - Clear chat
 * - Edge cases
 *
 * Regression: ISSUE-001, ISSUE-002, ISSUE-004, ISSUE-005, ISSUE-007
 * Found by /qa on 2026-04-02
 * Report: .gstack/qa-reports/qa-report-localhost-5173-2026-04-02.md
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAIChat } from '@/hooks/useAIChat';
import { useUIStore } from '@/stores/uiStore';
import { useCalculationStore } from '@/stores/calculationStore';
import { useProjectStore } from '@/stores/projectStore';
import * as aiChatServiceModule from '@/services/ai';

// Mock the AI chat service
vi.mock('@/services/ai', () => ({
  aiChatService: {
    sendMessageStream: vi.fn(),
    updateConfig: vi.fn(),
  },
  buildSystemPrompt: vi.fn((lang: 'zh' | 'en') => `System prompt (${lang})`),
  buildUserPrompt: vi.fn((q, ctx, lang) => `User: ${q} | Lang: ${lang}`),
  buildProjectContext: vi.fn(() => ({ province: 'guangdong' as const })),
  extractConversationSummary: vi.fn(() => 'Conversation summary'),
}));

const mockStreamEvent = (type: string, data?: any) => ({ type, data });

describe('useAIChat', () => {
  // Mock project data
  const mockProject = {
    id: 'test-project',
    name: 'Test Project',
    province: 'guangdong',
    systemSize: { capacity: 2000, power: 500 },
    costs: {
      battery: 0.5,
      pcs: 0.15,
      bms: 0.05,
      ems: 0.03,
      thermalManagement: 0.04,
      fireProtection: 0.02,
      container: 0.03,
      installation: 0.08,
      other: 0.02,
    },
    operatingParams: {
      systemEfficiency: 0.90,
      dod: 0.85,
      cyclesPerDay: 2,
      degradationRate: 0.02,
    },
  };

  const mockResult = {
    irr: 0.085,
    npv: 500000,
    paybackPeriod: 8.2,
    annualRevenue: 250000,
    annualCosts: 50000,
    annualProfit: 200000,
    totalInvestment: 1000000,
  };

  beforeEach(() => {
    // Clear all stores before each test
    useUIStore.getState().clearChatMessages();
    useUIStore.getState().setChatError(null);
    useCalculationStore.setState({ result: mockResult });
    useProjectStore.setState({ currentProject: mockProject });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('sendMessage - happy path', () => {
    it('should send message and receive streaming response', async () => {
      const mockStream = async function* () {
        yield mockStreamEvent('text', 'Hello ');
        yield mockStreamEvent('text', 'World');
        yield mockStreamEvent('done');
      };

      vi.mocked(aiChatServiceModule.aiChatService.sendMessageStream).mockImplementation(() => mockStream());

      const { result } = renderHook(() => useAIChat());

      // Initial state
      expect(result.current.hasMessages).toBe(false);
      expect(result.current.isThinking).toBe(false);

      // Send message
      await act(async () => {
        await result.current.sendMessage('Test question');
      });

      // Should have user message and assistant placeholder
      expect(result.current.hasMessages).toBe(true);
      expect(result.current.messages).toHaveLength(2);
      expect(result.current.messages[0]).toEqual({
        id: expect.any(String),
        role: 'user',
        content: 'Test question',
        timestamp: expect.any(Date),
      });
      expect(result.current.messages[1]).toEqual({
        id: expect.any(String),
        role: 'assistant',
        content: '',
        timestamp: expect.any(Date),
        isStreaming: true,
      });

      // Wait for streaming to complete
      await waitFor(() => {
        expect(result.current.messages[1].isStreaming).toBe(false);
      });

      // Should have full content
      expect(result.current.messages[1].content).toBe('Hello World');
      expect(result.current.isThinking).toBe(false);
    });

    it('should use conversation history for follow-up messages', async () => {
      const mockStream = async function* () {
        yield mockStreamEvent('text', 'Follow-up response');
        yield mockStreamEvent('done');
      };

      vi.mocked(aiChatServiceModule.aiChatService.sendMessageStream).mockImplementation(() => mockStream());

      const { result } = renderHook(() => useAIChat());

      // Send first message
      await act(async () => {
        await result.current.sendMessage('First question');
      });

      // Add messages to store to simulate conversation history
      useUIStore.getState().addChatMessage({
        id: 'msg-1',
        role: 'user',
        content: 'First question',
        timestamp: new Date(),
      });
      useUIStore.getState().addChatMessage({
        id: 'msg-2',
        role: 'assistant',
        content: 'First response',
        timestamp: new Date(),
      });

      // Send follow-up message
      await act(async () => {
        await result.current.sendMessage('Second question');
      });

      // Should have called extractConversationSummary
      expect(aiChatServiceModule.extractConversationSummary).toHaveBeenCalled();
    });
  });

  describe('sendMessage - error handling', () => {
    it('should return error when no project exists', async () => {
      useProjectStore.setState({ currentProject: null });

      const { result } = renderHook(() => useAIChat());

      await act(async () => {
        await result.current.sendMessage('Test question');
      });

      expect(result.current.error).toBe('Please complete the project calculation first');
      expect(result.current.errorType).toBe('invalid_request');
    });

    it('should return error when no calculation result exists', async () => {
      useCalculationStore.setState({ result: null });

      const { result } = renderHook(() => useAIChat());

      await act(async () => {
        await result.current.sendMessage('Test question');
      });

      expect(result.current.error).toBe('Please complete the project calculation first');
      expect(result.current.errorType).toBe('invalid_request');
    });

    it('should handle API error gracefully', async () => {
      const mockStream = async function* () {
        yield mockStreamEvent('error', 'API request failed');
      };

      vi.mocked(aiChatServiceModule.aiChatService.sendMessageStream).mockImplementation(() => mockStream());

      const { result } = renderHook(() => useAIChat());

      await act(async () => {
        await result.current.sendMessage('Test question');
      });

      // Should show error message
      expect(result.current.error).toBe('API request failed');
      expect(result.current.errorType).toBe('unknown');

      // Message should show error and streaming should be cleared
      const lastMessage = result.current.messages[result.current.messages.length - 1];
      expect(lastMessage.content).toBe('Error: API request failed');
      expect(lastMessage.isStreaming).toBe(false);
    });

    it('should handle timeout after 30 seconds', async () => {
      vi.useFakeTimers();

      const mockStream = async function* () {
        // Never complete - simulates hanging request
        await new Promise(() => {}); // Never resolves
      };

      vi.mocked(aiChatServiceModule.aiChatService.sendMessageStream).mockImplementation(() => mockStream());

      const { result } = renderHook(() => useAIChat());

      act(() => {
        result.current.sendMessage('Test question');
      });

      // Fast-forward 30 seconds
      act(() => {
        vi.advanceTimersByTime(30000);
      });

      await waitFor(() => {
        expect(result.current.error).toBe('AI response timeout (30s) - please try again');
      });

      vi.useRealTimers();
    }, 10000);
  });

  describe('sendMessage - request cancellation (ISSUE-005)', () => {
    it('should abort request on component unmount', async () => {
      let abortCalled = false;
      const mockStream = async function* (signal?: AbortSignal) {
        // Check if signal was aborted
        const checkAbort = () => {
          if (signal?.aborted) {
            abortCalled = true;
            throw new DOMException('Aborted', 'AbortError');
          }
        };

        checkAbort();
        await new Promise((resolve) => setTimeout(resolve, 100));
        checkAbort();
        yield mockStreamEvent('text', 'Data');
        yield mockStreamEvent('done');
      };

      vi.mocked(aiChatServiceModule.aiChatService.sendMessageStream).mockImplementation((...args: any[]) => mockStream(args[2]));

      const { result, unmount } = renderHook(() => useAIChat());

      act(() => {
        result.current.sendMessage('Test question');
      });

      // Unmount before stream completes
      unmount();

      // Wait for cleanup
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Abort should have been called in the service
      // The signal check happens inside the mock stream
      expect(abortCalled).toBe(true);
    });

    it('should handle AbortError gracefully without showing error', async () => {
      const mockStream = async function* () {
        throw new DOMException('Aborted', 'AbortError');
      };

      vi.mocked(aiChatServiceModule.aiChatService.sendMessageStream).mockImplementation(() => mockStream());

      const { result } = renderHook(() => useAIChat());

      await act(async () => {
        await result.current.sendMessage('Test question');
      });

      // Should not show error for abort
      expect(result.current.error).toBeNull();
      expect(result.current.errorType).toBeNull();
    });
  });

  describe('sendMessage - request debouncing (ISSUE-007)', () => {
    it('should prevent concurrent sends', async () => {
      const mockStream = async function* () {
        yield mockStreamEvent('text', 'Response');
        yield mockStreamEvent('done');
      };

      vi.mocked(aiChatServiceModule.aiChatService.sendMessageStream).mockImplementation(() => mockStream());

      const { result } = renderHook(() => useAIChat());

      // Start first request
      let firstRequestCompleted = false;
      const firstPromise = act(async () => {
        await result.current.sendMessage('First message');
        firstRequestCompleted = true;
      });

      // Immediately try second request while first is still thinking
      act(() => {
        result.current.sendMessage('Second message');
      });

      await firstPromise;

      // Should only have called sendMessage once
      expect(aiChatServiceModule.aiChatService.sendMessageStream).toHaveBeenCalledTimes(1);
    });
  });

  describe('clearChat', () => {
    it('should clear all messages and errors', async () => {
      const { result } = renderHook(() => useAIChat());

      // Add some messages and error
      useUIStore.getState().addChatMessage({
        id: 'msg-1',
        role: 'user',
        content: 'Test',
        timestamp: new Date(),
      });
      useUIStore.getState().setChatError('Some error');

      expect(result.current.hasMessages).toBe(true);
      expect(result.current.error).toBe('Some error');

      // Clear chat
      act(() => {
        result.current.clearChat();
      });

      expect(result.current.hasMessages).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('retryLastMessage (ISSUE-004)', () => {
    it('should remove failed assistant message and retry user message', async () => {
      const mockStream = async function* () {
        yield mockStreamEvent('text', 'Retry response');
        yield mockStreamEvent('done');
      };

      vi.mocked(aiChatServiceModule.aiChatService.sendMessageStream).mockImplementation(() => mockStream());

      const { result } = renderHook(() => useAIChat());

      // Add conversation history
      useUIStore.getState().addChatMessage({
        id: 'user-msg-1',
        role: 'user',
        content: 'Original question',
        timestamp: new Date(),
      });
      useUIStore.getState().addChatMessage({
        id: 'assistant-msg-1',
        role: 'assistant',
        content: 'Failed response',
        timestamp: new Date(),
      });

      const originalMessageCount = result.current.messages.length;

      // Retry
      await act(async () => {
        await result.current.retryLastMessage();
      });

      // Failed message should be removed
      expect(result.current.messages).toHaveLength(originalMessageCount);

      // Should have new assistant message
      const lastMessage = result.current.messages[result.current.messages.length - 1];
      expect(lastMessage.role).toBe('assistant');
      expect(lastMessage.content).toBe('Retry response');
    });

    it('should do nothing if no user message exists', async () => {
      const { result } = renderHook(() => useAIChat());

      const spy = vi.spyOn(result.current, 'sendMessage');

      await act(async () => {
        await result.current.retryLastMessage();
      });

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('streaming state management (ISSUE-001)', () => {
    it('should clear isStreaming flag when streaming completes', async () => {
      const mockStream = async function* () {
        yield mockStreamEvent('text', 'Response');
        yield mockStreamEvent('done');
      };

      vi.mocked(aiChatServiceModule.aiChatService.sendMessageStream).mockImplementation(() => mockStream());

      const { result } = renderHook(() => useAIChat());

      await act(async () => {
        await result.current.sendMessage('Test');
      });

      await waitFor(() => {
        const assistantMsg = result.current.messages.find(m => m.role === 'assistant');
        expect(assistantMsg?.isStreaming).toBe(false);
      });
    });

    it('should clear isStreaming flag on error', async () => {
      const mockStream = async function* () {
        yield mockStreamEvent('error', 'API error');
      };

      vi.mocked(aiChatServiceModule.aiChatService.sendMessageStream).mockImplementation(() => mockStream());

      const { result } = renderHook(() => useAIChat());

      await act(async () => {
        await result.current.sendMessage('Test');
      });

      await waitFor(() => {
        const assistantMsg = result.current.messages.find(m => m.role === 'assistant');
        expect(assistantMsg?.isStreaming).toBe(false);
      });
    });
  });
});
