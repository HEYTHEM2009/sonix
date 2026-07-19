<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('privacy_last_seen')->default(true);
            $table->boolean('privacy_read_receipts')->default(true);
            $table->boolean('privacy_typing')->default(true);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['privacy_last_seen', 'privacy_read_receipts', 'privacy_typing']);
        });
    }
};
