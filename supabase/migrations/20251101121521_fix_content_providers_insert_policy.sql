/*
  # Fix content_providers INSERT policy

  1. Changes
    - Add INSERT policy for authenticated users to allow updating provider data from TMDB
  
  2. Security
    - Only authenticated users can insert new provider records
    - This allows the frontend to update stale provider data from TMDB API
*/

-- Add INSERT policy for authenticated users
CREATE POLICY "Authenticated users can insert content providers"
  ON content_providers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
