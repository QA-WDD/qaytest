-- Fix recursive RLS on public.project_members

-- Helper: is user a member of a project?
CREATE OR REPLACE FUNCTION public.is_project_member(pid uuid, uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members pm WHERE pm.project_id = pid AND pm.user_id = uid
  );
$$;

-- Helper: is user lead on the project or admin globally?
CREATE OR REPLACE FUNCTION public.is_project_lead_or_admin(pid uuid, uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin(uid) OR EXISTS (
    SELECT 1 FROM public.project_members pm WHERE pm.project_id = pid AND pm.user_id = uid AND pm.role = 'lead'
  );
$$;

-- Replace policies that referenced project_members inside itself (causing recursion)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'project_members' AND policyname = 'Users can view project members for their projects'
  ) THEN
    DROP POLICY "Users can view project members for their projects" ON public.project_members;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'project_members' AND policyname = 'Project leads and admins can manage project members'
  ) THEN
    DROP POLICY "Project leads and admins can manage project members" ON public.project_members;
  END IF;

  -- View policy (no recursion)
  CREATE POLICY "Users can view project members for their projects" ON public.project_members
    FOR SELECT
    USING (
      public.is_project_member(project_members.project_id, auth.uid())
    );

  -- Manage policy (no recursion)
  CREATE POLICY "Project leads and admins can manage project members" ON public.project_members
    FOR ALL
    USING (
      public.is_project_lead_or_admin(project_members.project_id, auth.uid())
    );
END $$;


