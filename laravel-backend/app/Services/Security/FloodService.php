<?php

namespace App\Services\Security;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;

class FloodService
{
    public function allow(string $key, int $maxAttempts, int $decaySeconds): bool
    {
        return RateLimiter::attempt("flood:{$key}", $maxAttempts, fn () => true, $decaySeconds);
    }

    public function remaining(string $key, int $maxAttempts, int $decaySeconds): int
    {
        return max(0, $maxAttempts - RateLimiter::attempts("flood:{$key}"));
    }

    public function abuseScore(int $userId): int
    {
        return (int) Cache::get("abuse:{$userId}", 0);
    }

    public function bumpAbuse(int $userId, int $amount = 1): void
    {
        Cache::put("abuse:{$userId}", $this->abuseScore($userId) + $amount, now()->addHour());
    }
}
