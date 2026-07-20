<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('reels')) {
            Schema::table('reels', function (Blueprint $table) {
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
        }

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
            Schema::table('users', function (Blueprint $table) {
                if (! Schema::hasColumn('users', 'is_pro')) {
                    $table->boolean('is_pro')->default(false);
                }
                if (! Schema::hasColumn('users', 'pro_until')) {
                    $table->timestamp('pro_until')->nullable();
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('reels')) {
            Schema::table('reels', function (Blueprint $table) {
                foreach (['status', 'scheduled_at', 'is_featured'] as $col) {
                    if (Schema::hasColumn('reels', $col)) {
                        $table->dropColumn($col);
                    }
                }
            });
        }
        Schema::dropIfExists('music_tracks');
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                foreach (['is_pro', 'pro_until'] as $col) {
                    if (Schema::hasColumn('users', $col)) {
                        $table->dropColumn($col);
                    }
                }
            });
        }
    }
};
