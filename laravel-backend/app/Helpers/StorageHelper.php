<?php

namespace App\Helpers;

use App\Services\CloudinaryService;
use Illuminate\Http\UploadedFile;

class StorageHelper
{
    public static function upload(UploadedFile $file, string $subfolder = 'uploads'): string
    {
        $cloudinary = app(CloudinaryService::class);

        if ($cloudinary->isConfigured()) {
            $url = $cloudinary->upload($file, ['folder' => $subfolder]);
            if ($url) {
                return $url;
            }
        }

        return self::uploadLocal($file, $subfolder);
    }

    public static function uploadLocal(UploadedFile $file, string $subfolder = 'uploads'): string
    {
        // Paths are stored relative to public/uploads/. A caller subfolder of
        // "uploads" is treated as the root so we never produce /uploads/uploads.
        $subfolder = trim($subfolder, '/');
        if ($subfolder === '' || $subfolder === 'uploads') {
            $subfolder = '';
        }

        $ext = strtolower(pathinfo($file->getClientOriginalName(), PATHINFO_EXTENSION)) ?: 'jpg';
        // Never persist an executable/interpretable extension under the public web root.
        $unsafeExt = ['php', 'php3', 'php4', 'php5', 'phtml', 'pht', 'html', 'htm', 'js', 'svg', 'exe', 'sh', 'bat', 'cmd', 'jsp', 'asp', 'aspx', 'cgi', 'pl'];
        if (in_array($ext, $unsafeExt, true)) {
            $ext = 'bin';
        }
        $filename = 'file_'.time().'_'.mt_rand(1000, 9999).'.'.$ext;
        $destDir = public_path('uploads/'.$subfolder);
        if (! is_dir($destDir)) {
            mkdir($destDir, 0777, true);
        }
        $file->move($destDir, $filename);

        // Return path relative to public/uploads/ (what MediaSecurity serves).
        return ($subfolder === '' ? '' : $subfolder.'/').$filename;
    }

    public static function getUrl(string $path): string
    {
        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        // $path is already relative to public/uploads/.
        $cleanPath = ltrim($path, '/');
        if (str_starts_with($cleanPath, 'uploads/')) {
            $cleanPath = substr($cleanPath, strlen('uploads/'));
        }

        return url('api/media/'.$cleanPath);
    }
}
