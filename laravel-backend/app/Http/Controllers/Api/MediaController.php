<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\MediaSecurityService;
use Illuminate\Http\Request;

class MediaController extends Controller
{
    public function serve(Request $request, $path)
    {
        $path = str_replace(['../', '..\\', '%2e%2e', '%2f', '%5c'], '', urldecode($path));
        $path = preg_replace('#/+#', '/', trim($path, '/'));

        $fullPath = public_path('uploads/' . $path);

        $realUploads = realpath(public_path('uploads'));
        $realFile = realpath($fullPath);

        if (!$realFile || !str_starts_with($realFile, $realUploads)) {
            abort(404);
        }

        if (!file_exists($fullPath) || !is_file($fullPath)) {
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

        $headers = [
            'Content-Type' => $mime,
            'Cache-Control' => 'public, max-age=86400',
            'Accept-Ranges' => 'bytes',
            'X-Content-Type-Options' => 'nosniff',
            'X-Frame-Options' => 'DENY',
        ];

        // Support range requests for video
        if (in_array($ext, ['mp4', 'mov', 'webm'])) {
            $range = $request->header('Range');
            if ($range && preg_match('/bytes=(\d+)-(\d*)/', $range, $matches)) {
                $fileSize = filesize($fullPath);
                $start = (int) $matches[1];
                if ($start >= $fileSize) {
                    return response('', 416, ['Content-Range' => "bytes */{$fileSize}"]);
                }
                $end = isset($matches[2]) && $matches[2] !== '' ? min((int) $matches[2], $fileSize - 1) : $fileSize - 1;
                $length = $end - $start + 1;

                $handle = fopen($fullPath, 'r');
                fseek($handle, $start);
                $content = fread($handle, $length);
                fclose($handle);

                $headers['Content-Range'] = "bytes {$start}-{$end}/{$fileSize}";
                $headers['Content-Length'] = $length;
                $headers['Accept-Ranges'] = 'bytes';

                return response($content, 206, $headers);
            }
        }

        return response()->file($fullPath, $headers);
    }

    /**
     * Generate a signed URL for a media path.
     */
    public function sign(Request $request)
    {
        $request->validate([
            'path' => 'required|string',
        ]);

        $service = new MediaSecurityService();
        $signedUrl = $service->signUrl($request->input('path'));

        return response()->json([
            'url' => $signedUrl,
            'expires_in' => $service->getTtl(),
        ]);
    }

    /**
     * Generate signed URLs for multiple paths.
     */
    public function signBatch(Request $request)
    {
        $request->validate([
            'paths' => 'required|array|max:50',
            'paths.*' => 'string',
        ]);

        $service = new MediaSecurityService();
        $paths = $request->input('paths');

        $urls = [];
        foreach ($paths as $path) {
            $urls[$path] = $service->requiresSigning($path)
                ? $service->signUrl($path)
                : config('app.url') . '/uploads/' . $path;
        }

        return response()->json([
            'urls' => $urls,
            'expires_in' => $service->getTtl(),
        ]);
    }
}
