/**
 * Share Dialog Component
 *
 * Modal dialog for sharing projects with users
 */

import React, { useState } from 'react';
import { useProjectSharing } from '../../hooks/useCollaboration';
import { SharePermission } from '../../repositories/ShareRepository';

interface ShareDialogProps {
  projectId: string;
  projectName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareDialog({ projectId, projectName, isOpen, onClose }: ShareDialogProps) {
  const { shares, loading, shareWithUser, createPublicLink, updatePermission, revokeShare } =
    useProjectSharing(projectId);

  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<SharePermission>('view');
  const [expiresIn, setExpiresIn] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) return;

    setIsCreating(true);

    try {
      const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000) : undefined;

      // For demo purposes, we'll create a user ID from email
      // In production, you'd look up the actual user
      const userId = `user-${email.replace(/[^a-zA-Z0-9]/g, '')}`;

      await shareWithUser(userId, permission, expiresAt);

      setEmail('');
      setExpiresIn(null);
    } catch (error) {
      console.error('Failed to share project:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreatePublicLink = async () => {
    setIsCreating(true);

    try {
      const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000) : undefined;

      const share = await createPublicLink(permission, expiresAt);

      // Copy link to clipboard
      const link = `${window.location.origin}/shared/${share.share_token}`;
      await navigator.clipboard.writeText(link);

      alert(`Share link copied to clipboard:\n${link}`);
    } catch (error) {
      console.error('Failed to create share link:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdatePermission = async (shareId: string, newPermission: SharePermission) => {
    try {
      await updatePermission(shareId, newPermission);
    } catch (error) {
      console.error('Failed to update permission:', error);
    }
  };

  const handleRevoke = async (shareId: string) => {
    if (confirm('Are you sure you want to revoke this share?')) {
      try {
        await revokeShare(shareId);
      } catch (error) {
        console.error('Failed to revoke share:', error);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Dialog panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Share "{projectName}"
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            {/* Share with user */}
            <form onSubmit={handleShare} className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Share with user
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <select
                  value={permission}
                  onChange={(e) => setPermission(e.target.value as SharePermission)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="view">Can view</option>
                  <option value="edit">Can edit</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex gap-2 mb-3">
                <select
                  value={expiresIn || ''}
                  onChange={(e) => setExpiresIn(e.target.value ? Number(e.target.value) : null)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">No expiration</option>
                  <option value="1">Expires in 1 day</option>
                  <option value="7">Expires in 7 days</option>
                  <option value="30">Expires in 30 days</option>
                </select>
                <button
                  type="submit"
                  disabled={isCreating || !email}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Share
                </button>
              </div>
            </form>

            {/* Create public link */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Or create a public share link
              </h4>
              <div className="flex gap-2">
                <select
                  value={permission}
                  onChange={(e) => setPermission(e.target.value as SharePermission)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="view">Can view</option>
                  <option value="edit">Can edit</option>
                </select>
                <button
                  onClick={handleCreatePublicLink}
                  disabled={isCreating}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Link
                </button>
              </div>
            </div>

            {/* Existing shares */}
            {shares.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  People with access
                </h4>
                <div className="space-y-2">
                  {shares.map((share) => (
                    <div
                      key={share.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm font-medium text-gray-900">
                            {share.shared_to_user?.name || 'Public Link'}
                          </span>
                        </div>
                        {share.expires_at && (
                          <div className="text-xs text-gray-500 mt-1">
                            Expires {new Date(share.expires_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={share.permission}
                          onChange={(e) =>
                            handleUpdatePermission(share.id, e.target.value as SharePermission)
                          }
                          className="text-sm px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="view">View</option>
                          <option value="edit">Edit</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          onClick={() => handleRevoke(share.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}