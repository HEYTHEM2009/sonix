<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected function addIndex(string $table, string|array $column, ?string $name = null): void
    {
        if (! Schema::hasTable($table)) {
            return;
        }
        $name = $name ?? $table.'_'.(is_array($column) ? implode('_', $column) : $column).'_index';
        if (! Schema::hasIndex($table, $name)) {
            Schema::table($table, function (Blueprint $t) use ($column, $name) {
                $t->index($column, $name);
            });
        }
    }

    public function up(): void
    {
        $this->addIndex('reel_comments', 'parent_id');
        $this->addIndex('reel_comments', 'user_id');
        $this->addIndex('reel_likes', 'reel_id');
        $this->addIndex('notifications', ['user_id', 'seen']);
        $this->addIndex('notifications', 'sender_id');
        $this->addIndex('likes', 'post_id');
        $this->addIndex('likes', 'user_id');
        $this->addIndex('comments', 'post_id');
        $this->addIndex('comments', 'user_id');
        $this->addIndex('bookmarks', 'post_id');
        $this->addIndex('follows', 'follower_id');
        $this->addIndex('follows', 'following_id');
        $this->addIndex('stories', ['user_id', 'created_at']);
        $this->addIndex('messages', 'receiver_id');
        $this->addIndex('messages', 'is_deleted');
        $this->addIndex('group_messages', ['group_id', 'created_at']);
        $this->addIndex('group_messages', 'user_id');
    }

    protected function dropIndex(string $table, string $column): void
    {
        $name = $table.'_'.(is_array($column) ? implode('_', $column) : $column).'_index';
        if (Schema::hasTable($table) && Schema::hasIndex($table, $name)) {
            Schema::table($table, function (Blueprint $t) use ($name) {
                $t->dropIndex($name);
            });
        }
    }

    public function down(): void
    {
        $this->dropIndex('reel_comments', 'parent_id');
        $this->dropIndex('reel_comments', 'user_id');
        $this->dropIndex('reel_likes', 'reel_id');
        $this->dropIndex('notifications', ['user_id', 'seen']);
        $this->dropIndex('notifications', 'sender_id');
        $this->dropIndex('likes', 'post_id');
        $this->dropIndex('likes', 'user_id');
        $this->dropIndex('comments', 'post_id');
        $this->dropIndex('comments', 'user_id');
        $this->dropIndex('bookmarks', 'post_id');
        $this->dropIndex('follows', 'follower_id');
        $this->dropIndex('follows', 'following_id');
        $this->dropIndex('stories', ['user_id', 'created_at']);
        $this->dropIndex('messages', 'receiver_id');
        $this->dropIndex('messages', 'is_deleted');
        $this->dropIndex('group_messages', ['group_id', 'created_at']);
        $this->dropIndex('group_messages', 'user_id');
    }
};
