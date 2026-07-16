<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use App\Helpers\StorageHelper;

class ReelController extends Controller
{
    public function index(Request $request)
    {
        if (!Schema::hasTable('reels')) {
            return response()->json(['data' => [], 'total' => 0, 'per_page' => 20]);
        }

        $reels = \App\Models\Reel::with('user:id,username,avatar')
            ->withCount(['likes', 'comments'])
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($reels);
    }

    public function store(Request $request)
    {
        try {
        $request->validate([
            'video' => 'required|file|mimes:mp4,mov|max:102400',
            'caption' => 'nullable|string|max:2200',
            'music_title' => 'nullable|string|max:255',
            'duration' => 'nullable|integer|max:300',
        ]);

        $path = StorageHelper::upload($request->file('video'), 'reels');
        $videoUrl = StorageHelper::getUrl($path);

        $reel = \App\Models\Reel::create([
            'user_id' => Auth::id(),
            'video_url' => $videoUrl,
            'caption' => $request->caption,
            'music_title' => $request->music_title,
            'duration' => $request->duration ?? 30,
        ]);

        return response()->json($reel->load('user'), 201);
        } catch (\Throwable $e) {
            return response()->json([
                'debug_error' => $e->getMessage(),
                'debug_file' => $e->getFile() . ':' . $e->getLine(),
                'debug_trace' => collect($e->getTrace())->take(5)->map(fn($t) => ($t['file'] ?? '') . ':' . ($t['line'] ?? ''))->all(),
            ], 500);
        }
    }

    public function show($id)
    {
        $reel = \App\Models\Reel::with('user:id,username,avatar')
            ->withCount(['likes', 'comments'])
            ->findOrFail($id);

        return response()->json($reel);
    }

    public function destroy($id)
    {
        $reel = \App\Models\Reel::where('user_id', Auth::id())->findOrFail($id);
        $reel->delete();

        return response()->json(['message' => 'Reel deleted']);
    }

    public function like($id)
    {
        $reel = \App\Models\Reel::findOrFail($id);
        $existing = $reel->likes()->where('user_id', Auth::id())->first();

        if ($existing) {
            $existing->delete();
            return response()->json(['liked' => false]);
        }

        $reel->likes()->create(['user_id' => Auth::id()]);
        return response()->json(['liked' => true]);
    }

    public function comment(Request $request, $id)
    {
        $request->validate(['content' => 'required|string|max:1000']);

        $reel = \App\Models\Reel::findOrFail($id);
        $comment = $reel->comments()->create([
            'user_id' => Auth::id(),
            'content' => $request->content,
        ]);

        return response()->json($comment->load('user'), 201);
    }
}
