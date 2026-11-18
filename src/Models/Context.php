<?php
declare(strict_types=1);

namespace App\Models;

/** Who is calling the API, worked out once per request by the Authenticate middleware. */
final class Context
{
    public function __construct(
        public readonly ?string $uid,
        public readonly ?object $me,
        public readonly string $guest,
    ) {}

    public function staff(): bool { return $this->me !== null; }
    public function admin(): bool { return $this->staff() && $this->me->role === User::ADMIN; }
    /** The kantin an owner manages ('' for customers). */
    public function kantin(): string { return $this->staff() ? User::kantinId($this->me) : ''; }
    /** A temporary password (set by the admin or the server config) must be replaced first. */
    public function mustChangePassword(): bool { return $this->staff() && !empty($this->me->mustChange); }
}
