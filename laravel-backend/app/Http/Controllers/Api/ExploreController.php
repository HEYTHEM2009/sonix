<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\User;
use App\Models\Follow;
use Illuminate\Http\Request;

class ExploreController extends Controller
{
    public function index(Request $request)
    {
        $currentUser = $request->user();
        $perPage = (int) ($request->input('per_page', 20));

        $trending = Post::with('user:id,username,avatar')
            ->withCount(['likes', 'likes as liked' => fn($q) => $q->where('user_id', $currentUser?->id ?? 0)])
            ->withCount('comments as comments_count')
            ->where('created_at', '>=', now()->subDays(7))
            ->where(function ($q) use ($currentUser) {
                $q->whereHas('user', fn($sub) => $sub->where('is_private', false));
                if ($currentUser) {
                    $q->orWhere('user_id', $currentUser->id);
                }
            })
            ->orderByDesc('likes_count')
            ->orderByDesc('comments_count')
            ->limit(30)
            ->get();

        $suggested = User::select('id', 'username', 'avatar', 'bio')
            ->where('id', '!=', $currentUser?->id ?? 0)
            ->where(function ($q) use ($currentUser) {
                if ($currentUser) {
                    $q->whereNotExists(fn($ex) => $ex->selectRaw(1)->from('follows')
                        ->whereColumn('follows.following_id', 'users.id')
                        ->where('follows.follower_id', $currentUser->id)
                        ->where('follows.status', 'accepted'));
                }
            })
            ->inRandomOrder()
            ->limit(20)
            ->get();

        return response()->json([
            'trending' => $trending,
            'suggested' => $suggested,
        ]);
    }
}
