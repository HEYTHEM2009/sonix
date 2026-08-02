<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\URL;

class MediaSecurityService
{
    protected string $secret;

    protected int $signedUrlTTL; // minutes

    public function __construct()
    {
        $this->secret = config('app.key');
        $this->signedUrlTTL = (int) config('media.signed_url_ttl', 3600); // 1 hour default
    }

    /**
     * Generate a signed URL for a media file.
     * Format: /media/{path}?signature=xxx&expires=xxx&token=xxx
     */
    public function signUrl(string $path): string
    {
        $expires = Carbon::now()->addSeconds($this->signedUrlTTL)->timestamp;
        $payload = $path.'|'.$expires;
        $signature = hash_hmac('sha256', $payload, $this->secret);

        $baseUrl = config('app.url', 'http://localhost');

        return "{$baseUrl}/media/{$path}?"
            .http_build_query([
                'sig' => $signature,
                'exp' => $expires,
            ]);
    }

    /**
     * Verify a signed URL is valid and not expired.
     */
    public function verifySignedUrl(string $path, string $signature, string $expires): bool
    {
        if (! is_numeric($expires) || (int) $expires < time()) {
            return false;
        }

        // Verify signature
        $payload = $path.'|'.$expires;
        $expected = hash_hmac('sha256', $payload, $this->secret);

        return hash_equals($expected, $signature);
    }

    /**
     * Generate signed URLs for multiple media files.
     */
    public function signUrls(array $paths): array
    {
        return array_map(fn ($path) => $this->signUrl($path), $paths);
    }

    /**
     * Get signed URL TTL in seconds.
     */
    public function getTtl(): int
    {
        return $this->signedUrlTTL;
    }

    /**
     * Check if a path requires signed URL access.
     *
     * All media served through /api/media/* lives in public/uploads and is
     * rendered by the mobile app with plain <Image>/WebView URLs that cannot
     * carry Bearer tokens, so uploaded media must be publicly readable
     * (capability-style URLs with random filenames). Signed-URL infrastructure
     * is kept for future non-public storage buckets.
     */
    public function requiresSigning(string $path): bool
    {
        return false;
    }
}
