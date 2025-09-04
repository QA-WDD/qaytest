-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_case_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bug_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bug_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bug_comments ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all users" ON public.users FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update all users" ON public.users FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Projects policies
CREATE POLICY "Users can view projects they are members of" ON public.projects FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.project_members WHERE project_id = id AND user_id = auth.uid())
  OR created_by = auth.uid()
);
CREATE POLICY "Project leads and admins can update projects" ON public.projects FOR UPDATE USING (
  created_by = auth.uid() OR
  EXISTS (SELECT 1 FROM public.project_members pm JOIN public.users u ON pm.user_id = u.id 
          WHERE pm.project_id = id AND pm.user_id = auth.uid() AND (u.role = 'admin' OR pm.role = 'lead'))
);
CREATE POLICY "Admins and leads can create projects" ON public.projects FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'lead'))
);

-- Project members policies
CREATE POLICY "Users can view project members for their projects" ON public.project_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.project_members WHERE project_id = project_members.project_id AND user_id = auth.uid())
);
CREATE POLICY "Project leads and admins can manage project members" ON public.project_members FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users u JOIN public.project_members pm ON u.id = pm.user_id 
          WHERE pm.project_id = project_members.project_id AND pm.user_id = auth.uid() AND (u.role = 'admin' OR pm.role = 'lead'))
);

-- Test cases policies
CREATE POLICY "Users can view test cases for their projects" ON public.test_cases FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.project_members WHERE project_id = test_cases.project_id AND user_id = auth.uid())
);
CREATE POLICY "Users can create test cases for their projects" ON public.test_cases FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.project_members WHERE project_id = test_cases.project_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update test cases they created or leads/admins can update any" ON public.test_cases FOR UPDATE USING (
  created_by = auth.uid() OR
  EXISTS (SELECT 1 FROM public.project_members pm JOIN public.users u ON pm.user_id = u.id 
          WHERE pm.project_id = test_cases.project_id AND pm.user_id = auth.uid() AND (u.role = 'admin' OR pm.role = 'lead'))
);

-- Test case history policies
CREATE POLICY "Users can view test case history for their projects" ON public.test_case_history FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.test_cases tc JOIN public.project_members pm ON tc.project_id = pm.project_id 
          WHERE tc.id = test_case_history.test_case_id AND pm.user_id = auth.uid())
);
CREATE POLICY "Users can insert test case history" ON public.test_case_history FOR INSERT WITH CHECK (
  changed_by = auth.uid()
);

-- Test executions policies
CREATE POLICY "Users can view test executions for their projects" ON public.test_executions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.test_cases tc JOIN public.project_members pm ON tc.project_id = pm.project_id 
          WHERE tc.id = test_executions.test_case_id AND pm.user_id = auth.uid())
);
CREATE POLICY "Users can create test executions for their projects" ON public.test_executions FOR INSERT WITH CHECK (
  executed_by = auth.uid() AND
  EXISTS (SELECT 1 FROM public.test_cases tc JOIN public.project_members pm ON tc.project_id = pm.project_id 
          WHERE tc.id = test_executions.test_case_id AND pm.user_id = auth.uid())
);

-- Bugs policies
CREATE POLICY "Users can view bugs for their projects" ON public.bugs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.project_members WHERE project_id = bugs.project_id AND user_id = auth.uid())
);
CREATE POLICY "Users can create bugs for their projects" ON public.bugs FOR INSERT WITH CHECK (
  reported_by = auth.uid() AND
  EXISTS (SELECT 1 FROM public.project_members WHERE project_id = bugs.project_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update bugs they reported or are assigned to, leads/admins can update any" ON public.bugs FOR UPDATE USING (
  reported_by = auth.uid() OR assigned_to = auth.uid() OR
  EXISTS (SELECT 1 FROM public.project_members pm JOIN public.users u ON pm.user_id = u.id 
          WHERE pm.project_id = bugs.project_id AND pm.user_id = auth.uid() AND (u.role = 'admin' OR pm.role = 'lead'))
);

-- Bug history policies
CREATE POLICY "Users can view bug history for their projects" ON public.bug_history FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.bugs b JOIN public.project_members pm ON b.project_id = pm.project_id 
          WHERE b.id = bug_history.bug_id AND pm.user_id = auth.uid())
);
CREATE POLICY "Users can insert bug history" ON public.bug_history FOR INSERT WITH CHECK (
  changed_by = auth.uid()
);

-- Bug attachments policies
CREATE POLICY "Users can view bug attachments for their projects" ON public.bug_attachments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.bugs b JOIN public.project_members pm ON b.project_id = pm.project_id 
          WHERE b.id = bug_attachments.bug_id AND pm.user_id = auth.uid())
);
CREATE POLICY "Users can upload bug attachments" ON public.bug_attachments FOR INSERT WITH CHECK (
  uploaded_by = auth.uid()
);

-- Bug comments policies
CREATE POLICY "Users can view bug comments for their projects" ON public.bug_comments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.bugs b JOIN public.project_members pm ON b.project_id = pm.project_id 
          WHERE b.id = bug_comments.bug_id AND pm.user_id = auth.uid())
);
CREATE POLICY "Users can create bug comments" ON public.bug_comments FOR INSERT WITH CHECK (
  created_by = auth.uid()
);
CREATE POLICY "Users can update their own comments" ON public.bug_comments FOR UPDATE USING (
  created_by = auth.uid()
);
