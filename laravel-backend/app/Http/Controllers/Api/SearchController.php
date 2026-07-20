<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SearchService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class SearchController extends Controller
{
    protected SearchService $search;

    public function __construct(SearchService $search)
    {
        $this->search = $search;
    }

    public function suggestions(Request $request)
    {
        try {
            $result = $this->search->smartSuggestions(
                Auth::id(),
                (string) $request->query('q', ''),
                (int) $request->query('limit', 10)
            );

            return $this->success($result, 'OK');
        } catch (\Throwable $e) {
            Log::error('SearchController@suggestions: '.$e->getMessage());

            return $this->error('Search failed.', 500);
        }
    }

    public function users(Request $request)
    {
        $request->validate(['q' => 'required|string|min:1|max:100']);

        try {
            $result = $this->search->users($request->query('q'), 20, (int) $request->query('page', 1));

            return $this->success($result, 'OK');
        } catch (\Throwable $e) {
            Log::error('SearchController@users: '.$e->getMessage());

            return $this->error('Search failed.', 500);
        }
    }

    public function reels(Request $request)
    {
        $request->validate(['q' => 'required|string|min:1|max:100']);

        try {
            $result = $this->search->reels($request->query('q'), 20, (int) $request->query('page', 1));

            return $this->success($result, 'OK');
        } catch (\Throwable $e) {
            Log::error('SearchController@reels: '.$e->getMessage());

            return $this->error('Search failed.', 500);
        }
    }

    public function posts(Request $request)
    {
        $request->validate(['q' => 'required|string|min:1|max:100']);

        try {
            $result = $this->search->posts($request->query('q'), 20, (int) $request->query('page', 1));

            return $this->success($result, 'OK');
        } catch (\Throwable $e) {
            Log::error('SearchController@posts: '.$e->getMessage());

            return $this->error('Search failed.', 500);
        }
    }

    public function stories(Request $request)
    {
        $request->validate(['q' => 'required|string|min:1|max:100']);

        try {
            $result = $this->search->stories($request->query('q'), 20, (int) $request->query('page', 1));

            return $this->success($result, 'OK');
        } catch (\Throwable $e) {
            Log::error('SearchController@stories: '.$e->getMessage());

            return $this->error('Search failed.', 500);
        }
    }

    public function hashtags(Request $request)
    {
        $request->validate(['q' => 'required|string|min:1|max:100']);

        try {
            $result = $this->search->hashtags($request->query('q'), 20);

            return $this->success($result, 'OK');
        } catch (\Throwable $e) {
            Log::error('SearchController@hashtags: '.$e->getMessage());

            return $this->error('Search failed.', 500);
        }
    }

    public function audio(Request $request)
    {
        $request->validate(['q' => 'required|string|min:1|max:100']);

        try {
            $result = $this->search->audio($request->query('q'), 20, (int) $request->query('page', 1));

            return $this->success($result, 'OK');
        } catch (\Throwable $e) {
            Log::error('SearchController@audio: '.$e->getMessage());

            return $this->error('Search failed.', 500);
        }
    }

    public function trending(Request $request)
    {
        try {
            $result = $this->search->trending((int) $request->query('limit', 10));

            return $this->success($result, 'OK');
        } catch (\Throwable $e) {
            Log::error('SearchController@trending: '.$e->getMessage());

            return $this->error('Search failed.', 500);
        }
    }
}
