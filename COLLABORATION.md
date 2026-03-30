# Collaboration Features Guide

## Overview

The ESS Financial platform includes enterprise-grade collaboration features for team projects:

- **Project Sharing** - Share projects with specific users or via public links
- **Permission Control** - Fine-grained access control (view, edit, admin)
- **Comments & Discussions** - Threaded comments with resolution tracking
- **Approval Workflows** - Multi-step approval process with role-based requirements
- **Real-time Updates** - Instant sync across all connected clients

## Project Sharing

### Share with Users

```typescript
import { useProjectSharing } from '@/hooks/useCollaboration';

function ProjectShareButton({ projectId }) {
  const { shareWithUser } = useProjectSharing(projectId);

  const handleShare = async () => {
    await shareWithUser(
      'user-id',
      'edit', // permission: 'view' | 'edit' | 'admin'
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // expires in 7 days
    );
  };

  return <button onClick={handleShare}>Share Project</button>;
}
```

### Create Public Links

```typescript
const { createPublicLink } = useProjectSharing(projectId);

const handleCreateLink = async () => {
  const share = await createPublicLink(
    'view',
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // expires in 30 days
  );

  // Share link: https://yourapp.com/shared/{share_token}
  console.log('Share token:', share.share_token);
};
```

### Permission Levels

- **View** - Can only view the project
- **Edit** - Can modify project parameters
- **Admin** - Full control including sharing and deletion

### Access Shared Projects

```typescript
import { useSharedProjects } from '@/hooks/useCollaboration';

function SharedProjectsList() {
  const { sharedProjects, loading } = useSharedProjects();

  return (
    <div>
      {sharedProjects.map(share => (
        <div key={share.id}>
          <h3>{share.project?.name}</h3>
          <p>Shared by: {share.shared_by_user?.name}</p>
          <p>Permission: {share.permission}</p>
        </div>
      ))}
    </div>
  );
}
```

## Comments & Discussions

### Add Comments

```typescript
import { useProjectComments } from '@/hooks/useCollaboration';

function CommentsPanel({ projectId }) {
  const { comments, addComment, toggleResolved } = useProjectComments(projectId);

  const handleAddComment = async () => {
    await addComment('This looks good! Great work on the IRR calculation.');
  };

  return (
    <div>
      {comments.map(comment => (
        <div key={comment.id}>
          <p>{comment.content}</p>
          <button onClick={() => toggleResolved(comment.id)}>
            {comment.resolved ? 'Mark Unresolved' : 'Mark Resolved'}
          </button>
        </div>
      ))}
      <button onClick={handleAddComment}>Add Comment</button>
    </div>
  );
}
```

### Threaded Replies

```typescript
const handleAddReply = async (parentCommentId: string) => {
  await addComment('I agree with this point.', parentCommentId);
};
```

### Comment Features

- **Threaded Discussions** - Reply to any comment
- **Resolution Tracking** - Mark comments as resolved/unresolved
- **Real-time Updates** - See new comments instantly
- **User Mentions** - Notify team members (with `@username`)
- **Timestamps** - Track when comments were made

## Approval Workflows

### Create Approval Request

```typescript
import { useApprovalWorkflow } from '@/hooks/useCollaboration';

function ApprovalButton({ projectId }) {
  const { createRequest } = useApprovalWorkflow(projectId);

  const handleRequestApproval = async () => {
    await createRequest(
      'Financial Review Required',
      'Please review the IRR and NPV calculations for Q1 project',
      { projectId, region: 'East' }
    );
  };

  return <button onClick={handleRequestApproval}>Request Approval</button>;
}
```

### Approval Process

The workflow goes through multiple steps:

1. **Review** - Initial review by managers
2. **Financial** - Financial analysis review
3. **Technical** - Technical parameters validation
4. **Final** - Final approval by admins

### Take Action on Requests

```typescript
const { approvals, addAction } = useApprovalWorkflow(projectId);

const handleApprove = async (approvalId: string) => {
  await addAction(approvalId, 'approve', 'Looks good, approved!');
};

const handleReject = async (approvalId: string) => {
  await addAction(approvalId, 'reject', 'Please revise the calculations');
};

const handleRequestChanges = async (approvalId: string) => {
  await addAction(approvalId, 'request_changes', 'Update the discount rate');
};
```

### Approval Status

- **Pending** - Awaiting approval
- **Approved** - All steps completed successfully
- **Rejected** - Request was rejected
- **Cancelled** - Request was cancelled

## Real-time Features

All collaboration features support real-time updates:

```typescript
// Automatically updates when:
// - New comments are added
// - Permissions are changed
// - Approval status changes
// - Projects are shared

// No manual refresh needed!
const { comments } = useProjectComments(projectId, {
  autoRefresh: true // enabled by default
});
```

## UI Components

### Share Dialog

```typescript
import { ShareDialog } from '@/components/collaboration/ShareDialog';

function ProjectToolbar({ projectId, projectName }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Share Project</button>
      <ShareDialog
        projectId={projectId}
        projectName={projectName}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
```

### Comments Panel

```typescript
import { CommentsPanel } from '@/components/collaboration/CommentsPanel';

function ProjectDetail({ projectId }) {
  const [showComments, setShowComments] = useState(false);

  return (
    <>
      <button onClick={() => setShowComments(true)}>
        Comments ({commentCount})
      </button>
      <CommentsPanel
        projectId={projectId}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
      />
    </>
  );
}
```

### Approval Workflow

```typescript
import { ApprovalWorkflow } from '@/components/collaboration/ApprovalWorkflow';

function ApprovalsTab({ projectId, projectName }) {
  return (
    <div>
      <h2>Approvals</h2>
      <ApprovalWorkflow projectId={projectId} projectName={projectName} />
    </div>
  );
}
```

## Security & Permissions

### Row-Level Security

All collaboration features respect Row-Level Security (RLS):

- Users can only see projects shared with them
- Permission checks are enforced server-side
- Audit logs track all sharing activities

### Audit Trail

Every collaboration action is logged:

```typescript
// Automatically logged:
// - Who shared a project
// - Who was granted access
// - When permissions changed
// - All comments and approvals
```

## Best Practices

### 1. Use Appropriate Permissions

```typescript
// ✅ Good - Minimum required permission
await shareWithUser(userId, 'view');

// ❌ Bad - Over-permissioning
await shareWithUser(userId, 'admin'); // Only if really needed
```

### 2. Set Expiration Dates

```typescript
// ✅ Good - Temporary access
await shareWithUser(userId, 'edit', expiresAt);

// ❌ Bad - Permanent access when not needed
await shareWithUser(userId, 'edit'); // No expiration
```

### 3. Use Approval Workflows

```typescript
// ✅ Good - Proper approval for important changes
await createRequest('Budget Increase', 'Needs CFO approval');

// ❌ Bad - Making changes without approval
// Directly modifying sensitive parameters
```

### 4. Keep Comments Organized

```typescript
// ✅ Good - Resolve old comments
await toggleResolved(commentId);

// ✅ Good - Use threaded replies
await addComment('I agree', parentCommentId);

// ❌ Bad - Leaving many unresolved comments
```

## Database Schema

### Shares Table

```sql
CREATE TABLE shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  shared_by_user_id UUID NOT NULL REFERENCES users(id),
  shared_to_user_id UUID REFERENCES users(id),
  share_token TEXT UNIQUE,
  permission TEXT NOT NULL DEFAULT 'view',
  expires_at TIMESTAMPTZ,
  access_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Comments Table

```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  mentions TEXT[],
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Approval Tables

```sql
CREATE TABLE approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  requested_by_user_id UUID NOT NULL REFERENCES users(id),
  current_step TEXT NOT NULL DEFAULT 'review',
  status TEXT NOT NULL DEFAULT 'pending',
  title TEXT NOT NULL,
  description TEXT,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE approval_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_request_id UUID NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  comment TEXT,
  step TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Troubleshooting

### Share Link Not Working

**Problem**: Public share link shows "Not Found"
**Solution**:
1. Check if share has expired
2. Verify the token is correct
3. Check if project still exists

### Can't Add Comments

**Problem**: Comment button is disabled
**Solution**:
1. Verify you have permission to comment
2. Check if project is shared with you
3. Ensure you're logged in

### Approval Stuck

**Problem**: Approval not advancing to next step
**Solution**:
1. Check if required approvers have acted
2. Verify role permissions
3. Contact admin for manual override

## API Reference

### Share Repository

```typescript
class ShareRepository {
  shareProject(projectId, userId, options): Promise<Share>
  createPublicShare(projectId, userId, options): Promise<Share>
  getByToken(token): Promise<Share>
  getUserSharedProjects(userId): Promise<Share[]>
  updatePermission(shareId, permission): Promise<Share>
  revokeShare(shareId): Promise<boolean>
  checkAccess(projectId, userId): Promise<{hasAccess, permission}>
}
```

### Comment Repository

```typescript
class CommentRepository {
  findByProject(projectId): Promise<Comment[]>
  create(comment): Promise<Comment>
  update(id, updates): Promise<Comment>
  delete(id): Promise<boolean>
  toggleResolved(id): Promise<Comment>
}
```

### Approval Repository

```typescript
class ApprovalRepository {
  createRequest(options): Promise<ApprovalRequest>
  getRequest(id): Promise<ApprovalRequest>
  getProjectRequests(projectId): Promise<ApprovalRequest[]>
  addAction(options): Promise<ApprovalAction>
  cancelRequest(id): Promise<ApprovalRequest>
}
```

## Support

For collaboration feature issues:
1. Check user permissions
2. Verify project sharing status
3. Review audit logs
4. Contact team admin

## License

Proprietary - All rights reserved