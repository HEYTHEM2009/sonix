<?php

namespace App\Services;

use App\Models\Follow;
use App\Models\Story;
use App\Models\StoryView;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Log;

class StoryCacheService
{
    protected int $ttl = 300; // 5 minutes

    protected string $prefix = 'stories:';

    public function getFeed(int $userId): ?array
    {
        try {
            $cacheKey = "{$this->prefix}feed:{$userId}";
            $cached = Redis::get($cacheKey);

            if ($cached) {
                return json_decode($cached, true);
            }
        } catch (\Throwable $e) {
            Log::warning('Redis read failed, falling back to DB: ' . $e->getMessage());
        }

        return null;
    }

    public function setFeed(int $userId, array $feed): void
    {
        try {
            $cacheKey = "{$this->prefix}feed:{$userId}";
            Redis::setex($cacheKey, $this->ttl, json_encode($feed));
        } catch (\Throwable $e) {
            Log::warning('Redis write failed: ' . $e->getMessage());
        }
    }

    public function invalidateUser(int $userId): void
    {
        try {
            Redis::del("{$this->prefix}feed:{$userId}");
        } catch (\Throwable $e) {
            Log::warning('Redis invalidation failed: ' . $e->getMessage());
        }
    }

    public function invalidateFollowers(int $userId): void
    {
        try {
            $followerIds = Follow::where('following_id', $userId)
                ->where('status', 'accepted')
                ->pluck('follower_id')
                ->toArray();

            $followerIds[] = $userId;

            $keys = array_map(fn($id) => "{$this->prefix}feed:{$id}", $followerIds);
            Redis::del($keys);
        } catch (\Throwable $e) {
            Log::warning('Redis fan-out invalidation failed: ' . $e->getMessage());
        }
    }

    public function onStoryCreated(int $userId): void
    {
        $this->invalidateFollowers($userId);
    }

    public function onStoryDeleted(int $userId): void
    {
        $this->invalidateFollowers($userId);
    }

    public function onStoryExpired(): void
    {
        try {
            $keys = Redis::keys("{$this->prefix}feed:*");
            if (!empty($keys)) {
                Redis::del($keys);
            }
        } catch (\Throwable $e) {
            Log::warning('Redis bulk invalidation failed: ' . $e->getMessage());
        }
    }
}
