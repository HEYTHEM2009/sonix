<?php

namespace App\Services;

use App\Models\MusicTrack;
use App\Models\Reel;
use App\Models\ReelAnalytics;
use App\Models\ReelHashtag;
use App\Models\ReelLike;
use App\Models\ReelSave;
use App\Models\ReelShare;
use App\Models\ReelWatchHistory;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Encapsulates all Reels business logic: feed, recommendations, trending,
 * analytics and moderation helpers. Keeps controllers thin and reusable.
 */
class ReelService
{
    protected int $perPage = 20;

    public function feed(int $userId, array $filters = []): array
    {
        $cacheKey = 'reel_feed:'.$userId.':'.md5(json_encode($filters));

        return Cache::remember($cacheKey, 60, function () use ($userId, $filters) {
            $query = Reel::with('user:id,username,avatar')
                ->withCount(['likes', 'comments'])
                ->where('status', 'published')
                ->where(function ($q) {
                    $q->whereNull('scheduled_at')->orWhere('scheduled_at', '<=', now());
                });

            if (! empty($filters['hashtag'])) {
                $query->whereHas('hashtags', fn ($q) => $q->where('tag', strtolower($filters['hashtag'])));
            }

            if (! empty($filters['user_id'])) {
                $query->where('user_id', $filters['user_id']);
            }

            if (! empty($filters['trending'])) {
                $query->join('reel_analytics', 'reel_analytics.reel_id', '=', 'reels.id')
                    ->orderByDesc('reel_analytics.trending_score');
            } else {
                $query->orderByDesc('created_at');
            }

            $reels = $query->paginate($this->perPage)->withQueryString();

            return $this->decorateCollection($reels, $userId);
        });
    }

    /**
     * For-You recommendation feed based on the viewer's likes, saves, watch
     * history and follows. Falls back to trending for cold users.
     */
    public function forYou(int $userId): array
    {
        $cacheKey = 'reel_foryou:'.$userId;

        return Cache::remember($cacheKey, 120, function () use ($userId) {
            $interestedUserIds = ReelLike::where('user_id', $userId)
                ->pluck('reel_id');

            $preferredCreators = Reel::whereIn('id', $interestedUserIds)
                ->pluck('user_id')
                ->unique()
                ->take(50);

            $likedReelIds = ReelLike::where('user_id', $userId)->pluck('reel_id')->toArray();
            $savedReelIds = ReelSave::where('user_id', $userId)->pluck('reel_id')->toArray();
            $watchedReelIds = ReelWatchHistory::where('user_id', $userId)->pluck('reel_id')->toArray();
            $seen = array_merge($likedReelIds, $savedReelIds, $watchedReelIds);

            $query = Reel::with('user:id,username,avatar')
                ->withCount(['likes', 'comments'])
                ->where('reels.user_id', '!=', $userId)
                ->where('status', 'published')
                ->where(function ($q) {
                    $q->whereNull('scheduled_at')->orWhere('scheduled_at', '<=', now());
                })
                ->whereNotIn('reels.id', $seen);

            if ($preferredCreators->isNotEmpty()) {
                try {
                    $query->orderByRaw(
                        'CASE WHEN reels.user_id IN ('.$preferredCreators->implode(',').') THEN 0 ELSE 1 END'
                    );
                } catch (\Throwable $e) {
                    $query->orderByDesc('reels.created_at');
                }
            }

            $query->join('reel_analytics', 'reel_analytics.reel_id', '=', 'reels.id')
                ->orderByDesc('reel_analytics.recommendation_score')
                ->orderByDesc('reels.created_at');

            $reels = $query->paginate($this->perPage)->withQueryString();

            return $this->decorateCollection($reels, $userId);
        });
    }

    public function trending(int $userId, int $perPage = 20): array
    {
        try {
            $reels = Reel::with('user:id,username,avatar')
                ->withCount(['likes', 'comments'])
                ->join('reel_analytics', 'reel_analytics.reel_id', '=', 'reels.id')
                ->orderByDesc('reel_analytics.trending_score')
                ->paginate($perPage)
                ->withQueryString();
        } catch (\Throwable $e) {
            $reels = Reel::with('user:id,username,avatar')
                ->withCount(['likes', 'comments'])
                ->orderByDesc('created_at')
                ->paginate($perPage)
                ->withQueryString();
        }

        return $this->decorateCollection($reels, $userId);
    }

    public function byHashtag(string $tag, int $userId, int $perPage = 20): array
    {
        $reels = Reel::with('user:id,username,avatar')
            ->withCount(['likes', 'comments'])
            ->whereHas('hashtags', fn ($q) => $q->where('tag', strtolower($tag)))
            ->orderByDesc('created_at')
            ->paginate($perPage)
            ->withQueryString();

        return $this->decorateCollection($reels, $userId);
    }

    public function search(string $term, int $userId, int $perPage = 20): array
    {
        $reels = Reel::with('user:id,username,avatar')
            ->withCount(['likes', 'comments'])
            ->where('caption', 'like', '%'.$term.'%')
            ->orWhere('music_title', 'like', '%'.$term.'%')
            ->orderByDesc('created_at')
            ->paginate($perPage)
            ->withQueryString();

        return $this->decorateCollection($reels, $userId);
    }

    public function saved(int $userId, int $perPage = 20): array
    {
        $reels = Reel::with('user:id,username,avatar')
            ->withCount(['likes', 'comments'])
            ->whereHas('saves', fn ($q) => $q->where('user_id', $userId))
            ->orderByDesc('created_at')
            ->paginate($perPage)
            ->withQueryString();

        return $this->decorateCollection($reels, $userId);
    }

    /**
     * Record a watch session and recompute analytics for the reel.
     */
    public function recordWatch(int $userId, int $reelId, int $secondsWatched, int $percent, bool $completed): void
    {
        ReelWatchHistory::updateOrCreate(
            [
                'user_id' => $userId,
                'reel_id' => $reelId,
                'created_at' => now()->startOfDay(),
            ],
            [
                'watch_seconds' => $secondsWatched,
                'percent_watched' => $percent,
                'completed' => $completed,
            ]
        );

        $this->recomputeAnalytics($reelId);
    }

    public function recordShare(int $userId, int $reelId, ?string $platform): void
    {
        ReelShare::create([
            'user_id' => $userId,
            'reel_id' => $reelId,
            'platform' => $platform,
        ]);

        $this->recomputeAnalytics($reelId);
    }

    public function toggleSave(int $userId, int $reelId): bool
    {
        $save = ReelSave::where(['user_id' => $userId, 'reel_id' => $reelId])->first();

        if ($save) {
            $save->delete();
            $saved = false;
        } else {
            ReelSave::create(['user_id' => $userId, 'reel_id' => $reelId]);
            $saved = true;
        }

        $this->recomputeAnalytics($reelId);
        Cache::forget('reel_feed:'.$userId);

        return $saved;
    }

    public function toggleLike(int $userId, int $reelId): array
    {
        $reel = Reel::findOrFail($reelId);
        $existing = $reel->likes()->where('user_id', $userId)->first();

        if ($existing) {
            $existing->delete();
            $liked = false;
        } else {
            $reel->likes()->create(['user_id' => $userId]);
            $liked = true;
        }

        $this->recomputeAnalytics($reelId);
        Cache::forget('reel_feed:'.$userId);

        $reel = Reel::withCount('likes')->findOrFail($reelId);

        return [
            'liked' => $liked,
            'likes_count' => $reel->likes_count,
        ];
    }

    /**
     * Recompute deriver analytics used for trending & recommendations.
     */
    public function recomputeAnalytics(int $reelId): void
    {
        try {
            $reel = Reel::withCount(['likes', 'comments', 'saves', 'shares'])->find($reelId);
            if (! $reel) {
                return;
            }

            $watchTime = ReelWatchHistory::where('reel_id', $reelId)->sum('watch_seconds');
            $completions = ReelWatchHistory::where('reel_id', $reelId)->where('completed', true)->count();
            $totalViews = ReelWatchHistory::where('reel_id', $reelId)->count();
            $completionRate = $totalViews > 0 ? round(($completions / $totalViews) * 100, 2) : 0;

            $views = max($reel->views_count, $totalViews);

            $ageHours = max(1, ($reel->created_at->diffInMinutes(now())) / 60);
            $engagement = $reel->likes_count * 3 + $reel->comments_count * 2
                + $reel->saves_count * 4 + $reel->shares_count * 5;
            $trendingScore = round(($engagement + $views) / sqrt($ageHours), 2);

            $recommendationScore = round(
                $completionRate * 0.4 + min(100, $reel->saves_count * 2) * 0.3 + min(100, $engagement) * 0.3,
                2
            );

            ReelAnalytics::updateOrCreate(
                ['reel_id' => $reelId],
                [
                    'views_count' => $views,
                    'likes_count' => $reel->likes_count,
                    'comments_count' => $reel->comments_count,
                    'shares_count' => $reel->shares_count,
                    'saves_count' => $reel->saves_count,
                    'watch_time_seconds' => $watchTime,
                    'completion_rate' => $completionRate,
                    'trending_score' => $trendingScore,
                    'recommendation_score' => $recommendationScore,
                    'last_viewed_at' => now(),
                ]
            );
        } catch (\Throwable $e) {
            Log::error('ReelService@recomputeAnalytics: '.$e->getMessage());
        }
    }

    public function creatorInsights(int $userId): array
    {
        $reels = Reel::where('user_id', $userId)
            ->with('analytics')
            ->withCount(['likes', 'comments', 'saves', 'shares'])
            ->orderByDesc('created_at')
            ->get();

        $totalViews = $reels->sum('views_count');
        $totalLikes = $reels->sum('likes_count');
        $totalComments = $reels->sum('comments_count');
        $totalSaves = $reels->sum('saves_count');
        $totalShares = $reels->sum('shares_count');
        $watchTime = $reels->sum(fn ($r) => $r->analytics?->watch_time_seconds ?? 0);
        $avgCompletion = $reels->avg(fn ($r) => $r->analytics?->completion_rate ?? 0);

        return [
            'totals' => [
                'reels' => $reels->count(),
                'views' => $totalViews,
                'likes' => $totalLikes,
                'comments' => $totalComments,
                'saves' => $totalSaves,
                'shares' => $totalShares,
                'watch_time_seconds' => $watchTime,
            ],
            'engagement_rate' => $totalViews > 0
                ? round((($totalLikes + $totalComments + $totalSaves) / $totalViews) * 100, 2)
                : 0,
            'avg_completion_rate' => round((float) $avgCompletion, 2),
            'reels' => $reels->map(function ($r) {
                return [
                    'id' => $r->id,
                    'caption' => $r->caption,
                    'views_count' => $r->views_count,
                    'likes_count' => $r->likes_count,
                    'comments_count' => $r->comments_count,
                    'saves_count' => $r->saves_count,
                    'shares_count' => $r->shares_count,
                    'completion_rate' => $r->analytics?->completion_rate ?? 0,
                    'trending_score' => $r->analytics?->trending_score ?? 0,
                    'watch_time_seconds' => $r->analytics?->watch_time_seconds ?? 0,
                ];
            }),
        ];
    }

    public function popularHashtags(int $limit = 20): array
    {
        return ReelHashtag::select('tag', DB::raw('count(*) as total'))
            ->groupBy('tag')
            ->orderByDesc('total')
            ->limit($limit)
            ->pluck('total', 'tag')
            ->toArray();
    }

    /**
     * Reels Pro: list the authenticated creator's drafts (not yet published).
     */
    public function drafts(int $userId, int $perPage = 20): array
    {
        $reels = Reel::with('user:id,username,avatar')
            ->withCount(['likes', 'comments'])
            ->where('user_id', $userId)
            ->where('status', 'draft')
            ->orderByDesc('updated_at')
            ->paginate($perPage);

        return $this->decorateCollection($reels, $userId);
    }

    /**
     * Reels Pro: list scheduled (pending) reels for the creator.
     */
    public function scheduled(int $userId, int $perPage = 20): array
    {
        $reels = Reel::with('user:id,username,avatar')
            ->withCount(['likes', 'comments'])
            ->where('user_id', $userId)
            ->where('status', 'scheduled')
            ->orderBy('scheduled_at')
            ->paginate($perPage);

        return $this->decorateCollection($reels, $userId);
    }

    /**
     * Reels Pro: featured/curated reel feed (admin-pinned).
     */
    public function featured(int $userId, int $perPage = 20): array
    {
        $reels = Reel::with('user:id,username,avatar')
            ->withCount(['likes', 'comments'])
            ->where('status', 'published')
            ->where('is_featured', true)
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return $this->decorateCollection($reels, $userId);
    }

    /**
     * Reels Pro: music library for the create-reel flow.
     */
    public function musicLibrary(?string $genre = null, ?string $term = null, int $perPage = 30): array
    {
        $query = MusicTrack::query();

        if ($genre) {
            $query->where('genre', $genre);
        }
        if ($term) {
            $query->where(function ($q) use ($term) {
                $q->where('title', 'like', "%{$term}%")
                    ->orWhere('artist', 'like', "%{$term}%");
            });
        }

        return $query->orderByDesc('is_trending')
            ->orderByDesc('created_at')
            ->paginate($perPage)
            ->toArray();
    }

    /**
     * Reels Pro: toggle the authenticated user's Pro badge (self-serve upgrade).
     */
    public function togglePro(int $userId, bool $enabled): bool
    {
        $user = User::findOrFail($userId);
        $user->is_pro = $enabled;
        $user->pro_until = $enabled ? now()->addYear() : null;
        $user->save();

        return $enabled;
    }

    protected function decorateCollection($paginator, int $userId): array
    {
        try {
            $likedIds = ReelLike::where('user_id', $userId)->pluck('reel_id')->toArray();
        } catch (\Throwable $e) {
            $likedIds = [];
        }

        try {
            $savedIds = ReelSave::where('user_id', $userId)->pluck('reel_id')->toArray();
        } catch (\Throwable $e) {
            $savedIds = [];
        }

        $paginator->getCollection()->transform(function ($reel) use ($likedIds, $savedIds) {
            $reel->liked = in_array($reel->id, $likedIds, true);
            $reel->saved = in_array($reel->id, $savedIds, true);
            try {
                $reel->hashtags = $reel->hashtags()->pluck('tag')->toArray();
            } catch (\Throwable $e) {
                $reel->hashtags = [];
            }

            return $reel;
        });

        return $paginator->toArray();
    }
}
