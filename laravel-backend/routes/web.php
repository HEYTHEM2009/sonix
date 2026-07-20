<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

Route::get('/', function () {
    return response()->json(['message' => 'Social API Running']);
});

Route::get('/uploads/{path}', function ($path) {
    $fullPath = public_path('uploads/'.$path);
    if (! file_exists($fullPath) || ! is_file($fullPath)) {
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
    ]);
    if (in_array($ext, ['mp4', 'mov', 'webm'])) {
        $response->header('Content-Type', 'video/'.($ext === 'mov' ? 'quicktime' : $ext));
    }

    return $response;
})->where('path', '.*');

Route::get('/storage/{path}', function ($path) {
    // Prevent directory traversal: only serve files inside storage/app/public.
    $base = storage_path('app/public');
    $fullPath = realpath($base.DIRECTORY_SEPARATOR.$path);

    if ($fullPath === false
        || ! str_starts_with($fullPath, $base.DIRECTORY_SEPARATOR)
        || ! is_file($fullPath)) {
        abort(404);
    }

    $mime = mime_content_type($fullPath);

    return response()->file($fullPath, [
        'Content-Type' => $mime,
        'Cache-Control' => 'public, max-age=86400',
    ]);
})->where('path', '.*');
