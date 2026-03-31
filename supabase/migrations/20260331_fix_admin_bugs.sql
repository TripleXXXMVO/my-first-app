-- PROJ-5: Admin Panel — Bug fixes (BUG-11, BUG-12)

-- ============================================================
-- BUG-11: Fix contradictory NOT NULL + ON DELETE SET NULL on admin_audit_log.admin_id
-- The NOT NULL constraint blocks PostgreSQL from setting admin_id to NULL when
-- an admin user is deleted, causing the deletion to fail entirely.
-- Fix: drop NOT NULL so audit log entries survive admin account deletion.
-- ============================================================
ALTER TABLE admin_audit_log ALTER COLUMN admin_id DROP NOT NULL;

-- ============================================================
-- BUG-12: Add helper function to batch-fetch last_sign_in_at from auth.users
-- Replaces 50 individual getUserById() calls (N+1) with a single SQL query.
-- SECURITY DEFINER runs as the function owner (bypasses RLS on auth schema).
-- ============================================================
CREATE OR REPLACE FUNCTION get_users_last_sign_in(user_ids UUID[])
RETURNS TABLE (id UUID, last_sign_in_at TIMESTAMPTZ)
SECURITY DEFINER
SET search_path = auth, public
LANGUAGE sql
AS $$
  SELECT id, last_sign_in_at FROM auth.users WHERE id = ANY(user_ids);
$$;

-- Only admins (service role) should call this function
REVOKE ALL ON FUNCTION get_users_last_sign_in(UUID[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_users_last_sign_in(UUID[]) TO service_role;
