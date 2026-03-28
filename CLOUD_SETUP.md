# Cloud Project Management Setup Guide

This guide will help you set up Supabase for the cloud project management system.

## Prerequisites

- Node.js 18+ and npm installed
- A Supabase account (free tier is sufficient)

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign in with GitHub or create an account
4. Click "New Project"
5. Fill in the project details:
   - **Name**: ESS Financial (or any name you prefer)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose a region closest to your users
6. Wait for the project to be provisioned (usually 1-2 minutes)

## Step 2: Get Your API Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public**: A long JWT key

## Step 3: Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and paste your credentials:
   ```env
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## Step 4: Set Up the Database Schema

### Option A: Use the Supabase Dashboard (Recommended for Quick Setup)

1. Go to **SQL Editor** in your Supabase dashboard
2. Click "New Query"
3. Paste and run the following SQL:

```sql
-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  form_data JSONB NOT NULL DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed')),
  collaboration_model VARCHAR(50),
  industry VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  display_name VARCHAR(100),
  avatar_url TEXT,
  company_name VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
-- Users can view their own projects
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own projects
CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own projects
CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own projects
CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for user_profiles
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Option B: Use Supabase CLI (Recommended for Production)

1. Install the Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Link to your project:
   ```bash
   supabase link --project-ref YOUR_PROJECT_ID
   ```

3. Apply the schema:
   ```bash
   supabase db push
   ```

## Step 5: Enable Real-time (Optional)

Real-time updates allow multiple tabs/devices to sync automatically.

1. Go to **Database** → **Replication** in your Supabase dashboard
2. Find the `projects` table
3. Toggle **Realtime** to ON
4. Select the tables you want to enable (just `projects` is fine)

## Step 6: Configure Authentication

1. Go to **Authentication** → **Settings**
2. Configure your site URL:
   - **Site URL**: `http://localhost:5173` (for development)
   - **Redirect URLs**: Add `http://localhost:5173/**`
3. Enable email authentication:
   - **Enable Email provider**: ON
   - **Confirm email**: OFF (for development, ON for production)
   - **Secure email change**: ON

## Step 7: Test the Setup

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open your browser to `http://localhost:5173`

3. You should see:
   - A login page (or demo page if you visit `/demo`)
   - Ability to register a new account
   - After login, a project list page
   - Ability to create and edit projects

## Troubleshooting

### "Supabase credentials not found" error
- Make sure `.env.local` exists and contains valid values
- Restart the dev server after creating `.env.local`

### "Row level security policy violation" errors
- Make sure you ran the SQL to create RLS policies
- Check that your user is logged in

### Real-time updates not working
- Make sure real-time is enabled for the `projects` table
- Check the browser console for subscription errors

### Projects not saving
- Check the browser console for errors
- Make sure the `form_data` column accepts JSONB
- Verify RLS policies allow inserts

## Production Deployment

When deploying to production:

1. Update your environment variables with production values
2. Update the Site URL in Supabase authentication settings
3. Enable email confirmation
4. Consider setting up custom SMTP for emails
5. Review and tighten RLS policies if needed
6. Enable database backups in Supabase settings

## Next Steps

- Set up custom email templates
- Configure additional authentication providers (Google, GitHub, etc.)
- Set up database functions for complex queries
- Consider using Supabase Edge Functions for server-side logic
- Monitor usage in Supabase dashboard

## Support

- Supabase Documentation: https://supabase.com/docs
- Supabase Discord: https://supabase.com/docs/discord
- GitHub Issues: https://github.com/supabase/supabase/issues
