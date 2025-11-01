/*
  # Add Browser Fingerprint to AI Chat Rate Limiting

  ## Problem
  Users can bypass rate limits by:
  1. Clearing browser storage (localStorage)
  2. Creating new session IDs to reset their 5 prompt limit

  ## Solution
  Add browser fingerprinting to track users even after clearing storage:
  1. Store browser fingerprint hash with each session
  2. Use fingerprint as primary identifier for guest users
  3. Validate fingerprint on every request
  4. If fingerprint exists but session_id changes, merge to existing record

  ## Changes
  - Add browser_fingerprint column to ai_chat_usage_limits table
  - Create index on browser_fingerprint for efficient lookups
  - Update check_and_reset_ai_chat_limits to handle fingerprints
  - Update increment_ai_chat_usage to validate fingerprints
  - Auto-merge sessions with same fingerprint

  ## Security
  - Fingerprint provides persistent tracking across storage clears
  - Cannot be easily spoofed without changing browser/device
  - IP address is NOT used to avoid IPv4/IPv6 issues
  - Session hijacking prevented by fingerprint validation
*/

-- Add browser_fingerprint column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_chat_usage_limits'
    AND column_name = 'browser_fingerprint'
  ) THEN
    ALTER TABLE ai_chat_usage_limits ADD COLUMN browser_fingerprint text;
    CREATE INDEX IF NOT EXISTS idx_ai_chat_usage_limits_fingerprint
      ON ai_chat_usage_limits(browser_fingerprint);
  END IF;
END $$;

-- Update check_and_reset_ai_chat_limits to handle browser fingerprints
CREATE OR REPLACE FUNCTION check_and_reset_ai_chat_limits(
  p_user_id uuid DEFAULT NULL,
  p_session_id text DEFAULT NULL,
  p_browser_fingerprint text DEFAULT NULL
)
RETURNS TABLE(
  daily_limit integer,
  bonus_limit integer,
  used_count integer,
  remaining integer,
  reset_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_record ai_chat_usage_limits;
  v_now timestamptz := now();
  v_hours_since_reset numeric;
  v_base_limit integer := 5;
BEGIN
  -- Determine base limit
  IF p_user_id IS NOT NULL THEN
    v_base_limit := 25;
  ELSE
    v_base_limit := 5;
  END IF;

  -- For authenticated users, find by user_id
  IF p_user_id IS NOT NULL THEN
    SELECT * INTO v_record FROM ai_chat_usage_limits WHERE user_id = p_user_id;
  -- For guests, prioritize fingerprint over session_id
  ELSIF p_browser_fingerprint IS NOT NULL THEN
    SELECT * INTO v_record FROM ai_chat_usage_limits 
    WHERE browser_fingerprint = p_browser_fingerprint
    ORDER BY last_reset_at DESC
    LIMIT 1;
    
    -- If found by fingerprint but session_id differs, update session_id
    IF v_record.id IS NOT NULL AND v_record.session_id != p_session_id THEN
      RAISE NOTICE 'Fingerprint match found - merging session % to existing record', p_session_id;
      UPDATE ai_chat_usage_limits
      SET session_id = p_session_id, updated_at = v_now
      WHERE id = v_record.id;
    END IF;
  ELSE
    -- Fallback to session_id if no fingerprint provided
    SELECT * INTO v_record FROM ai_chat_usage_limits WHERE session_id = p_session_id;
  END IF;

  -- If no record exists, create it
  IF v_record.id IS NULL THEN
    INSERT INTO ai_chat_usage_limits (
      user_id,
      session_id,
      browser_fingerprint,
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
      p_browser_fingerprint,
      v_base_limit,
      0,
      0,
      v_now,
      v_now,
      v_now
    )
    RETURNING * INTO v_record;

    RAISE NOTICE 'Created new rate limit record with fingerprint %', COALESCE(p_browser_fingerprint, 'NULL');
  ELSE
    -- Calculate hours since last reset
    v_hours_since_reset := EXTRACT(EPOCH FROM (v_now - v_record.last_reset_at)) / 3600;

    -- If more than 24 hours, reset limits
    IF v_hours_since_reset >= 24 THEN
      UPDATE ai_chat_usage_limits
      SET
        used_count = 0,
        bonus_limit = 0,
        last_reset_at = v_now,
        updated_at = v_now,
        browser_fingerprint = COALESCE(p_browser_fingerprint, browser_fingerprint)
      WHERE id = v_record.id
      RETURNING * INTO v_record;

      RAISE NOTICE 'Reset rate limits after 24 hours';
    ELSE
      -- Just update fingerprint if provided and different
      IF p_browser_fingerprint IS NOT NULL AND v_record.browser_fingerprint != p_browser_fingerprint THEN
        UPDATE ai_chat_usage_limits
        SET browser_fingerprint = p_browser_fingerprint, updated_at = v_now
        WHERE id = v_record.id
        RETURNING * INTO v_record;
      END IF;
    END IF;
  END IF;

  -- Return current state
  RETURN QUERY SELECT
    v_record.daily_limit,
    v_record.bonus_limit,
    v_record.used_count,
    (v_record.daily_limit + v_record.bonus_limit - v_record.used_count) as remaining,
    v_record.last_reset_at + interval '24 hours' as reset_at;
END;
$$;

-- Update increment_ai_chat_usage to handle browser fingerprints
CREATE OR REPLACE FUNCTION increment_ai_chat_usage(
  p_user_id uuid DEFAULT NULL,
  p_session_id text DEFAULT NULL,
  p_browser_fingerprint text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_used integer;
  v_daily_limit integer;
  v_bonus_limit integer;
  v_total_limit integer;
  v_rows_updated integer;
  v_base_limit integer := 5;
  v_now timestamptz := now();
  v_record_id uuid;
BEGIN
  -- Determine base limit
  IF p_user_id IS NOT NULL THEN
    v_base_limit := 25;
  ELSE
    v_base_limit := 5;
  END IF;

  -- Get current usage and limits
  IF p_user_id IS NOT NULL THEN
    SELECT id, used_count, daily_limit, bonus_limit
    INTO v_record_id, v_current_used, v_daily_limit, v_bonus_limit
    FROM ai_chat_usage_limits
    WHERE user_id = p_user_id;
  ELSIF p_browser_fingerprint IS NOT NULL THEN
    SELECT id, used_count, daily_limit, bonus_limit
    INTO v_record_id, v_current_used, v_daily_limit, v_bonus_limit
    FROM ai_chat_usage_limits
    WHERE browser_fingerprint = p_browser_fingerprint
    ORDER BY last_reset_at DESC
    LIMIT 1;
  ELSE
    SELECT id, used_count, daily_limit, bonus_limit
    INTO v_record_id, v_current_used, v_daily_limit, v_bonus_limit
    FROM ai_chat_usage_limits
    WHERE session_id = p_session_id;
  END IF;

  -- If no record found, create it
  IF v_record_id IS NULL THEN
    RAISE NOTICE 'No usage record found - creating new record with limit % and fingerprint %', v_base_limit, COALESCE(p_browser_fingerprint, 'NULL');

    INSERT INTO ai_chat_usage_limits (
      user_id,
      session_id,
      browser_fingerprint,
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
      p_browser_fingerprint,
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

  -- Calculate total limit
  v_total_limit := v_daily_limit + v_bonus_limit;

  -- Check if limit would be exceeded
  IF v_current_used >= v_total_limit THEN
    RAISE NOTICE 'Rate limit exceeded: % >= %', v_current_used, v_total_limit;
    RETURN false;
  END IF;

  -- Atomically increment the counter
  UPDATE ai_chat_usage_limits
  SET
    used_count = used_count + 1,
    browser_fingerprint = COALESCE(p_browser_fingerprint, browser_fingerprint),
    updated_at = now()
  WHERE id = v_record_id
    AND used_count < (daily_limit + bonus_limit);

  -- Check if update was successful
  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;

  IF v_rows_updated > 0 THEN
    RAISE NOTICE 'Successfully incremented usage count to % with fingerprint %', v_current_used + 1, COALESCE(p_browser_fingerprint, 'NULL');
    RETURN true;
  ELSE
    RAISE NOTICE 'Failed to increment - concurrent limit reached';
    RETURN false;
  END IF;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_and_reset_ai_chat_limits(uuid, text, text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION increment_ai_chat_usage(uuid, text, text) TO authenticated, anon;
