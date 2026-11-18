<?php
declare(strict_types=1);

namespace App\Models;

/**
 * Each kantin (tenant) keeps its own collections. The first kantin ("main") uses the plain names;
 * others use "k.<kantin id>.<name>", e.g. k.ab12cd.products. Users are shared by all kantins.
 */
final class Tenant
{
    public const MAIN = 'main';
    public const COLLECTIONS = ['products', 'settings', 'days', 'kas', 'stock', 'items', 'itemMoves', 'suppliers', 'evals', 'orders', 'hpp'];
    /** Fields of settings/main shared by every kantin; only the super admin changes them. */
    public const GLOBAL_FIELDS = ['tables', 'qrBase', 'kantins'];
    /** Settings fields customers (table QR) may read. */
    public const GUEST_SETTINGS = ['shopName', 'categories', 'pay', 'tables', 'qrBase', 'kantins'];

    /** "k.ab12cd.orders" → ['ab12cd', 'orders']; "orders" → ['main', 'orders']; "users" → ['', 'users']; unknown → null. */
    public static function split(string $col): ?array
    {
        if ($col === 'users') return ['', 'users'];
        if (preg_match('/^(?:k\.([a-z0-9]{2,20})\.)?([A-Za-z]+)$/', $col, $m) && in_array($m[2], self::COLLECTIONS, true)) {
            return [$m[1] !== '' ? $m[1] : self::MAIN, $m[2]];
        }
        return null;
    }
}
