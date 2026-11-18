<?php
declare(strict_types=1);

namespace App;

use App\Controllers\AuthController;
use App\Controllers\DataController;
use App\Controllers\SystemController;
use App\Helpers\HttpException;
use App\Helpers\Logger;
use App\Helpers\Request;
use App\Helpers\Response;
use App\Models\Context;
use App\Models\User;
use App\Repositories\DocumentRepository;
use App\Repositories\MetaRepository;
use App\Repositories\SettingsRepository;
use App\Repositories\UserRepository;
use App\Services\AuthService;
use App\Services\Database;
use App\Services\DumpService;
use App\Services\MirrorService;
use App\Services\RateLimiter;
use App\Services\WriteService;
use App\Validators\OrderValidator;
use App\Validators\RegisterValidator;
use App\Validators\WriteValidator;

/**
 * Router API PHP murni: header keamanan -> sesi -> JSON -> database -> autentikasi -> controller.
 */
final class Router
{
    public const ROUTES = [
        'ping'     => [SystemController::class, 'ping'],
        'rev'      => [SystemController::class, 'rev'],
        'dump'     => [DataController::class, 'dump'],
        'write'    => [DataController::class, 'write'],
        'login'          => [AuthController::class, 'login'],
        'logout'         => [AuthController::class, 'logout'],
        'register'       => [AuthController::class, 'register'],
        'reset_password' => [AuthController::class, 'resetPassword'],
    ];

    private array $services = [];

    public function handle(Request $request): void
    {
        try {
            $this->sendSecurityHeaders();
            $this->startSession();
            $this->parseJsonBody($request);

            $pdo = Database::connection();
            Database::ensureSchema($pdo);
            Database::ensureSuperAdmin($this->get(UserRepository::class));

            $this->authenticate($request);
            $this->dispatch($request);
        } catch (HttpException $e) {
            Response::error($e->getMessage(), $e->status());
        } catch (\PDOException $e) {
            Logger::error('Database: ' . $e->getMessage(), ['op' => $request->op]);
            Response::error('Tidak bisa terhubung ke MySQL. Pastikan MySQL di Laragon/XAMPP sudah Start.', 503);
        } catch (\Throwable $e) {
            Logger::error(get_class($e) . ': ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine(), ['op' => $request->op]);
            Response::error('Terjadi kesalahan di server. Coba lagi.', 500);
        }
    }

    private function sendSecurityHeaders(): void
    {
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        header('X-Content-Type-Options: nosniff');
        header('Referrer-Policy: same-origin');
        if (!Request::isSecure() && !Request::isLoopback()) {
            throw new HttpException('Akses aplikasi dari jaringan harus menggunakan HTTPS.', 403);
        }
    }

    private function startSession(): void
    {
        $name = preg_replace('/[^A-Za-z0-9_-]/', '', (string)app_config('app.session_name', 'ONEKLIKBIZ')) ?: 'ONEKLIKBIZ';
        session_name($name);
        session_set_cookie_params([
            'httponly' => true,
            'samesite' => 'Lax',
            'secure'   => Request::isSecure(),
        ]);
        session_start();
    }

    private function parseJsonBody(Request $request): void
    {
        if (strlen($request->raw) > (int)app_config('app.max_body_bytes', 2000000)) {
            throw new HttpException('Data terlalu besar.', 413);
        }
        $decoded = $request->raw !== '' ? json_decode($request->raw) : null;
        $request->body = is_object($decoded) ? $decoded : null;
    }

    private function authenticate(Request $request): void
    {
        $uid = $_SESSION['uid'] ?? null;
        $me = $uid ? $this->get(UserRepository::class)->find((string)$uid) : null;
        if ($me && !User::isStaff($me)) {
            $me = null;
            unset($_SESSION['uid']);
        }
        $request->context = new Context($me ? (string)$uid : null, $me, $request->guest);
    }

    private function dispatch(Request $r): void
    {
        $route = self::ROUTES[$r->op] ?? null;
        if (!$route) throw new HttpException('Perintah tidak dikenal.', 404);
        [$class, $method] = $route;
        $this->get($class)->$method($r);
    }

    public function get(string $class): object
    {
        if (isset($this->services[$class])) return $this->services[$class];
        $pdo = fn() => Database::connection();
        $obj = match ($class) {
            MetaRepository::class     => new MetaRepository($pdo()),
            MirrorService::class      => new MirrorService($pdo(), date_default_timezone_get()),
            DocumentRepository::class => new DocumentRepository($pdo(), $this->get(MetaRepository::class), $this->get(MirrorService::class)),
            UserRepository::class     => new UserRepository($this->get(DocumentRepository::class)),
            SettingsRepository::class => new SettingsRepository($this->get(DocumentRepository::class)),
            AuthService::class        => new AuthService($this->get(UserRepository::class), $this->get(SettingsRepository::class), new RateLimiter(), new RegisterValidator()),
            DumpService::class        => new DumpService($this->get(DocumentRepository::class), $this->get(MetaRepository::class)),
            WriteService::class       => new WriteService($this->get(DocumentRepository::class), $this->get(MetaRepository::class), new WriteValidator(), new OrderValidator()),
            SystemController::class   => new SystemController($this->get(MetaRepository::class)),
            AuthController::class     => new AuthController($this->get(AuthService::class)),
            DataController::class     => new DataController($this->get(DumpService::class), $this->get(WriteService::class)),
        };
        return $this->services[$class] = $obj;
    }
}
