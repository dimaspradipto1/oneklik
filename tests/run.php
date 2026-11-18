<?php
/*
 * Tes Oneklik Biz.
 *
 *   php tests/run.php                      → tes unit (tanpa database)
 *   php tests/run.php http://127.0.0.1:8765/api/   → tes unit + tes API ke server itu
 *
 * Tes API membuat akun dan data uji, jadi jalankan HANYA ke server dengan database uji, misalnya:
 *   set DB_DATABASE=kantin_uis_test & set SUPERADMIN_USER=superuji & set SUPERADMIN_PASS=rahasia-uji-1
 *   php -S 127.0.0.1:8765 -t public
 */
declare(strict_types=1);
require dirname(__DIR__) . '/src/bootstrap.php';

use App\Helpers\HttpException;
use App\Helpers\Json;
use App\Helpers\Password;
use App\Models\Tenant;
use App\Validators\OrderValidator;
use App\Validators\RegisterValidator;
use App\Validators\WriteValidator;

$pass = 0; $fail = 0;
function check(bool $ok, string $name): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? "  ok    " : "  GAGAL ") . $name . PHP_EOL; }
function throws(callable $fn, int $status = 0): bool { try { $fn(); return false; } catch (HttpException $e) { return !$status || $e->status() === $status; } }

echo "Unit\n";
$modernHash = Password::hash('rahasia-modern-2026');
$legacySalt = 'abc123';
$legacyHash = $legacySalt . ':rahasia-lama';
for ($i = 0; $i < 2000; $i++) $legacyHash = hash('sha256', $legacySalt . $legacyHash);
check(Password::verify('rahasia-modern-2026', (object)['hash' => $modernHash])
    && !Password::verify('salah', (object)['hash' => $modernHash])
    && Password::acceptable('password-panjang-2026')
    && !Password::acceptable('pendek')
    && Password::needsRehash($legacyHash), 'Password memakai hash PHP dan mengenali hash lama untuk migrasi');
check(Password::verify('rahasia-lama', (object)['hash' => $legacyHash, 'salt' => $legacySalt]), 'Password tetap memverifikasi akun dengan hash legacy');
$mirrorSchema = implode("\n", App\Services\MirrorService::schema());
check(
    str_contains($mirrorSchema, 'password_hash')
    && str_contains($mirrorSchema, 'uq_users_username')
    && str_contains($mirrorSchema, 'uq_users_email')
    && str_contains($mirrorSchema, 'email VARCHAR(120)'),
    'Skema users memuat username (UNIQUE), email (UNIQUE), phone, dan password_hash'
);
check(Tenant::split('orders') === ['main', 'orders'], 'Tenant::split koleksi kantin utama');
check(Tenant::split('k.ab12cd.products') === ['ab12cd', 'products'], 'Tenant::split koleksi kantin lain');
check(Tenant::split('users') === ['', 'users'] && Tenant::split('hacker') === null && Tenant::split('k.AB.orders') === null, 'Tenant::split menolak koleksi tak dikenal');
check(Json::pick('{"a":1,"b":2,"c":{}}', ['a', 'c']) === '{"a":1,"c":{}}', 'Json::pick menjaga objek kosong');
check(Json::encode(Json::merge((object)['x' => (object)['a' => 1, 'b' => 2]], (object)['x' => (object)['b' => 3]])) === '{"x":{"a":1,"b":3}}', 'Json::merge menggabungkan per field');
$wv = new WriteValidator();
check(throws(fn() => $wv->validate((object)['act' => 'drop', 'col' => 'orders', 'id' => 'x', 'data' => new stdClass()])), 'WriteValidator menolak perintah asing');
check(throws(fn() => $wv->validate((object)['act' => 'set', 'col' => 'orders', 'id' => 'a b', 'data' => new stdClass()])), 'WriteValidator menolak ID tidak valid');
check($wv->validate((object)['act' => 'delete', 'col' => 'k.zz99.kas', 'id' => 'k1'])['kantin'] === 'zz99', 'WriteValidator mengenali kantin');
$rv = new RegisterValidator();
$good = (object)['name' => 'Bu Siti', 'bizName' => 'Kantin Bu Siti', 'username' => 'busiti', 'contact' => '0812', 'password' => 'password-siti-2026'];
$goodEmail = (object)['name' => 'Bu Siti', 'bizName' => 'Kantin Bu Siti', 'username' => 'busiti', 'email' => 'siti@contoh.id', 'phone' => '0812', 'password' => 'password-siti-2026'];
check($rv->validate($good)['phone'] === '0812' && $rv->validate($goodEmail)['email'] === 'siti@contoh.id', 'RegisterValidator menerima data lengkap (contact maupun email+phone)');
check(throws(fn() => $rv->validate((object)array_merge((array)$good, ['email' => 'bukan-email']))), 'RegisterValidator menolak format email tidak valid');
check(throws(fn() => $rv->validate((object)array_merge((array)$good, ['bizName' => 'X']))), 'RegisterValidator menolak nama usaha 1 huruf');
check(throws(fn() => $rv->validate((object)array_merge((array)$good, ['username' => 'a b']))), 'RegisterValidator menolak username tidak valid');
$ov = new OrderValidator();
$order = (object)['guest' => 'g1', 'customer' => 'Ani', 'phone' => '0812', 'table' => 't1', 'cart' => (object)['p1' => 1], 'status' => 'selesai', 'payClaim' => 1];
$clean = $ov->forCreate(clone $order, 'g1', 100);
check(!isset($clean->status) && !isset($clean->payClaim) && $clean->uid === '', 'OrderValidator membuang field khusus staf');
check(throws(fn() => $ov->forCreate(clone $order, 'g2', 100)), 'OrderValidator menolak pesanan atas nama tamu lain');
check(throws(fn() => $ov->forDelete((object)['guest' => 'g1', 'status' => 'diproses'], 'g1'), 403), 'Pesanan yang sudah diproses tidak bisa dibatalkan pelanggan');
check(throws(fn() => $ov->forUpdate((object)['guest' => 'g1'], (object)['total' => 0], 'g1'), 403), 'Pelanggan tidak bisa mengubah isi pesanan');

$base = $argv[1] ?? '';
if ($base !== '') {
    echo "\nAPI ($base)\n";
    $jar = [];
    $call = function (string $who, string $op, ?array $body = null, array $headers = []) use ($base, &$jar): array {
        $ch = curl_init($base . '?op=' . $op);
        $h = array_merge(['Content-Type: application/json'], $headers);
        if (!empty($jar[$who])) $h[] = 'Cookie: ' . $jar[$who];
        curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_HEADER => true, CURLOPT_HTTPHEADER => $h]);
        if ($body !== null) { curl_setopt($ch, CURLOPT_POST, true); curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body)); }
        $res = (string)curl_exec($ch);
        $status = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        $hs = (int)curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        if (preg_match_all('/^Set-Cookie:\s*([^;]+)/mi', substr($res, 0, $hs), $m)) $jar[$who] = end($m[1]);
        return [$status, json_decode(substr($res, $hs), true)];
    };
    [$s, $d] = $call('guest', 'ping'); check($s === 200 && ($d['ok'] ?? false), 'ping');
    [$s, $d] = $call('guest', 'dump'); check($s === 200 && $d['hasUsers'] === true && empty($d['docs']['users']), 'super admin dibuat otomatis; tamu tidak melihat daftar akun');
    [$s] = $call('admin', 'login', ['id' => 'superuji', 'pw' => 'salah']); check($s === 401, 'password salah ditolak');
    [$s, $d] = $call('admin', 'login', ['id' => 'superuji', 'pw' => 'rahasia-uji-1']); check($s === 200, 'super admin masuk dengan password dari .env');
    [$s, $d] = $call('admin', 'dump'); $adminId = $d['me'] ?? '';
    check(($d['docs']['users'][$adminId]['mustChange'] ?? false) === true, 'password super admin bersifat sementara');
    check(!isset($d['docs']['users'][$adminId]['hash']) && !isset($d['docs']['users'][$adminId]['salt']), 'hash password tidak dikirim bahkan ke pemilik akun');
    [$s] = $call('admin', 'write', ['act' => 'set', 'col' => 'products', 'id' => 'p1', 'data' => ['name' => 'Teh']]); check($s === 403, 'sebelum ganti password, super admin belum bisa mengubah data');
    $me = $d['docs']['users'][$adminId]; $me['currentPassword'] = 'rahasia-uji-1'; $me['newPassword'] = 'superbaru-admin-99';
    [$s] = $call('admin', 'write', ['act' => 'set', 'col' => 'users', 'id' => $adminId, 'data' => $me]); check($s === 200, 'super admin mengganti password sendiri');
    [$s] = $call('admin', 'write', ['act' => 'set', 'col' => 'products', 'id' => 'p1', 'data' => ['name' => 'Teh', 'price' => 3000]]); check($s === 200, 'setelah ganti password, super admin bisa mengubah data');

    $reg = fn(array $o = []) => $call('owner', 'register', ['data' => array_merge(['name' => 'Pak Budi', 'bizName' => 'Warung Pak Budi', 'username' => 'pakbudi', 'contact' => 'budi@contoh.id', 'password' => 'budipass-uji-2026'], $o)]);
    [$s, $d] = $reg(); check($s === 200 && !empty($d['id']), 'pemilik mendaftar sendiri dan langsung masuk');
    $ownerId = $d['id'] ?? '';
    [$s, $d] = $call('owner', 'dump'); $kid = $d['docs']['users'][$ownerId]['kid'] ?? '';
    $names = array_column($d['docs']['settings']['main']['kantins'] ?? [], 'name');
    check($d['me'] === $ownerId && in_array('Warung Pak Budi', $names, true)
        && !isset($d['docs']['users'][$ownerId]['hash']) && !isset($d['docs']['users'][$ownerId]['salt']), 'kantin dibuat dan hash tidak dikirim ke pemilik');
    [$s] = $call('x', 'register', ['data' => ['name' => 'Lain', 'bizName' => 'warung pak budi', 'username' => 'lain1', 'contact' => 'l@l.l', 'password' => 'password-lain-2026']]); check($s === 409, 'nama usaha kembar ditolak');
    [$s] = $call('x', 'register', ['data' => ['name' => 'Lain', 'bizName' => 'Warung Lain', 'username' => 'PakBudi', 'contact' => 'l@l.l', 'password' => 'password-lain-2026']]); check($s === 409, 'username kembar ditolak');
    [$s] = $call('owner', 'write', ['act' => 'set', 'col' => 'k.' . $kid . '.products', 'id' => 'b1', 'data' => ['name' => 'Nasi', 'price' => 10000]]); check($s === 200, 'pemilik mengubah data kantinnya sendiri');
    [$s] = $call('owner', 'write', ['act' => 'set', 'col' => 'products', 'id' => 'p2', 'data' => ['name' => 'X']]); check($s === 403, 'pemilik tidak bisa mengubah kantin lain');
    [$s, $d] = $call('owner', 'dump'); check(!isset($d['docs']['products']) && count($d['docs']['users']) === 1, 'pemilik hanya melihat kantin dan akunnya sendiri');

    $g = ['X-Guest: tamu1'];
    $orderCol = 'k.' . $kid . '.orders';
    [$s] = $call('guest', 'write', ['act' => 'set', 'col' => $orderCol, 'id' => 'o1', 'data' => ['guest' => 'tamu1', 'customer' => 'Ani', 'phone' => '0812', 'table' => 't1', 'cart' => ['b1' => 1], 'status' => 'selesai']], $g); check($s === 200, 'pelanggan mengirim pesanan');
    [$s, $d] = $call('guest', 'dump', null, $g); check(isset($d['docs'][$orderCol]['o1']) && !isset($d['docs'][$orderCol]['o1']['status']), 'pelanggan melihat pesanannya; status palsu dibuang');
    [$s, $d] = $call('guest', 'dump', null, ['X-Guest: tamu2']); check(!isset($d['docs'][$orderCol]), 'pelanggan lain tidak melihat pesanan itu');
    [$s] = $call('guest', 'write', ['act' => 'set', 'col' => 'products', 'id' => 'p9', 'data' => ['name' => 'X']], $g); check($s === 403, 'pelanggan tidak bisa mengubah menu');

    [$s, $d] = $call('admin', 'dump'); $owner = $d['docs']['users'][$ownerId] ?? [];
    check($owner && !isset($owner['hash']), 'super admin tidak menerima hash password pengguna lain');
    $owner['newPassword'] = 'password-owner-temporary-2026';
    [$s] = $call('admin', 'write', ['act' => 'set', 'col' => 'users', 'id' => $ownerId, 'data' => $owner]); check($s === 200, 'admin mereset password tanpa mengirim hash dari browser');
    unset($owner['newPassword']);
    $owner['active'] = false;
    [$s] = $call('admin', 'write', ['act' => 'set', 'col' => 'users', 'id' => $ownerId, 'data' => $owner]); check($s === 200, 'super admin menonaktifkan pemilik');
    [$s] = $call('owner', 'write', ['act' => 'set', 'col' => 'k.' . $kid . '.products', 'id' => 'b2', 'data' => ['name' => 'Es']]); check($s === 403, 'sesi pemilik yang dinonaktifkan langsung terputus');
    [$s, $d] = $call('y', 'login', ['id' => 'pakbudi', 'pw' => 'password-owner-temporary-2026']); check($s === 403, 'akun nonaktif tidak bisa masuk');
    $owner['active'] = true;
    $call('admin', 'write', ['act' => 'set', 'col' => 'users', 'id' => $ownerId, 'data' => $owner]);
    [$s, $d] = $call('y', 'login', ['id' => 'pakbudi', 'pw' => 'password-owner-temporary-2026']); check($s === 200, 'password sementara pemilik bekerja setelah diaktifkan kembali');
    [$s, $d] = $call('y', 'dump'); $owner = $d['docs']['users'][$ownerId] ?? [];
    check(!empty($owner['mustChange']) && !isset($owner['hash']), 'password reset mewajibkan ganti tanpa mengirim hash');
    $owner['currentPassword'] = 'password-owner-temporary-2026';
    $owner['newPassword'] = 'password-owner-final-2026';
    [$s] = $call('y', 'write', ['act' => 'set', 'col' => 'users', 'id' => $ownerId, 'data' => $owner]); check($s === 200, 'pemilik mengganti password sementara melalui verifikasi server');
    [$s] = $call('guest', 'nope'); check($s === 404, 'perintah tak dikenal → 404');
}

echo PHP_EOL . "$pass lulus, $fail gagal" . PHP_EOL;
exit($fail ? 1 : 0);
