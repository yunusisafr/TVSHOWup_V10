/*
  # Fix Security Definer View and Function Search Paths

  1. Fix active_content_providers View
    - Remove SECURITY DEFINER property
    - Recreate view with correct column references

  2. Fix Function Search Paths
    - Update check_and_reset_ai_chat_limits function
    - Update increment_ai_chat_usage function
    - Set explicit search_path to prevent search path manipulation attacks

  Important Notes:
    - SECURITY DEFINER functions run with creator's privileges
    - Mutable search_path can be exploited for privilege escalation
    - Setting search_path to 'pg_catalog, public' prevents attacks
*/

-- Fix check_and_reset_ai_chat_limits function search path
CREATE OR REPLACE FUNCTION check_and_reset_ai_chat_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  UPDATE ai_chat_rate_limits
  SET 
    daily_count = 0,
    daily_reset_at = CURRENT_TIMESTAMP
  WHERE daily_reset_at < CURRENT_TIMESTAMP - INTERVAL '24 hours';
END;
$$;

-- Fix increment_ai_chat_usage function search path
CREATE OR REPLACE FUNCTION increment_ai_chat_usage(
  p_user_id UUID DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  remaining_daily INTEGER,
  reset_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_record RECORD;
BEGIN
  IF p_user_id IS NULL AND p_ip_address IS NULL AND p_session_id IS NULL THEN
    RAISE EXCEPTION 'At least one identifier (user_id, ip_address, or session_id) must be provided';
  END IF;

  IF p_user_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.auth.users WHERE id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Invalid user_id provided';
  END IF;

  IF p_ip_address IS NOT NULL AND p_ip_address !~ '^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$' THEN
    RAISE EXCEPTION 'Invalid IP address format';
  END IF;

  INSERT INTO public.ai_chat_rate_limits (user_id, ip_address, session_id, daily_count, daily_reset_at)
  VALUES (
    p_user_id,
    p_ip_address,
    p_session_id,
    1,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT (COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid), 
               COALESCE(ip_address, ''), 
               COALESCE(session_id, ''))
  DO UPDATE SET
    daily_count = CASE
      WHEN ai_chat_rate_limits.daily_reset_at < CURRENT_TIMESTAMP - INTERVAL '24 hours' THEN 1
      ELSE ai_chat_rate_limits.daily_count + 1
    END,
    daily_reset_at = CASE
      WHEN ai_chat_rate_limits.daily_reset_at < CURRENT_TIMESTAMP - INTERVAL '24 hours' THEN CURRENT_TIMESTAMP
      ELSE ai_chat_rate_limits.daily_reset_at
    END,
    updated_at = CURRENT_TIMESTAMP
  RETURNING * INTO v_record;

  RETURN QUERY SELECT
    (50 - v_record.daily_count)::INTEGER as remaining_daily,
    v_record.daily_reset_at as reset_at;
END;
$$;

-- Recreate active_content_providers view without SECURITY DEFINER
DROP VIEW IF EXISTS active_content_providers;

CREATE VIEW active_content_providers AS
SELECT 
  cp.id,
  cp.content_id,
  cp.content_type,
  cp.country_code,
  cp.monetization_type,
  cp.link,
  cp.last_updated,
  p.id AS provider_id,
  p.name AS provider_name,
  p.logo_path,
  p.display_priority,
  p.provider_type,
  p.website_url
FROM content_providers cp
JOIN providers p ON cp.provider_id = p.id
WHERE p.is_active = true;