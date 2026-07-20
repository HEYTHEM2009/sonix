<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // messages: unindexed JSON column used in every conversation query
        Schema::table('messages', function (Blueprint $table) {
            if (! Schema::hasIndex('messages', 'messages_receiver_read_created_idx')) {
                $table->index(['receiver_id', 'is_read', 'created_at'], 'messages_receiver_read_created_idx');
            }
        });

        // reel_likes: enforce one like per user per reel (data integrity + fast toggle)
        Schema::table('reel_likes', function (Blueprint $table) {
            if (! Schema::hasIndex('reel_likes', 'reel_likes_reel_user_unique')) {
                $table->unique(['reel_id', 'user_id'], 'reel_likes_reel_user_unique');
            }
        });

        // reel_watch_history: analytics aggregation scans per reel
        Schema::table('reel_watch_history', function (Blueprint $table) {
            if (! Schema::hasIndex('reel_watch_history', 'reel_watch_reel_created_idx')) {
                $table->index(['reel_id', 'created_at'], 'reel_watch_reel_created_idx');
            }
        });

        // reel_comments: listing/first-N queries
        Schema::table('reel_comments', function (Blueprint $table) {
            if (! Schema::hasIndex('reel_comments', 'reel_comments_reel_created_idx')) {
                $table->index(['reel_id', 'created_at'], 'reel_comments_reel_created_idx');
            }
        });

        // notifications: latest listing
        Schema::table('notifications', function (Blueprint $table) {
            if (! Schema::hasIndex('notifications', 'notifications_user_created_idx')) {
                $table->index(['user_id', 'created_at'], 'notifications_user_created_idx');
            }
        });

        // posts: user feed filtering
        Schema::table('posts', function (Blueprint $table) {
            if (! Schema::hasIndex('posts', 'posts_user_created_idx')) {
                $table->index(['user_id', 'created_at'], 'posts_user_created_idx');
            }
        });

        // blocked_users: reverse lookups (isBlocked checks both directions)
        Schema::table('blocked_users', function (Blueprint $table) {
            if (! Schema::hasIndex('blocked_users', 'blocked_users_blocked_id_idx')) {
                $table->index(['blocked_id'], 'blocked_users_blocked_id_idx');
            }
        });

        // story_views: firstOrCreate + listing
        Schema::table('story_views', function (Blueprint $table) {
            if (! Schema::hasIndex('story_views', 'story_views_story_user_unique')) {
                $table->unique(['story_id', 'user_id'], 'story_views_story_user_unique');
            }
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropIndex('messages_receiver_read_created_idx');
        });
        Schema::table('reel_likes', function (Blueprint $table) {
            $table->dropUnique('reel_likes_reel_user_unique');
        });
        Schema::table('reel_watch_history', function (Blueprint $table) {
            $table->dropIndex('reel_watch_reel_created_idx');
        });
        Schema::table('reel_comments', function (Blueprint $table) {
            $table->dropIndex('reel_comments_reel_created_idx');
        });
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropIndex('notifications_user_created_idx');
        });
        Schema::table('posts', function (Blueprint $table) {
            $table->dropIndex('posts_user_created_idx');
        });
        Schema::table('blocked_users', function (Blueprint $table) {
            $table->dropIndex('blocked_users_blocked_id_idx');
        });
        Schema::table('story_views', function (Blueprint $table) {
            $table->dropUnique('story_views_story_user_unique');
        });
    }
};
