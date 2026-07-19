<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->boolean('is_starred')->default(false)->after('is_read');
            $table->boolean('is_saved')->default(false)->after('is_starred');
            $table->boolean('is_pinned')->default(false)->after('is_saved');
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropColumn(['is_starred', 'is_saved', 'is_pinned']);
        });
    }
};
