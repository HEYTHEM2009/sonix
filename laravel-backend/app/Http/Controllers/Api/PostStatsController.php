<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PinnedPost;
use App\Models\Post;
use App\Models\PostView;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;

class PostStatsController extends Controller
{
    public function show($postId)
    {
        try {
            $post = Post::findOrFail($postId);

            $hasViewsCount = $this->columnExists('posts', 'views_count');
            $stats = [
                'views' => $hasViewsCount ? ($post->views_count ?? 0) : 0,
                'likes' => $post->likes()->count(),
                'comments' => $post->comments()->count(),
                'bookmarks' => $post->bookmarks()->count(),
            ];

            return response()->json($stats);
        } catch (\Exception $e) {
            return response()->json([
                'views' => 0,
                'likes' => 0,
                'comments' => 0,
                'bookmarks' => 0,
            ]);
        }
    }

    public function recordView($postId)
    {
        try {
            $post = Post::findOrFail($postId);

            if ($this->columnExists('posts', 'views_count')) {
                $post->increment('views_count');
            }

            try {
                PostView::create([
                    'post_id' => $postId,
                    'user_id' => Auth::id(),
                    'ip_address' => request()->ip(),
                ]);
            } catch (\Exception $e) {
                // Table might not exist
            }

            return response()->json(['message' => 'View recorded']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Operation failed'], 500);
        }
    }

    public function pin($postId)
    {
        try {
            $post = Post::where('user_id', Auth::id())->findOrFail($postId);

            PinnedPost::where('user_id', Auth::id())->delete();

            PinnedPost::create([
                'user_id' => Auth::id(),
                'post_id' => $postId,
            ]);

            if ($this->columnExists('posts', 'is_pinned')) {
                $post->update(['is_pinned' => true]);
            }

            return response()->json(['message' => 'Post pinned']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Operation failed'], 500);
        }
    }

    public function unpin($postId)
    {
        try {
            PinnedPost::where('user_id', Auth::id())->where('post_id', $postId)->delete();

            if ($this->columnExists('posts', 'is_pinned')) {
                Post::where('id', $postId)->update(['is_pinned' => false]);
            }

            return response()->json(['message' => 'Post unpinned']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Operation failed'], 500);
        }
    }

    private function columnExists($table, $column)
    {
        try {
            return Schema::hasColumn($table, $column);
        } catch (\Exception $e) {
            return false;
        }
    }
}
