<?php

namespace App\Helpers;

class Sanitize
{
    public static function text(?string $input): ?string
    {
        if ($input === null) return null;

        $input = strip_tags($input);
        $input = htmlspecialchars($input, ENT_QUOTES, 'UTF-8');
        $input = trim($input);

        return $input === '' ? null : $input;
    }

    public static function content(?string $input): ?string
    {
        if ($input === null) return null;

        $allowed = '<b><i><u><em><strong><br><p>';
        $input = strip_tags($input, $allowed);

        $input = preg_replace_callback('/<[^>]+>/', function ($matches) {
            $tag = $matches[0];
            if (preg_match('/^(<\s*\/?\s*)(\w+)/', $tag, $m)) {
                $tagName = strtolower($m[2]);
                $allowedTags = ['b', 'i', 'u', 'em', 'strong', 'br', 'p'];
                if (in_array($tagName, $allowedTags)) {
                    return $tag;
                }
            }
            return htmlspecialchars($tag, ENT_QUOTES, 'UTF-8');
        }, $input);

        $input = trim($input);

        return $input === '' ? null : $input;
    }
}
