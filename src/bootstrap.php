<?php
/*
 * Oneklik Biz: titik awal backend (PHP murni).
 * Dipanggil oleh public/index.php (halaman aplikasi) dan public/api/index.php (API).
 */
declare(strict_types=1);

define('BASE_PATH', dirname(__DIR__));

spl_autoload_register(static function (string $class): void {
    if (strncmp($class, 'App\\', 4) !== 0) return;
    $file = BASE_PATH . '/src/' . str_replace('\\', '/', substr($class, 4)) . '.php';
    if (is_file($file)) require $file;
});

$GLOBALS['__ONEKLIK_CONFIG'] = require BASE_PATH . '/config/config.php';

if (!function_exists('app_config')) {
    function app_config(?string $key = null, $default = null)
    {
        $cfg = $GLOBALS['__ONEKLIK_CONFIG'] ?? [];
        if ($key === null || $key === '') return $cfg;
        foreach (explode('.', $key) as $part) {
            if (!is_array($cfg) || !array_key_exists($part, $cfg)) return $default;
            $cfg = $cfg[$part];
        }
        return $cfg;
    }
}

date_default_timezone_set((string)app_config('app.timezone', 'Asia/Jakarta'));
