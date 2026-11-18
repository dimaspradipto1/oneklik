<?php
declare(strict_types=1);

namespace App\Services;

use App\Helpers\HttpException;
use App\Helpers\Password;
use App\Helpers\Str;
use App\Models\Tenant;
use App\Models\User;
use App\Repositories\SettingsRepository;
use App\Repositories\UserRepository;
use App\Validators\RegisterValidator;

final class AuthService
{
    public function __construct(
        private UserRepository $users,
        private SettingsRepository $settings,
        private RateLimiter $limiter,
        private RegisterValidator $registerValidator,
    ) {}

    /** Staff login with username / NIM / email + password. Returns the user id. */
    public function login(string $login, string $password): string
    {
        $this->limiter->checkLogin();
        $found = $this->users->findByLogin($login);
        if (!$found || !Password::verify($password, $found[1])) {
            $this->limiter->loginFailed((int)app_config('limits.login_max_fails', 5), (int)app_config('limits.login_lock_seconds', 30));
            throw new HttpException('Username/NIM/email atau password salah.', 401);
        }
        [$id, $u] = $found;
        if (!empty($u->pending)) throw new HttpException('Pendaftaran Anda masih menunggu persetujuan super admin. Coba masuk lagi setelah disetujui.', 403);
        if (!User::isStaff($u)) throw new HttpException('Akun ini dinonaktifkan oleh super admin. Hubungi pengelola Oneklik Biz.', 403);
        if (Password::needsRehash((string)($u->hash ?? ''))) {
            $u->hash = Password::hash($password);
            unset($u->salt);
        }
        $this->startSession($id);
        $this->limiter->loginSucceeded();
        $u->lastLogin = Str::nowMs();
        $this->users->save($id, $u);
        return $id;
    }

    public function logout(): void
    {
        $_SESSION = [];
        session_destroy();
    }

    /**
     * A business owner signs up: the account and its kantin are active right away and the owner is logged in.
     * The super admin can deactivate the account later (Master Data → Pengguna).
     */
    public function register($data): string
    {
        $limits = app_config('limits');
        $this->limiter->attempt('register', (int)$limits['register_per_session'], 3600, 'Terlalu banyak pendaftaran dari perangkat ini. Coba lagi nanti.');
        $v = $this->registerValidator->validate($data);

        $all = $this->users->all();
        $recent = 0;
        $hourAgo = Str::nowMs() - 3600000;
        foreach ($all as $u) if (is_object($u) && ($u->role ?? '') === User::OWNER && (int)($u->createdAt ?? 0) > $hourAgo) $recent++;
        if ($recent >= (int)$limits['register_per_hour']) throw new HttpException('Pendaftaran sedang ramai. Coba lagi dalam satu jam.', 429);
        if (
            $this->users->loginTaken($v['username'], $all)
            || ($v['email'] !== '' && $this->users->loginTaken($v['email'], $all))
            || ($v['phone'] !== '' && $this->users->loginTaken($v['phone'], $all))
        ) {
            throw new HttpException('Username, email, atau nomor HP sudah terdaftar.', 409);
        }

        $biz = Str::lower($v['bizName']);
        $usedIds = [Tenant::MAIN];
        foreach ($this->settings->kantins() as $k) {
            $usedIds[] = (string)($k->id ?? '');
            if (Str::lower((string)($k->name ?? '')) === $biz) throw new HttpException('Nama usaha ini sudah dipakai kantin lain. Pakai nama yang berbeda.', 409);
        }
        foreach ($all as $u) if (is_object($u)) $usedIds[] = (string)($u->kid ?? '');
        do { $kid = Str::random(6); } while (in_array($kid, $usedIds, true));

        $id = 'u' . Str::random(13);
        $now = Str::nowMs();
        // The new kantin joins the shared kantin list so customers can pick it.
        $this->settings->addKantin($kid, $v['bizName']);
        $this->users->save($id, (object)[
            'name' => $v['name'], 'username' => $v['username'], 'email' => $v['email'], 'phone' => $v['phone'], 'contact' => $v['contact'],
            'role' => User::OWNER, 'kid' => $kid,
            'bizName' => $v['bizName'], 'active' => true, 'hash' => Password::hash($v['password']),
            'createdAt' => $now, 'lastLogin' => $now, 'selfRegistered' => true,
        ]);
        $this->limiter->hit('register');
        $this->startSession($id);
        return $id;
    }

    private function startSession(string $id): void
    {
        session_regenerate_id(true);
        $_SESSION['uid'] = $id;
    }
}
