<?php

namespace Database\Seeders;

use App\Models\Reel;
use App\Models\User;
use Illuminate\Database\Seeder;

class ReelSeeder extends Seeder
{
    public function run(): void
    {
        if (Reel::count() > 0) {
            echo "⏭️ Reels already exist, skipping\n";
            return;
        }

        $user = User::where('email', 'test@test.com')->first() ?? User::first();

        $videos = [
            ['url' => 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 'caption' => 'لحظات مليئة بالإثارة 🔥', 'music' => 'إيقاع حماسي'],
            ['url' => 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', 'caption' => 'اهرب من الروتين 🏃', 'music' => 'موسيقى تصويرية'],
            ['url' => 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', 'caption' => 'المرح هو المفتاح 😄', 'music' => 'أغنية مرح'],
            ['url' => 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', 'caption' => 'رحلات ممتعة مع الأصدقاء 🚗', 'music' => 'موسيقى سفر'],
            ['url' => 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4', 'caption' => 'كل شيء سيكون على ما يرام 💪', 'music' => 'لحن هادئ'],
            ['url' => 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'caption' => 'مغامرات الأرنب الكبير 🐰', 'music' => 'موسيقى كرتون'],
            ['url' => 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 'caption' => 'في عالم الخيال 🌌', 'music' => 'موسيقى سينمائية'],
            ['url' => 'https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', 'caption' => 'قصة مؤثرة من الألم إلى الأمل ✨', 'music' => 'سيمفونية درامية'],
            ['url' => 'https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4', 'caption' => 'مغامرات على الطرق الوعرة 🚙', 'music' => 'موسيقى حماسية'],
            ['url' => 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', 'caption' => 'معركة في عالم المستقبل 🤖', 'music' => 'موسيقى ملحمية'],
        ];

        foreach ($videos as $v) {
            for ($i = 0; $i < 3; $i++) {
                Reel::create([
                    'user_id' => $user->id,
                    'video_url' => $v['url'],
                    'caption' => $v['caption'],
                    'music_title' => $v['music'],
                    'duration' => 30,
                    'comments_enabled' => true,
                ]);
            }
        }

        echo "✅ Seeded: " . (count($videos) * 3) . " reels\n";
    }
}
