<?php
declare(strict_types=1);

namespace App\Helpers;

final class Response
{
    /** Sends JSON. A string is sent as-is (already-encoded JSON, so empty objects stay objects). */
    public static function json($data, int $status = 200): void
    {
        http_response_code($status);
        echo is_string($data) ? $data : json_encode($data, JSON_UNESCAPED_UNICODE);
    }

    public static function error(string $message, int $status = 400): void
    {
        self::json(['error' => $message], $status);
    }
}
