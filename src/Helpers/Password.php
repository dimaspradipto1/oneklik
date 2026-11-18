<?php
declare(strict_types=1);

namespace App\Helpers;

/** Password hashing for server accounts, with a legacy verifier for existing accounts. */
final class Password
{
    public const MIN_LENGTH = 12;
    public const MAX_LENGTH = 128;

    public static function hash(string $password): string
    {
        $algorithm = defined('PASSWORD_ARGON2ID') ? PASSWORD_ARGON2ID : PASSWORD_DEFAULT;
        return password_hash($password, $algorithm);
    }

    public static function verify(string $password, object $user): bool
    {
        $stored = (string)($user->hash ?? '');
        if ($stored === '') return false;
        $info = password_get_info($stored);
        if (($info['algoName'] ?? 'unknown') !== 'unknown') return password_verify($password, $stored);

        $salt = (string)($user->salt ?? '');
        return preg_match('/^[0-9a-f]{64}$/', $stored) === 1
            && hash_equals($stored, self::legacyHash($password, $salt));
    }

    public static function needsRehash(string $stored): bool
    {
        $info = password_get_info($stored);
        if (($info['algoName'] ?? 'unknown') === 'unknown') return true;
        $algorithm = defined('PASSWORD_ARGON2ID') ? PASSWORD_ARGON2ID : PASSWORD_DEFAULT;
        return password_needs_rehash($stored, $algorithm);
    }

    public static function acceptable(string $password): bool
    {
        $length = mb_strlen($password);
        return $length >= self::MIN_LENGTH && $length <= self::MAX_LENGTH;
    }

    /** Verifies hashes created by the old browser-side SHA-256 scheme. */
    private static function legacyHash(string $password, string $salt): string
    {
        $h = $salt . ':' . $password;
        for ($i = 0; $i < 2000; $i++) $h = hash('sha256', $salt . $h);
        return $h;
    }
}
