/**
 * Approval Workflow Component
 *
 * Display and manage approval workflows for projects
 */

import React, { useState } from 'react';
import { useApprovalWorkflow } from '../../hooks/useCollaboration';
import { ApprovalStatus, ApprovalStep, ApprovalWithDetails } from '../../repositories/ApprovalRepository';

interface ApprovalWorkflowProps {
  projectId: string;
  projectName: string;
}

export function ApprovalWorkflow({ projectId, projectName }: ApprovalWorkflowProps) {
  const {
    approvals,
    loading,
    createRequest,
    addAction,
    cancelRequest,
  } = useApprovalWorkflow(projectId);

  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [comment, setComment] = useState('');

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) return;

    setIsCreating(true);

    try {
      await createRequest(title.trim(), description.trim() || undefined);

      setTitle('');
      setDescription('');
    } catch (error) {
      console.error('Failed to create approval request:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleApprove = async (approval: ApprovalWithDetails) => {
    try {
      await addAction(approval.id, 'approve', 'Approved');
    } catch (error) {
      console.error('Failed to approve:', error);
    }
  };

  const handleReject = async (approval: ApprovalWithDetails) => {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;

    try {
      await addAction(approval.id, 'reject', reason);
    } catch (error) {
      console.error('Failed to reject:', error);
    }
  };

  const handleRequestChanges = async (approval: ApprovalWithDetails) => {
    try {
      await addAction(approval.id, 'request_changes', comment || 'Please review and update');
      setComment('');
    } catch (error) {
      console.error('Failed to request changes:', error);
    }
  };

  const handleCancel = async (approval: ApprovalWithDetails) => {
    if (confirm('Are you sure you want to cancel this approval request?')) {
      try {
        await cancelRequest(approval.id);
      } catch (error) {
        console.error('Failed to cancel:', error);
      }
    }
  };

  const getStatusColor = (status: ApprovalStatus) => {
    switch (status) {
      case ApprovalStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case ApprovalStatus.APPROVED:
        return 'bg-green-100 text-green-800';
      case ApprovalStatus.REJECTED:
        return 'bg-red-100 text-red-800';
      case ApprovalStatus.CANCELLED:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: ApprovalStatus) => {
    switch (status) {
      case ApprovalStatus.PENDING:
        return 'Pending';
      case ApprovalStatus.APPROVED:
        return 'Approved';
      case ApprovalStatus.REJECTED:
        return 'Rejected';
      case ApprovalStatus.CANCELLED:
        return 'Cancelled';
    }
  };

  const getStepText = (step: ApprovalStep) => {
    switch (step) {
      case ApprovalStep.REVIEW:
        return 'Review';
      case ApprovalStep.FINANCIAL:
        return 'Financial Review';
      case ApprovalStep.TECHNICAL:
        return 'Technical Review';
      case ApprovalStep.FINAL:
        return 'Final Approval';
    }
  };

  return (
    <div className="space-y-6">
      {/* Create new request */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Request Approval
        </h3>

        <form onSubmit={handleCreateRequest} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Financial review for Q1 project"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context for this approval request..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={isCreating || !title.trim()}
            className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? 'Creating...' : 'Create Request'}
          </button>
        </form>
      </div>

      {/* Approval requests */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Approval Requests
        </h3>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : approvals.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-white rounded-lg shadow">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>No approval requests yet</p>
            <p className="text-sm">Create a request to start the approval workflow</p>
          </div>
        ) : (
          approvals.map((approval) => (
            <div key={approval.id} className="bg-white rounded-lg shadow p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-lg font-semibold text-gray-900">
                      {approval.title}
                    </h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(approval.status)}`}>
                      {getStatusText(approval.status)}
                    </span>
                  </div>
                  {approval.description && (
                    <p className="text-sm text-gray-600">{approval.description}</p>
                  )}
                </div>

                {approval.status === ApprovalStatus.PENDING && (
                  <button
                    onClick={() => handleCancel(approval)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Current Step</span>
                  <span className="font-medium">{getStepText(approval.current_step)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${([ApprovalStep.REVIEW, ApprovalStep.FINANCIAL, ApprovalStep.TECHNICAL, ApprovalStep.FINAL].indexOf(approval.current_step) + 1) * 25}%`
                    }}
                  />
                </div>
              </div>

              {/* Actions */}
              {approval.status === ApprovalStatus.PENDING && (
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => handleApprove(approval)}
                    className="flex-1 px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(approval)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-md hover:bg-red-700"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleRequestChanges(approval)}
                    className="flex-1 px-4 py-2 bg-yellow-600 text-white font-medium rounded-md hover:bg-yellow-700"
                  >
                    Request Changes
                  </button>
                </div>
              )}

              {/* Action history */}
              {approval.actions && approval.actions.length > 0 && (
                <div className="border-t pt-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">
                    Action History
                  </h5>
                  <div className="space-y-2">
                    {approval.actions.map((action) => (
                      <div key={action.id} className="flex items-start gap-2 text-sm">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          {action.user?.name?.[0] || '?'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">
                              {action.user?.name || 'Unknown'}
                            </span>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                              action.action === 'approve'
                                ? 'bg-green-100 text-green-700'
                                : action.action === 'reject'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {action.action}
                            </span>
                          </div>
                          {action.comment && (
                            <p className="text-gray-600 mt-1">{action.comment}</p>
                          )}
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(action.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comment for request changes */}
              {approval.status === ApprovalStatus.PENDING && (
                <div className="mt-4">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add a comment (optional)..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}