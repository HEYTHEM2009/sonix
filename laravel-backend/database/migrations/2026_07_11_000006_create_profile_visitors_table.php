<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('profile_visitors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('visitor_id')->constrained('users')->onDelete('cascade');
            $table->timestamps();

            $table->index('user_id');
            $table->index('visitor_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('profile_visitors');
    }
};
