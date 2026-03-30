-- PROJ-5 BUG-5: Fix recursive RLS policies on the profiles table.
--
-- The original "Admins can read/update/delete all profiles" policies used:
--   EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
--
-- This subquery hits the `profiles` table from within a `profiles` RLS policy,
-- creating a potential infinite recursion. Supabase/Postgres may short-circuit it,
-- but it is an anti-pattern that can silently break under future Postgres versions.
--
-- Fix: introduce an `is_admin()` SECURITY DEFINER function that bypasses RLS when
-- looking up the caller's own role. Policies then call this function instead of
-- embedding the self-referencing subquery directly.

-- ============================================================
-- 1. Create is_admin() helper — SECURITY DEFINER bypasses RLS
-- ============================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
-- Restrict execution to the owning role only (security best practice)
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

-- ============================================================
-- 2. Drop and recreate admin RLS policies on profiles
--    (same permissions, no recursive subquery)
-- ============================================================

DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
CREATE POLICY "Admins can read all profiles"
  ON profiles
  FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles"
  ON profiles
  FOR UPDATE
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
CREATE POLICY "Admins can delete profiles"
  ON profiles
  FOR DELETE
  USING (is_admin());

-- ============================================================
-- 3. Drop and recreate admin RLS policies on admin_audit_log
--    (same fix — they had the same recursive pattern)
-- ============================================================

DROP POLICY IF EXISTS "Admins can read audit logs" ON admin_audit_log;
CREATE POLICY "Admins can read audit logs"
  ON admin_audit_log
  FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can insert audit logs" ON admin_audit_log;
CREATE POLICY "Admins can insert audit logs"
  ON admin_audit_log
  FOR INSERT
  WITH CHECK (is_admin());
