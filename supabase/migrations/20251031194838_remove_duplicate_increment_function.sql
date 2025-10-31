/*
  # Remove Duplicate increment_ai_chat_usage Function

  ## Problem
  There are two increment_ai_chat_usage functions with different signatures:
  1. (p_user_id, p_session_id) → boolean (CORRECT - uses ai_chat_usage_limits)
  2. (p_user_id, p_ip_address, p_session_id) → TABLE (WRONG - uses ai_chat_rate_limits which doesn't exist)

  PostgreSQL cannot choose which function to call, causing "Could not choose the best candidate function" error.

  ## Solution
  Drop the incorrect function that uses non-existent ai_chat_rate_limits table.
  Keep the correct function that uses ai_chat_usage_limits table.
*/

-- Drop the incorrect function with 3 parameters
DROP FUNCTION IF EXISTS increment_ai_chat_usage(uuid, text, text);

-- Verify the correct function remains (2 parameters)
-- This function should already exist from the previous migration