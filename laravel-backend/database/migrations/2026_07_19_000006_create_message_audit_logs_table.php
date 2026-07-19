<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('message_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('message_id')->nullable();
            $table->unsignedBigInteger('actor_id')->nullable();
            $table->string('action');
            $table->text('meta')->nullable();
            $table->timestamps();

            $table->index(['message_id', 'action']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('message_audit_logs');
    }
};
