<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        DB::statement('CREATE INDEX IF NOT EXISTS idx_notifications_user_type ON notifications(user_id, type)');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_story_highlights_user_id ON story_highlights(user_id)');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_messages_is_deleted ON messages(is_deleted)');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages(sender_id, receiver_id) WHERE is_deleted = false');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id)');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_follows_follower_status ON follows(follower_id, status)');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_follows_following_status ON follows(following_id, status)');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_bookmarks_user_post ON bookmarks(user_id, post_id)');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_stories_user_created ON stories(user_id, created_at)');
    }

    public function down()
    {
        DB::statement('DROP INDEX IF EXISTS idx_notifications_user_type');
        DB::statement('DROP INDEX IF EXISTS idx_story_highlights_user_id');
        DB::statement('DROP INDEX IF EXISTS idx_messages_is_deleted');
        DB::statement('DROP INDEX IF EXISTS idx_messages_sender_receiver');
        DB::statement('DROP INDEX IF EXISTS idx_likes_post_id');
        DB::statement('DROP INDEX IF EXISTS idx_follows_follower_status');
        DB::statement('DROP INDEX IF EXISTS idx_follows_following_status');
        DB::statement('DROP INDEX IF EXISTS idx_bookmarks_user_post');
        DB::statement('DROP INDEX IF EXISTS idx_stories_user_created');
    }
};