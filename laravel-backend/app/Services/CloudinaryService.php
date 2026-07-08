<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;

class CloudinaryService
{
    private string $cloudName;
    private string $apiKey;
    private string $apiSecret;

    public function __construct()
    {
        $this->cloudName = config('cloudinary.cloud_name', '') ?: getenv('CLOUDINARY_CLOUD_NAME') ?: '';
        $this->apiKey = config('cloudinary.api_key', '') ?: getenv('CLOUDINARY_API_KEY') ?: '';
        $this->apiSecret = config('cloudinary.api_secret', '') ?: getenv('CLOUDINARY_API_SECRET') ?: '';
    }

    public function isConfigured(): bool
    {
        $configured = !empty($this->cloudName) && !empty($this->apiKey) && !empty($this->apiSecret);
        if (!$configured) {
            Log::warning('Cloudinary not configured', [
                'cloud_name' => $this->cloudName ? 'set' : 'empty',
                'api_key' => $this->apiKey ? 'set' : 'empty',
                'api_secret' => $this->apiSecret ? 'set' : 'empty',
            ]);
        }
        return $configured;
    }

    public function upload(UploadedFile $file, array $options = []): ?string
    {
        if (!$this->isConfigured()) {
            return null;
        }

        try {
            $folder = $options['folder'] ?? 'uploads';
            $timestamp = time();
            $paramsToSign = [
                'folder' => $folder,
                'resource_type' => 'auto',
                'timestamp' => $timestamp,
            ];

            if (isset($options['public_id'])) {
                $paramsToSign['public_id'] = $options['public_id'];
            }

            ksort($paramsToSign);
            $signStr = '';
            foreach ($paramsToSign as $k => $v) {
                $signStr .= "{$k}={$v}&";
            }
            $signStr = rtrim($signStr, '&');
            $signature = sha1($signStr . $this->apiSecret);

            $realPath = $file->getRealPath();
            $mimeType = mime_content_type($realPath) ?: 'application/octet-stream';
            $originalName = $file->getClientOriginalName();

            $uploadUrl = "https://api.cloudinary.com/v1_1/{$this->cloudName}/auto/upload";

            $postFields = [
                'file' => new \CURLFile($realPath, $mimeType, $originalName),
                'api_key' => $this->apiKey,
                'timestamp' => $timestamp,
                'folder' => $folder,
                'resource_type' => 'auto',
                'signature' => $signature,
            ];

            if (isset($options['public_id'])) {
                $postFields['public_id'] = $options['public_id'];
            }

            $ch = curl_init();
            curl_setopt_array($ch, [
                CURLOPT_URL => $uploadUrl,
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => $postFields,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 60,
                CURLOPT_SSL_VERIFYPEER => true,
            ]);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $error = curl_error($ch);
            curl_close($ch);

            if ($error) {
                Log::error('Cloudinary cURL error', ['error' => $error]);
                error_log("[CLOUDINARY] cURL error: {$error}");
                return null;
            }

            $result = json_decode($response, true);

            if ($httpCode >= 200 && $httpCode < 300 && isset($result['secure_url'])) {
                Log::info('Cloudinary upload success', ['url' => $result['secure_url']]);
                error_log("[CLOUDINARY] Upload success: {$result['secure_url']}");
                return $result['secure_url'];
            }

            Log::error('Cloudinary upload failed', ['http_code' => $httpCode, 'response' => $result]);
            error_log("[CLOUDINARY] Upload failed HTTP {$httpCode}: " . json_encode($result));
            return null;
        } catch (\Exception $e) {
            Log::error('Cloudinary upload exception', ['message' => $e->getMessage()]);
            return null;
        }
    }

    public function uploadPath(string $filePath, array $options = []): ?string
    {
        if (!$this->isConfigured()) {
            return null;
        }

        try {
            $tempFile = tempnam(sys_get_temp_dir(), 'cloudinary_');
            copy($filePath, $tempFile);

            $file = new UploadedFile($tempFile, basename($filePath), mime_content_type($filePath), null, true);
            $url = $this->upload($file, $options);

            @unlink($tempFile);
            return $url;
        } catch (\Exception $e) {
            Log::error('Cloudinary path upload error', ['message' => $e->getMessage()]);
            return null;
        }
    }
}
