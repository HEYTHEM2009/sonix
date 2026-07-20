<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('reels') && ! Schema::hasIndex('reels', 'reels_feed_idx')) {
            Schema::table('reels', function (Blueprint $table) {
                $table->index(['status', 'scheduled_at', 'created_at'], 'reels_feed_idx');
            });
        }

        if (Schema::hasTable('reels') && ! Schema::hasIndex('reels', 'reels_featured_idx')) {
            Schema::table('reels', function (Blueprint $table) {
                $table->index(['status', 'is_featured', 'created_at'], 'reels_featured_idx');
            });
        }

        if (Schema::hasTable('music_tracks') && ! Schema::hasIndex('music_tracks', 'music_tracks_trending_idx')) {
            Schema::table('music_tracks', function (Blueprint $table) {
                $table->index(['is_trending', 'created_at'], 'music_tracks_trending_idx');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('reels')) {
            Schema::table('reels', function (Blueprint $table) {
                if (Schema::hasIndex('reels', 'reels_feed_idx')) {
                    $table->dropIndex('reels_feed_idx');
                }
                if (Schema::hasIndex('reels', 'reels_featured_idx')) {
                    $table->dropIndex('reels_featured_idx');
                }
            });
        }
        if (Schema::hasTable('music_tracks')) {
            Schema::table('music_tracks', function (Blueprint $table) {
                if (Schema::hasIndex('music_tracks', 'music_tracks_trending_idx')) {
                    $table->dropIndex('music_tracks_trending_idx');
                }
            });
        }
    }
};
