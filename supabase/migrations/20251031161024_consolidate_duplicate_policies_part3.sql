/*
  # Consolidate Duplicate RLS Policies - Part 3

  1. User Profiles Policies
    - Remove duplicate "Anyone can view user profiles" policies
    - Keep one policy for all roles (anon, authenticated, authenticator, dashboard_user)
    - Keep separate admin and user own profile policies

  2. User Watchlists Policies
    - Consolidate "Admin direct access" and "Admins can manage" policies
    - Keep user own watchlist policies separate
    - Keep "Anyone can view public watchlists" separate

  3. User Lists and List Items
    - Consolidate where appropriate
    - Keep public vs private access separate

  Important Notes:
    - Multiple roles accessing same data should use one policy
    - Admin access vs user access should remain separate
    - Public vs private access should remain separate
*/

-- User Profiles - Remove duplicate "Anyone can view" policies for all roles
DROP POLICY IF EXISTS "Anyone can view user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Public can view user profiles" ON user_profiles;

-- Create single policy for all roles to view profiles
CREATE POLICY "Anyone can view user profiles"
  ON user_profiles
  FOR SELECT
  TO anon, authenticated, authenticator, dashboard_user
  USING (true);

-- User Watchlists - Consolidate admin policies
DROP POLICY IF EXISTS "Admin direct access to user_watchlists" ON user_watchlists;
DROP POLICY IF EXISTS "Admins can manage user_watchlists" ON user_watchlists;

CREATE POLICY "Admins can manage user_watchlists"
  ON user_watchlists
  FOR ALL
  TO authenticated
  USING (is_admin_by_role())
  WITH CHECK (is_admin_by_role());

-- User Lists - Consolidate view policies
DROP POLICY IF EXISTS "Admins view all lists" ON user_lists;
DROP POLICY IF EXISTS "Users can view public lists" ON user_lists;
DROP POLICY IF EXISTS "Users view own lists" ON user_lists;

CREATE POLICY "Users view public or own lists or admins view all"
  ON user_lists
  FOR SELECT
  TO authenticated
  USING (
    is_public = true OR 
    user_id = (select auth.uid()) OR 
    is_admin_by_role()
  );

-- User List Items - Consolidate view policies
DROP POLICY IF EXISTS "Users can view items in public lists" ON user_list_items;
DROP POLICY IF EXISTS "Users view items in own lists" ON user_list_items;

CREATE POLICY "Users view items in public or own lists"
  ON user_list_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_lists
      WHERE user_lists.id = user_list_items.list_id
      AND (user_lists.is_public = true OR user_lists.user_id = (select auth.uid()))
    )
  );