<?php
declare(strict_types=1);

namespace App\Services;

use App\Helpers\HttpException;
use App\Helpers\Json;
use App\Helpers\Password;
use App\Helpers\Str;
use App\Models\Context;
use App\Models\Tenant;
use App\Models\User;
use App\Repositories\DocumentRepository;
use App\Repositories\MetaRepository;
use App\Validators\OrderValidator;
use App\Validators\WriteValidator;

/**
 * Saves one document change after checking who may make it:
 *   - Super admin: everything (but cannot remove or demote their own account).
 *   - Owner: only their own kantin's data and their own name/password.
 *   - Customer (table QR): only creating, paying or cancelling their own orders.
 */
final class WriteService
{
    public function __construct(
        private DocumentRepository $docs,
        private MetaRepository $meta,
        private WriteValidator $validator,
        private OrderValidator $orders,
    ) {}

    public function write(Context $c, ?object $in, int $rawBytes): int
    {
        ['act' => $act, 'col' => $col, 'id' => $id, 'data' => $data, 'kantin' => $kid, 'base' => $base] = $this->validator->validate($in);
        $old = $this->docs->find($col, $id);

        if ($c->staff()) $data = $this->staffRules($c, $act, $col, $id, $kid, $base, $data, $old);
        else $data = $this->guestRules($c, $act, $base, $data, $old, $rawBytes);

        if ($act === 'delete') $this->docs->delete($col, $id);
        elseif ($act === 'update') {
            if (!$old) throw new HttpException('Dokumen tidak ada.', 404);
            $this->docs->save($col, $id, Json::merge($old, $data));
        } else $this->docs->save($col, $id, $data);
        return $this->meta->rev();
    }

    private function staffRules(Context $c, string $act, string $col, string $id, string $kid, string $base, ?object $data, ?object $old): ?object
    {
        if ($c->mustChangePassword() && !($col === 'users' && $id === $c->uid && $act !== 'delete')) throw new HttpException('Ganti password sementara Anda terlebih dahulu.', 403);
        if (!$c->admin() && $base !== 'users' && $kid !== $c->kantin()) throw new HttpException('Anda hanya bisa mengubah data kantin Anda sendiri.', 403);
        if (!$c->admin() && $col === 'settings' && $id === Tenant::MAIN && $act !== 'delete') {
            // The shared table list, QR address and kantin list are managed by the super admin.
            foreach (Tenant::GLOBAL_FIELDS as $k) { if ($old && property_exists($old, $k)) $data->$k = $old->$k; else unset($data->$k); }
        }
        if ($col === 'users') $data = $this->userRules($c, $act, $id, $data, $old);
        return $data;
    }

    private function userRules(Context $c, string $act, string $id, ?object $data, ?object $old): ?object
    {
        if (!$c->admin()) {
            // Owners may only change their own name/password; role, status and kantin stay as they are.
            if ($id !== $c->uid || $act === 'delete' || !$old) throw new HttpException('Hanya admin yang boleh mengelola pengguna.', 403);
            $data->role = $old->role;
            $data->active = $old->active ?? true;
            $data->kid = $old->kid ?? '';
        } elseif ($id === $c->uid && ($act === 'delete' || ($data && (($data->role ?? User::ADMIN) !== User::ADMIN || (isset($data->active) && $data->active === false))))) {
            throw new HttpException('Anda tidak bisa menghapus, menonaktifkan, atau menurunkan role akun sendiri.', 403);
        }
        if ($data && !in_array($data->role ?? '', User::STAFF_ROLES, true) && $act !== 'update') throw new HttpException('Role tidak dikenal.');
        if (!$data || $act === 'delete') return $data;

        $newPassword = (string)($data->newPassword ?? '');
        $currentPassword = (string)($data->currentPassword ?? '');
        foreach (array_merge(User::SECRET_FIELDS, User::PW_RESET_FIELDS, ['newPassword', 'currentPassword']) as $field) unset($data->$field);

        if ($newPassword !== '') {
            if (!Password::acceptable($newPassword)) throw new HttpException('Password harus 12–128 karakter.');
            if ($id === $c->uid) {
                if (!$old || !Password::verify($currentPassword, $old)) throw new HttpException('Password lama salah.', 401);
                $data->hash = Password::hash($newPassword);
                $data->mustChange = false;
            } else {
                if (!$c->admin()) throw new HttpException('Hanya admin yang boleh mengatur password pengguna.', 403);
                $data->hash = Password::hash($newPassword);
                $data->mustChange = true;
                $data->pwResetAt = Str::nowMs();
                $data->pwResetBy = (string)($c->me->name ?? 'admin');
            }
            unset($data->salt);
            return $data;
        }

        if (!$old) throw new HttpException('Password awal wajib diisi.');
        if (property_exists($old, 'hash')) $data->hash = $old->hash;
        if (property_exists($old, 'salt')) $data->salt = $old->salt;
        foreach (User::PW_RESET_FIELDS as $field) {
            if (property_exists($old, $field)) $data->$field = $old->$field;
        }
        return $data;
    }

    private function guestRules(Context $c, string $act, string $base, ?object $data, ?object $old, int $rawBytes): ?object
    {
        if ($base !== 'orders' || $c->guest === '') throw new HttpException('Silakan masuk sebagai staf untuk mengubah data ini.', 403);
        if ($act === 'set') {
            if ($old) throw new HttpException('Pesanan sudah ada.', 403);
            return $this->orders->forCreate($data, $c->guest, $rawBytes);
        }
        if ($act === 'delete') { $this->orders->forDelete($old, $c->guest); return null; }
        return $this->orders->forUpdate($old, $data, $c->guest);
    }
}
