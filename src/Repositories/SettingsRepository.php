<?php
declare(strict_types=1);

namespace App\Repositories;

use App\Models\Tenant;

/** settings/main holds the first kantin's settings plus the shared kantin list, tables and QR address. */
final class SettingsRepository
{
    public function __construct(private DocumentRepository $docs) {}

    public function main(): object
    {
        return $this->docs->find('settings', Tenant::MAIN) ?? new \stdClass();
    }

    /** @return object[] */
    public function kantins(): array
    {
        $list = $this->main()->kantins ?? [];
        return is_array($list) ? array_values(array_filter($list, 'is_object')) : [];
    }

    public function addKantin(string $id, string $name): void
    {
        $set = $this->main();
        $list = is_array($set->kantins ?? null) ? $set->kantins : [];
        $list[] = (object)['id' => $id, 'name' => $name, 'active' => true];
        $set->kantins = $list;
        $this->docs->save('settings', Tenant::MAIN, $set);
    }
}
