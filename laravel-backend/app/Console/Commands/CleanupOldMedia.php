<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class CleanupOldMedia extends Command
{
    protected $signature = 'app:cleanup-old-media';
    protected $description = 'Remove orphaned media files not referenced by any story/post';

    public function handle(): int
    {
        $uploadsPath = public_path('uploads');
        if (!is_dir($uploadsPath)) {
            $this->info("No uploads directory found.");
            return 0;
        }

        $files = File::allFiles($uploadsPath);
        $deleted = 0;
        $skipped = 0;

        foreach ($files as $file) {
            $relativePath = '/' . ltrim(str_replace(public_path(), '', $file->getPathname()), '/');

            // Skip transcoded directory
            if (str_contains($relativePath, 'transcoded')) {
                continue;
            }

            // Check if file is referenced in database
            $isReferenced = $this->isFileReferenced($relativePath);

            if (!$isReferenced) {
                // Only delete files older than 24 hours
                if ($file->getMTime() < time() - 86400) {
                    @unlink($file->getPathname());
                    $deleted++;
                }
            } else {
                $skipped++;
            }
        }

        $this->info("Cleanup complete: deleted {$deleted} orphaned files, kept {$skipped} referenced files.");
        return 0;
    }

    protected function isFileReferenced(string $path): bool
    {
        // Check stories table
        $storyCount = \DB::table('stories')
            ->where('image', $path)
            ->orWhere('video', $path)
            ->orWhere('thumbnail', $path)
            ->count();

        if ($storyCount > 0) return true;

        // Check posts table
        $postCount = \DB::table('posts')
            ->where('image', $path)
            ->orWhere('video', $path)
            ->orWhere('thumbnail', $path)
            ->count();

        if ($postCount > 0) return true;

        // Check users table (avatars)
        $userCount = \DB::table('users')
            ->where('avatar', $path)
            ->count();

        if ($userCount > 0) return true;

        // Check story_highlights table
        $highlightCount = \DB::table('story_highlights')
            ->where('cover_image', $path)
            ->count();

        if ($highlightCount > 0) return true;

        return false;
    }
}
