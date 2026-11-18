<?php
declare(strict_types=1);

namespace App\Repositories;

use App\Models\User;

final class UserRepository
{
    public const COL = 'users';

    public function __construct(private DocumentRepository $docs) {}

    /** @return array<string, object> id => user */
    public function all(): array
    {
        return $this->docs->collection(self::COL);
    }

    public function find(string $id): ?object
    {
        return $this->docs->find(self::COL, $id);
    }

    public function save(string $id, object $user): void
    {
        $this->docs->save(self::COL, $id, $user);
    }

    /** @return array{0: string, 1: object}|null [id, user] */
    public function findByLogin(string $login): ?array
    {
        foreach ($this->all() as $id => $u) if (is_object($u) && User::matchesLogin($u, $login)) return [(string)$id, $u];
        return null;
    }

    /** Is this username / NIM / email / phone already used by an account? */
    public function loginTaken(string $login, ?array $users = null): bool
    {
        foreach ($users ?? $this->all() as $u) if (is_object($u) && User::matchesLogin($u, $login)) return true;
        return false;
    }

    public function hasAdmin(?array $users = null): bool
    {
        foreach ($users ?? $this->all() as $u) if (is_object($u) && ($u->role ?? '') === User::ADMIN) return true;
        return false;
    }
}
