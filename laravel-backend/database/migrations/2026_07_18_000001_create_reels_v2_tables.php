<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('reel_saves')) {
            Schema::create('reel_saves', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->foreignId('reel_id')->constrained()->onDelete('cascade');
                $table->timestamps();

                $table->unique(['user_id', 'reel_id']);
                $table->index('user_id');
                $table->index('reel_id');
            });
        }

        if (! Schema::hasTable('reel_shares')) {
            Schema::create('reel_shares', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
                $table->foreignId('reel_id')->constrained()->onDelete('cascade');
                $table->string('platform')->nullable();
                $table->timestamps();

                $table->index('reel_id');
                $table->index('user_id');
            });
        }

        if (! Schema::hasTable('reel_hashtags')) {
            Schema::create('reel_hashtags', function (Blueprint $table) {
                $table->id();
                $table->foreignId('reel_id')->constrained()->onDelete('cascade');
                $table->string('tag', 100);
                $table->timestamps();

                $table->index('reel_id');
                $table->index('tag');
                $table->unique(['reel_id', 'tag']);
            });
        }

        if (! Schema::hasTable('reel_mentions')) {
            Schema::create('reel_mentions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('reel_id')->constrained()->onDelete('cascade');
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->timestamps();

                $table->index('reel_id');
                $table->index('user_id');
                $table->unique(['reel_id', 'user_id']);
            });
        }

        if (! Schema::hasTable('reel_watch_history')) {
            Schema::create('reel_watch_history', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->foreignId('reel_id')->constrained()->onDelete('cascade');
                $table->integer('watch_seconds')->default(0);
                $table->integer('percent_watched')->default(0);
                $table->boolean('completed')->default(false);
                $table->timestamps();

                $table->index('user_id');
                $table->index('reel_id');
                $table->index(['user_id', 'reel_id']);
            });
        }

        if (! Schema::hasTable('reel_analytics')) {
            Schema::create('reel_analytics', function (Blueprint $table) {
                $table->id();
                $table->foreignId('reel_id')->constrained()->onDelete('cascade');
                $table->unsignedBigInteger('views_count')->default(0);
                $table->unsignedBigInteger('likes_count')->default(0);
                $table->unsignedBigInteger('comments_count')->default(0);
                $table->unsignedBigInteger('shares_count')->default(0);
                $table->unsignedBigInteger('saves_count')->default(0);
                $table->unsignedBigInteger('watch_time_seconds')->default(0);
                $table->decimal('completion_rate', 5, 2)->default(0);
                $table->decimal('trending_score', 10, 2)->default(0);
                $table->decimal('recommendation_score', 10, 2)->default(0);
                $table->timestamp('last_viewed_at')->nullable();
                $table->timestamps();

                $table->unique('reel_id');
                $table->index('trending_score');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('reel_analytics');
        Schema::dropIfExists('reel_watch_history');
        Schema::dropIfExists('reel_mentions');
        Schema::dropIfExists('reel_hashtags');
        Schema::dropIfExists('reel_shares');
        Schema::dropIfExists('reel_saves');
    }
};
