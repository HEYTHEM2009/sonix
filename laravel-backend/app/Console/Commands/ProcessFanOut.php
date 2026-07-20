<?php

namespace App\Console\Commands;

use App\Services\StoryCacheService;
use Illuminate\Console\Command;

class ProcessFanOut extends Command
{
    protected $signature = 'app:process-fan-out';

    protected $description = 'Process queued fan-out jobs for story feed invalidation';

    public function handle(StoryCacheService $cache): int
    {
        $processed = $cache->processFanOutQueue();

        if ($processed > 0) {
            $this->info("Processed {$processed} fan-out jobs.");
        }

        return 0;
    }
}
