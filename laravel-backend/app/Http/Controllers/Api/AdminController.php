<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BlockedWord;
use App\Models\Notification;
use App\Models\Post;
use App\Models\Reel;
use App\Models\ReelAnalytics;
use App\Models\Report;
use App\Models\Story;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Admin dashboard. Every method enforces the `admin` role. Exposes read and
 * moderation actions only — no destructive bulk deletes.
 */
class AdminController extends Controller
{
    protected function authorizeAdmin(): ?JsonResponse
    {
        $user = Auth::user();
        if (! $user || $user->role !== 'admin') {
            return $this->error('Forbidden.', 403);
        }

        return null;
    }

    public function dashboard(Request $request)
    {
        if ($denied = $this->authorizeAdmin()) {
            return $denied;
        }

        $stats = Cache::remember('admin_dashboard', 120, function () {
            return [
                'users' => User::count(),
                'reels' => Reel::count(),
                'posts' => Post::count(),
                'stories' => Story::count(),
                'reports' => Report::count(),
                'blocked_words' => BlockedWord::count(),
                'new_users_24h' => User::where('created_at', '>=', now()->subDay())->count(),
                'active_today' => User::where('last_seen_at', '>=', now()->subDay())->count(),
            ];
        });

        return $this->success($stats, 'OK');
    }

    public function users(Request $request)
    {
        if ($denied = $this->authorizeAdmin()) {
            return $denied;
        }

        $request->validate([
            'q' => 'nullable|string|max:100',
            'role' => 'nullable|string|in:user,admin',
        ]);

        $query = User::select('id', 'username', 'email', 'role', 'is_private', 'created_at', 'last_seen_at');

        if ($request->filled('q')) {
            $query->where('username', 'ilike', "%{$request->q}%")
                ->orWhere('email', 'ilike', "%{$request->q}%");
        }
        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        return $this->success($query->orderByDesc('created_at')->paginate(25)->toArray(), 'OK');
    }

    public function showUser($id)
    {
        if ($denied = $this->authorizeAdmin()) {
            return $denied;
        }

        $user = User::withCount(['posts', 'reels', 'followers', 'following'])->findOrFail($id);

        return $this->success($user, 'OK');
    }

    public function banUser(Request $request, $id)
    {
        if ($denied = $this->authorizeAdmin()) {
            return $denied;
        }

        $user = User::findOrFail($id);
        if ($user->role === 'admin') {
            return $this->error('Cannot ban an admin.', 403);
        }
        $user->forceFill(['role' => 'banned'])->save();

        return $this->success(null, 'User banned.');
    }

    public function unbanUser(Request $request, $id)
    {
        if ($denied = $this->authorizeAdmin()) {
            return $denied;
        }

        $user = User::findOrFail($id);
        $user->forceFill(['role' => 'user'])->save();

        return $this->success(null, 'User restored.');
    }

    public function reels(Request $request)
    {
        if ($denied = $this->authorizeAdmin()) {
            return $denied;
        }

        $query = Reel::with('user:id,username')
            ->withCount(['likes', 'comments', 'reports' => function ($q) {
                $q->where('reportable_type', Reel::class);
            }]);

        if ($request->filled('q')) {
            $query->where('caption', 'ilike', "%{$request->q}%");
        }

        return $this->success($query->orderByDesc('created_at')->paginate(25)->toArray(), 'OK');
    }

    public function posts(Request $request)
    {
        if ($denied = $this->authorizeAdmin()) {
            return $denied;
        }

        $query = Post::with('user:id,username')->withCount(['likes', 'comments']);

        if ($request->filled('q')) {
            $query->where('content', 'ilike', "%{$request->q}%");
        }

        return $this->success($query->orderByDesc('created_at')->paginate(25)->toArray(), 'OK');
    }

    public function stories(Request $request)
    {
        if ($denied = $this->authorizeAdmin()) {
            return $denied;
        }

        return $this->success(
            Story::with('user:id,username')->orderByDesc('created_at')->paginate(25)->toArray(),
            'OK'
        );
    }

    public function reports(Request $request)
    {
        if ($denied = $this->authorizeAdmin()) {
            return $denied;
        }

        $query = Report::with(['reporter:id,username', 'reportable'])
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        } else {
            $query->where('status', 'pending');
        }

        return $this->success($query->paginate(25)->toArray(), 'OK');
    }

    public function resolveReport(Request $request, $id)
    {
        if ($denied = $this->authorizeAdmin()) {
            return $denied;
        }

        $report = Report::findOrFail($id);
        $report->update([
            'status' => $request->input('status', 'resolved'),
            'moderated_by' => Auth::id(),
            'moderated_at' => now(),
        ]);

        return $this->success($report, 'Report updated.');
    }

    public function removeContent(Request $request, $type, $id)
    {
        if ($denied = $this->authorizeAdmin()) {
            return $denied;
        }

        $model = match ($type) {
            'reel' => Reel::class,
            'post' => Post::class,
            'story' => Story::class,
            default => null,
        };

        if (! $model) {
            return $this->error('Invalid content type.', 400);
        }

        $item = $model::findOrFail($id);
        $item->delete();

        return $this->success(null, 'Content removed.');
    }

    public function analytics(Request $request)
    {
        if ($denied = $this->authorizeAdmin()) {
            return $denied;
        }

        $topReels = Reel::join('reel_analytics', 'reel_analytics.reel_id', '=', 'reels.id')
            ->with('user:id,username')
            ->orderByDesc('reel_analytics.trending_score')
            ->limit(20)
            ->get(['reels.*', 'reel_analytics.*']);

        $totals = [
            'views' => ReelAnalytics::sum('views_count'),
            'watch_time' => ReelAnalytics::sum('watch_time_seconds'),
            'avg_completion' => round((float) ReelAnalytics::avg('completion_rate'), 2),
        ];

        return $this->success(['top_reels' => $topReels, 'totals' => $totals], 'OK');
    }

    public function notifications(Request $request)
    {
        if ($denied = $this->authorizeAdmin()) {
            return $denied;
        }

        $request->validate(['message' => 'required|string|max:500', 'user_id' => 'nullable|integer|exists:users,id']);

        if ($request->filled('user_id')) {
            Notification::create([
                'user_id' => $request->user_id,
                'type' => 'admin',
                'message' => $request->message,
            ]);
        } else {
            $chunk = User::pluck('id')->chunk(500);
            foreach ($chunk as $ids) {
                foreach ($ids as $uid) {
                    Notification::create([
                        'user_id' => $uid,
                        'type' => 'admin',
                        'message' => $request->message,
                    ]);
                }
            }
        }

        return $this->success(null, 'Notifications sent.');
    }

    public function roles(Request $request)
    {
        if ($denied = $this->authorizeAdmin()) {
            return $denied;
        }

        $roles = User::select('role', DB::raw('count(*) as total'))
            ->groupBy('role')
            ->pluck('total', 'role')
            ->toArray();

        return $this->success($roles, 'OK');
    }

    public function permissions(Request $request)
    {
        if ($denied = $this->authorizeAdmin()) {
            return $denied;
        }

        $permissions = [
            'user.ban' => true,
            'user.unban' => true,
            'content.remove' => true,
            'report.resolve' => true,
            'notification.broadcast' => true,
            'badword.manage' => true,
        ];

        return $this->success($permissions, 'OK');
    }

    public function settings(Request $request)
    {
        if ($denied = $this->authorizeAdmin()) {
            return $denied;
        }

        if ($request->isMethod('put')) {
            $request->validate(['key' => 'required|string', 'value' => 'required']);
            Cache::forever('setting:'.$request->key, $request->value);

            return $this->success(null, 'Setting saved.');
        }

        return $this->success([
            'app_name' => config('app.name'),
            'maintenance_mode' => Cache::get('setting:maintenance_mode', false),
        ], 'OK');
    }

    public function logs(Request $request)
    {
        if ($denied = $this->authorizeAdmin()) {
            return $denied;
        }

        $path = storage_path('logs/laravel.log');
        if (! file_exists($path)) {
            return $this->success(['lines' => []], 'OK');
        }

        $lines = array_slice(array_reverse(file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES)), 0, 200);

        // Redact obvious PII / secrets before returning to the admin client.
        $redacted = array_map(function ($line) {
            $line = preg_replace('/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/', '[email-redacted]', $line);
            $line = preg_replace('/(token|signature|password|secret|authorization)[=: "\']+[^\s,"\']+/i', '$1=[redacted]', $line);
            $line = preg_replace('/\bBearer\s+[A-Za-z0-9._-]+/', 'Bearer [redacted]', $line);

            return $line;
        }, $lines);

        return $this->success(['lines' => $redacted], 'OK');
    }

    public function badWords(Request $request)
    {
        if ($denied = $this->authorizeAdmin()) {
            return $denied;
        }

        return $this->success(BlockedWord::orderBy('word')->paginate(50)->toArray(), 'OK');
    }

    public function addBadWord(Request $request)
    {
        if ($denied = $this->authorizeAdmin()) {
            return $denied;
        }

        $request->validate(['word' => 'required|string|max:60|unique:blocked_words,word']);
        BlockedWord::create(['word' => strtolower($request->word)]);

        return $this->success(null, 'Bad word added.');
    }

    public function deleteBadWord($id)
    {
        if ($denied = $this->authorizeAdmin()) {
            return $denied;
        }

        BlockedWord::findOrFail($id)->delete();

        return $this->success(null, 'Bad word removed.');
    }
}
