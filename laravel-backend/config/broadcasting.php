<?php

return [

    'default' => env('BROADCAST_CONNECTION', 'reverb'),

    'connections' => [

        'reverb' => [
            'driver' => 'pusher',
            'key' => env('REVERB_APP_KEY'),
            'secret' => env('REVERB_APP_SECRET'),
            'app_id' => env('REVERB_APP_ID'),
            'options' => [
                'host' => env('REVERB_HOST', '127.0.0.1'),
                'port' => (int) env('REVERB_PORT', env('REVERB_SERVER_PORT', 8080)),
                'scheme' => 'http',
                'useTLS' => false,
            ],
        ],

    ],

    'channels' => [
        'presence-*' => [
            'driver' => 'auth',
        ],
        'private-*' => [
            'driver' => 'auth',
        ],
    ],

];
