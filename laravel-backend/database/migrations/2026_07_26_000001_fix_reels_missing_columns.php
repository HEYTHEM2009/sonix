<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reels', function (Blueprint $table) {
            if (! Schema::hasColumn('reels', 'is_published')) {
                $table->boolean('is_published')->default(true)->after('views_count');
            }
            if (! Schema::hasColumn('reels', 'status')) {
                $table->string('status')->default('published')->after('is_published');
            }
            if (! Schema::hasColumn('reels', 'scheduled_at')) {
                $table->timestamp('scheduled_at')->nullable()->after('status');
            }
            if (! Schema::hasColumn('reels', 'is_featured')) {
                $table->boolean('is_featured')->default(false)->after('scheduled_at');
            }
        });

        if (! Schema::hasTable('music_tracks')) {
            Schema::create('music_tracks', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->string('artist')->nullable();
                $table->string('url')->nullable();
                $table->string('genre')->nullable();
                $table->integer('duration')->default(30);
                $table->boolean('is_trending')->default(false);
                $table->timestamps();
                $table->index('genre');
                $table->index('is_trending');
            });
        }

        if (Schema::hasTable('users')) {
            if (! Schema::hasColumn('users', 'is_pro')) {
                Schema::table('users', function (Blueprint $table) {
                    $table->boolean('is_pro')->default(false);
                });
            }
            if (! Schema::hasColumn('users', 'pro_until')) {
                Schema::table('users', function (Blueprint $table) {
                    $table->timestamp('pro_until')->nullable();
                });
            }
        }
    }

    public function down(): void
    {
        Schema::table('reels', function (Blueprint $table) {
            foreach (['is_published', 'status', 'scheduled_at', 'is_featured'] as $col) {
                if (Schema::hasColumn('reels', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
        Schema::dropIfExists('music_tracks');
    }
};
