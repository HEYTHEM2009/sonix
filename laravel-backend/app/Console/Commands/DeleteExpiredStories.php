<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Story;
use App\Models\StoryView;
use App\Models\StoryReaction;
use App\Models\StoryHighlightItem;
use App\Services\CdnService;
use Carbon\Carbon;

class DeleteExpiredStories extends Command
{
    protected $signature = 'app:delete-expired-stories';
    protected $description = 'Delete stories older than 12 hours';

    public function handle()
    {
        $cutoff = Carbon::now()->subHours(12);
        $cdn = new CdnService();
        $deleted = 0;
        $cdnUrls = [];

        $expired = Story::where('created_at', '<', $cutoff)
            ->where('is_highlight', false)
            ->pluck('id');

        if ($expired->isEmpty()) {
            $this->info("No expired stories found.");
            return 0;
        }

        foreach ($expired->chunk(200) as $chunk) {
            $stories = Story::whereIn('id', $chunk)->get();

            foreach ($stories as $story) {
                if ($story->image) {
                    $file = public_path(ltrim($story->image, '/'));
                    if (file_exists($file)) @unlink($file);
                    $cdnUrls[] = config('app.url') . $story->image;
                }
                if ($story->video) {
                    $file = public_path(ltrim($story->video, '/'));
                    if (file_exists($file)) @unlink($file);
                    $cdnUrls[] = config('app.url') . $story->video;
                }

                StoryView::where('story_id', $story->id)->delete();
                StoryReaction::where('story_id', $story->id)->delete();
                StoryHighlightItem::where('story_id', $story->id)->delete();
                $story->delete();
                $deleted++;
            }

            if ($cdn->isEnabled() && !empty($cdnUrls)) {
                $cdn->purgeFiles($cdnUrls);
                $cdnUrls = [];
            }
        }

        $this->info("Deleted $deleted expired stories.");
        return 0;
    }
}
