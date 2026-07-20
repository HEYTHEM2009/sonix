<?php

namespace App\Services;

use App\Models\Follow;
use App\Models\MusicTrack;
use App\Models\Post;
use App\Models\Reel;
use App\Models\ReelHashtag;
use App\Models\Story;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Centralised search across users, reels, posts, stories, hashtags and audio.
 */
class SearchService
{
    public function smartSuggestions(int $userId, string $term = '', int $limit = 10): array
    {
        $term = trim($term);

        if ($term === '') {
            return $this->defaultSuggestions($userId, $limit);
        }

        return [
            'users' => $this->users($term, $limit),
            'reels' => $this->reels($term, $limit),
            'posts' => $this->posts($term, $limit),
            'hashtags' => $this->hashtags($term, $limit),
            'audio' => $this->audio($term, $limit),
        ];
    }

    public function users(string $term, int $limit = 20, int $page = 1): array
    {
        return User::where('username', 'ilike', "%{$term}%")
            ->orWhere('bio', 'ilike', "%{$term}%")
            ->select('id', 'username', 'avatar', 'is_private', 'bio')
            ->orderByRaw('CASE WHEN username ILIKE ? THEN 0 ELSE 1 END', ["{$term}%"])
            ->paginate($limit, ['*'], 'page', $page)
            ->toArray();
    }

    public function reels(string $term, int $limit = 20, int $page = 1): array
    {
        return Reel::with('user:id,username,avatar')
            ->where('caption', 'ilike', "%{$term}%")
            ->orWhere('music_title', 'ilike', "%{$term}%")
            ->orderByDesc('created_at')
            ->paginate($limit, ['*'], 'page', $page)
            ->toArray();
    }

    public function posts(string $term, int $limit = 20, int $page = 1): array
    {
        return Post::with('user:id,username,avatar')
            ->where('content', 'ilike', "%{$term}%")
            ->orderByDesc('created_at')
            ->paginate($limit, ['*'], 'page', $page)
            ->toArray();
    }

    public function stories(string $term, int $limit = 20, int $page = 1): array
    {
        return Story::with('user:id,username,avatar')
            ->where('text_overlay', 'ilike', "%{$term}%")
            ->orderByDesc('created_at')
            ->paginate($limit, ['*'], 'page', $page)
            ->toArray();
    }

    public function hashtags(string $term, int $limit = 20): array
    {
        return ReelHashtag::select('tag', DB::raw('count(*) as total'))
            ->where('tag', 'ilike', "%{$term}%")
            ->groupBy('tag')
            ->orderByDesc('total')
            ->limit($limit)
            ->pluck('total', 'tag')
            ->toArray();
    }

    public function audio(string $term, int $limit = 20, int $page = 1): array
    {
        $query = MusicTrack::query();

        if ($term) {
            $query->where(function ($q) use ($term) {
                $q->where('title', 'ilike', "%{$term}%")
                    ->orWhere('artist', 'ilike', "%{$term}%")
                    ->orWhere('genre', 'ilike', "%{$term}%");
            });
        }

        return $query->orderByDesc('is_trending')
            ->orderByDesc('created_at')
            ->paginate($limit, ['*'], 'page', $page)
            ->toArray();
    }

    public function trending(int $limit = 10): array
    {
        return ReelHashtag::select('tag', DB::raw('count(*) as total'))
            ->groupBy('tag')
            ->orderByDesc('total')
            ->limit($limit)
            ->pluck('total', 'tag')
            ->toArray();
    }

    protected function defaultSuggestions(int $userId, int $limit): array
    {
        return Cache::remember('search_suggestions:'.$userId, 300, function () use ($userId, $limit) {
            $followingIds = Follow::where('follower_id', $userId)
                ->pluck('following_id')->toArray();

            $users = User::whereIn('id', $followingIds)
                ->select('id', 'username', 'avatar', 'is_private')
                ->inRandomOrder()
                ->limit($limit)
                ->get();

            $hashtags = ReelHashtag::select('tag', DB::raw('count(*) as total'))
                ->groupBy('tag')
                ->orderByDesc('total')
                ->limit($limit)
                ->pluck('total', 'tag')
                ->toArray();

            return [
                'users' => $users->toArray(),
                'reels' => [],
                'posts' => [],
                'hashtags' => $hashtags,
                'audio' => MusicTrack::where('is_trending', true)
                    ->select('id', 'title', 'artist', 'genre', 'url')
                    ->limit($limit)
                    ->get()
                    ->toArray(),
            ];
        });
    }
}
