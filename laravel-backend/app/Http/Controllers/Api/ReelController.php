<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use App\Helpers\StorageHelper;

class ReelController extends Controller
{
    public function index(Request $request)
    {
        try {
            if (!Schema::hasTable('reels')) {
                return response()->json(['data' => [], 'total' => 0, 'per_page' => 20]);
            }

            $userId = Auth::id();
            $hasLikes = Schema::hasTable('reel_likes');
            $hasComments = Schema::hasTable('reel_comments');

            $query = \App\Models\Reel::with('user:id,username,avatar');

            if ($hasLikes) {
                $query->withCount('likes')
                      ->with(['likes' => function ($q) use ($userId) {
                          $q->where('user_id', $userId)->limit(1);
                      }]);
            }
            if ($hasComments) {
                $query->withCount('comments');
            }

            $reels = $query->orderByDesc('created_at')->paginate(20);

            $reels->getCollection()->transform(function ($reel) use ($hasLikes) {
                $reel->liked = $hasLikes ? $reel->likes->count() > 0 : false;
                if ($hasLikes) {
                    $reel->unset('likes');
                }
                return $reel;
            });

            return response()->json($reels);
        } catch (\Exception $e) {
            return response()->json([
                'data' => [],
                'total' => 0,
                'per_page' => 20,
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function store(Request $request)
    {
        $request->validate([
            'video' => 'required|file|mimes:mp4,mov|max:102400',
            'caption' => 'nullable|string|max:2200',
            'music_title' => 'nullable|string|max:255',
            'duration' => 'nullable|integer|max:300',
        ]);

        $path = StorageHelper::upload($request->file('video'), 'reels');
        $videoUrl = StorageHelper::getUrl($path);

        $reel = \App\Models\Reel::create([
            'user_id' => Auth::id(),
            'video_url' => $videoUrl,
            'caption' => $request->caption,
            'music_title' => $request->music_title,
            'duration' => $request->duration ?? 30,
        ]);

        return response()->json($reel->load('user'), 201);
    }

    public function show($id)
    {
        $reel = \App\Models\Reel::with('user:id,username,avatar')
            ->withCount(['likes', 'comments'])
            ->with(['comments' => function ($q) {
                $q->with(['user:id,username,avatar', 'replies' => function ($rq) {
                    $rq->with('user:id,username,avatar')->withCount('likes')->orderBy('created_at');
                }])->withCount('likes')
                  ->whereNull('parent_id')
                  ->orderByDesc('created_at')
                  ->limit(50);
            }])
            ->findOrFail($id);

        return response()->json($reel);
    }

    public function recordView($id)
    {
        try {
            $reel = \App\Models\Reel::findOrFail($id);
            $reel->increment('views_count');
            $reel->refresh();
            return response()->json(['views_count' => $reel->views_count]);
        } catch (\Exception $e) {
            return response()->json(['views_count' => 0]);
        }
    }

    public function destroy($id)
    {
        $reel = \App\Models\Reel::where('user_id', Auth::id())->findOrFail($id);
        $reel->delete();

        return response()->json(['message' => 'Reel deleted']);
    }

    public function like($id)
    {
        $reel = \App\Models\Reel::findOrFail($id);
        $existing = $reel->likes()->where('user_id', Auth::id())->first();

        if ($existing) {
            $existing->delete();
            $count = $reel->likes()->count();
            return response()->json(['liked' => false, 'likes_count' => $count]);
        }

        $reel->likes()->create(['user_id' => Auth::id()]);
        $count = $reel->likes()->count();
        return response()->json(['liked' => true, 'likes_count' => $count]);
    }

    public function comment(Request $request, $id)
    {
        $request->validate([
            'content' => 'required|string|max:1000',
            'parent_id' => 'nullable|integer|exists:reel_comments,id',
        ]);

        $reel = \App\Models\Reel::findOrFail($id);
        $comment = $reel->comments()->create([
            'user_id' => Auth::id(),
            'content' => $request->content,
            'parent_id' => $request->parent_id,
        ]);

        return response()->json($comment->load('user'), 201);
    }

    public function likeComment($commentId)
    {
        $comment = \App\Models\ReelComment::findOrFail($commentId);
        $existing = $comment->likes()->where('user_id', Auth::id())->first();

        if ($existing) {
            $existing->delete();
            $count = $comment->likes()->count();
            return response()->json(['liked' => false, 'likes_count' => $count]);
        }

        $comment->likes()->create(['user_id' => Auth::id()]);
        $count = $comment->likes()->count();
        return response()->json(['liked' => true, 'likes_count' => $count]);
    }

    public function destroyComment($id)
    {
        $comment = \App\Models\ReelComment::where('user_id', Auth::id())->findOrFail($id);
        $comment->delete();

        return response()->json(['message' => 'Comment deleted']);
    }
}
