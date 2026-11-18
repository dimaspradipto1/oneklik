<?php
declare(strict_types=1);

namespace App\Models;

/** Customer orders from a table QR code (collection "orders" of each kantin). */
final class Order
{
    public const PAY_METHODS = ['kasir', 'qris', 'shopeepay', 'gopay'];
    /** Once the kitchen has these, the customer can no longer cancel. */
    public const LOCKED_STATUSES = ['diproses', 'diantar'];
    /** The only fields a customer may change on an existing order. */
    public const GUEST_EDITABLE = ['payClaim', 'payMethod'];
    /** Fields only staff may set. */
    public const STAFF_ONLY = ['payClaim', 'status', 'queue', 'printedAt'];
    public const MAX_BYTES = 20000;

    public static function belongsTo(?object $order, string $guest): bool
    {
        return $order !== null && $guest !== '' && ($order->guest ?? '') === $guest;
    }
}
