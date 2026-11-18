<?php
/*
 * Template konfigurasi Oneklik Biz untuk server cPanel (production).
 * Cara pakai di cPanel:
 *   1. Isi database, username, password, dan superadmin di bawah ini.
 *   2. Rename file ini menjadi "config.php" (menggantikan config.php lokal).
 */

declare(strict_types=1);

return [
    'app' => [
        'name'           => 'Oneklik Biz',
        'tagline'        => 'One Click, Grow Your Business.',
        'env'            => 'production',
        'debug'          => false,
        'timezone'       => 'Asia/Jakarta',
        'trust_proxy'    => false, // Ubah ke true jika domain memakai Cloudflare / reverse proxy
        'session_name'   => 'oneklik_biz',
        'max_body_bytes' => 2000000,
    ],

    'database' => [
        'host'            => 'localhost',
        'port'            => 3306,
        'database'        => 'ISI_NAMA_DATABASE_CPANEL',
        'username'        => 'ISI_USER_DATABASE_CPANEL',
        'password'        => 'ISI_PASSWORD_DATABASE_CPANEL',
        'charset'         => 'utf8mb4',
        'create_database' => false, // Di cPanel, database dibuat lewat MySQL Database Wizard
    ],

    // Dipakai otomatis hanya jika tabel users di database cPanel masih kosong.
    'superadmin' => [
        'name'     => 'Super Admin',
        'username' => 'andiauliya25',
        'email'    => 'admin@domainanda.com',
        'password' => 'GantiPasswordKuatMin12Karakter',
    ],

    'limits' => [
        'login_max_fails'      => 5,
        'login_lock_seconds'   => 30,
        'register_per_session' => 3,
        'register_per_hour'    => 20,
    ],
];
