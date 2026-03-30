/**
 * Comments Panel Component
 *
 * Display and manage comments on projects
 */

import React, { useState } from 'react';
import { useProjectComments } from '../../hooks/useCollaboration';
import { CommentWithUser } from '../../repositories/CommentRepository';

interface CommentsPanelProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CommentsPanel({ projectId, isOpen, onClose }: CommentsPanelProps) {
  const {
    comments,
    loading,
    addComment,
    updateComment,
    deleteComment,
    toggleResolved,
  } = useProjectComments(projectId);

  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim()) return;

    setIsSubmitting(true);

    try {
      await addComment(newComment.trim());
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = async (commentId: string, e: React.FormEvent) => {
    e.preventDefault();

    if (!replyText.trim()) return;

    setIsSubmitting(true);

    try {
      await addComment(replyText.trim(), commentId);
      setReplyText('');
      setReplyTo(null);
    } catch (error) {
      console.error('Failed to add reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (comment: CommentWithUser) => {
    setEditingId(comment.id);
    setEditText(comment.content);
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editText.trim()) return;

    setIsSubmitting(true);

    try {
      await updateComment(commentId, editText.trim());
      setEditingId(null);
      setEditText('');
    } catch (error) {
      console.error('Failed to update comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (confirm('Are you sure you want to delete this comment?')) {
      try {
        await deleteComment(commentId);
      } catch (error) {
        console.error('Failed to delete comment:', error);
      }
    }
  };

  const handleToggleResolved = async (commentId: string) => {
    try {
      await toggleResolved(commentId);
    } catch (error) {
      console.error('Failed to toggle resolved:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Comments</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Comments list */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>No comments yet</p>
            <p className="text-sm">Start the conversation</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="border rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {comment.user?.name?.[0] || '?'}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {comment.user?.name || 'Unknown'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(comment.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleResolved(comment.id)}
                      className={`p-1 rounded ${
                        comment.resolved
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                      title={comment.resolved ? 'Mark as unresolved' : 'Mark as resolved'}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => setReplyTo(comment.id)}
                      className="p-1 rounded bg-gray-100 text-gray-400 hover:bg-gray-200"
                      title="Reply"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleStartEdit(comment)}
                      className="p-1 rounded bg-gray-100 text-gray-400 hover:bg-gray-200"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="p-1 rounded bg-gray-100 text-red-400 hover:bg-red-100"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {editingId === comment.id ? (
                  <div className="mb-2">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleSaveEdit(comment.id)}
                        disabled={isSubmitting}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditText('');
                        }}
                        className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-700 mb-2 whitespace-pre-wrap">
                    {comment.content}
                  </div>
                )}

                {comment.resolved && (
                  <div className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full mb-2">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Resolved
                  </div>
                )}

                {/* Reply form */}
                {replyTo === comment.id && (
                  <form onSubmit={(e) => handleSubmitReply(comment.id, e)} className="mt-2">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write a reply..."
                      className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                      autoFocus
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting || !replyText.trim()}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        Reply
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setReplyTo(null);
                          setReplyText('');
                        }}
                        className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-3 space-y-2 border-t pt-2">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="flex items-start gap-2 pl-3">
                        <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                          {reply.user?.name?.[0] || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-900">
                              {reply.user?.name || 'Unknown'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(reply.created_at).toLocaleString()}
                            </span>
                          </div>
                          <div className="text-xs text-gray-700 mt-1">
                            {reply.content}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New comment form */}
      <div className="border-t px-4 py-3">
      <form onSubmit={handleSubmitComment}>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-none"
          rows={3}
        />
        <div className="flex justify-end mt-2">
          <button
            type="submit"
            disabled={isSubmitting || !newComment.trim()}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Post Comment
          </button>
        </div>
      </form>
    </div>
    </div>
  );
}