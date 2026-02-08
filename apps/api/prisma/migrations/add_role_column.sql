-- Add role column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'viewer';

-- Add check constraint for valid roles
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('admin', 'viewer'));

-- Update existing users to admin (first user should be admin)
UPDATE profiles SET role = 'admin' WHERE role IS NULL LIMIT 1;
