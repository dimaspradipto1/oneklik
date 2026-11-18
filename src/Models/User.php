<?php
declare(strict_types=1);

namespace App\Models;

use App\Helpers\Str;

/** User documents (collection "users") are plain JSON objects; these are the rules about them. */
final class User
{
    public const ADMIN = 'admin';       // shown as "Super Admin"
    public const OWNER = 'pemilik';     // Pemilik Usaha, linked to one kantin (kid)
    public const STAFF_ROLES = [self::ADMIN, self::OWNER];
    /** Credential fields are never sent to browsers. */
    public const SECRET_FIELDS = ['hash', 'salt', 'password_hash'];
    public const PW_RESET_FIELDS = ['mustChange', 'pwResetAt', 'pwResetBy'];

    public static function isActive(?object $u): bool
    {
        return $u !== null && !(isset($u->active) && $u->active === false);
    }

    public static function isStaff(?object $u): bool
    {
        return self::isActive($u) && in_array($u->role ?? '', self::STAFF_ROLES, true);
    }

    public static function isAdmin(?object $u): bool
    {
        return self::isStaff($u) && $u->role === self::ADMIN;
    }

    public static function kantinId(object $u): string
    {
        return ((string)($u->kid ?? '')) ?: Tenant::MAIN;
    }

    /** True when $login (username, email, phone or contact) belongs to this user. */
    public static function matchesLogin(object $u, string $login): bool
    {
        $login = Str::lower($login);
        if ($login === '') return false;
        foreach (['username', 'email', 'phone', 'contact'] as $field) {
            if (Str::lower((string)($u->$field ?? '')) === $login) return true;
        }
        return false;
    }
}
