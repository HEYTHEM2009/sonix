<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('email_verification_tokens')) {
            Schema::table('email_verification_tokens', function (Blueprint $table) {
                if (Schema::hasColumn('email_verification_tokens', 'token')) {
                    $table->string('token', 255)->nullable()->change();
                }
            });
            return;
        }

        Schema::create('email_verification_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token', 255);
            $table->timestamp('expires_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('email_verification_tokens');
    }
};
