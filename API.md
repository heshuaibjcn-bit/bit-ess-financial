# API Security Guide

## Overview

The ESS Financial platform uses tRPC for type-safe, secure API communication:

- **End-to-End Type Safety** - Types shared between client and server
- **Automatic Validation** - Zod schema validation
- **Protected Procedures** - Authentication required by default
- **Role-Based Access** - Permission checks on every endpoint
- **Input Sanitization** - Automatic data sanitization
- **Error Handling** - Structured error responses

## Installation

```bash
npm install @trpc/server @trpc/client @trpc/react-query @tanstack/react-query
npm install @trpc/next
npm install zod superjson
```

## Server Setup

### Basic tRPC Server

```typescript
import { initTRPC } from '@trpc/server';

const t = initTRPC.context<Context>().create();

export const appRouter = t.router({
  hello: t.procedure
    .input(z.object({ name: z.string() }))
    .query(({ input }) => {
      return { greeting: `Hello ${input.name}!` };
    }),
});

export type AppRouter = typeof appRouter;
```

### Protected Procedures

Require authentication:

```typescript
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new Error('Not authenticated');
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthed);
```

## Client Setup

### Initialize tRPC Client

```typescript
import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: '/api/trpc',
    }),
  ],
});
```

### Provider Setup

```typescript
import { TRPCProvider } from '@/client/trpc';

function App() {
  return (
    <TRPCProvider>
      <YourApp />
    </TRPCProvider>
  );
}
```

## Usage Examples

### Query Data

```typescript
import { trpc } from '@/client/trpc';

function ProjectList() {
  const { data, isLoading } = trpc.project.list.useQuery({
    includeDemo: false,
    limit: 20,
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {data?.map(project => (
        <div key={project.id}>{project.name}</div>
      ))}
    </div>
  );
}
```

### Create Data

```typescript
function CreateProject() {
  const mutation = trpc.project.create.useMutation();

  const handleSubmit = async (data: ProjectInput) => {
    try {
      const result = await mutation.mutateAsync({
        name: 'My Project',
        input: data,
        saveToDatabase: true,
      });

      console.log('Project created:', result);
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  return <button onClick={handleSubmit}>Create Project</button>;
}
```

### Update Data

```typescript
function UpdateProject({ projectId }: { projectId: string }) {
  const mutation = trpc.project.update.useMutation();

  const handleUpdate = async () => {
    await mutation.mutateAsync({
      id: projectId,
      name: 'Updated Name',
    });
  };

  return <button onClick={handleUpdate}>Update</button>;
}
```

### Delete Data

```typescript
function DeleteProject({ projectId }: { projectId: string }) {
  const mutation = trpc.project.delete.useMutation();

  const handleDelete = async () => {
    await mutation.mutateAsync({ id: projectId });
  };

  return <button onClick={handleDelete}>Delete</button>;
}
```

## API Endpoints

### Project Endpoints

```typescript
// List projects
trpc.project.list.useQuery({ includeDemo: false, limit: 50 })

// Get single project
trpc.project.byId.useQuery({ id: 'project-id' })

// Create project
trpc.project.create.useMutation({ name, input, saveToDatabase })

// Update project
trpc.project.update.useMutation({ id, name, description })

// Delete project
trpc.project.delete.useMutation({ id })

// Clone project
trpc.project.clone.useMutation({ id, newName })

// Get statistics
trpc.project.statistics.useQuery()

// Search projects
trpc.project.search.useMutation({ query, limit, offset })
```

### User Endpoints

```typescript
// Get current user
trpc.user.me.useQuery()

// Get user with stats
trpc.user.meWithStats.useQuery()

// Update profile
trpc.user.update.useMutation({ name, avatar_url })

// Change password
trpc.user.changePassword.useMutation({ currentPassword, newPassword })

// Update role (admin only)
trpc.user.updateRole.useMutation({ userId, role })

// Search users
trpc.user.search.useMutation({ query, limit })
```

### Calculation Endpoints

```typescript
// Calculate metrics
trpc.calculation.calculate.useMutation(input)

// Calculate with benchmark
trpc.calculation.calculateWithBenchmark.useMutation(input)

// Sensitivity analysis
trpc.calculation.sensitivityAnalysis.useMutation({ input, parameter, range })

// Multi-parameter sensitivity
trpc.calculation.multiParameterSensitivity.useMutation({ input, parameters })

// Scenario analysis
trpc.calculation.scenarioAnalysis.useMutation({ scenarios })

// Get benchmarks
trpc.calculation.benchmarks.useQuery()

// Compare with specific benchmark
trpc.calculation.compareBenchmark.useMutation({ input, result, benchmarkId })
```

### Collaboration Endpoints

```typescript
// Share project
trpc.collaboration.shareProject.useMutation({ projectId, userId, permission, expiresAt })

// Create public link
trpc.collaboration.createPublicLink.useMutation({ projectId, permission, expiresAt })

// Get shared projects
trpc.collaboration.getSharedProjects.useQuery()

// Get project shares
trpc.collaboration.getProjectShares.useQuery({ projectId })

// Update permission
trpc.collaboration.updateSharePermission.useMutation({ shareId, permission })

// Revoke share
trpc.collaboration.revokeShare.useMutation({ shareId })

// Get comments
trpc.collaboration.getComments.useQuery({ projectId })

// Add comment
trpc.collaboration.addComment.useMutation({ projectId, content, parentId, mentions })

// Update comment
trpc.collaboration.updateComment.useMutation({ commentId, content })

// Delete comment
trpc.collaboration.deleteComment.useMutation({ commentId })

// Toggle resolved
trpc.collaboration.toggleCommentResolved.useMutation({ commentId })

// Create approval request
trpc.collaboration.createApprovalRequest.useMutation({ projectId, title, description, data })

// Get approval requests
trpc.collaboration.getApprovalRequests.useQuery({ projectId })

// Get pending approvals
trpc.collaboration.getPendingApprovals.useQuery()

// Add approval action
trpc.collaboration.addApprovalAction.useMutation({ approvalRequestId, action, comment })

// Cancel approval request
trpc.collaboration.cancelApprovalRequest.useMutation({ approvalRequestId })
```

## Input Validation

### Zod Schemas

```typescript
import { z } from 'zod';

const CreateProjectInput = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  capacity: z.number().positive(),
  investment: z.number().positive(),
});

// Type is automatically inferred
type CreateProjectInput = z.infer<typeof CreateProjectInput>;
```

### Validation in Procedures

```typescript
create: protectedProcedure
  .input(CreateProjectInput)
  .mutation(async ({ input }) => {
    // input is validated and type-safe
    const project = await createProject(input);
    return project;
  });
```

## Error Handling

### Server-Side Errors

```typescript
throw new TRPCError({
  code: 'NOT_FOUND',
  message: 'Project not found',
});

throw new TRPCError({
  code: 'FORBIDDEN',
  message: 'You do not have permission',
});

throw new TRPCError({
  code: 'UNAUTHORIZED',
  message: 'Invalid credentials',
});

throw new TRPCError({
  code: 'BAD_REQUEST',
  message: 'Invalid input',
});
```

### Client-Side Error Handling

```typescript
const mutation = trpc.project.create.useMutation();

try {
  await mutation.mutateAsync(data);
} catch (error) {
  if (error instanceof TRPCClientError) {
    console.error('Error:', error.message);
  }
}
```

## Security Features

### Authentication

All protected procedures require valid authentication:

```typescript
export const protectedProcedure = t.procedure
  .use(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Not authenticated',
      });
    }
    return next();
  });
```

### Authorization

Check user permissions:

```typescript
.use(async ({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin access required',
    });
  }
  return next();
})
```

### Input Sanitization

All inputs are validated and sanitized:

```typescript
.input(z.object({
  name: z.string().max(200).transform(s => s.trim()),
  email: z.string().email(),
}))
```

### Rate Limiting

Implement rate limiting on protected endpoints:

```typescript
.use(async ({ ctx, next }) => {
  const rateLimit = await checkRateLimit(ctx.user.id);

  if (!rateLimit.allowed) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: 'Rate limit exceeded',
    });
  }

  return next();
})
```

## Best Practices

### 1. Use Protected Procedures by Default

```typescript
// ✅ Good - Protected by default
export const appRouter = t.router({
  project: t.router({
    create: protectedProcedure.mutation(/* ... */),
    update: protectedProcedure.mutation(/* ... */),
  }),
});

// ❌ Bad - Public endpoints
export const appRouter = t.router({
  project: t.router({
    create: t.procedure.mutation(/* ... */),  // No auth!
  }),
});
```

### 2. Validate All Inputs

```typescript
// ✅ Good - Validated input
.input(z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
}))

// ❌ Bad - No validation
.input(z.any())
```

### 3. Handle Errors Gracefully

```typescript
// ✅ Good - Specific error codes
if (!project) {
  throw new TRPCError({
    code: 'NOT_FOUND',
    message: 'Project not found',
  });
}

// ❌ Bad - Generic error
if (!project) {
  throw new Error('Not found');
}
```

### 4. Use TypeScript for Type Safety

```typescript
// ✅ Good - Type-safe
const result = await trpc.project.byId.useQuery({ id: projectId });
// result.data is properly typed

// ❌ Bad - No type safety
const response = await fetch(`/api/projects/${projectId}`);
const data = await response.json(); // unknown type
```

## Performance Tips

### 1. Enable Batching

tRPC automatically batches requests:

```typescript
links: [
  httpBatchLink({
    url: '/api/trpc',
  }),
]
```

### 2. Use React Query Caching

```typescript
const utils = trpc.useContext();

// Invalidate related queries
utils.project.list.invalidate();
utils.project.statistics.invalidate();
```

### 3. Optimize Re-renders

```typescript
// Select only needed data
const { data: projects } = trpc.project.list.useQuery(
  { limit: 50 },
  {
    select: (data) => data.map(p => ({ id: p.id, name: p.name })),
  }
);
```

## Troubleshooting

### Type Errors

**Problem**: Type mismatches between client and server
**Solution**:
```bash
# Regenerate types
npm run generate-types
```

### Network Errors

**Problem**: API calls failing
**Solution**:
1. Check server is running
2. Verify API URL is correct
3. Check browser console for errors
4. Verify authentication token

### Validation Errors

**Problem**: Input validation failing
**Solution**:
1. Check Zod schema matches input
2. Verify input data structure
3. Check for required fields
4. Validate data types

## API Reference

### Error Codes

- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `BAD_REQUEST` - Invalid input
- `TOO_MANY_REQUESTS` - Rate limit exceeded
- `INTERNAL_SERVER_ERROR` - Server error

### HTTP Status Codes

- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## Support

For API issues:
1. Check tRPC documentation
2. Verify input schemas
3. Check server logs
4. Review error messages

## License

Proprietary - All rights reserved
