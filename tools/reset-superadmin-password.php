<?php
/*
 * Reset password akun Super Admin yang username-nya cocok dengan superadmin.username di config/config.php.
 *     php tools/reset-superadmin-password.php
 */
declare(strict_types=1);

if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require dirname(__DIR__) . '/src/bootstrap.php';

use App\Helpers\Password;
use App\Helpers\Str;
use App\Models\User;
use App\Repositories\DocumentRepository;
use App\Repositories\MetaRepository;
use App\Repositories\UserRepository;
use App\Services\Database;
use App\Services\MirrorService;
use App\Validators\UsernameRule;

$config = app_config('superadmin');
$username = trim((string)($config['username'] ?? ''));
if ($username === '' || !UsernameRule::valid($username)) {
    fwrite(STDERR, "Konfigurasi superadmin.username di config/config.php tidak valid.\n");
    exit(1);
}

$pdo = Database::connection();
Database::ensureSchema($pdo);
$users = new UserRepository(new DocumentRepository(
    $pdo,
    new MetaRepository($pdo),
    new MirrorService($pdo, date_default_timezone_get())
));

$matches = [];
foreach ($users->all() as $id => $user) {
    if (is_object($user) && ($user->role ?? '') === User::ADMIN
        && Str::lower((string)($user->username ?? '')) === Str::lower($username)) {
        $matches[(string)$id] = $user;
    }
}
if (count($matches) !== 1) {
    fwrite(STDERR, "Harus ada tepat satu akun admin dengan username tersebut.\n");
    exit(1);
}

$id = array_key_first($matches);
$user = $matches[$id];
$customPassword = (string)($argv[1] ?? '');
if ($customPassword !== '') {
    if (!Password::acceptable($customPassword)) {
        fwrite(STDERR, "Password harus 12–128 karakter.\n");
        exit(1);
    }
    $password = $customPassword;
    $user->mustChange = false;
} else {
    $password = rtrim(strtr(base64_encode(random_bytes(24)), '+/', '-_'), '=');
    $user->mustChange = true;
}
$user->hash = Password::hash($password);
unset($user->salt);
$user->pwResetAt = Str::nowMs();
$user->pwResetBy = 'perintah reset server';
$users->save($id, $user);

if ($customPassword !== '') {
    echo "Password akun Super Admin ($username) berhasil diubah.\n";
} else {
    echo "Password sementara akun Super Admin (tampilkan sekali): $password\n";
    echo "Login menggunakan password tersebut, lalu segera buat password baru.\n";
}
