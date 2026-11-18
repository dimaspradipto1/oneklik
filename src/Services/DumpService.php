<?php
declare(strict_types=1);

namespace App\Services;

use App\Helpers\Json;
use App\Models\Context;
use App\Models\Tenant;
use App\Models\User;
use App\Repositories\DocumentRepository;
use App\Repositories\MetaRepository;

/**
 * Builds the data download each browser loads (and reloads when the revision changes),
 * filtered by who is asking. Raw JSON is passed through untouched so empty objects stay objects.
 */
final class DumpService
{
    public function __construct(private DocumentRepository $docs, private MetaRepository $meta) {}

    public function build(Context $c): string
    {
        $by = [];
        $hasUsers = false;
        foreach ($this->docs->allRows() as $r) {
            if ($r['col'] === 'users') $hasUsers = true;
            $split = Tenant::split($r['col']);
            if (!$split) continue;
            $data = $this->visible($c, $r['col'], (string)$r['id'], $split[0], $split[1], $r['data']);
            if ($data === null) continue;
            $by[$r['col']][] = Json::encode((string)$r['id']) . ':' . $data;
        }
        $cols = [];
        foreach ($by as $col => $items) $cols[] = Json::encode($col) . ':{' . implode(',', $items) . '}';
        return '{"rev":' . $this->meta->rev() . ',"hasUsers":' . ($hasUsers ? 'true' : 'false')
            . ',"me":' . json_encode($c->staff() ? $c->uid : null) . ',"docs":{' . implode(',', $cols) . '}}';
    }

    /** The document as this caller may see it, or null when it is hidden from them. */
    private function visible(Context $c, string $col, string $id, string $kid, string $base, string $data): ?string
    {
        if (!$c->staff()) {
            // Customers: every kantin's menu and public settings, plus their own orders.
            if ($base === 'orders') { $d = json_decode($data); return ($c->guest !== '' && ($d->guest ?? '') === $c->guest) ? $data : null; }
            if ($base === 'settings') return Json::pick($data, Tenant::GUEST_SETTINGS);
            return $base === 'products' ? $data : null;
        }
        if ($c->mustChangePassword()) {
            // Temporary password: only the own account and the shared list until it is replaced.
            if ($base === 'users') return $id === $c->uid ? Json::without($data, User::SECRET_FIELDS) : null;
            return ($col === 'settings' && $id === Tenant::MAIN) ? Json::pick($data, Tenant::GLOBAL_FIELDS) : null;
        }
        if ($c->admin()) {
            // Password verifiers are never sent to any browser.
            return $base === 'users' ? Json::without($data, User::SECRET_FIELDS) : $data;
        }
        // Owners: their own kantin, their own account, and the shared tables/kantin list.
        if ($base === 'users') return $id === $c->uid ? Json::without($data, User::SECRET_FIELDS) : null;
        if ($kid !== $c->kantin()) return ($col === 'settings' && $id === Tenant::MAIN) ? Json::pick($data, Tenant::GLOBAL_FIELDS) : null;
        return $data;
    }
}
