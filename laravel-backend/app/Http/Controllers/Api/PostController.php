<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Helpers\Sanitize;
use App\Helpers\StorageHelper;
use App\Models\Post;
use App\Models\Follow;
use App\Models\User;
use App\Models\BlockedUser;
use Illuminate\Http\Request;

class PostController extends Controller
{
    public function index(Request $request)
    {
        $currentUser = $request->user();
        $perPage = (int) ($request->input('per_page', 20));

        $posts = Post::with('user:id,username,avatar')
            ->withCount(['likes', 'likes as liked' => fn($q) => $q->where('user_id', $currentUser?->id ?? 0)])
            ->withCount('comments as comments_count')
            ->where(function ($q) use ($currentUser) {
                $q->whereHas('user', fn($sub) => $sub->where('is_private', false));
                if ($currentUser) {
                    $q->orWhereExists(fn($sub) => $sub->selectRaw(1)->from('follows')
                        ->whereColumn('follows.following_id', 'posts.user_id')
                        ->where('follows.follower_id', $currentUser->id)
                        ->where('follows.status', 'accepted'));
                    $q->orWhere('user_id', $currentUser->id);
                }
            })
            ->latest()
            ->paginate($perPage);

        return response()->json($posts);
    }

    public function show($id, Request $request)
    {
        $currentUser = $request->user();
        $post = Post::with('user:id,username,avatar')
            ->withCount(['likes', 'likes as liked' => fn($q) => $q->where('user_id', $currentUser?->id ?? 0)])
            ->withCount('comments as comments_count')
            ->find($id);

        if (!$post) return response()->json(['message' => 'Not found'], 404);

        return response()->json($post);
    }

    public function userPosts($userId, Request $request)
    {
        $currentUser = $request->user();
        $perPage = (int) ($request->input('per_page', 20));

        $targetUser = User::select('id', 'is_private', 'username')->find($userId);
        if (!$targetUser) {
            return response()->json(['message' => 'User not found'], 404);
        }

        if ($targetUser->is_private && (!$currentUser || $currentUser->id !== $targetUser->id)) {
            $isFollowing = $currentUser && Follow::where('follower_id', $currentUser->id)
                ->where('following_id', $targetUser->id)
                ->where('status', 'accepted')
                ->exists();
            if (!$isFollowing) {
                return response()->json(['data' => [], 'user' => $targetUser, 'private' => true]);
            }
        }

        $posts = Post::with('user:id,username,avatar')
            ->withCount(['likes', 'likes as liked' => fn($q) => $q->where('user_id', $currentUser?->id ?? 0)])
            ->withCount('comments as comments_count')
            ->where('user_id', $userId)
            ->latest()
            ->paginate($perPage);

        return response()->json($posts);
    }

    public function destroy($id)
    {
        $post = Post::find($id);
        if (!$post) return response()->json(['message' => 'Not found'], 404);
        if ($post->user_id !== request()->user()->id) return response()->json(['message' => 'Unauthorized'], 403);
        $post->delete();
        return response()->json(['message' => 'Post deleted']);
    }

    public function update($id, Request $request)
    {
        $post = Post::find($id);
        if (!$post) return response()->json(['message' => 'Not found'], 404);
        if ($post->user_id !== $request->user()->id) return response()->json(['message' => 'Unauthorized'], 403);

        $request->validate(['content' => 'required|string|max:5000']);

        $post->content = Sanitize::text($request->input('content'));
        $post->save();

        $post->load('user:id,username,avatar');
        return response()->json($post);
    }

    public function store(Request $request)
    {
        $rules = ['content' => 'nullable|string'];
        if ($request->hasFile('video')) {
            $rules['video'] = 'required|mimes:mp4,mov,avi,webm|max:102400';
        } else {
            $rules['image'] = 'nullable|image|max:2048';
        }
        $request->validate($rules);

        $hasContent = $request->filled('content') && trim($request->content ?? '') !== '';
        $hasImage = $request->hasFile('image');
        $hasVideo = $request->hasFile('video');

        if (!$hasContent && !$hasImage && !$hasVideo) {
            return response()->json(['message' => 'Content, image, or video is required'], 400);
        }

        $data = [
            'content' => Sanitize::text($request->content ?? ''),
            'type' => $hasVideo ? 'video' : ($hasImage ? 'image' : 'text'),
            'user_id' => $request->user()->id,
        ];

        if ($hasVideo) {
            $path = StorageHelper::upload($request->file('video'), 'uploads');
            $data['video'] = StorageHelper::getUrl($path);
        } elseif ($hasImage) {
            $path = StorageHelper::upload($request->file('image'), 'uploads');
            $data['image'] = StorageHelper::getUrl($path);
            $data['thumbnail'] = StorageHelper::getUrl($path);
        }

        $post = Post::create($data);

        $post->load('user:id,username,avatar');
        return response()->json($post);
    }
}
