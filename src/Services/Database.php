<?php
declare(strict_types=1);

namespace App\Services;

use App\Helpers\Password;
use App\Helpers\Str;
use App\Models\User;
use App\Repositories\UserRepository;
use App\Validators\UsernameRule;

/** Koneksi PDO tunggal per request, memakai config/config.php. */
final class Database
{
    private static ?\PDO $pdo = null;

    public static function connection(): \PDO
    {
        if (self::$pdo) return self::$pdo;
        $c = app_config('database');
        $pdo = new \PDO(
            sprintf('mysql:host=%s;port=%d;charset=%s', $c['host'], (int)$c['port'], $c['charset']),
            $c['username'],
            $c['password'],
            [\PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION, \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_ASSOC]
        );
        $name = str_replace('`', '', (string)$c['database']);
        if (!empty($c['create_database'])) {
            try {
                $pdo->exec("CREATE DATABASE IF NOT EXISTS `$name` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            } catch (\PDOException) {
            }
        }
        $pdo->exec("USE `$name`");
        return self::$pdo = $pdo;
    }

    /** Pastikan semua tabel dari sql/schema.sql tersedia dan tabel salinan sinkron. */
    public static function ensureSchema(\PDO $pdo): void
    {
        $hasDocs = $pdo->query("SHOW TABLES LIKE 'docs'")->fetchColumn();
        if (!$hasDocs) {
            $sql = file_get_contents(BASE_PATH . '/sql/schema.sql');
            if ($sql !== false) {
                $pdo->exec($sql);
            }
        }
        (new MirrorService($pdo, date_default_timezone_get()))->ensure();
    }

    /** Buat akun Super Admin dari config/config.php jika belum ada admin di database. */
    public static function ensureSuperAdmin(UserRepository $users): void
    {
        $all = $users->all();
        if ($users->hasAdmin($all)) return;

        $cfg = app_config('superadmin');
        $username = trim((string)($cfg['username'] ?? ''));
        $email = trim((string)($cfg['email'] ?? ''));
        $password = (string)($cfg['password'] ?? '');

        if ($username === '' || !Password::acceptable($password) || $password === 'ganti-password-ini' || !UsernameRule::valid($username)) {
            throw new \RuntimeException('Konfigurasi superadmin di config/config.php tidak valid; gunakan username valid dan password minimal 12 karakter.');
        }
        if ($users->loginTaken($username, $all) || ($email !== '' && $users->loginTaken($email, $all))) {
            throw new \RuntimeException('Username atau email superadmin sudah dipakai akun lain.');
        }

        $now = Str::nowMs();
        $users->save('u' . Str::random(13), (object)[
            'name'       => trim((string)($cfg['name'] ?? '')) ?: 'Super Admin',
            'username'   => $username,
            'email'      => $email !== '' ? Str::lower($email) : '',
            'phone'      => '',
            'contact'    => $email !== '' ? Str::lower($email) : '',
            'role'       => User::ADMIN,
            'active'     => true,
            'hash'       => Password::hash($password),
            'createdAt'  => $now,
            'mustChange' => true,
            'pwResetAt'  => $now,
            'pwResetBy'  => 'file konfigurasi server',
        ]);
    }
}
