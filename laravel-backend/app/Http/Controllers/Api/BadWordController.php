<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

class BadWordController extends Controller
{
    public function check(Request $request)
    {
        $request->validate(['text' => 'required|string']);

        $blockedWords = Cache::remember('blocked_words', 3600, fn() =>
            \App\Models\BlockedWord::pluck('word')->map(fn($w) => strtolower($w))->toArray()
        );
        $words = explode(' ', strtolower($request->text));

        $found = array_filter($words, fn($word) => in_array($word, $blockedWords));

        return response()->json([
            'has_bad_words' => count($found) > 0,
            'bad_words' => array_values($found),
        ]);
    }

    public function index()
    {
        $words = \App\Models\BlockedWord::orderBy('word')->paginate(100);
        return response()->json($words);
    }

    public function store(Request $request)
    {
        $request->validate([
            'word' => 'required|string|max:100',
            'category' => 'nullable|string|max:50',
        ]);

        $word = \App\Models\BlockedWord::firstOrCreate(
            ['word' => strtolower($request->word)],
            ['category' => $request->category ?? 'general']
        );

        Cache::forget('blocked_words');

        return response()->json($word, 201);
    }

    public function destroy($id)
    {
        \App\Models\BlockedWord::findOrFail($id)->delete();
        Cache::forget('blocked_words');
        return response()->json(['message' => 'Word removed']);
    }
}
