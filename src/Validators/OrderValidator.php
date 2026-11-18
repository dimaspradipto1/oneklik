<?php
declare(strict_types=1);

namespace App\Validators;

use App\Helpers\HttpException;
use App\Models\Order;

/** What a customer (table QR, no login) may send for their own orders. */
final class OrderValidator
{
    /** A new order: must be complete and carry the customer's own guest id. Staff-only fields are removed. */
    public function forCreate(object $data, string $guest, int $rawBytes): object
    {
        if (($data->guest ?? '') !== $guest || trim((string)($data->customer ?? '')) === '' || trim((string)($data->phone ?? '')) === '' || empty($data->table) || !is_object($data->cart ?? null)) {
            throw new HttpException('Data pesanan tidak lengkap.');
        }
        if ($rawBytes > Order::MAX_BYTES) throw new HttpException('Pesanan terlalu besar.', 413);
        $this->checkPayMethod($data);
        foreach (Order::STAFF_ONLY as $k) unset($data->$k);
        $data->uid = '';
        return $data;
    }

    /** Cancelling: only own, unpaid orders the kitchen has not started. */
    public function forDelete(?object $old, string $guest): void
    {
        if (!Order::belongsTo($old, $guest)) throw new HttpException('Pesanan tidak ditemukan.', 403);
        if (!empty($old->paid)) throw new HttpException('Pesanan sudah lunas. Hubungi kasir untuk pembatalan.', 403);
        if (in_array($old->status ?? '', Order::LOCKED_STATUSES, true)) throw new HttpException('Pesanan sudah diproses dapur. Hubungi kasir untuk membatalkan.', 403);
    }

    /** Changing: only "I have paid" (payClaim) or the payment method. */
    public function forUpdate(?object $old, object $data, string $guest): object
    {
        if (!Order::belongsTo($old, $guest)) throw new HttpException('Pesanan tidak ditemukan.', 403);
        if (!empty($old->paid)) throw new HttpException('Pesanan sudah lunas.', 403);
        $keys = array_keys(get_object_vars($data));
        if (!$keys || array_diff($keys, Order::GUEST_EDITABLE)) throw new HttpException('Pesanan tidak bisa diubah. Batalkan lalu pesan ulang.', 403);
        $this->checkPayMethod($data);
        if (isset($data->payClaim)) $data->payClaim = (object)['at' => (int)(microtime(true) * 1000)];
        return $data;
    }

    private function checkPayMethod(object $data): void
    {
        if (isset($data->payMethod) && !in_array($data->payMethod, Order::PAY_METHODS, true)) throw new HttpException('Metode bayar tidak dikenal.');
    }
}
