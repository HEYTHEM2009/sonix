<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('reels') && ! Schema::hasColumn('reels', 'is_published')) {
            Schema::table('reels', function (Blueprint $table) {
                $table->boolean('is_published')->default(true)->after('views_count');
            });
        }
        if (Schema::hasTable('reels') && ! Schema::hasColumn('reels', 'comments_enabled')) {
            Schema::table('reels', function (Blueprint $table) {
                $table->boolean('comments_enabled')->default(true);
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('reels') && Schema::hasColumn('reels', 'is_published')) {
            Schema::table('reels', function (Blueprint $table) {
                $table->dropColumn('is_published');
            });
        }
        if (Schema::hasTable('reels') && Schema::hasColumn('reels', 'comments_enabled')) {
            Schema::table('reels', function (Blueprint $table) {
                $table->dropColumn('comments_enabled');
            });
        }
    }
};
