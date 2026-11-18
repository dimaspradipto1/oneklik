<?php
declare(strict_types=1);

namespace App\Repositories;

use App\Helpers\Json;
use App\Helpers\Str;
use App\Services\MirrorService;

/** All app data lives in one table `docs` as JSON documents, addressed by collection + id. */
final class DocumentRepository
{
    public function __construct(private \PDO $pdo, private MetaRepository $meta, private ?MirrorService $mirror = null) {}

    public function find(string $col, string $id): ?object
    {
        $s = $this->pdo->prepare('SELECT data FROM docs WHERE col = ? AND id = ?');
        $s->execute([$col, $id]);
        $raw = $s->fetchColumn();
        if ($raw === false) return null;
        $d = json_decode($raw);
        return is_object($d) ? $d : null;
    }

    public function save(string $col, string $id, object $data): void
    {
        $s = $this->pdo->prepare('REPLACE INTO docs (col, id, data, updated_at) VALUES (?, ?, ?, ?)');
        $s->execute([$col, $id, Json::encode($data), Str::nowMs()]);
        $this->meta->bump();
        $this->mirror?->sync($col, $id, $data); // keep the readable tables (products, sales, …) up to date
    }

    public function delete(string $col, string $id): void
    {
        $s = $this->pdo->prepare('DELETE FROM docs WHERE col = ? AND id = ?');
        $s->execute([$col, $id]);
        $this->meta->bump();
        $this->mirror?->sync($col, $id, null);
    }

    /** Every document as raw rows (col, id, data), for the full data download. */
    public function allRows(): array
    {
        return $this->pdo->query('SELECT col, id, data FROM docs')->fetchAll();
    }

    /** id => decoded document of one collection. */
    public function collection(string $col): array
    {
        $s = $this->pdo->prepare('SELECT id, data FROM docs WHERE col = ?');
        $s->execute([$col]);
        $out = [];
        foreach ($s->fetchAll() as $r) $out[$r['id']] = json_decode($r['data']);
        return $out;
    }
}
