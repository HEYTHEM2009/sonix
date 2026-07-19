<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->index('content');
            $table->index('created_at');
            $table->index(['receiver_id', 'created_at']);
            $table->index(['sender_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropIndex(['content']);
            $table->dropIndex(['created_at']);
            $table->dropIndex(['receiver_id', 'created_at']);
            $table->dropIndex(['sender_id', 'created_at']);
        });
    }
};
