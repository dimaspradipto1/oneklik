<?php
declare(strict_types=1);

namespace App\Helpers;

final class Str
{
    /** Random lowercase letters and digits, e.g. kantin ids (6) and user ids (13). */
    public static function random(int $length): string
    {
        $alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
        $s = '';
        for ($i = 0; $i < $length; $i++) $s .= $alphabet[random_int(0, 35)];
        return $s;
    }

    public static function lower(string $s): string
    {
        return mb_strtolower(trim($s));
    }

    public static function nowMs(): int
    {
        return (int)(microtime(true) * 1000);
    }
}
