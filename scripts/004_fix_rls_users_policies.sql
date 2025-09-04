-- Fix recursive RLS on public.users and allow self-insert for profile upsert

-- 1) Helper function to check if current user is admin without triggering recursive policy evaluation
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = uid AND u.role = 'admin'
  );
$$;

-- 2) Replace admin policies on users to use is_admin(auth.uid())
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Admins can view all users'
  ) THEN
    DROP POLICY "Admins can view all users" ON public.users;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Admins can update all users'
  ) THEN
    DROP POLICY "Admins can update all users" ON public.users;
  END IF;

  CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT
    USING ( public.is_admin(auth.uid()) );

  CREATE POLICY "Admins can update all users" ON public.users
    FOR UPDATE
    USING ( public.is_admin(auth.uid()) );
END $$;

-- 3) Allow users to insert their own profile (required for upsert on first login)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Users can insert their own profile'
  ) THEN
    CREATE POLICY "Users can insert their own profile" ON public.users
      FOR INSERT
      WITH CHECK ( auth.uid() = id );
  END IF;
END $$;


