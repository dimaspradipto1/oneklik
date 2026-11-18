<?php
/*
 * Mengisi ulang tabel-tabel salinan (users, products, sales, orders, …) dari tabel docs.
 * Jalankan dari terminal bila isinya terasa tidak cocok dengan aplikasi:
 *     php tools/rebuild-mirror.php
 * Aman dijalankan kapan saja: data aplikasi (tabel docs) tidak diubah.
 */
declare(strict_types=1);

if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require dirname(__DIR__) . '/src/bootstrap.php';

$pdo = App\Services\Database::connection();
App\Services\Database::ensureSchema($pdo);
$mirror = new App\Services\MirrorService($pdo, date_default_timezone_get());
$mirror->install();
$n = $mirror->rebuild();
$pdo->prepare("REPLACE INTO meta (k, v) VALUES ('mirror', ?)")->execute([App\Services\MirrorService::VERSION]);
echo "Selesai: $n dokumen disalin ke " . count(App\Services\MirrorService::TABLES) . " tabel.\n";
