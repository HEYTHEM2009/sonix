<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Media Security Configuration
    |--------------------------------------------------------------------------
    */

    // Signed URL TTL in seconds (default: 1 hour)
    'signed_url_ttl' => env('MEDIA_SIGNED_URL_TTL', 3600),

    // Maximum upload size in MB
    'max_upload_size' => env('MEDIA_MAX_UPLOAD_SIZE', 50),

    // Allowed image MIME types
    'allowed_image_types' => ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],

    // Allowed video MIME types
    'allowed_video_types' => ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'],

    // Image compression quality (1-100)
    'image_quality' => env('MEDIA_IMAGE_QUALITY', 85),

    // Max image dimensions (px)
    'max_image_width' => 2048,
    'max_image_height' => 2048,

    // Thumbnail sizes
    'thumbnail_sizes' => [
        'small' => ['width' => 150, 'height' => 150],
        'medium' => ['width' => 300, 'height' => 300],
        'large' => ['width' => 600, 'height' => 600],
    ],

    /*
    |--------------------------------------------------------------------------
    | Watermark Configuration
    |--------------------------------------------------------------------------
    */

    'watermark_enabled' => env('MEDIA_WATERMARK_ENABLED', false),
    'watermark_text' => env('MEDIA_WATERMARK_TEXT', 'YourApp'),
    'watermark_font_size' => env('MEDIA_WATERMARK_FONT_SIZE', 24),
    'watermark_color' => env('MEDIA_WATERMARK_COLOR', '#ffffff'),
    'watermark_opacity' => env('MEDIA_WATERMARK_OPACITY', 30),

    /*
    |--------------------------------------------------------------------------
    | Transcoding Configuration
    |--------------------------------------------------------------------------
    */

    'transcoding_enabled' => env('MEDIA_TRANSCODING_ENABLED', false),
    'transcoding_queue' => env('MEDIA_TRANSCODING_QUEUE', 'default'),
    'transcoding_qualities' => ['480p', '720p', '1080p'],

    /*
    |--------------------------------------------------------------------------
    | Anti-Scraping Configuration
    |--------------------------------------------------------------------------
    */

    'anti_scraping_enabled' => env('ANTI_SCRAPING_ENABLED', true),

    /*
    |--------------------------------------------------------------------------
    | Storage Configuration
    |--------------------------------------------------------------------------
    */

    'storage_disk' => env('MEDIA_STORAGE_DISK', 'local'),

    /*
    |--------------------------------------------------------------------------
    | CDN Configuration
    |--------------------------------------------------------------------------
    */

    'cdn_enabled' => env('MEDIA_CDN_ENABLED', false),
    'cdn_url' => env('MEDIA_CDN_URL', ''),
];
