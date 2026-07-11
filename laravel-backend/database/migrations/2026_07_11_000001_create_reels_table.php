<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('video_url');
            $table->string('thumbnail_url')->nullable();
            $table->text('caption')->nullable();
            $table->string('music_title')->nullable();
            $table->string('music_url')->nullable();
            $table->integer('duration')->default(30);
            $table->boolean('comments_enabled')->default(true);
            $table->timestamps();

            $table->index('user_id');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reels');
    }
};
