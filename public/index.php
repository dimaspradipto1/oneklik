<?php
/* Halaman aplikasi Oneklik Biz (routing halaman menu berbasis PHP). */
require dirname(__DIR__) . '/src/bootstrap.php';

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-cache, must-revalidate');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');

$app = app_config('app');

$menuPages = [
    'kasir'     => ['view' => 'kasir',   'label' => 'Kasir',          'file' => 'kasir.php'],
    'riwayat'   => ['view' => 'riwayat', 'label' => 'Riwayat',        'file' => 'riwayat.php'],
    'laporan'   => ['view' => 'laporan', 'label' => 'Laporan',        'file' => 'laporan.php'],
    'stok'      => ['view' => 'stok',    'label' => 'Stok Produk',    'file' => 'stok.php'],
    'pembelian' => ['view' => 'beli',    'label' => 'Pembelian',      'file' => 'pembelian.php'],
    'kas'       => ['view' => 'kas',     'label' => 'Kas & Biaya',    'file' => 'kas.php'],
    'hpp'       => ['view' => 'hpp',     'label' => 'Kalkulator HPP', 'file' => 'hpp.php'],
    'produk'        => ['view' => 'produk',   'label' => 'Produk',         'file' => 'produk.php'],
    'setting-login' => ['view' => 'loginset', 'label' => 'Setting Login',  'file' => 'setting-login.php'],
    'master'        => ['view' => 'master',   'label' => 'Master Data',    'file' => 'master.php'],
];

$requested = strtolower(trim((string)($_GET['page'] ?? 'kasir')));
if ($requested === 'beli') $requested = 'pembelian';

$currentPage = array_key_exists($requested, $menuPages) ? $requested : 'kasir';
$currentView = $menuPages[$currentPage]['view'];

require BASE_PATH . '/views/app.php';
