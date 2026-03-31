-- PROJ-5: Add email column to profiles table
-- The admin API reads email from profiles but the column was missing.
-- Also updates handle_new_user trigger to store email on signup.

-- ============================================================
-- 1. Add email column to profiles
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Index for admin search by email
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- ============================================================
-- 2. Backfill email from auth.users for existing rows
-- ============================================================
UPDATE profiles
SET email = auth.users.email
FROM auth.users
WHERE profiles.id = auth.users.id;

-- ============================================================
-- 3. Update trigger to store email on new signups
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
