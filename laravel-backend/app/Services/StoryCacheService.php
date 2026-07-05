<?php

namespace App\Services;

use App\Models\Follow;
use App\Models\Story;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class StoryCacheService
{
    protected int $ttl = 300; // 5 minutes
    protected string $prefix = 'sonix:';
    protected string $feedPrefix = 'stories:feed:';
    protected string $timelinePrefix = 'stories:timeline:';
    protected string $metadataPrefix = 'stories:meta:';
    protected string $statsPrefix = 'stories:stats:';
    protected string $pendingPrefix = 'stories:pending:';

    /**
     * Get cached story feed for user.
     * Uses ZSET for efficient ordered retrieval.
     */
    public function getFeed(int $userId): ?array
    {
        try {
            $feedKey = "{$this->feedPrefix}{$userId}";
            $data = Redis::get($feedKey);

            if ($data) {
                $decoded = json_decode($data, true);
                if (is_array($decoded)) {
                    return $decoded;
                }
            }

            // Fallback: try ZSET (timeline-based cache)
            $timelineKey = "{$this->timelinePrefix}{$userId}";
            $storyIds = Redis::zrevrange($timelineKey, 0, 50);

            if (!empty($storyIds)) {
                return $this->hydrateFromIds($storyIds);
            }
        } catch (\Throwable $e) {
            Log::warning('[StoryCache] Redis read failed', ['error' => $e->getMessage()]);
        }

        return null;
    }

    /**
     * Set story feed in cache.
     */
    public function setFeed(int $userId, array $feed): void
    {
        try {
            $feedKey = "{$this->feedPrefix}{$userId}";
            Redis::setex($feedKey, $this->ttl, json_encode($feed));

            // Also update the timeline ZSET with story IDs
            $timelineKey = "{$this->timelinePrefix}{$userId}";
            $storyIds = [];
            foreach ($feed as $userGroup) {
                if (isset($userGroup['stories'])) {
                    foreach ($userGroup['stories'] as $story) {
                        $storyIds[] = $story['id'];
                    }
                }
            }

            if (!empty($storyIds)) {
                $now = (float) microtime(true);
                foreach ($storyIds as $id) {
                    Redis::zadd($timelineKey, [$id => $now]);
                }
                Redis::expire($timelineKey, $this->ttl + 60);
            }
        } catch (\Throwable $e) {
            Log::warning('[StoryCache] Redis write failed', ['error' => $e->getMessage()]);
        }
    }

    /**
     * Invalidate cache for a single user.
     */
    public function invalidateUser(int $userId): void
    {
        try {
            Redis::del("{$this->feedPrefix}{$userId}");
            Redis::del("{$this->timelinePrefix}{$userId}");
            Redis::del("{$this->metadataPrefix}{$userId}");
            Redis::del("{$this->statsPrefix}{$userId}");
        } catch (\Throwable $e) {
            Log::warning('[StoryCache] User invalidation failed', ['error' => $e->getMessage()]);
        }
    }

    /**
     * Fan-out invalidation to all followers of a user.
     * Uses batched Redis operations to avoid N+1.
     */
    public function invalidateFollowers(int $userId): void
    {
        try {
            $followerIds = Follow::where('following_id', $userId)
                ->where('status', 'accepted')
                ->pluck('follower_id')
                ->toArray();

            $followerIds[] = $userId; // Include self

            if (empty($followerIds)) return;

            // Batch delete all keys at once
            $keysToDelete = [];
            foreach ($followerIds as $id) {
                $keysToDelete[] = "{$this->feedPrefix}{$id}";
                $keysToDelete[] = "{$this->timelinePrefix}{$id}";
                $keysToDelete[] = "{$this->metadataPrefix}{$id}";
                $keysToDelete[] = "{$this->statsPrefix}{$id}";
            }

            Redis::del($keysToDelete);
        } catch (\Throwable $e) {
            Log::warning('[StoryCache] Fan-out invalidation failed', ['error' => $e->getMessage()]);
        }
    }

    /**
     * Queue a story for background fan-out to followers.
     * Instead of blocking the API request, queue the work.
     */
    public function queueFanOut(int $storyId, int $userId): void
    {
        try {
            $payload = json_encode([
                'story_id' => $storyId,
                'user_id' => $userId,
                'queued_at' => now()->toISOString(),
            ]);

            Redis::lpush("{$this->pendingPrefix}queue", $payload);

            // Mark the queue for processing
            Redis::setex("{$this->pendingPrefix}flag", 60, 1);
        } catch (\Throwable $e) {
            Log::warning('[StoryCache] Fan-out queue failed', ['error' => $e->getMessage()]);
        }
    }

    /**
     * Process queued fan-out jobs.
     * Call this from a scheduled command or queue worker.
     */
    public function processFanOutQueue(): int
    {
        $processed = 0;

        try {
            while ($payload = Redis::rpop("{$this->pendingPrefix}queue")) {
                $job = json_decode($payload, true);
                if (!$job || !isset($job['user_id'])) continue;

                $this->invalidateFollowers($job['user_id']);
                $processed++;
            }

            Redis::del("{$this->pendingPrefix}flag");
        } catch (\Throwable $e) {
            Log::warning('[StoryCache] Fan-out queue processing failed', ['error' => $e->getMessage()]);
        }

        return $processed;
    }

    /**
     * Store story metadata (view counts, reactions) in Redis hash.
     */
    public function setStoryMeta(int $storyId, array $meta): void
    {
        try {
            $key = "{$this->metadataPrefix}{$storyId}";
            foreach ($meta as $field => $value) {
                Redis::hset($key, $field, is_array($value) ? json_encode($value) : $value);
            }
            Redis::expire($key, $this->ttl + 120);
        } catch (\Throwable $e) {
            Log::warning('[StoryCache] Meta write failed', ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get story metadata from cache.
     */
    public function getStoryMeta(int $storyId): ?array
    {
        try {
            $key = "{$this->metadataPrefix}{$storyId}";
            $data = Redis::hgetall($key);
            if (!empty($data)) {
                return $data;
            }
        } catch (\Throwable $e) {
            Log::warning('[StoryCache] Meta read failed', ['error' => $e->getMessage()]);
        }

        return null;
    }

    /**
     * Increment story view count atomically.
     */
    public function incrementViews(int $storyId): int
    {
        try {
            $key = "{$this->statsPrefix}{$storyId}:views";
            $count = Redis::incr($key);
            Redis::expire($key, $this->ttl + 120);
            return $count;
        } catch (\Throwable $e) {
            Log::warning('[StoryCache] View increment failed', ['error' => $e->getMessage()]);
            return 0;
        }
    }

    /**
     * Get cached view count.
     */
    public function getViewCount(int $storyId): ?int
    {
        try {
            $key = "{$this->statsPrefix}{$storyId}:views";
            $count = Redis::get($key);
            return $count !== null ? (int) $count : null;
        } catch (\Throwable $e) {
            return null;
        }
    }

    /**
     * Invalidate story cache on story creation.
     */
    public function onStoryCreated(int $userId): void
    {
        $this->invalidateFollowers($userId);
    }

    /**
     * Invalidate story cache on story deletion.
     */
    public function onStoryDeleted(int $userId): void
    {
        $this->invalidateFollowers($userId);
    }

    /**
     * Bulk invalidate all story caches (for expiry).
     */
    public function onStoryExpired(): void
    {
        try {
            $patterns = [
                "{$this->feedPrefix}*",
                "{$this->timelinePrefix}*",
                "{$this->metadataPrefix}*",
                "{$this->statsPrefix}*",
            ];

            foreach ($patterns as $pattern) {
                $cursor = null;
                do {
                    [$cursor, $keys] = Redis::scan($cursor ?? 0, ['match' => $pattern, 'count' => 100]);
                    if (!empty($keys)) {
                        Redis::del($keys);
                    }
                } while ($cursor > 0);
            }
        } catch (\Throwable $e) {
            Log::warning('[StoryCache] Bulk invalidation failed', ['error' => $e->getMessage()]);
        }
    }

    /**
     * Hydrate story data from cached IDs.
     */
    protected function hydrateFromIds(array $storyIds): ?array
    {
        try {
            $stories = Story::with(['user:id,username,avatar'])
                ->whereIn('id', $storyIds)
                ->where('created_at', '>=', now()->subHours(12))
                ->get()
                ->keyBy('id');

            if ($stories->isEmpty()) return null;

            $result = [];
            foreach ($storyIds as $id) {
                if ($stories->has($id)) {
                    $result[] = $stories[$id]->toArray();
                }
            }

            return $result;
        } catch (\Throwable $e) {
            Log::warning('[StoryCache] Hydration failed', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Get cache stats for monitoring.
     */
    public function getStats(): array
    {
        try {
            $feedCount = 0;
            $cursor = 0;
            do {
                [$cursor, $keys] = Redis::scan($cursor, ['match' => "{$this->feedPrefix}*", 'count' => 100]);
                $feedCount += count($keys);
            } while ($cursor > 0);

            $timelineCount = 0;
            $cursor = 0;
            do {
                [$cursor, $keys] = Redis::scan($cursor, ['match' => "{$this->timelinePrefix}*", 'count' => 100]);
                $timelineCount += count($keys);
            } while ($cursor > 0);

            $pendingCount = Redis::llen("{$this->pendingPrefix}queue") ?? 0;

            return [
                'feed_keys' => $feedCount,
                'timeline_keys' => $timelineCount,
                'pending_queue' => $pendingCount,
                'ttl' => $this->ttl,
            ];
        } catch (\Throwable $e) {
            return ['error' => $e->getMessage()];
        }
    }
}
