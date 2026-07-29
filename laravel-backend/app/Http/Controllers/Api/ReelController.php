<?php

namespace App\Http\Controllers\Api;

use App\Helpers\Sanitize;
use App\Helpers\StorageHelper;
use App\Http\Controllers\Controller;
use App\Models\Reel;
use App\Models\ReelComment;
use App\Services\ReelService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class ReelController extends Controller
{
    protected ReelService $reels;

    public function __construct(ReelService $reels)
    {
        $this->reels = $reels;
    }

    public function index(Request $request)
    {
        if (! Schema::hasTable('reels')) {
            return $this->success(['data' => [], 'total' => 0, 'per_page' => 20, 'current_page' => 1], 'OK');
        }

        try {
            $userId = Auth::id();
            $filters = [];

            if ($request->filled('hashtag')) {
                $filters['hashtag'] = strtolower($request->query('hashtag'));
            }
            if ($request->filled('user_id')) {
                $filters['user_id'] = $request->query('user_id');
            }
            if ($request->boolean('trending')) {
                $filters['trending'] = true;
            }

            $result = $this->reels->feed($userId, $filters);

            return $this->success($result, 'OK');
        } catch (\Throwable $e) {
            Log::error('ReelController@index: '.$e->getMessage());

            return $this->error('Unable to load reels at this time.', 500);
        }
    }

    public function forYou(Request $request)
    {
        try {
            $result = $this->reels->forYou(Auth::id());

            return $this->success($result, 'OK');
        } catch (\Throwable $e) {
            Log::error('ReelController@forYou: '.$e->getMessage());

            return $this->error('Unable to load recommendations.', 500);
        }
    }

    public function trending(Request $request)
    {
        try {
            $result = $this->reels->trending(Auth::id(), (int) $request->query('per_page', 20));

            return $this->success($result, 'OK');
        } catch (\Throwable $e) {
            Log::error('ReelController@trending: '.$e->getMessage());

            return $this->error('Unable to load trending reels.', 500);
        }
    }

    public function search(Request $request)
    {
        $request->validate(['q' => 'required|string|min:1|max:100']);

        try {
            $result = $this->reels->search($request->query('q'), Auth::id());

            return $this->success($result, 'OK');
        } catch (\Throwable $e) {
            Log::error('ReelController@search: '.$e->getMessage());

            return $this->error('Search failed.', 500);
        }
    }

    public function byHashtag(Request $request, $tag)
    {
        try {
            $result = $this->reels->byHashtag(strtolower($tag), Auth::id());

            return $this->success($result, 'OK');
        } catch (\Throwable $e) {
            Log::error('ReelController@byHashtag: '.$e->getMessage());

            return $this->error('Unable to load hashtag.', 500);
        }
    }

    public function saved(Request $request)
    {
        try {
            $result = $this->reels->saved(Auth::id());

            return $this->success($result, 'OK');
        } catch (\Throwable $e) {
            Log::error('ReelController@saved: '.$e->getMessage());

            return $this->error('Unable to load saved reels.', 500);
        }
    }

    public function store(Request $request)
    {
        $request->validate([
            'video' => 'required|file|mimes:mp4,mov,webm|max:204800',
            'caption' => 'nullable|string|max:2200',
            'music_title' => 'nullable|string|max:255',
            'music_url' => 'nullable|url|max:500',
            'thumbnail' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
            'duration' => 'nullable|integer|min:1|max:600',
            'comments_enabled' => 'nullable|boolean',
            'status' => 'nullable|in:draft,published,scheduled',
            'scheduled_at' => 'nullable|date|after:now',
            'is_featured' => 'nullable|boolean',
        ]);

        try {
            $videoPath = StorageHelper::upload($request->file('video'), 'reels');
            $videoUrl = StorageHelper::getUrl($videoPath);

            $thumbnailUrl = null;
            if ($request->hasFile('thumbnail')) {
                $thumbPath = StorageHelper::upload($request->file('thumbnail'), 'reels/thumbnails');
                $thumbnailUrl = StorageHelper::getUrl($thumbPath);
            }

            $status = $request->input('status', 'published');
            $reel = Reel::create([
                'user_id' => Auth::id(),
                'video_url' => $videoUrl,
                'thumbnail_url' => $thumbnailUrl,
                'caption' => $request->caption,
                'music_title' => $request->music_title,
                'music_url' => $request->music_url,
                'duration' => $request->duration ?? 30,
                'comments_enabled' => $request->boolean('comments_enabled', true),
                'status' => $status,
                'is_published' => $status === 'published',
                'scheduled_at' => $status === 'scheduled' ? $request->input('scheduled_at') : null,
                'is_featured' => $request->boolean('is_featured', false),
            ]);

            $reel->syncHashtags();
            $reel->syncMentions();
            $this->reels->recomputeAnalytics($reel->id);

            return $this->success($reel->load('user'), 'Reel created.', 201);
        } catch (\Throwable $e) {
            Log::error('ReelController@store: '.$e->getMessage());

            return $this->error('Failed to upload reel.', 500);
        }
    }

    public function show($id)
    {
        try {
            $reel = Reel::find($id);

            if (! $reel) {
                return $this->error('Reel not found.', 404);
            }

            $reel->load('user:id,username,avatar');

            if (Schema::hasTable('reel_likes')) {
                $reel->loadCount('likes');
            }
            if (Schema::hasTable('reel_comments')) {
                $reel->loadCount('comments');
            }
            if (Schema::hasTable('reel_saves')) {
                $reel->loadCount('saves');
            }
            if (Schema::hasTable('reel_shares')) {
                $reel->loadCount('shares');
            }

            $hasLikesTable = Schema::hasTable('reel_comment_likes');
            $hasParentId = Schema::hasColumn('reel_comments', 'parent_id');

            $reel->load(['comments' => function ($q) use ($hasLikesTable, $hasParentId) {
                if ($hasParentId) {
                    $q->with(['user:id,username,avatar', 'replies' => function ($rq) use ($hasLikesTable) {
                        $rq->with('user:id,username,avatar');
                        if ($hasLikesTable) {
                            $rq->withCount('likes');
                        }
                        $rq->orderBy('created_at');
                    }]);
                    if ($hasLikesTable) {
                        $q->withCount('likes');
                    }
                    $q->whereNull('parent_id')
                        ->orderByDesc('created_at')
                        ->limit(50);
                } else {
                    $q->with('user:id,username,avatar')
                        ->orderByDesc('created_at')
                        ->limit(50);
                }
            }]);

            if (Schema::hasTable('reel_hashtags')) {
                $reel->load('hashtags');
                $reel->hashtags = $reel->hashtags->pluck('tag');
            } else {
                $reel->hashtags = collect();
            }

            if (Schema::hasTable('reel_analytics')) {
                $reel->load('analytics');
            }

            $reel->liked = $reel->isLikedBy();
            $reel->saved = $reel->isSavedBy();

            return $this->success($reel, 'OK');
        } catch (\Throwable $e) {
            \Log::error('ReelController@show: '.$e->getMessage(), ['trace' => $e->getTraceAsString()]);

            return $this->error('An error occurred while loading the reel.', 500);
        }
    }

    public function update(Request $request, $id)
    {
        $reel = Reel::where('user_id', Auth::id())->findOrFail($id);

        $request->validate([
            'caption' => 'nullable|string|max:2200',
            'music_title' => 'nullable|string|max:255',
            'music_url' => 'nullable|url|max:500',
            'comments_enabled' => 'nullable|boolean',
        ]);

        $reel->update($request->only(['caption', 'music_title', 'music_url', 'comments_enabled']));
        $reel->syncHashtags();
        $reel->syncMentions();

        return $this->success($reel->load('user'), 'Reel updated.');
    }

    public function destroy($id)
    {
        $reel = Reel::where('user_id', Auth::id())->findOrFail($id);
        $reel->delete();

        return $this->success(null, 'Reel deleted.');
    }

    public function like($id)
    {
        try {
            $result = $this->reels->toggleLike(Auth::id(), $id);

            return $this->success($result, $result['liked'] ? 'Liked.' : 'Unliked.');
        } catch (\Throwable $e) {
            Log::error('ReelController@like: '.$e->getMessage());

            return $this->error('Unable to like reel.', 500);
        }
    }

    public function comment(Request $request, $id)
    {
        try {
            if (! Schema::hasTable('reel_comments')) {
                return $this->error('Comments are not available.', 500);
            }

            $request->validate([
                'content' => 'required|string|max:1000',
                'parent_id' => 'nullable|integer|exists:reel_comments,id',
            ]);

            $reel = Reel::find($id);
            if (! $reel) {
                return $this->error('Reel not found.', 404);
            }

            $data = [
                'user_id' => Auth::id(),
                'content' => Sanitize::text($request->content),
            ];
            if (Schema::hasColumn('reel_comments', 'parent_id')) {
                $data['parent_id'] = $request->parent_id;
            }

            $comment = $reel->comments()->create($data);

            $this->reels->recomputeAnalytics($reel->id);

            return $this->success($comment->load('user'), 'Comment added.', 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->error($e->getMessage(), 422, $e->errors());
        } catch (\Throwable $e) {
            Log::error('ReelController@comment: '.$e->getMessage());

            return $this->error('Failed to post comment.', 500);
        }
    }

    public function likeComment($commentId)
    {
        try {
            $comment = ReelComment::findOrFail($commentId);
            $existing = $comment->likes()->where('user_id', Auth::id())->first();

            if ($existing) {
                $existing->delete();
                $liked = false;
            } else {
                $comment->likes()->create(['user_id' => Auth::id()]);
                $liked = true;
            }

            return $this->success([
                'liked' => $liked,
                'likes_count' => $comment->likes()->count(),
            ], $liked ? 'Liked.' : 'Unliked.');
        } catch (\Throwable $e) {
            Log::error('ReelController@likeComment: '.$e->getMessage());

            return $this->error('Unable to like comment.', 500);
        }
    }

    public function destroyComment($id)
    {
        $comment = ReelComment::where('user_id', Auth::id())->findOrFail($id);
        $comment->delete();

        return $this->success(null, 'Comment deleted.');
    }

    public function toggleSave($id)
    {
        try {
            $saved = $this->reels->toggleSave(Auth::id(), $id);

            return $this->success(['saved' => $saved], $saved ? 'Saved.' : 'Removed from saved.');
        } catch (\Throwable $e) {
            Log::error('ReelController@toggleSave: '.$e->getMessage());

            return $this->error('Unable to save reel.', 500);
        }
    }

    public function share(Request $request, $id)
    {
        $request->validate(['platform' => 'nullable|string|max:50']);

        try {
            $this->reels->recordShare(Auth::id(), $id, $request->input('platform'));

            return $this->success(null, 'Share recorded.');
        } catch (\Throwable $e) {
            Log::error('ReelController@share: '.$e->getMessage());

            return $this->error('Unable to record share.', 500);
        }
    }

    public function recordView(Request $request, $id)
    {
        $request->validate([
            'seconds' => 'nullable|integer|min:0|max:600',
            'percent' => 'nullable|integer|min:0|max:100',
            'completed' => 'nullable|boolean',
        ]);

        try {
            $this->reels->recordWatch(
                Auth::id(),
                $id,
                (int) $request->input('seconds', 0),
                (int) $request->input('percent', 0),
                $request->boolean('completed', false)
            );

            return $this->success(null, 'View recorded.');
        } catch (\Throwable $e) {
            Log::error('ReelController@recordView: '.$e->getMessage());

            return $this->error('Unable to record view.', 500);
        }
    }

    public function insights()
    {
        try {
            $result = $this->reels->creatorInsights(Auth::id());

            return $this->success($result, 'OK');
        } catch (\Throwable $e) {
            Log::error('ReelController@insights: '.$e->getMessage());

            return $this->error('Unable to load insights.', 500);
        }
    }

    public function drafts()
    {
        try {
            $result = $this->reels->drafts(Auth::id());

            return $this->success($result, 'OK');
        } catch (\Throwable $e) {
            Log::error('ReelController@drafts: '.$e->getMessage());

            return $this->error('Unable to load drafts.', 500);
        }
    }

    public function scheduled()
    {
        try {
            $result = $this->reels->scheduled(Auth::id());

            return $this->success($result, 'OK');
        } catch (\Throwable $e) {
            Log::error('ReelController@scheduled: '.$e->getMessage());

            return $this->error('Unable to load scheduled reels.', 500);
        }
    }

    public function featured()
    {
        try {
            $result = $this->reels->featured(Auth::id());

            return $this->success($result, 'OK');
        } catch (\Throwable $e) {
            Log::error('ReelController@featured: '.$e->getMessage());

            return $this->error('Unable to load featured reels.', 500);
        }
    }

    public function musicLibrary(Request $request)
    {
        try {
            $result = $this->reels->musicLibrary(
                $request->input('genre'),
                $request->input('term'),
            );

            return $this->success($result, 'OK');
        } catch (\Throwable $e) {
            Log::error('ReelController@musicLibrary: '.$e->getMessage());

            return $this->error('Unable to load music library.', 500);
        }
    }

    public function togglePro(Request $request)
    {
        $request->validate(['enabled' => 'required|boolean']);

        try {
            $enabled = $this->reels->togglePro(Auth::id(), $request->boolean('enabled'));

            return $this->success(['is_pro' => $enabled], 'Pro status updated.');
        } catch (\Throwable $e) {
            Log::error('ReelController@togglePro: '.$e->getMessage());

            return $this->error('Unable to update Pro status.', 500);
        }
    }

    public function popularHashtags()
    {
        try {
            $result = $this->reels->popularHashtags();

            return $this->success($result, 'OK');
        } catch (\Throwable $e) {
            Log::error('ReelController@popularHashtags: '.$e->getMessage());

            return $this->error('Unable to load hashtags.', 500);
        }
    }
}
