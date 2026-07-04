<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CdnService
{
    protected string $zoneId;
    protected string $apiToken;
    protected string $baseUrl;

    public function __construct()
    {
        $this->zoneId = config('services.cloudflare.zone_id', '');
        $this->apiToken = config('services.cloudflare.api_token', '');
        $this->baseUrl = 'https://api.cloudflare.com/client/v4';
    }

    public function isEnabled(): bool
    {
        return !empty($this->zoneId) && !empty($this->apiToken);
    }

    public function purgeFiles(array $urls): bool
    {
        if (!$this->isEnabled()) {
            return false;
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiToken,
                'Content-Type' => 'application/json',
            ])->post("{$this->baseUrl}/zones/{$this->zoneId}/purge_cache", [
                'files' => $urls,
            ]);

            if ($response->successful()) {
                Log::info('CDN purge successful', ['urls' => $urls]);
                return true;
            }

            Log::warning('CDN purge failed', [
                'status' => $response->status(),
                'body' => $response->json(),
            ]);
            return false;
        } catch (\Exception $e) {
            Log::warning('CDN purge error: ' . $e->getMessage());
            return false;
        }
    }

    public function purgeAll(): bool
    {
        if (!$this->isEnabled()) {
            return false;
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiToken,
                'Content-Type' => 'application/json',
            ])->delete("{$this->baseUrl}/zones/{$this->zoneId}/purge_cache", [
                'purge_everything' => true,
            ]);

            return $response->successful();
        } catch (\Exception $e) {
            Log::warning('CDN purge all error: ' . $e->getMessage());
            return false;
        }
    }
}
