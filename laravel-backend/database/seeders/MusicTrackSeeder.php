<?php

namespace Database\Seeders;

use App\Models\MusicTrack;
use Illuminate\Database\Seeder;

class MusicTrackSeeder extends Seeder
{
    public function run(): void
    {
        if (MusicTrack::count() > 0) {
            echo "⏭️ Music tracks already exist, skipping\n";

            return;
        }

        $tracks = [
            ['title' => 'Midnight Drive', 'artist' => 'Sonix Beats', 'genre' => 'lofi', 'duration' => 30, 'is_trending' => true],
            ['title' => 'Sunrise Vibes', 'artist' => 'Aurora', 'genre' => 'pop', 'duration' => 28, 'is_trending' => true],
            ['title' => 'Urban Pulse', 'artist' => 'MC Flux', 'genre' => 'hiphop', 'duration' => 32, 'is_trending' => true],
            ['title' => 'Calm Waters', 'artist' => 'Echo', 'genre' => 'ambient', 'duration' => 35, 'is_trending' => false],
            ['title' => 'Neon Nights', 'artist' => 'Synthwave Co', 'genre' => 'electronic', 'duration' => 30, 'is_trending' => true],
            ['title' => 'Desert Wind', 'artist' => 'Nomad', 'genre' => 'world', 'duration' => 27, 'is_trending' => false],
            ['title' => 'Happy Moments', 'artist' => 'Bright', 'genre' => 'pop', 'duration' => 25, 'is_trending' => true],
            ['title' => 'Workout Hype', 'artist' => 'Gainz', 'genre' => 'edm', 'duration' => 30, 'is_trending' => true],
            ['title' => 'Acoustic Soul', 'artist' => 'Mara', 'genre' => 'acoustic', 'duration' => 33, 'is_trending' => false],
            ['title' => 'Deep Focus', 'artist' => 'LoFi Lab', 'genre' => 'lofi', 'duration' => 40, 'is_trending' => false],
            ['title' => 'Festival Drop', 'artist' => 'Bassline', 'genre' => 'edm', 'duration' => 29, 'is_trending' => true],
            ['title' => 'Rainy Day', 'artist' => 'Cloud', 'genre' => 'ambient', 'duration' => 36, 'is_trending' => false],
        ];

        foreach ($tracks as $t) {
            MusicTrack::create($t);
        }

        echo '✅ Seeded: '.count($tracks)." music tracks\n";
    }
}
