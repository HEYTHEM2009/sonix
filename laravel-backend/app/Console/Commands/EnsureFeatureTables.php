<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

class EnsureFeatureTables extends Command
{
    protected $signature = 'app:ensure-feature-tables';
    protected $description = 'Create missing feature tables (profile_visitors, user_badges, profile_templates) and clean stale migration records';

    public function handle()
    {
        $created = 0;

        // Remove stale migration records for tables that don't actually exist
        $staleMigrations = [
            '2026_07_11_000006_create_profile_visitors_table',
            '2026_07_11_000008_create_user_badges_table',
            '2026_07_11_000011_create_profile_templates_table',
            '2026_07_12_000001_create_missing_feature_tables',
            '2026_07_12_000001_add_vanish_and_edit_fields_to_messages',
            '2026_07_12_000013_create_recent_searches_table',
        ];

        foreach ($staleMigrations as $migration) {
            $exists = DB::table('migrations')->where('migration', $migration)->exists();
            if ($exists) {
                DB::table('migrations')->where('migration', $migration)->delete();
                $this->info("Removed stale migration record: {$migration}");
            }
        }

        // Create profile_visitors table
        if (!Schema::hasTable('profile_visitors')) {
            Schema::create('profile_visitors', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->foreignId('visitor_id')->constrained('users')->onDelete('cascade');
                $table->timestamps();
                $table->index('user_id');
                $table->index('visitor_id');
            });
            $this->info('Created profile_visitors table');
            $created++;
        } else {
            $this->info('profile_visitors table already exists');
        }

        // Create user_badges table
        if (!Schema::hasTable('user_badges')) {
            Schema::create('user_badges', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->string('badge_type');
                $table->string('badge_name');
                $table->text('description')->nullable();
                $table->string('icon_url')->nullable();
                $table->timestamps();
                $table->index('user_id');
            });
            $this->info('Created user_badges table');
            $created++;
        } else {
            $this->info('user_badges table already exists');
        }

        // Create profile_templates table
        if (!Schema::hasTable('profile_templates')) {
            Schema::create('profile_templates', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->string('template_name');
                $table->json('template_data')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
                $table->index('user_id');
            });
            $this->info('Created profile_templates table');
            $created++;
        } else {
            $this->info('profile_templates table already exists');
        }

        // Create support_messages table
        if (!Schema::hasTable('support_messages')) {
            Schema::create('support_messages', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->string('subject', 255);
                $table->text('message');
                $table->timestamps();
            });
            $this->info('Created support_messages table');
            $created++;
        } else {
            $this->info('support_messages table already exists');
        }

        // Create recent_searches table
        if (!Schema::hasTable('recent_searches')) {
            Schema::create('recent_searches', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->foreignId('searched_user_id')->constrained('users')->cascadeOnDelete();
                $table->timestamps();
                $table->unique(['user_id', 'searched_user_id']);
            });
            $this->info('Created recent_searches table');
            $created++;
        } else {
            $this->info('recent_searches table already exists');
        }

        // Add missing columns to messages table (PostgreSQL-safe, no ->after())
        $missingMessageColumns = 0;
        if (!Schema::hasColumn('messages', 'is_edited')) {
            Schema::table('messages', function (Blueprint $table) {
                $table->boolean('is_edited')->default(false);
            });
            $this->info('Added is_edited column to messages');
            $missingMessageColumns++;
        }
        if (!Schema::hasColumn('messages', 'original_content')) {
            Schema::table('messages', function (Blueprint $table) {
                $table->text('original_content')->nullable();
            });
            $this->info('Added original_content column to messages');
            $missingMessageColumns++;
        }
        if (!Schema::hasColumn('messages', 'is_disappearing')) {
            Schema::table('messages', function (Blueprint $table) {
                $table->boolean('is_disappearing')->default(false);
            });
            $this->info('Added is_disappearing column to messages');
            $missingMessageColumns++;
        }
        if (!Schema::hasColumn('messages', 'disappears_at')) {
            Schema::table('messages', function (Blueprint $table) {
                $table->timestamp('disappears_at')->nullable();
            });
            $this->info('Added disappears_at column to messages');
            $missingMessageColumns++;
        }
        if (!Schema::hasColumn('messages', 'deleted_for')) {
            Schema::table('messages', function (Blueprint $table) {
                $table->text('deleted_for')->nullable();
            });
            $this->info('Added deleted_for column to messages');
            $missingMessageColumns++;
        }

        if ($missingMessageColumns > 0) {
            $this->info("Successfully added {$missingMessageColumns} missing column(s) to messages table");
        }

        // Add missing columns to users table
        $missingUserColumns = 0;
        if (!Schema::hasColumn('users', 'role')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('role')->default('user');
            });
            $this->info('Added role column to users');
            $missingUserColumns++;
        }
        if (!Schema::hasColumn('users', 'two_factor_enabled')) {
            Schema::table('users', function (Blueprint $table) {
                $table->boolean('two_factor_enabled')->default(false);
            });
            $this->info('Added two_factor_enabled column to users');
            $missingUserColumns++;
        }
        if (!Schema::hasColumn('users', 'two_factor_secret')) {
            Schema::table('users', function (Blueprint $table) {
                $table->text('two_factor_secret')->nullable();
            });
            $this->info('Added two_factor_secret column to users');
            $missingUserColumns++;
        }

        if ($missingUserColumns > 0) {
            $this->info("Successfully added {$missingUserColumns} missing column(s) to users table");
        }

        // Reel tables
        if (!Schema::hasTable('reels')) {
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
                $table->integer('views_count')->default(0);
                $table->timestamps();
            });
            $this->info('Created reels table');
        }
        if (!Schema::hasTable('reel_likes')) {
            Schema::create('reel_likes', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->foreignId('reel_id')->constrained()->onDelete('cascade');
                $table->timestamps();
                $table->unique(['user_id', 'reel_id']);
            });
            $this->info('Created reel_likes table');
        }
        if (!Schema::hasTable('reel_comments')) {
            Schema::create('reel_comments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->foreignId('reel_id')->constrained()->onDelete('cascade');
                $table->text('content');
                $table->foreignId('parent_id')->nullable()->constrained('reel_comments')->onDelete('cascade');
                $table->timestamps();
            });
            $this->info('Created reel_comments table');
        }
        if (!Schema::hasTable('reel_comment_likes')) {
            Schema::create('reel_comment_likes', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->foreignId('reel_comment_id')->constrained()->onDelete('cascade');
                $table->timestamps();
                $table->unique(['user_id', 'reel_comment_id']);
            });
            $this->info('Created reel_comment_likes table');
        }

        // Group chat tables
        $groupTablesCreated = 0;
        if (!Schema::hasTable('groups')) {
            Schema::create('groups', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('avatar')->nullable();
                $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
                $table->timestamps();
            });
            $this->info('Created groups table');
            $groupTablesCreated++;
        }
        if (!Schema::hasTable('group_members')) {
            Schema::create('group_members', function (Blueprint $table) {
                $table->id();
                $table->foreignId('group_id')->constrained('groups')->onDelete('cascade');
                $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
                $table->string('role')->default('member');
                $table->timestamp('joined_at')->useCurrent();
                $table->timestamps();
                $table->unique(['group_id', 'user_id']);
            });
            $this->info('Created group_members table');
            $groupTablesCreated++;
        }
        if (!Schema::hasTable('group_messages')) {
            Schema::create('group_messages', function (Blueprint $table) {
                $table->id();
                $table->foreignId('group_id')->constrained('groups')->onDelete('cascade');
                $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
                $table->text('content')->nullable();
                $table->string('type')->default('text');
                $table->string('image')->nullable();
                $table->timestamps();
            });
            $this->info('Created group_messages table');
            $groupTablesCreated++;
        }

        if ($created > 0 || $groupTablesCreated > 0) {
            $this->info("Successfully created {$created} missing table(s) and {$groupTablesCreated} group table(s)");
        } else {
            $this->info('All feature tables already exist');
        }

        return 0;
    }
}
