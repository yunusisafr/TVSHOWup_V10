/*
  # Fix RLS Policies - Performance Optimization

  1. Update RLS Policies to Use (select auth.uid()) Pattern
    - Fix ai_chat_conversations policies
    - Fix ai_chat_messages policies
    
  Important Notes:
    - Using (select auth.uid()) prevents re-evaluation for each row
    - This significantly improves query performance at scale
    - The subquery is evaluated once per query instead of per row
*/

-- Drop and recreate ai_chat_conversations policies with optimized pattern
DROP POLICY IF EXISTS "Users can view own or session conversations" ON ai_chat_conversations;
DROP POLICY IF EXISTS "Users can update own or session conversations" ON ai_chat_conversations;

CREATE POLICY "Users can view own or session conversations"
  ON ai_chat_conversations
  FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid()) OR 
    session_id = current_setting('request.headers', true)::json->>'x-session-id'
  );

CREATE POLICY "Users can update own or session conversations"
  ON ai_chat_conversations
  FOR UPDATE
  TO authenticated
  USING (
    user_id = (select auth.uid()) OR 
    session_id = current_setting('request.headers', true)::json->>'x-session-id'
  )
  WITH CHECK (
    user_id = (select auth.uid()) OR 
    session_id = current_setting('request.headers', true)::json->>'x-session-id'
  );

-- Drop and recreate ai_chat_messages policies with optimized pattern
DROP POLICY IF EXISTS "Users can view messages in own or session conversations" ON ai_chat_messages;
DROP POLICY IF EXISTS "Users can create messages in own or session conversations" ON ai_chat_messages;

CREATE POLICY "Users can view messages in own or session conversations"
  ON ai_chat_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ai_chat_conversations
      WHERE id = ai_chat_messages.conversation_id
      AND (
        user_id = (select auth.uid()) OR 
        session_id = current_setting('request.headers', true)::json->>'x-session-id'
      )
    )
  );

CREATE POLICY "Users can create messages in own or session conversations"
  ON ai_chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_chat_conversations
      WHERE id = ai_chat_messages.conversation_id
      AND (
        user_id = (select auth.uid()) OR 
        session_id = current_setting('request.headers', true)::json->>'x-session-id'
      )
    )
  );