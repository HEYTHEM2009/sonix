<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reel_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('reel_id')->constrained()->onDelete('cascade');
            $table->text('content');
            $table->timestamps();

            $table->index('reel_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reel_comments');
    }
};
