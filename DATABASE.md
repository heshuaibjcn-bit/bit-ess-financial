# Database Integration Guide

## Overview

The ESS Financial platform integrates with Supabase for enterprise-grade database functionality including:

- **PostgreSQL Database** - Reliable, scalable relational database
- **Real-time Subscriptions** - Instant updates across connected clients
- **Row-Level Security (RLS)** - Fine-grained access control
- **Authentication Integration** - Seamless auth-to-database mapping
- **File Storage** - Secure file uploads and serving
- **Type Safety** - Full TypeScript support with auto-generated types

## Setup

### 1. Create Supabase Project

1. Visit [https://supabase.com](https://supabase.com)
2. Create a new project
3. Choose a region close to your users
4. Wait for the project to be provisioned

### 2. Configure Environment Variables

Copy the configuration from your Supabase project settings:

```bash
# .env.local
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**⚠️ Important**: Never commit `SUPABASE_SERVICE_ROLE_KEY` to version control!

### 3. Install Dependencies

```bash
npm install @supabase/supabase-js
```

### 4. Initialize Database Schema

Run the SQL schema setup in your Supabase SQL Editor:

```sql
-- Create tables, indexes, RLS policies
-- See SQL setup script below
```

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  avatar_url TEXT,
  mfa_enabled BOOLEAN DEFAULT FALSE,
  mfa_secret TEXT,
  failed_login_attempts INTEGER DEFAULT 0,
  is_locked BOOLEAN DEFAULT FALSE,
  lock_until TIMESTAMPTZ,
  requires_password_change BOOLEAN DEFAULT FALSE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);
```

### Projects Table

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  province TEXT NOT NULL,
  capacity DECIMAL NOT NULL,
  investment DECIMAL NOT NULL,
  -- ... all project fields
  calculated_irr DECIMAL NOT NULL,
  calculated_npv DECIMAL NOT NULL,
  calculated_payback_period DECIMAL NOT NULL,
  calculated_lcoe DECIMAL NOT NULL,
  is_demo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_calculated_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);

-- RLS Policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);
```

### Audit Logs Table

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES users(id),
  user_role TEXT NOT NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT
);

-- Indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);

-- RLS Policies
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit logs"
  ON audit_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
  ON audit_logs FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'super_admin')
    )
  );
```

### Security Events Table

```sql
CREATE TABLE security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  severity TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES users(id),
  ip_address TEXT,
  user_agent TEXT,
  description TEXT NOT NULL,
  details JSONB,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_security_events_user_id ON security_events(user_id);
CREATE INDEX idx_security_events_timestamp ON security_events(timestamp DESC);
CREATE INDEX idx_security_events_severity ON security_events(severity);

-- RLS Policies
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all security events"
  ON security_events FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'super_admin')
    )
  );
```

## Usage

### Basic Database Operations

```typescript
import { useProjects, useProjectOperations } from '@/hooks/useDatabase';

function ProjectList() {
  const { projects, loading, error, refetch } = useProjects();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {projects.map(project => (
        <div key={project.id}>{project.name}</div>
      ))}
    </div>
  );
}
```

### Creating Projects

```typescript
const { createProject } = useProjectOperations();

const handleCreate = async () => {
  try {
    const project = await createProject(
      'My Project',
      projectInput,
      calculationResult,
      { description: 'Project description' }
    );
    console.log('Project created:', project);
  } catch (error) {
    console.error('Failed to create project:', error);
  }
};
```

### Real-time Updates

```typescript
// Projects automatically update when changes occur in database
const { projects } = useProjects({
  autoRefresh: true,
  refreshInterval: 30000, // 30 seconds
});

// Real-time subscriptions are automatic
// When another client creates/updates/deletes a project,
// your UI will update instantly
```

### Advanced Queries

```typescript
// Using repositories directly
import { projectRepository } from '@/repositories/ProjectRepository';

// Search projects
const results = await projectRepository.search('solar');

// Get user statistics
const stats = await projectRepository.getStatistics(userId);

// Find with calculations
const projectWithCalculations = await projectRepository.findWithCalculations(projectId);
```

## Real-time Features

### Subscribing to Changes

```typescript
import { createRealtimeSubscription } from '@/lib/supabase';

const subscription = createRealtimeSubscription('projects')
  .onInsert((payload) => {
    console.log('New project:', payload.new);
  })
  .onUpdate((payload) => {
    console.log('Project updated:', payload.new);
  })
  .onDelete((payload) => {
    console.log('Project deleted:', payload.old);
  })
  .subscribe();

// Clean up
return () => subscription.unsubscribe();
```

### Filtered Subscriptions

```typescript
const subscription = createRealtimeSubscription('projects')
  .onFilter(
    { user_id: 'eq.user-id' },
    (payload) => console.log('Change:', payload)
  )
  .subscribe();
```

## File Storage

### Upload Files

```typescript
import { storage } from '@/lib/supabase';

const uploadFile = async (file: File) => {
  const path = `reports/${Date.now()}-${file.name}`;
  const result = await storage.upload('documents', path, file);

  if (result) {
    const url = storage.getPublicUrl('documents', result);
    return url;
  }
};
```

### List Files

```typescript
const files = await storage.list('documents', 'reports');
```

### Delete Files

```typescript
await storage.delete('documents', ['file1.pdf', 'file2.pdf']);
```

## Authentication Integration

### Sync Auth User to Database

```typescript
import { userRepository } from '@/repositories/UserRepository';

// Automatically syncs auth user to database
const user = await userRepository.syncAuthUser();
```

### Update User Profile

```typescript
await userRepository.update(userId, {
  name: 'New Name',
  avatar_url: 'https://...',
});
```

## Security Best Practices

### 1. Row-Level Security (RLS)

Always enable RLS on your tables:

```sql
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;
```

### 2. Validate on Backend

Never trust client-side validation:

```typescript
// Backend validation
if (project.user_id !== auth.uid()) {
  throw new Error('Unauthorized');
}
```

### 3. Use Service Role Key Carefully

Only use service role key in secure contexts:

```typescript
// ❌ BAD - Never in client code
const supabase = createClient(url, serviceRoleKey);

// ✅ GOOD - Only in server functions
import { createSupabaseAdminClient } from '@/lib/supabase';
const admin = createSupabaseAdminClient();
```

### 4. Sanitize User Input

Always validate and sanitize:

```typescript
const sanitized = {
  name: input.name.slice(0, 100), // Limit length
  description: input.description?.slice(0, 1000),
};
```

## Monitoring

### Check Database Availability

```typescript
import { useDatabaseAvailable } from '@/hooks/useDatabase';

function DatabaseStatus() {
  const { isAvailable, isChecking } = useDatabaseAvailable();

  if (isChecking) return <div>Checking database...</div>;
  if (!isAvailable) return <div>Database unavailable</div>;

  return <div>Database connected</div>;
}
```

### Error Handling

```typescript
try {
  const result = await projectRepository.create(data);
} catch (error) {
  if (error.code === '23505') {
    // Unique constraint violation
    console.error('Duplicate entry');
  } else if (error.code === '23503') {
    // Foreign key violation
    console.error('Referenced record not found');
  } else {
    console.error('Database error:', error);
  }
}
```

## Troubleshooting

### Connection Issues

**Problem**: Can't connect to Supabase
**Solution**:
1. Check environment variables
2. Verify URL format (https://...)
3. Check network connectivity
4. Ensure project is active

### RLS Issues

**Problem**: Can't access data despite being logged in
**Solution**:
1. Check RLS policies
2. Verify `auth.uid()` matches user ID
3. Test policies in Supabase SQL Editor

### Real-time Issues

**Problem**: Real-time updates not working
**Solution**:
1. Check Realtime is enabled in Supabase
2. Verify table replication is enabled
3. Check browser console for errors
4. Ensure user has permissions

## Performance Tips

### 1. Use Indexes

```sql
CREATE INDEX idx_projects_user_created
  ON projects(user_id, created_at DESC);
```

### 2. Limit Query Results

```typescript
const projects = await projectRepository.findByUserId(userId, {
  limit: 20,
  offset: 0,
});
```

### 3. Select Only Needed Columns

```typescript
const { data } = await supabase
  .from('projects')
  .select('id, name, calculated_irr')
  .eq('user_id', userId);
```

### 4. Use Database Functions

```sql
CREATE OR REPLACE FUNCTION get_user_stats(user_id UUID)
RETURNS JSON AS $$
  SELECT json_build_object(
    'total_projects', COUNT(*),
    'total_investment', SUM(investment)
  )
  FROM projects
  WHERE projects.user_id = get_user_stats.user_id;
$$ LANGUAGE SQL;
```

## Migration

Run migrations in Supabase SQL Editor:

```sql
-- Example migration
ALTER TABLE projects ADD COLUMN benchmark_irr DECIMAL;
CREATE INDEX idx_projects_irr ON projects(calculated_irr);
```

## Backup

### Export Data

```typescript
const { data } = await supabase
  .from('projects')
  .select()
  .csv();

// Download as CSV file
```

### Automated Backups

Supabase automatically backs up your database. Check your project settings for:
- Backup frequency
- Retention period
- Point-in-time recovery

## Support

For issues:
1. Check Supabase dashboard logs
2. Review browser console errors
3. Test queries in SQL Editor
4. Check RLS policies

## License

Proprietary - All rights reserved