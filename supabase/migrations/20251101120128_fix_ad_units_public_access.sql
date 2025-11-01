/*
  # Fix ad_units table public access

  1. Changes
    - Drop existing SELECT policy that only allows authenticated users
    - Create new SELECT policy that allows both anonymous (anon) and authenticated users to view active ads
    - Admins can still view all ads
  
  2. Security
    - Anonymous users can only see active ads (is_active = true)
    - Authenticated users can only see active ads (is_active = true)
    - Admin users can see all ads through is_admin_by_role() function
*/

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Anyone can view active ads or admins view all" ON ad_units;

-- Create new policy that allows both anon and authenticated users
CREATE POLICY "Public can view active ads, admins view all"
  ON ad_units
  FOR SELECT
  TO anon, authenticated
  USING (
    (is_active = true) OR is_admin_by_role()
  );
