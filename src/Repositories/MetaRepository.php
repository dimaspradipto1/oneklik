<?php
declare(strict_types=1);

namespace App\Repositories;

/** The data revision number. Browsers poll it every few seconds and reload data when it changes. */
final class MetaRepository
{
    public function __construct(private \PDO $pdo) {}

    public function rev(): int
    {
        return (int)$this->pdo->query("SELECT v FROM meta WHERE k = 'rev'")->fetchColumn();
    }

    public function bump(): void
    {
        $this->pdo->exec("UPDATE meta SET v = v + 1 WHERE k = 'rev'");
    }
}
