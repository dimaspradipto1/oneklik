<?php
declare(strict_types=1);

namespace App\Helpers;

/** Writes server errors to storage/logs/app-YYYY-MM-DD.log (never shown to visitors). */
final class Logger
{
    public static function error(string $message, array $context = []): void
    {
        $dir = BASE_PATH . '/storage/logs';
        if (!is_dir($dir)) @mkdir($dir, 0775, true);
        $line = '[' . date('Y-m-d H:i:s') . '] ' . $message . ($context ? ' ' . json_encode($context, JSON_UNESCAPED_UNICODE) : '') . PHP_EOL;
        @file_put_contents($dir . '/app-' . date('Y-m-d') . '.log', $line, FILE_APPEND | LOCK_EX);
    }
}
