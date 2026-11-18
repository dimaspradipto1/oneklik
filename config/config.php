<?php
/*
 * Konfigurasi utama Oneklik Biz (PHP murni, tanpa .env atau framework).
 * Sesuaikan nilai database dan akun Super Admin di file ini.
 */
declare(strict_types=1);

$env = static fn(string $key, $default) => ($v = getenv($key)) !== false ? $v : $default;

return [
    'app' => [
        'name'           => $env('APP_NAME', 'Oneklik Biz'),
        'tagline'        => 'One Click, Grow Your Business.',
        'env'            => $env('APP_ENV', 'local'),       // local | production
        'debug'          => filter_var($env('APP_DEBUG', false), FILTER_VALIDATE_BOOL),
        'timezone'       => $env('APP_TIMEZONE', 'Asia/Jakarta'),
        'trust_proxy'    => filter_var($env('TRUST_PROXY', false), FILTER_VALIDATE_BOOL),
        'session_name'   => 'ONEKLIKBIZ',
        'max_body_bytes' => 2000000,
    ],

    'database' => [
        'host'            => $env('DB_HOST', '127.0.0.1'),
        'port'            => (int)$env('DB_PORT', 3306),
        'database'        => $env('DB_DATABASE', 'oneklik_biz'),
        'username'        => $env('DB_USERNAME', 'root'),
        'password'        => (string)$env('DB_PASSWORD', ''),
        'charset'         => 'utf8mb4',
        // Di Laragon/XAMPP lokal: buat database otomatis jika belum ada.
        'create_database' => filter_var($env('DB_CREATE', true), FILTER_VALIDATE_BOOL),
    ],

    // Dibuat otomatis hanya jika tabel users belum memiliki akun admin.
    'superadmin' => [
        'name'     => $env('SUPERADMIN_NAME', 'Super Admin'),
        'username' => (string)$env('SUPERADMIN_USER', 'andiauliya25'),
        'email'    => (string)$env('SUPERADMIN_EMAIL', ''),
        'password' => (string)$env('SUPERADMIN_PASS', 'ubahsaya12345'),
    ],

    'limits' => [
        'login_max_fails'      => 5,    // salah password berturut-turut sebelum dikunci
        'login_lock_seconds'   => 30,
        'register_per_session' => 3,    // pendaftaran pemilik per perangkat per jam
        'register_per_hour'    => 20,   // pendaftaran pemilik seluruh aplikasi per jam
    ],
];
