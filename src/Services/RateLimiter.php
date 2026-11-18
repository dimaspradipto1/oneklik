<?php
declare(strict_types=1);

namespace App\Services;

use App\Helpers\HttpException;

/** Per-browser-session limits (wrong passwords, sign-ups). */
final class RateLimiter
{
    /** Throws while this session is locked out after too many wrong passwords. */
    public function checkLogin(): void
    {
        $now = time();
        if (($_SESSION['lockUntil'] ?? 0) > $now) {
            throw new HttpException('Terlalu banyak percobaan. Coba lagi dalam ' . ($_SESSION['lockUntil'] - $now) . ' detik.', 429);
        }
    }

    public function loginFailed(int $maxFails, int $lockSeconds): void
    {
        $_SESSION['fails'] = ($_SESSION['fails'] ?? 0) + 1;
        if ($_SESSION['fails'] >= $maxFails) { $_SESSION['lockUntil'] = time() + $lockSeconds; $_SESSION['fails'] = 0; }
    }

    public function loginSucceeded(): void
    {
        $_SESSION['fails'] = 0;
    }

    /** Allows at most $max hits of $key per $window seconds. */
    public function attempt(string $key, int $max, int $window, string $message): void
    {
        $now = time();
        $hits = array_values(array_filter($_SESSION['rl'][$key] ?? [], fn($t) => $t > $now - $window));
        if (count($hits) >= $max) throw new HttpException($message, 429);
        $_SESSION['rl'][$key] = $hits;
    }

    public function hit(string $key): void
    {
        $_SESSION['rl'][$key][] = time();
    }
}
