<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Helpers\Request;
use App\Helpers\Response;
use App\Services\AuthService;

final class AuthController
{
    public function __construct(private AuthService $auth) {}

    /** POST ?op=login {id, pw} */
    public function login(Request $r): void
    {
        $id = $this->auth->login((string)$r->input('id', ''), (string)$r->input('pw', ''));
        Response::json(['ok' => true, 'id' => $id]);
    }

    /** POST ?op=logout */
    public function logout(Request $r): void
    {
        $this->auth->logout();
        Response::json(['ok' => true]);
    }

    /** POST ?op=register {data: {name, bizName, username, contact, password}} */
    public function register(Request $r): void
    {
        $id = $this->auth->register($r->input('data'));
        Response::json(['ok' => true, 'id' => $id]);
    }

    /** POST ?op=reset_password {username, password} */
    public function resetPassword(Request $r): void
    {
        $this->auth->resetPassword((string)$r->input('username', ''), (string)$r->input('password', ''));
        Response::json(['ok' => true]);
    }
}
