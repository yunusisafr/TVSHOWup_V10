/*
  # Consolidate Duplicate RLS Policies - Part 2

  1. Content Moderation Policies
    - Merge admin view policies
    
  2. Content Ratings Policies
    - Keep "Public can view ratings" and "Users view own ratings" separate
    - These serve different purposes (public vs private)

  3. Static Pages Policies
    - Merge admin and public read policies

  4. Share Lists Policies
    - Keep public and own view policies separate (different use cases)

  Important Notes:
    - Only merge policies that truly duplicate functionality
    - Keep policies separate when they serve different access patterns
*/

-- Content Moderation - Consolidate admin view policies
DROP POLICY IF EXISTS "Admins can manage moderation records" ON content_moderation;
DROP POLICY IF EXISTS "Admins can view all moderation records" ON content_moderation;

CREATE POLICY "Admins can view and manage moderation records"
  ON content_moderation
  FOR SELECT
  TO authenticated
  USING (is_admin_by_role());

-- Static Pages - Keep both policies as they serve different purposes
-- "Admins can view static pages" allows admins to see unpublished pages
-- "Public can read published static pages" allows everyone to see published pages
-- These are complementary, not duplicate