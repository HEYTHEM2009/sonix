<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PostController;
use App\Http\Controllers\Api\LikeController;
use App\Http\Controllers\Api\CommentController;
use App\Http\Controllers\Api\FollowController;
use App\Http\Controllers\Api\FeedController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\StoryController;
use App\Http\Controllers\Api\BookmarkController;
use App\Http\Controllers\Api\BlockController;
use App\Http\Controllers\Api\ReportController;

Route::post('/auth/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

Route::get('/users', [UserController::class, 'index']);
Route::get('/users/search', [UserController::class, 'search'])->middleware('auth:sanctum');
Route::get('/users/me', [UserController::class, 'me'])->middleware('auth:sanctum');
Route::post('/users/profile', [UserController::class, 'updateProfile'])->middleware(['auth:sanctum', 'throttle:10,1']);
Route::get('/users/{id}', [UserController::class, 'show']);
Route::get('/users/{id}/stats', [UserController::class, 'stats']);
Route::get('/users/{id}/status', [UserController::class, 'status']);
Route::post('/users/{id}/online', [UserController::class, 'setOnline'])->middleware('auth:sanctum');
Route::post('/notifications/register', [NotificationController::class, 'registerToken'])->middleware('auth:sanctum');
Route::post('/users/toggle-privacy', [UserController::class, 'togglePrivacy'])->middleware('auth:sanctum');

Route::post('/auth/change-password', [AuthController::class, 'changePassword'])->middleware(['auth:sanctum', 'throttle:5,1']);
Route::delete('/auth/account', [AuthController::class, 'deleteAccount'])->middleware(['auth:sanctum', 'throttle:3,1']);

Route::get('/posts', [PostController::class, 'index']);
Route::post('/posts', [PostController::class, 'store'])->middleware(['auth:sanctum', 'throttle:10,1']);
Route::get('/posts/{id}', [PostController::class, 'show']);
Route::put('/posts/{id}', [PostController::class, 'update'])->middleware('auth:sanctum');
Route::get('/posts/user/{userId}', [PostController::class, 'userPosts'])->middleware('auth:sanctum');
Route::delete('/posts/{id}', [PostController::class, 'destroy'])->middleware(['auth:sanctum', 'throttle:20,1']);

Route::post('/likes', [LikeController::class, 'toggle'])->middleware(['auth:sanctum', 'throttle:30,1']);
Route::get('/likes/{postId}', [LikeController::class, 'count']);
Route::get('/likes/{postId}/users', [LikeController::class, 'users']);

Route::get('/posts/{postId}/comments', [CommentController::class, 'index']);
Route::post('/posts/{postId}/comments', [CommentController::class, 'store'])->middleware(['auth:sanctum', 'throttle:20,1']);
Route::delete('/comments/{id}', [CommentController::class, 'destroy'])->middleware(['auth:sanctum', 'throttle:20,1']);

Route::post('/follow', [FollowController::class, 'toggle'])->middleware(['auth:sanctum', 'throttle:15,1']);
Route::get('/follow/{userId}/followers', [FollowController::class, 'followers']);
Route::get('/follow/{userId}/following', [FollowController::class, 'following']);
Route::get('/follow/requests', [FollowController::class, 'requests'])->middleware('auth:sanctum');
Route::post('/follow/approve/{id}', [FollowController::class, 'approve'])->middleware('auth:sanctum');
Route::post('/follow/reject/{id}', [FollowController::class, 'reject'])->middleware('auth:sanctum');
Route::get('/follow/{userId}/status', [FollowController::class, 'status'])->middleware('auth:sanctum');

Route::get('/feed', [FeedController::class, 'index'])->middleware('auth:sanctum');

Route::get('/notifications', [NotificationController::class, 'index'])->middleware('auth:sanctum');
Route::patch('/notifications/seen', [NotificationController::class, 'markAsSeen'])->middleware('auth:sanctum');

Route::post('/messages', [MessageController::class, 'send'])->middleware(['auth:sanctum', 'throttle:20,1']);
Route::get('/messages/unread', [MessageController::class, 'totalUnread'])->middleware('auth:sanctum');
Route::get('/messages/conversations', [MessageController::class, 'conversations'])->middleware('auth:sanctum');
Route::post('/messages/read/{userId}', [MessageController::class, 'markAsRead'])->middleware('auth:sanctum');
Route::post('/messages/online', [MessageController::class, 'updateOnline'])->middleware('auth:sanctum');
Route::post('/messages/typing', [MessageController::class, 'typing'])->middleware(['auth:sanctum', 'throttle:60,1']);
Route::get('/messages/typing/{userId}', [MessageController::class, 'checkTyping'])->middleware('auth:sanctum');
Route::get('/messages/{userId}', [MessageController::class, 'conversation'])->middleware('auth:sanctum');
Route::post('/messages/{id}/react', [MessageController::class, 'addReaction'])->middleware(['auth:sanctum', 'throttle:30,1']);
Route::delete('/messages/{id}/react', [MessageController::class, 'removeReaction'])->middleware('auth:sanctum');
Route::delete('/messages/{id}', [MessageController::class, 'destroy'])->middleware(['auth:sanctum', 'throttle:20,1']);
Route::post('/messages/mute/{userId}', [MessageController::class, 'toggleMute'])->middleware('auth:sanctum');
Route::post('/messages/pin/{userId}', [MessageController::class, 'togglePin'])->middleware('auth:sanctum');
Route::delete('/messages/conversation/{userId}', [MessageController::class, 'deleteConversation'])->middleware('auth:sanctum');

Route::get('/stories', [StoryController::class, 'index'])->middleware('auth:sanctum');
Route::get('/stories/debug', [StoryController::class, 'debug'])->middleware('auth:sanctum');
Route::post('/stories', [StoryController::class, 'store'])->middleware(['auth:sanctum', 'throttle:10,1']);
Route::get('/stories/{id}/viewers', [StoryController::class, 'viewers'])->middleware('auth:sanctum');
Route::post('/stories/{id}/view', [StoryController::class, 'view'])->middleware('auth:sanctum');
Route::post('/stories/{id}/react', [StoryController::class, 'react'])->middleware(['auth:sanctum', 'throttle:30,1']);
Route::delete('/stories/{id}/react', [StoryController::class, 'removeReaction'])->middleware('auth:sanctum');
Route::get('/stories/{id}/reactions', [StoryController::class, 'reactions'])->middleware('auth:sanctum');
Route::get('/stories/{id}/analytics', [StoryController::class, 'analytics'])->middleware('auth:sanctum');
Route::post('/stories/{id}/forward', [StoryController::class, 'forward'])->middleware(['auth:sanctum', 'throttle:10,1']);
Route::delete('/stories/{id}', [StoryController::class, 'destroy'])->middleware(['auth:sanctum', 'throttle:20,1']);

Route::get('/stories/highlights/all', [StoryController::class, 'highlights'])->middleware('auth:sanctum');
Route::post('/stories/highlights', [StoryController::class, 'storeHighlight'])->middleware(['auth:sanctum', 'throttle:10,1']);
Route::post('/stories/highlights/{highlightId}/add', [StoryController::class, 'addToHighlight'])->middleware(['auth:sanctum', 'throttle:20,1']);
Route::delete('/stories/highlights/{id}', [StoryController::class, 'deleteHighlight'])->middleware('auth:sanctum');
Route::put('/stories/highlights/{id}', [StoryController::class, 'updateHighlight'])->middleware('auth:sanctum');
Route::delete('/stories/highlights/{highlightId}/stories/{storyId}', [StoryController::class, 'removeFromHighlight'])->middleware('auth:sanctum');
Route::get('/stories/mine', [StoryController::class, 'myStories'])->middleware('auth:sanctum');
Route::get('/users/{userId}/highlights', [StoryController::class, 'userHighlights'])->middleware('auth:sanctum');

Route::get('/bookmarks', [BookmarkController::class, 'index'])->middleware('auth:sanctum');
Route::post('/bookmarks', [BookmarkController::class, 'toggle'])->middleware(['auth:sanctum', 'throttle:30,1']);

Route::post('/block', [BlockController::class, 'toggle'])->middleware(['auth:sanctum', 'throttle:15,1']);
Route::get('/block/{userId}/status', [BlockController::class, 'status'])->middleware('auth:sanctum');
Route::get('/block/list', [BlockController::class, 'blockedList'])->middleware('auth:sanctum');

Route::post('/reports', [ReportController::class, 'store'])->middleware(['auth:sanctum', 'throttle:10,1']);

// Media routes with signed URLs
Route::get('/media/{path}', [App\Http\Controllers\Api\MediaController::class, 'serve'])->where('path', '.*');
Route::post('/media/sign', [App\Http\Controllers\Api\MediaController::class, 'sign'])->middleware('auth:sanctum');
Route::post('/media/sign-batch', [App\Http\Controllers\Api\MediaController::class, 'signBatch'])->middleware('auth:sanctum');

// Debug: Cloudinary config check
Route::get('/debug/cloudinary', function () {
    $service = new \App\Services\CloudinaryService();
    return response()->json([
        'is_configured' => $service->isConfigured(),
        'cloud_name' => config('cloudinary.cloud_name') ? 'set' : 'empty',
        'api_key' => config('cloudinary.api_key') ? 'set' : 'empty',
        'api_secret' => config('cloudinary.api_secret') ? 'set' : 'empty',
        'env_cloud_name' => env('CLOUDINARY_CLOUD_NAME') ? 'set' : 'empty',
        'getenv_cloud_name' => getenv('CLOUDINARY_CLOUD_NAME') ?: 'empty',
    ]);
});

// Debug: Actually try a Cloudinary upload and return full response
Route::get('/debug/cloudinary-test', function () {
    $cloudName = config('cloudinary.cloud_name', '');
    $apiKey = config('cloudinary.api_key', '');
    $apiSecret = config('cloudinary.api_secret', '');

    $result = ['cloud_name' => $cloudName ? 'set' : 'empty', 'api_key' => $apiKey ? 'set' : 'empty', 'api_secret' => $apiSecret ? 'set' : 'empty'];

    if (empty($cloudName) || empty($apiKey) || empty($apiSecret)) {
        $result['error'] = 'Missing credentials';
        return response()->json($result);
    }

    $tempFile = tempnam(sys_get_temp_dir(), 'cld_test_');
    $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
    file_put_contents($tempFile, $png);

    $timestamp = time();
    $paramsToSign = ['folder' => 'test', 'timestamp' => $timestamp];
    ksort($paramsToSign);
    $signStr = '';
    foreach ($paramsToSign as $k => $v) { $signStr .= "{$k}={$v}&"; }
    $signStr = rtrim($signStr, '&');
    $signature = sha1($signStr . $apiSecret);

    $result['signature_input'] = $signStr;
    $result['signature'] = $signature;

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => "https://api.cloudinary.com/v1_1/{$cloudName}/auto/upload",
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => [
            'file' => new \CURLFile($tempFile, 'image/png', 'test.png'),
            'api_key' => $apiKey,
            'timestamp' => $timestamp,
            'folder' => 'test',
            'resource_type' => 'auto',
            'signature' => $signature,
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_SSL_VERIFYPEER => true,
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);
    @unlink($tempFile);

    $result['http_code'] = $httpCode;
    $result['curl_error'] = $curlError ?: 'none';
    $result['response'] = json_decode($response, true) ?? $response;

    return response()->json($result);
});
