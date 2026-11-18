<?php
declare(strict_types=1);

namespace App\Validators;

use App\Helpers\HttpException;

final class UsernameRule
{
    public const PATTERN = '/^[A-Za-z0-9._-]{3,30}$/';

    public static function valid(string $username): bool
    {
        return (bool)preg_match(self::PATTERN, $username);
    }

    public static function check(string $username): void
    {
        if (!self::valid($username)) throw new HttpException('Username 3–30 karakter: huruf, angka, titik, garis bawah, atau strip.');
    }
}
