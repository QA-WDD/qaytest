-- Bug Tracking Application Database Schema
-- Creates comprehensive schema for bug and test case management

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types only if they do not exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'lead', 'tester');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_status') THEN
        CREATE TYPE project_status AS ENUM ('active', 'inactive', 'completed', 'archived');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'test_case_status') THEN
        CREATE TYPE test_case_status AS ENUM ('draft', 'active', 'deprecated');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'test_execution_status') THEN
        CREATE TYPE test_execution_status AS ENUM ('not_executed', 'passed', 'failed', 'blocked', 'skipped');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bug_status') THEN
        CREATE TYPE bug_status AS ENUM ('open', 'in_progress', 'resolved', 'closed', 'reopened');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bug_priority') THEN
        CREATE TYPE bug_priority AS ENUM ('low', 'medium', 'high', 'critical');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bug_severity') THEN
        CREATE TYPE bug_severity AS ENUM ('minor', 'major', 'critical', 'blocker');
    END IF;
END
$$;

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'tester',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  status project_status NOT NULL DEFAULT 'active',
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project members (many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'tester',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Test cases table
CREATE TABLE IF NOT EXISTS public.test_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  preconditions TEXT,
  steps TEXT NOT NULL,
  expected_result TEXT NOT NULL,
  status test_case_status NOT NULL DEFAULT 'draft',
  priority bug_priority NOT NULL DEFAULT 'medium',
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Test case history for tracking changes
CREATE TABLE IF NOT EXISTS public.test_case_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_case_id UUID NOT NULL REFERENCES public.test_cases(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID NOT NULL REFERENCES public.users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Test executions table
CREATE TABLE IF NOT EXISTS public.test_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_case_id UUID NOT NULL REFERENCES public.test_cases(id) ON DELETE CASCADE,
  executed_by UUID NOT NULL REFERENCES public.users(id),
  status test_execution_status NOT NULL DEFAULT 'not_executed',
  actual_result TEXT,
  notes TEXT,
  execution_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bugs table
CREATE TABLE IF NOT EXISTS public.bugs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  test_case_id UUID REFERENCES public.test_cases(id),
  test_execution_id UUID REFERENCES public.test_executions(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  steps_to_reproduce TEXT,
  expected_behavior TEXT,
  actual_behavior TEXT,
  status bug_status NOT NULL DEFAULT 'open',
  priority bug_priority NOT NULL DEFAULT 'medium',
  severity bug_severity NOT NULL DEFAULT 'minor',
  reported_by UUID NOT NULL REFERENCES public.users(id),
  assigned_to UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Bug history for tracking changes
CREATE TABLE IF NOT EXISTS public.bug_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bug_id UUID NOT NULL REFERENCES public.bugs(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID NOT NULL REFERENCES public.users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bug attachments
CREATE TABLE IF NOT EXISTS public.bug_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bug_id UUID NOT NULL REFERENCES public.bugs(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID NOT NULL REFERENCES public.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments for bugs
CREATE TABLE IF NOT EXISTS public.bug_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bug_id UUID NOT NULL REFERENCES public.bugs(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON public.projects(created_by);
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON public.project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_project_id ON public.test_cases(project_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_created_by ON public.test_cases(created_by);
CREATE INDEX IF NOT EXISTS idx_test_case_history_test_case_id ON public.test_case_history(test_case_id);
CREATE INDEX IF NOT EXISTS idx_test_executions_test_case_id ON public.test_executions(test_case_id);
CREATE INDEX IF NOT EXISTS idx_bugs_project_id ON public.bugs(project_id);
CREATE INDEX IF NOT EXISTS idx_bugs_test_case_id ON public.bugs(test_case_id);
CREATE INDEX IF NOT EXISTS idx_bugs_reported_by ON public.bugs(reported_by);
CREATE INDEX IF NOT EXISTS idx_bugs_assigned_to ON public.bugs(assigned_to);
CREATE INDEX IF NOT EXISTS idx_bug_history_bug_id ON public.bug_history(bug_id);
CREATE INDEX IF NOT EXISTS idx_bug_comments_bug_id ON public.bug_comments(bug_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
        CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_projects_updated_at') THEN
        CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_test_cases_updated_at') THEN
        CREATE TRIGGER update_test_cases_updated_at BEFORE UPDATE ON public.test_cases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_bugs_updated_at') THEN
        CREATE TRIGGER update_bugs_updated_at BEFORE UPDATE ON public.bugs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;
