<?php

namespace App\Http\Middleware;

use App\Services\MediaSecurityService;
use Closure;
use Illuminate\Http\Request;

class MediaSecurity
{
    public function handle(Request $request, Closure $next)
    {
        $path = $request->route('path');

        if (! $path) {
            return $next($request);
        }

        $service = new MediaSecurityService;

        // Public assets (avatars, default thumbnails) are always allowed.
        if (! $service->requiresSigning($path)) {
            // Delegate Range requests to MediaController's streaming logic,
            // which produces proper 206 partial-content responses for video.
            if ($request->headers->has('Range')) {
                return $next($request);
            }

            return $this->serveFile($request, $path);
        }

        // Authenticated API clients (the mobile app) may access media directly.
        if ($request->user()) {
            return $this->serveFile($request, $path);
        }

        // Unauthenticated requests must present a valid signed URL.
        $signature = $request->query('sig');
        $expires = $request->query('exp');

        if (! $signature || ! $expires) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        if (! $service->verifySignedUrl($path, $signature, $expires)) {
            return response()->json(['message' => 'Invalid or expired signature'], 403);
        }

        return $this->serveFile($request, $path);
    }

    protected function serveFile(Request $request, string $path)
    {
        // Contain the path inside public/uploads/ to prevent traversal.
        $path = ltrim($path, '/\\');
        $fullPath = public_path('uploads/'.$path);

        $realUploads = realpath(public_path('uploads'));
        $realFile = realpath($fullPath);

        if ($realUploads === false || $realFile === false
            || strncmp($realFile, $realUploads.DIRECTORY_SEPARATOR, strlen($realUploads.DIRECTORY_SEPARATOR)) !== 0
            || ! is_file($realFile)) {
            abort(404);
        }

        $ext = strtolower(pathinfo($fullPath, PATHINFO_EXTENSION));
        $mimeMap = [
            'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png',
            'gif' => 'image/gif', 'webp' => 'image/webp',
            'mp4' => 'video/mp4', 'mov' => 'video/quicktime', 'avi' => 'video/x-msvideo',
            'webm' => 'video/webm',
        ];

        $mime = $mimeMap[$ext] ?? mime_content_type($fullPath) ?? 'application/octet-stream';

        $response = response()->file($fullPath, [
            'Content-Type' => $mime,
            'Cache-Control' => 'public, max-age=86400',
            'Accept-Ranges' => 'bytes',
            'X-Content-Type-Options' => 'nosniff',
            'X-Frame-Options' => 'DENY',
        ]);

        return $response;
    }
}
