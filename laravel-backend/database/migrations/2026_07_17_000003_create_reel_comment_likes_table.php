<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reel_comment_likes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('reel_comment_id')->constrained()->onDelete('cascade');
            $table->timestamps();

            $table->unique(['user_id', 'reel_comment_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reel_comment_likes');
    }
};
