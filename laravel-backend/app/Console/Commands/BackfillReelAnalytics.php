<?php

namespace App\Console\Commands;

use App\Models\Reel;
use App\Services\ReelService;
use Illuminate\Console\Command;

class BackfillReelAnalytics extends Command
{
    protected $signature = 'reels:backfill-analytics';

    protected $description = 'Compute analytics rows for all existing reels (trending, completion, recommendation).';

    public function handle(): int
    {
        $service = app(ReelService::class);
        $reels = Reel::all();
        $bar = $this->output->createProgressBar($reels->count());

        foreach ($reels as $reel) {
            $service->recomputeAnalytics($reel->id);
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("Backfilled analytics for {$reels->count()} reels.");

        return self::SUCCESS;
    }
}
