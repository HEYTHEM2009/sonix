<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reel_comments', function (Blueprint $table) {
            $table->foreignId('parent_id')->nullable()->after('reel_id')->constrained('reel_comments')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('reel_comments', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
            $table->dropColumn('parent_id');
        });
    }
};
