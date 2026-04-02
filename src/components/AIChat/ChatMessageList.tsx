/**
 * ChatMessageList - Display chat messages
 *
 * Shows conversation history with user and AI messages
 */

import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { useTranslation } from 'react-i18next';
import type { ChatMessage } from '@/types/ai';
import { ThinkingIndicator } from './ThinkingIndicator';

interface ChatMessageListProps {
  messages: ChatMessage[];
  isAiThinking?: boolean;
  thinkingMessage?: string;
  className?: string;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  isAiThinking = false,
  thinkingMessage,
  className = '',
}) => {
  const { t } = useTranslation();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiThinking]);

  if (messages.length === 0 && !isAiThinking) {
    return (
      <div className={`flex flex-col items-center justify-center h-full text-center p-8 ${className}`}>
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {t('aiChat.title')}
        </h3>
        <p className="text-sm text-gray-600 max-w-xs">
          {t('aiChat.messages.welcome')}
        </p>
      </div>
    );
  }

  return (
    <div className={`chat-message-list flex-1 overflow-y-auto ${className}`}>
      <div className="space-y-4 px-4 py-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {isAiThinking && (
          <div className="flex justify-start">
            <div className="max-w-[80%] bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
              <ThinkingIndicator message={thinkingMessage} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

/**
 * Individual message bubble
 */
interface MessageBubbleProps {
  message: ChatMessage;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`
          max-w-[80%] rounded-2xl px-4 py-3
          ${isUser
            ? 'bg-blue-600 text-white rounded-tr-sm'
            : 'bg-gray-100 text-gray-900 rounded-tl-sm'
          }
        `}
      >
        {/* Streaming indicator */}
        {message.isStreaming && (
          <div className="flex items-center space-x-1 mb-2">
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
          </div>
        )}

        {/* Message content */}
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        ) : (
          <div className="markdown-content prose prose-sm max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                // Custom styling for markdown elements
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
                li: ({ children }) => <li className="mb-1">{children}</li>,
                h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                code: ({ inline, children, ...props }) =>
                  inline ? (
                    <code className="bg-gray-200 px-1 py-0.5 rounded text-xs" {...props}>{children}</code>
                  ) : (
                    <code className="block bg-gray-800 text-white p-2 rounded text-xs overflow-x-auto" {...props}>{children}</code>
                  ),
                strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-gray-300 pl-3 italic">{children}</blockquote>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Timestamp */}
        <div className={`text-[10px] mt-1 ${isUser ? 'text-blue-200' : 'text-gray-400'}`}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

export default ChatMessageList;
