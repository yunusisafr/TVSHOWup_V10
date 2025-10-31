/*
  # Fix Security Issues - Missing Indexes and Performance

  1. Add Missing Foreign Key Indexes
    - Add index on admin_logs(admin_id)
    - Add index on ai_chat_conversations(user_id)
    - Add index on ai_chat_messages(conversation_id)
    - Add index on ai_chat_rewards(user_id)
    - Add index on contact_messages(user_id)
    - Add index on content_moderation(moderator_id)
    - Add index on share_lists(user_id)

  2. Remove Unused Indexes
    - Remove idx_tvshows_first_air_date
    - Remove idx_ad_units_created_by
    - Remove idx_ad_units_updated_by
    - Remove idx_user_profiles_country_code
    - Remove idx_admin_users_created_by
    - Remove idx_content_comments_user_id
    - Remove idx_content_genres_genre_id
    - Remove idx_static_pages_created_by
    - Remove idx_static_pages_updated_by
    - Remove idx_share_lists_is_public

  3. Remove Duplicate Index
    - Keep idx_tv_shows_popularity, remove idx_tvshows_popularity

  Important Notes:
    - Foreign key indexes significantly improve JOIN performance
    - Removing unused indexes reduces maintenance overhead
    - Duplicate indexes waste storage and slow down writes
*/

-- Add missing foreign key indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_conversations_user_id ON ai_chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_conversation_id ON ai_chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_rewards_user_id ON ai_chat_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_messages_user_id ON contact_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_content_moderation_moderator_id ON content_moderation(moderator_id);
CREATE INDEX IF NOT EXISTS idx_share_lists_user_id ON share_lists(user_id);

-- Remove unused indexes to reduce maintenance overhead
DROP INDEX IF EXISTS idx_tvshows_first_air_date;
DROP INDEX IF EXISTS idx_ad_units_created_by;
DROP INDEX IF EXISTS idx_ad_units_updated_by;
DROP INDEX IF EXISTS idx_user_profiles_country_code;
DROP INDEX IF EXISTS idx_admin_users_created_by;
DROP INDEX IF EXISTS idx_content_comments_user_id;
DROP INDEX IF EXISTS idx_content_genres_genre_id;
DROP INDEX IF EXISTS idx_static_pages_created_by;
DROP INDEX IF EXISTS idx_static_pages_updated_by;
DROP INDEX IF EXISTS idx_share_lists_is_public;

-- Remove duplicate index (keep idx_tv_shows_popularity, remove idx_tvshows_popularity)
DROP INDEX IF EXISTS idx_tvshows_popularity;