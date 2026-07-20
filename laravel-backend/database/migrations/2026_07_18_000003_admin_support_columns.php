<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'last_seen_at')) {
            Schema::table('users', function (Blueprint $table) {
                $table->timestamp('last_seen_at')->nullable()->after('updated_at');
                $table->index('last_seen_at');
            });
        }

        if (Schema::hasTable('reports') && ! Schema::hasColumn('reports', 'status')) {
            Schema::table('reports', function (Blueprint $table) {
                $table->string('status')->default('pending')->after('reason');
                $table->foreignId('moderated_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('moderated_at')->nullable();
                $table->index('status');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('users', 'last_seen_at')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropIndex(['last_seen_at']);
                $table->dropColumn('last_seen_at');
            });
        }

        if (Schema::hasTable('reports') && Schema::hasColumn('reports', 'status')) {
            Schema::table('reports', function (Blueprint $table) {
                $table->dropColumn(['status', 'moderated_by', 'moderated_at']);
            });
        }
    }
};
