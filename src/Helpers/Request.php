<?php
declare(strict_types=1);

namespace App\Helpers;

/** The API request: which operation (?op=), the raw JSON body, its decoded form and the guest id header. */
final class Request
{
    public ?object $body = null;
    public string $raw = '';
    public string $op = '';
    public string $guest = '';
    /** Filled by the Authenticate middleware. */
    public ?\App\Models\Context $context = null;

    public static function isSecure(): bool
    {
        if ((!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
            || (int)($_SERVER['SERVER_PORT'] ?? 0) === 443
            || strtolower((string)($_SERVER['REQUEST_SCHEME'] ?? '')) === 'https') return true;
        if (!app_config('app.trust_proxy', false)) return false;
        $forwarded = trim(explode(',', (string)($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? ''))[0]);
        return strtolower($forwarded) === 'https';
    }

    public static function isLoopback(): bool
    {
        return in_array(strtolower((string)($_SERVER['REMOTE_ADDR'] ?? '')), ['127.0.0.1', '::1'], true);
    }

    public static function capture(): self
    {
        $r = new self();
        $r->op = (string)($_GET['op'] ?? '');
        $r->guest = preg_replace('/[^A-Za-z0-9_-]/', '', (string)($_SERVER['HTTP_X_GUEST'] ?? '')) ?? '';
        $r->raw = (string)file_get_contents('php://input');
        return $r;
    }

    public function input(string $key, $default = null)
    {
        return is_object($this->body) && property_exists($this->body, $key) ? $this->body->$key : $default;
    }
}
