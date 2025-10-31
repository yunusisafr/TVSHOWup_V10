/*
  # Fix AI Chat Rate Limiting IP Validation Issue

  ## Problem
  Users are getting "Daily limit reached" error even when they have remaining queries (showing 5/5).
  The issue is caused by IP address validation that rejects requests when the client IP changes
  between IPv4 and IPv6 (e.g., ::1 vs 127.0.0.1).

  ## Changes
  - Remove strict IP validation from increment_ai_chat_usage function
  - Still track IP for analytics but don't use it to reject requests
  - User ID and session ID provide sufficient security

  ## Security Notes
  - Authenticated users are tracked by user_id (primary security)
  - Guest users are tracked by session_id stored in localStorage (persistent across page reloads)
  - IP tracking is kept for analytics purposes only
*/

CREATE OR REPLACE FUNCTION increment_ai_chat_usage(
  p_user_id UUID DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_used integer;
  v_daily_limit integer;
  v_rows_updated integer;
  v_base_limit integer := 5;
  v_now timestamptz := now();
  v_client_ip inet;
BEGIN
  -- Get client IP address for analytics (not validation)
  v_client_ip := inet_client_addr();
  
  IF v_client_ip IS NULL THEN
    v_client_ip := '0.0.0.0'::inet;
  END IF;

  -- Determine base limit
  IF p_user_id IS NOT NULL THEN
    v_base_limit := 25;
  ELSE
    v_base_limit := 5;
  END IF;

  -- Get current usage and daily limit
  IF p_user_id IS NOT NULL THEN
    SELECT used_count, daily_limit
    INTO v_current_used, v_daily_limit
    FROM ai_chat_usage_limits
    WHERE user_id = p_user_id;
  ELSE
    SELECT used_count, daily_limit
    INTO v_current_used, v_daily_limit
    FROM ai_chat_usage_limits
    WHERE session_id = p_session_id;
  END IF;

  -- If no record found, create it
  IF v_current_used IS NULL THEN
    RAISE NOTICE 'No usage record found - creating new record with limit %', v_base_limit;
    
    INSERT INTO ai_chat_usage_limits (
      user_id,
      session_id,
      ip_address,
      daily_limit,
      bonus_limit,
      used_count,
      last_reset_at,
      created_at,
      updated_at
    )
    VALUES (
      p_user_id,
      p_session_id,
      v_client_ip,
      v_base_limit,
      0,
      1,
      v_now,
      v_now,
      v_now
    );
    
    RAISE NOTICE 'Successfully created record and set usage to 1';
    RETURN true;
  END IF;

  -- Check if limit would be exceeded
  IF v_current_used >= v_daily_limit THEN
    RAISE NOTICE 'Rate limit exceeded: % >= %', v_current_used, v_daily_limit;
    RETURN false;
  END IF;

  -- Atomically increment the counter
  IF p_user_id IS NOT NULL THEN
    UPDATE ai_chat_usage_limits
    SET
      used_count = used_count + 1,
      ip_address = v_client_ip,  -- Update IP for analytics but don't validate
      updated_at = now()
    WHERE user_id = p_user_id
      AND used_count < daily_limit;
  ELSE
    UPDATE ai_chat_usage_limits
    SET
      used_count = used_count + 1,
      ip_address = v_client_ip,  -- Update IP for analytics but don't validate
      updated_at = now()
    WHERE session_id = p_session_id
      AND used_count < daily_limit;
  END IF;

  -- Check if update was successful
  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;

  IF v_rows_updated > 0 THEN
    RAISE NOTICE 'Successfully incremented usage count to %', v_current_used + 1;
    RETURN true;
  ELSE
    RAISE NOTICE 'Failed to increment - concurrent limit reached';
    RETURN false;
  END IF;
END;
$$;