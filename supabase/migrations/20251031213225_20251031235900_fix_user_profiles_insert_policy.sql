/*
  # Fix User Profiles INSERT Policy

  1. Problem
    - Users cannot create their own profile records
    - Existing policy "Users can manage their own profile" uses USING clause only
    - INSERT operations fail because USING checks non-existent row
    - Error: "new row violates row-level security policy for table user_profiles"

  2. Solution
    - Drop the existing combined policy
    - Create separate policies for INSERT, SELECT, UPDATE, DELETE
    - INSERT policy uses WITH CHECK to validate new row
    - Other policies use USING for existing rows

  3. Security
    - Users can only insert their own profile (id = auth.uid())
    - Users can only view/update/delete their own profile
    - Admins retain full access through separate policies
*/

-- Drop existing combined policy
DROP POLICY IF EXISTS "Users can manage their own profile" ON user_profiles;

-- INSERT: Allow users to create their own profile only
CREATE POLICY "Users can insert their own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- SELECT: Allow users to view their own profile
CREATE POLICY "Users can view their own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- UPDATE: Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- DELETE: Allow users to delete their own profile
CREATE POLICY "Users can delete their own profile"
  ON user_profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);
