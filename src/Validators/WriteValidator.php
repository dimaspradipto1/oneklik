<?php
declare(strict_types=1);

namespace App\Validators;

use App\Helpers\HttpException;
use App\Models\Tenant;

/** Shape of a write request: {act: set|update|delete, col, id, data}. Access rules live in WriteService. */
final class WriteValidator
{
    public const ACTIONS = ['set', 'update', 'delete'];

    /** @return array{act: string, col: string, id: string, data: ?object, kantin: string, base: string} */
    public function validate(?object $in): array
    {
        $act = (string)($in->act ?? '');
        $col = (string)($in->col ?? '');
        $id = (string)($in->id ?? '');
        $data = $in->data ?? null;
        if (!in_array($act, self::ACTIONS, true)) throw new HttpException('Perintah tidak dikenal.');
        $split = Tenant::split($col);
        if (!$split) throw new HttpException('Koleksi tidak dikenal.');
        if (!preg_match('/^[A-Za-z0-9_.:@+~-]{1,120}$/', $id)) throw new HttpException('ID tidak valid.');
        if ($act !== 'delete' && !is_object($data)) throw new HttpException('Data harus berupa objek.');
        return ['act' => $act, 'col' => $col, 'id' => $id, 'data' => is_object($data) ? $data : null, 'kantin' => $split[0], 'base' => $split[1]];
    }
}
