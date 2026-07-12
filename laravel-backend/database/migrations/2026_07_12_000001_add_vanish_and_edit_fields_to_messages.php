<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->boolean('is_edited')->default(false)->after('is_deleted');
            $table->text('original_content')->nullable()->after('is_edited');
            $table->boolean('is_disappearing')->default(false)->after('original_content');
            $table->timestamp('disappears_at')->nullable()->after('is_disappearing');
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropColumn(['is_edited', 'original_content', 'is_disappearing', 'disappears_at']);
        });
    }
};
