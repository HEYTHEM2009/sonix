<?php

namespace Database\Seeders;

use App\Models\Reel;
use App\Models\ReelAnalytics;
use App\Models\ReelLike;
use App\Models\ReelSave;
use App\Models\ReelShare;
use App\Models\ReelWatchHistory;
use App\Models\User;
use Illuminate\Database\Seeder;

class ReelsDemoSeeder extends Seeder
{
    public function run(): void
    {
        if (Reel::count() > 0) {
            echo "⏭️ Reels already exist, skipping\n";

            return;
        }

        $users = User::all();
        if ($users->isEmpty()) {
            return;
        }

        $samples = [
            ['url' => 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 'caption' => 'Moments full of excitement 🔥 #fun', 'music' => 'Energetic beat', 'tags' => ['fun', 'energy']],
            ['url' => 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', 'caption' => 'Escape the routine 🏃 #travel', 'music' => 'Cinematic score', 'tags' => ['travel', 'lifestyle']],
            ['url' => 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', 'caption' => 'Fun is the key 😄 #comedy', 'music' => 'Happy song', 'tags' => ['comedy', 'fun']],
            ['url' => 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', 'caption' => 'Fun trips with friends 🚗 #roadtrip', 'music' => 'Travel music', 'tags' => ['travel', 'friends']],
            ['url' => 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4', 'caption' => 'Everything will be okay 💪 #motivation', 'music' => 'Calm tune', 'tags' => ['motivation', 'life']],
            ['url' => 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'caption' => 'Big Bunny adventures 🐰 #cartoon', 'music' => 'Cartoon music', 'tags' => ['cartoon', 'kids']],
            ['url' => 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 'caption' => 'In a world of fantasy 🌌 #scifi', 'music' => 'Cinematic', 'tags' => ['scifi', 'dream']],
            ['url' => 'https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', 'caption' => 'A touching story ✨ #story', 'music' => 'Dramatic symphony', 'tags' => ['story', 'drama']],
            ['url' => 'https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4', 'caption' => 'Off-road adventures 🚙 #offroad', 'music' => 'Epic music', 'tags' => ['offroad', 'travel']],
            ['url' => 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', 'caption' => 'Battle in a future world 🤖 #future', 'music' => 'Epic score', 'tags' => ['future', 'scifi']],
        ];

        $count = 0;
        foreach ($samples as $idx => $sample) {
            // distribute each sample across 3 different users for a realistic feed
            $owners = $users->shuffle()->take(3);
            foreach ($owners as $user) {
                $reel = Reel::create([
                    'user_id' => $user->id,
                    'video_url' => $sample['url'],
                    'caption' => $sample['caption'],
                    'music_title' => $sample['music'],
                    'duration' => 30,
                    'is_published' => true,
                    'comments_enabled' => true,
                ]);
                $reel->syncHashtags($sample['tags']);

                // engagement
                $likers = $users->where('id', '!=', $user->id)->random(min(3, $users->count() - 1));
                foreach ($likers as $liker) {
                    ReelLike::firstOrCreate(['user_id' => $liker->id, 'reel_id' => $reel->id]);
                }
                if ($idx % 2 === 0) {
                    $saver = $users->where('id', '!=', $user->id)->random(1)->first();
                    ReelSave::firstOrCreate(['user_id' => $saver->id, 'reel_id' => $reel->id]);
                }
                ReelShare::firstOrCreate(['user_id' => $user->id, 'reel_id' => $reel->id, 'platform' => 'in_app']);

                // watch history
                $viewer = $users->where('id', '!=', $user->id)->random(1)->first();
                ReelWatchHistory::create([
                    'user_id' => $viewer->id,
                    'reel_id' => $reel->id,
                    'watch_seconds' => rand(10, 30),
                    'percent_watched' => rand(30, 100),
                    'completed' => rand(0, 1) === 1,
                ]);

                ReelAnalytics::updateOrCreate(
                    ['reel_id' => $reel->id],
                    [
                        'views_count' => rand(20, 500),
                        'likes_count' => rand(5, 80),
                        'comments_count' => rand(0, 30),
                        'shares_count' => rand(1, 20),
                        'saves_count' => rand(1, 30),
                        'watch_time_seconds' => rand(100, 2000),
                        'completion_rate' => rand(40, 100) / 100,
                        'trending_score' => rand(0, 100) / 100,
                        'recommendation_score' => rand(0, 100) / 100,
                        'last_viewed_at' => now(),
                    ]
                );

                $count++;
            }
        }

        echo "✅ Seeded: {$count} reels distributed across users with analytics\n";
    }
}
