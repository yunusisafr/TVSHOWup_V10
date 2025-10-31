/*
  # Consolidate Duplicate RLS Policies - Part 1

  1. Clean Up AI Chat Policies
    - Remove duplicate "Users view own conversations" 
    - Remove duplicate "Users update own conversations"
    - Remove duplicate "Users create messages in own convos"
    - Remove duplicate "Users view messages in own convos"

  2. Clean Up Contact Messages Policies
    - Consolidate anonymous and authenticated insert policies
    - Keep admin view policy separate (restrictive)

  3. Clean Up Ad Units and Slots Policies
    - Merge public and admin read policies using is_admin_by_role() function

  Important Notes:
    - Multiple permissive policies with OR logic can be consolidated
    - Keep restrictive policies (admin-only) separate
    - This reduces policy evaluation overhead
    - Use existing is_admin_by_role() function for admin checks
*/

-- AI Chat Conversations - Remove old duplicate policies
DROP POLICY IF EXISTS "Users view own conversations" ON ai_chat_conversations;
DROP POLICY IF EXISTS "Users update own conversations" ON ai_chat_conversations;

-- AI Chat Messages - Remove old duplicate policies  
DROP POLICY IF EXISTS "Users create messages in own convos" ON ai_chat_messages;
DROP POLICY IF EXISTS "Users view messages in own convos" ON ai_chat_messages;

-- Contact Messages - Consolidate insert policies
DROP POLICY IF EXISTS "Anonymous users can submit contact messages" ON contact_messages;
DROP POLICY IF EXISTS "Authenticated users can submit contact messages" ON contact_messages;
DROP POLICY IF EXISTS "Anyone can submit contact form" ON contact_messages;

CREATE POLICY "Anyone can submit contact form"
  ON contact_messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Ad Units - Consolidate read policies
DROP POLICY IF EXISTS "Admins view all ads" ON ad_units;
DROP POLICY IF EXISTS "Anyone can view active ads" ON ad_units;

CREATE POLICY "Anyone can view active ads or admins view all"
  ON ad_units
  FOR SELECT
  TO authenticated
  USING (
    is_active = true OR is_admin_by_role()
  );

-- Ad Slots - Consolidate read policies
DROP POLICY IF EXISTS "Admins can manage ad slots" ON ad_slots;
DROP POLICY IF EXISTS "Public can read active ad slots" ON ad_slots;

CREATE POLICY "Public read active or admins manage ad slots"
  ON ad_slots
  FOR SELECT
  TO authenticated
  USING (
    is_active = true OR is_admin_by_role()
  );