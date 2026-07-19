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
use App\Http\Controllers\Api\ReelController;
use App\Http\Controllers\Api\VoiceMessageController;
use App\Http\Controllers\Api\PostStatsController;
use App\Http\Controllers\Api\TwoFactorController;
use App\Http\Controllers\Api\BadWordController;
use App\Http\Controllers\Api\SupportController;
use App\Http\Controllers\Api\GroupController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\AdminController;

Route::post('/auth/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:3,1');
Route::post('/auth/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:5,1');

Route::get('/users', [UserController::class, 'index'])->middleware('auth:sanctum');
Route::get('/users/search', [UserController::class, 'search'])->middleware('auth:sanctum');
Route::get('/users/search/suggestions', [UserController::class, 'searchSuggestions'])->middleware('auth:sanctum');
Route::get('/users/search/recent', [UserController::class, 'recentSearches'])->middleware('auth:sanctum');
Route::post('/users/search/recent', [UserController::class, 'saveRecentSearch'])->middleware('auth:sanctum');
Route::delete('/users/search/recent', [UserController::class, 'clearRecentSearches'])->middleware('auth:sanctum');
Route::get('/users/me', [UserController::class, 'me'])->middleware('auth:sanctum');
Route::post('/users/profile', [UserController::class, 'updateProfile'])->middleware(['auth:sanctum', 'throttle:10,1']);
Route::get('/users/{id}', [UserController::class, 'show'])->middleware('auth:sanctum');
Route::get('/users/{id}/stats', [UserController::class, 'stats'])->middleware('auth:sanctum');
Route::get('/users/{id}/status', [UserController::class, 'status'])->middleware('auth:sanctum');
Route::post('/users/{id}/online', [UserController::class, 'setOnline'])->middleware('auth:sanctum');
Route::get('/users/{id}/visitors', [UserController::class, 'visitors'])->middleware('auth:sanctum');
Route::get('/users/{id}/badges', [UserController::class, 'badges'])->middleware('auth:sanctum');
Route::post('/users/badges', [UserController::class, 'addBadge'])->middleware('auth:sanctum');
Route::delete('/users/badges/{id}', [UserController::class, 'removeBadge'])->middleware('auth:sanctum');
Route::get('/users/{id}/template', [UserController::class, 'getTemplate'])->middleware('auth:sanctum');
Route::post('/users/template', [UserController::class, 'setTemplate'])->middleware('auth:sanctum');
Route::post('/notifications/register', [NotificationController::class, 'registerToken'])->middleware('auth:sanctum');
Route::post('/users/toggle-privacy', [UserController::class, 'togglePrivacy'])->middleware('auth:sanctum');

Route::post('/auth/change-password', [AuthController::class, 'changePassword'])->middleware(['auth:sanctum', 'throttle:5,1']);
Route::delete('/auth/account', [AuthController::class, 'deleteAccount'])->middleware(['auth:sanctum', 'throttle:3,1']);

Route::get('/posts', [PostController::class, 'index'])->middleware('auth:sanctum');
Route::post('/posts', [PostController::class, 'store'])->middleware(['auth:sanctum', 'throttle:10,1']);
Route::get('/posts/{id}', [PostController::class, 'show'])->middleware('auth:sanctum');
Route::put('/posts/{id}', [PostController::class, 'update'])->middleware('auth:sanctum');
Route::get('/posts/hashtag/{tag}', [PostController::class, 'byHashtag'])->middleware('auth:sanctum');
Route::get('/posts/user/{userId}', [PostController::class, 'userPosts'])->middleware('auth:sanctum');
Route::delete('/posts/{id}', [PostController::class, 'destroy'])->middleware(['auth:sanctum', 'throttle:20,1']);

Route::post('/likes', [LikeController::class, 'toggle'])->middleware(['auth:sanctum', 'throttle:30,1']);
Route::get('/likes/{postId}', [LikeController::class, 'count'])->middleware('auth:sanctum');
Route::get('/likes/{postId}/users', [LikeController::class, 'users'])->middleware('auth:sanctum');

Route::get('/posts/{postId}/comments', [CommentController::class, 'index'])->middleware('auth:sanctum');
Route::post('/posts/{postId}/comments', [CommentController::class, 'store'])->middleware(['auth:sanctum', 'throttle:20,1']);
Route::delete('/comments/{id}', [CommentController::class, 'destroy'])->middleware(['auth:sanctum', 'throttle:20,1']);

Route::post('/follow', [FollowController::class, 'toggle'])->middleware(['auth:sanctum', 'throttle:15,1']);
Route::get('/follow/{userId}/followers', [FollowController::class, 'followers'])->middleware('auth:sanctum');
Route::get('/follow/{userId}/following', [FollowController::class, 'following'])->middleware('auth:sanctum');
Route::get('/follow/requests', [FollowController::class, 'requests'])->middleware('auth:sanctum');
Route::post('/follow/approve/{id}', [FollowController::class, 'approve'])->middleware('auth:sanctum');
Route::post('/follow/reject/{id}', [FollowController::class, 'reject'])->middleware('auth:sanctum');
Route::get('/follow/{userId}/status', [FollowController::class, 'status'])->middleware('auth:sanctum');

Route::get('/feed', [FeedController::class, 'index'])->middleware('auth:sanctum');
Route::get('/explore', [App\Http\Controllers\Api\ExploreController::class, 'index'])->middleware('auth:sanctum');

Route::get('/notifications', [NotificationController::class, 'index'])->middleware('auth:sanctum');
Route::patch('/notifications/seen', [NotificationController::class, 'markAsSeen'])->middleware('auth:sanctum');
Route::get('/notifications/preferences', [NotificationController::class, 'preferences'])->middleware('auth:sanctum');
Route::put('/notifications/preferences', [NotificationController::class, 'updatePreferences'])->middleware('auth:sanctum');

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
Route::put('/messages/{id}', [MessageController::class, 'update'])->middleware(['auth:sanctum', 'throttle:10,1']);
Route::post('/messages/{id}/vanish', [MessageController::class, 'setVanish'])->middleware(['auth:sanctum', 'throttle:10,1']);
  Route::delete('/messages/{id}', [MessageController::class, 'destroy'])->middleware(['auth:sanctum', 'throttle:20,1']);
  Route::delete('/messages/{id}/for-me', [MessageController::class, 'deleteForMe'])->middleware(['auth:sanctum', 'throttle:20,1']);
Route::post('/messages/{id}/forward', [MessageController::class, 'forward'])->middleware(['auth:sanctum', 'throttle:20,1']);
Route::post('/messages/mute/{userId}', [MessageController::class, 'toggleMute'])->middleware('auth:sanctum');
Route::post('/messages/pin/{userId}', [MessageController::class, 'togglePin'])->middleware('auth:sanctum');
Route::delete('/messages/conversation/{userId}', [MessageController::class, 'deleteConversation'])->middleware('auth:sanctum');
Route::post('/messages/{id}/deliver', [MessageController::class, 'deliver'])->middleware(['auth:sanctum', 'throttle:30,1']);
Route::get('/messages/{userId}/search', [MessageController::class, 'search'])->middleware(['auth:sanctum', 'throttle:20,1']);
Route::post('/messages/{userId}/draft', [MessageController::class, 'saveDraft'])->middleware('auth:sanctum');
Route::get('/messages/{userId}/draft', [MessageController::class, 'getDraft'])->middleware('auth:sanctum');
Route::post('/messages/{id}/star', [MessageController::class, 'toggleStar'])->middleware('auth:sanctum');
Route::post('/messages/{id}/save', [MessageController::class, 'toggleSave'])->middleware('auth:sanctum');
Route::post('/messages/{id}/pin', [MessageController::class, 'toggleMessagePin'])->middleware('auth:sanctum');
Route::post('/users/{userId}/block', [MessageController::class, 'blockUser'])->middleware('auth:sanctum');
Route::post('/users/{userId}/unblock', [MessageController::class, 'unblockUser'])->middleware('auth:sanctum');

Route::get('/stories', [StoryController::class, 'index'])->middleware('auth:sanctum');
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

Route::post('/support/feedback', [SupportController::class, 'feedback'])->middleware(['auth:sanctum', 'throttle:5,1']);

// Media routes with signed URLs
Route::get('/media/{path}', [App\Http\Controllers\Api\MediaController::class, 'serve'])
    ->middleware(['auth:sanctum', 'media.security'])
    ->where('path', '.*');
Route::post('/media/sign', [App\Http\Controllers\Api\MediaController::class, 'sign'])->middleware('auth:sanctum');
Route::post('/media/sign-batch', [App\Http\Controllers\Api\MediaController::class, 'signBatch'])->middleware('auth:sanctum');

// Reels
Route::get('/reels', [ReelController::class, 'index'])->middleware('auth:sanctum');
Route::get('/reels/foryou', [ReelController::class, 'forYou'])->middleware('auth:sanctum');
Route::get('/reels/trending', [ReelController::class, 'trending'])->middleware('auth:sanctum');
Route::get('/reels/search', [ReelController::class, 'search'])->middleware('auth:sanctum');
Route::get('/reels/saved', [ReelController::class, 'saved'])->middleware('auth:sanctum');
Route::get('/reels/hashtags/popular', [ReelController::class, 'popularHashtags'])->middleware('auth:sanctum');
Route::get('/reels/drafts', [ReelController::class, 'drafts'])->middleware('auth:sanctum');
Route::get('/reels/scheduled', [ReelController::class, 'scheduled'])->middleware('auth:sanctum');
Route::get('/reels/featured', [ReelController::class, 'featured'])->middleware('auth:sanctum');
Route::get('/reels/music', [ReelController::class, 'musicLibrary'])->middleware('auth:sanctum');
Route::post('/reels/pro', [ReelController::class, 'togglePro'])->middleware('auth:sanctum');
Route::get('/reels/hashtag/{tag}', [ReelController::class, 'byHashtag'])->middleware('auth:sanctum');
Route::get('/reels/insights', [ReelController::class, 'insights'])->middleware('auth:sanctum');
Route::post('/reels', [ReelController::class, 'store'])->middleware(['auth:sanctum', 'throttle:10,1']);
Route::get('/reels/{id}', [ReelController::class, 'show'])->middleware('auth:sanctum');
Route::put('/reels/{id}', [ReelController::class, 'update'])->middleware('auth:sanctum');
Route::delete('/reels/{id}', [ReelController::class, 'destroy'])->middleware('auth:sanctum');
Route::post('/reels/{id}/like', [ReelController::class, 'like'])->middleware(['auth:sanctum', 'throttle:30,1']);
Route::post('/reels/{id}/comment', [ReelController::class, 'comment'])->middleware(['auth:sanctum', 'throttle:20,1']);
Route::post('/reels/{id}/view', [ReelController::class, 'recordView'])->middleware('auth:sanctum');
Route::post('/reels/{id}/save', [ReelController::class, 'toggleSave'])->middleware('auth:sanctum');
Route::post('/reels/{id}/share', [ReelController::class, 'share'])->middleware('auth:sanctum');
Route::post('/reel-comments/{commentId}/like', [ReelController::class, 'likeComment'])->middleware(['auth:sanctum', 'throttle:30,1']);
Route::delete('/reel-comments/{id}', [ReelController::class, 'destroyComment'])->middleware(['auth:sanctum', 'throttle:20,1']);

// Search
Route::get('/search/suggestions', [SearchController::class, 'suggestions'])->middleware('auth:sanctum');
Route::get('/search/users', [SearchController::class, 'users'])->middleware('auth:sanctum');
Route::get('/search/reels', [SearchController::class, 'reels'])->middleware('auth:sanctum');
Route::get('/search/posts', [SearchController::class, 'posts'])->middleware('auth:sanctum');
Route::get('/search/stories', [SearchController::class, 'stories'])->middleware('auth:sanctum');
Route::get('/search/hashtags', [SearchController::class, 'hashtags'])->middleware('auth:sanctum');
Route::get('/search/audio', [SearchController::class, 'audio'])->middleware('auth:sanctum');
Route::get('/search/trending', [SearchController::class, 'trending'])->middleware('auth:sanctum');

// Group Chat
Route::get('/groups', [GroupController::class, 'index'])->middleware('auth:sanctum');
Route::post('/groups', [GroupController::class, 'store'])->middleware(['auth:sanctum', 'throttle:10,1']);
Route::get('/groups/{id}', [GroupController::class, 'show'])->middleware('auth:sanctum');
Route::post('/groups/{id}/members', [GroupController::class, 'addMembers'])->middleware('auth:sanctum');
Route::delete('/groups/{id}/members/{userId}', [GroupController::class, 'removeMember'])->middleware('auth:sanctum');
Route::post('/groups/{id}/messages', [GroupController::class, 'sendMessage'])->middleware(['auth:sanctum', 'throttle:20,1']);
Route::get('/groups/{id}/messages', [GroupController::class, 'messages'])->middleware('auth:sanctum');
Route::delete('/groups/{id}', [GroupController::class, 'destroy'])->middleware('auth:sanctum');

// Voice Messages
Route::post('/voice-messages', [VoiceMessageController::class, 'store'])->middleware(['auth:sanctum', 'throttle:10,1']);
Route::get('/voice-messages/{id}', [VoiceMessageController::class, 'show'])->middleware('auth:sanctum');
Route::delete('/voice-messages/{id}', [VoiceMessageController::class, 'destroy'])->middleware('auth:sanctum');

// Post Stats & Pin
Route::get('/posts/{id}/stats', [PostStatsController::class, 'show'])->middleware('auth:sanctum');
Route::post('/posts/{id}/view', [PostStatsController::class, 'recordView'])->middleware('auth:sanctum');
Route::post('/posts/{id}/pin', [PostStatsController::class, 'pin'])->middleware('auth:sanctum');
Route::post('/posts/{id}/unpin', [PostStatsController::class, 'unpin'])->middleware('auth:sanctum');

// 2FA
Route::post('/2fa/enable', [TwoFactorController::class, 'enable'])->middleware(['auth:sanctum', 'throttle:5,1']);
Route::post('/2fa/disable', [TwoFactorController::class, 'disable'])->middleware(['auth:sanctum', 'throttle:5,1']);
Route::post('/2fa/verify', [TwoFactorController::class, 'verify'])->middleware(['auth:sanctum', 'throttle:10,1']);
Route::get('/2fa/status', [TwoFactorController::class, 'status'])->middleware('auth:sanctum');

// Bad Words
Route::post('/bad-words/check', [BadWordController::class, 'check'])->middleware('auth:sanctum');
Route::get('/bad-words', [BadWordController::class, 'index'])->middleware('auth:sanctum');
Route::post('/bad-words', [BadWordController::class, 'store'])->middleware('auth:sanctum');
Route::delete('/bad-words/{id}', [BadWordController::class, 'destroy'])->middleware('auth:sanctum');

// Admin Panel
Route::prefix('admin')->middleware(['auth:sanctum'])->group(function () {
    Route::get('/dashboard', [AdminController::class, 'dashboard']);
    Route::get('/users', [AdminController::class, 'users']);
    Route::get('/users/{id}', [AdminController::class, 'showUser']);
    Route::post('/users/{id}/ban', [AdminController::class, 'banUser']);
    Route::post('/users/{id}/unban', [AdminController::class, 'unbanUser']);
    Route::get('/reels', [AdminController::class, 'reels']);
    Route::get('/posts', [AdminController::class, 'posts']);
    Route::get('/stories', [AdminController::class, 'stories']);
    Route::get('/reports', [AdminController::class, 'reports']);
    Route::put('/reports/{id}', [AdminController::class, 'resolveReport']);
    Route::delete('/content/{type}/{id}', [AdminController::class, 'removeContent']);
    Route::get('/analytics', [AdminController::class, 'analytics']);
    Route::post('/notifications', [AdminController::class, 'notifications']);
    Route::get('/roles', [AdminController::class, 'roles']);
    Route::get('/permissions', [AdminController::class, 'permissions']);
    Route::get('/settings', [AdminController::class, 'settings']);
    Route::put('/settings', [AdminController::class, 'settings']);
    Route::get('/logs', [AdminController::class, 'logs']);
    Route::get('/bad-words', [AdminController::class, 'badWords']);
    Route::post('/bad-words', [AdminController::class, 'addBadWord']);
    Route::delete('/bad-words/{id}', [AdminController::class, 'deleteBadWord']);
});


