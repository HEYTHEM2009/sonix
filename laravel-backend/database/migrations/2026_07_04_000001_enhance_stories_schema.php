<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Add missing columns that don't exist yet
        Schema::table('stories', function (Blueprint $table) {
            $table->boolean('is_highlight')->default(false)->after('drawing_data');

            // Composite indexes for hot queries
            $table->index(['user_id', 'created_at'], 'idx_stories_user_created');
            $table->index(['created_at', 'user_id'], 'idx_stories_created_user');
            $table->index('is_highlight', 'idx_stories_highlight');
        });

        // story_views: add index on created_at for range queries
        Schema::table('story_views', function (Blueprint $table) {
            $table->index('created_at', 'idx_story_views_created');
        });

        // story_reactions: add index on created_at
        Schema::table('story_reactions', function (Blueprint $table) {
            $table->index('created_at', 'idx_story_reactions_created');
        });

        // follows: add composite index for fan-out queries
        Schema::table('follows', function (Blueprint $table) {
            $table->index(['following_id', 'status', 'follower_id'], 'idx_follows_fanout');
        });

        // posts: add index for feed queries
        Schema::table('posts', function (Blueprint $table) {
            $table->index(['created_at', 'user_id'], 'idx_posts_feed');
        });

        // messages: add index for cleanup
        Schema::table('messages', function (Blueprint $table) {
            $table->index('created_at', 'idx_messages_created');
        });

        // notifications: add composite index
        Schema::table('notifications', function (Blueprint $table) {
            $table->index(['user_id', 'created_at'], 'idx_notifications_user_created');
        });
    }

    public function down(): void
    {
        Schema::table('stories', function (Blueprint $table) {
            $table->dropIndex('idx_stories_user_created');
            $table->dropIndex('idx_stories_created_user');
            $table->dropIndex('idx_stories_highlight');
            $table->dropColumn('is_highlight');
        });

        Schema::table('story_views', function (Blueprint $table) {
            $table->dropIndex('idx_story_views_created');
        });

        Schema::table('story_reactions', function (Blueprint $table) {
            $table->dropIndex('idx_story_reactions_created');
        });

        Schema::table('follows', function (Blueprint $table) {
            $table->dropIndex('idx_follows_fanout');
        });

        Schema::table('posts', function (Blueprint $table) {
            $table->dropIndex('idx_posts_feed');
        });

        Schema::table('messages', function (Blueprint $table) {
            $table->dropIndex('idx_messages_created');
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->dropIndex('idx_notifications_user_created');
        });
    }
};
