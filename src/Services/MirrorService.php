<?php
declare(strict_types=1);

namespace App\Services;

/**
 * Relational "mirror" of the app data.
 *
 * The app itself reads and writes JSON documents in the `docs` table (that is what keeps every phone in sync).
 * This class copies every document into ordinary tables (kantins, users, products, sales, sale_items, orders, …)
 * so the data can be read, filtered and reported on in phpMyAdmin or by other systems.
 *
 *  - The mirror tables are READ-ONLY copies: the app never reads them, and editing them changes nothing in the app.
 *  - After each saved/deleted document, apply() refreshes the rows that came from it.
 *  - rebuild() empties the mirror tables and fills them again from `docs` (safe to run any time).
 *
 * Used by both the new backend (oneklik/) and the old kantin-api.php, so it only depends on PDO.
 */
final class MirrorService
{
    /** Raise when the table layout changes: ensure() then recreates and refills the mirror. */
    public const VERSION = 4;

    private const TENANT_COLS = ['products', 'settings', 'days', 'kas', 'stock', 'items', 'itemMoves', 'suppliers', 'evals', 'orders', 'hpp'];

    /** Child tables first, so DROP works with the foreign keys. */
    public const TABLES = ['sale_items', 'sales', 'order_items', 'orders', 'hpp_menus', 'supplier_evaluations', 'suppliers',
        'item_movements', 'items', 'stock_movements', 'cash_entries', 'products', 'payment_methods', 'categories',
        'dining_tables', 'users', 'kantins'];

    private \DateTimeZone $tz;

    public function __construct(private \PDO $pdo, string $timezone = 'Asia/Jakarta')
    {
        $this->tz = new \DateTimeZone($timezone);
    }

    /* ------------------------------------------------------------------ setup */

    /** Creates/refreshes the mirror tables when they are missing or outdated. One SELECT when up to date. */
    public function ensure(): void
    {
        $this->pdo->exec('CREATE TABLE IF NOT EXISTS meta (k VARCHAR(20) PRIMARY KEY, v BIGINT NOT NULL) ENGINE=InnoDB');
        $v = $this->pdo->query("SELECT v FROM meta WHERE k = 'mirror'")->fetchColumn();
        if ($v !== false && (int)$v >= self::VERSION) return;
        $this->install();
        $this->rebuild();
        $this->pdo->prepare("REPLACE INTO meta (k, v) VALUES ('mirror', ?)")->execute([self::VERSION]);
    }

    /** Drops and creates every mirror table. */
    public function install(): void
    {
        $this->pdo->exec('SET FOREIGN_KEY_CHECKS = 0');
        foreach (self::TABLES as $t) $this->pdo->exec("DROP TABLE IF EXISTS `$t`");
        $this->pdo->exec('SET FOREIGN_KEY_CHECKS = 1');
        foreach (self::schema() as $sql) $this->pdo->exec($sql);
    }

    /** Empties the mirror tables and fills them again from every document in `docs`. */
    public function rebuild(): int
    {
        $this->pdo->exec('SET FOREIGN_KEY_CHECKS = 0');
        foreach (self::TABLES as $t) $this->pdo->exec("DELETE FROM `$t`");
        $this->pdo->exec('SET FOREIGN_KEY_CHECKS = 1');
        // Global settings first, so the kantin list exists before each kantin's own settings.
        $rows = $this->pdo->query("SELECT col, id, data FROM docs ORDER BY (col = 'settings' AND id = 'main') DESC, col, id")->fetchAll(\PDO::FETCH_ASSOC);
        $n = 0;
        foreach ($rows as $r) {
            $d = json_decode($r['data']);
            if (!is_object($d)) continue;
            $this->apply($r['col'], $r['id'], $d);
            $n++;
        }
        return $n;
    }

    /* ------------------------------------------------------------------ sync */

    /**
     * Refreshes the rows that come from one document. $data null = the document was deleted.
     * Never throws: a mirror problem must not stop the app from saving.
     */
    public function sync(string $col, string $id, $data): void
    {
        try {
            $this->apply($col, $id, is_object($data) ? $data : null);
        } catch (\Throwable $e) {
            error_log('Oneklik mirror (' . $col . '/' . $id . '): ' . $e->getMessage());
        }
    }

    public function apply(string $col, string $id, ?object $d): void
    {
        $split = self::split($col);
        if (!$split) return;
        [$kid, $base] = $split;
        $this->pdo->beginTransaction();
        try {
            match ($base) {
                'users' => $this->user($id, $d),
                'settings' => $id === 'main' ? $this->settings($kid, $d) : null,
                'products' => $this->product($kid, $id, $d),
                'days' => $this->day($kid, $id, $d),
                'orders' => $this->order($kid, $id, $d),
                'kas' => $this->kas($kid, $id, $d),
                'stock' => $this->stock($kid, $id, $d),
                'items' => $this->item($kid, $id, $d),
                'itemMoves' => $this->itemMove($kid, $id, $d),
                'suppliers' => $this->supplier($kid, $id, $d),
                'evals' => $this->evaluation($kid, $id, $d),
                'hpp' => $id === 'main' ? $this->hpp($kid, $d) : null,
                default => null,
            };
            $this->pdo->commit();
        } catch (\Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    /** "k.ab12.orders" → ['ab12', 'orders'], "orders" → ['main', 'orders'], "users" → ['', 'users']. */
    public static function split(string $col): ?array
    {
        if ($col === 'users') return ['', 'users'];
        if (preg_match('/^(?:k\.([a-z0-9]{2,20})\.)?([A-Za-z]+)$/', $col, $m) && in_array($m[2], self::TENANT_COLS, true)) {
            return [$m[1] !== '' ? $m[1] : 'main', $m[2]];
        }
        return null;
    }

    /* ------------------------------------------------------------------ per collection */

    private function user(string $id, ?object $u): void
    {
        $this->del('users', ['id' => $id]);
        if (!$u) return;
        $role = self::s($u, 'role');
        $contact = self::s($u, 'contact');
        $email = strtolower(self::s($u, 'email'));
        $phone = self::s($u, 'phone');
        if ($email === '' && $contact !== '' && str_contains($contact, '@')) {
            $email = strtolower($contact);
        } elseif ($phone === '' && $contact !== '' && !str_contains($contact, '@')) {
            $phone = $contact;
        }
        $this->ins('users', [
            'id'                   => $id,
            'kantin_id'            => $role === 'pemilik' ? (self::s($u, 'kid') ?: 'main') : (self::s($u, 'kid') ?: null),
            'name'                 => self::s($u, 'name'),
            'username'             => self::s($u, 'username') ?: $id,
            'email'                => $email !== '' ? $email : null,
            'phone'                => $phone !== '' ? $phone : null,
            'password_hash'        => self::s($u, 'hash'),
            'role'                 => $role ?: 'pemilik',
            'business_name'        => self::s($u, 'bizName') ?: null,
            'is_active'            => self::b($u, 'active', true),
            'is_pending'           => self::b($u, 'pending'),
            'must_change_password' => self::b($u, 'mustChange'),
            'created_at'           => $this->dt($u->createdAt ?? null),
            'last_login_at'        => $this->dt($u->lastLogin ?? null),
        ]);
    }

    private function settings(string $kid, ?object $s): void
    {
        if ($kid === 'main') {
            // Global part: the kantin list and the table QR codes.
            $list = $s && is_array($s->kantins ?? null) ? $s->kantins : [];
            $ids = [];
            foreach ($list as $k) {
                if (!is_object($k) || self::s($k, 'id') === '') continue;
                $ids[] = $k->id;
                $this->upsert('kantins', ['id' => $k->id], [
                    'name' => self::s($k, 'name'), 'description' => self::s($k, 'desc') ?: null, 'is_active' => self::b($k, 'active', true),
                ]);
            }
            if (!$ids) $this->upsert('kantins', ['id' => 'main'], ['name' => $s ? (self::s($s, 'shopName') ?: 'Kantin utama') : 'Kantin utama', 'is_active' => 1]);
            else {
                $in = implode(',', array_fill(0, count($ids), '?'));
                $this->pdo->prepare("DELETE FROM kantins WHERE id NOT IN ($in) AND id <> 'main'")->execute($ids);
            }
            $this->pdo->exec('DELETE FROM dining_tables');
            foreach ($s && is_array($s->tables ?? null) ? $s->tables : [] as $i => $t) {
                if (!is_object($t) || self::s($t, 'id') === '') continue;
                $this->ins('dining_tables', ['id' => $t->id, 'kantin_id' => self::s($t, 'kid') ?: null, 'name' => self::s($t, 'name'), 'sort_order' => $i]);
            }
            $this->pdo->prepare("UPDATE kantins SET qr_base_url = ? WHERE id = 'main'")->execute([$s ? (self::s($s, 'qrBase') ?: null) : null]);
        }
        // This kantin's own settings.
        $this->upsert('kantins', ['id' => $kid], [
            'shop_name' => $s ? (self::s($s, 'shopName') ?: null) : null,
            'owner_name' => $s ? (self::s($s, 'ownerName') ?: null) : null,
            'opening_date' => $s ? (self::date(self::s($s, 'openingDate'))) : null,
            'opening_cash' => $s ? self::n($s, 'openingCash') : 0,
            'opening_inventory' => $s ? self::n($s, 'openingInventory') : 0,
            'equipment_value' => $s ? self::n($s, 'equipment') : 0,
        ]);
        $this->del('categories', ['kantin_id' => $kid]);
        foreach ($s && is_array($s->categories ?? null) ? $s->categories : [] as $i => $c) {
            if (is_string($c) && $c !== '') $this->ins('categories', ['kantin_id' => $kid, 'name' => mb_substr($c, 0, 60), 'sort_order' => $i], true);
        }
        $this->del('payment_methods', ['kantin_id' => $kid]);
        foreach ($s && is_object($s->pay ?? null) ? get_object_vars($s->pay) : [] as $code => $p) {
            if (!is_object($p)) continue;
            $this->ins('payment_methods', ['kantin_id' => $kid, 'code' => mb_substr((string)$code, 0, 30), 'is_enabled' => self::b($p, 'enabled'),
                'account_name' => self::s($p, 'name') ?: null, 'account_number' => self::s($p, 'number') ?: null, 'has_qr_image' => self::s($p, 'img') !== '' ? 1 : 0]);
        }
    }

    private function product(string $kid, string $id, ?object $p): void
    {
        $this->del('products', ['kantin_id' => $kid, 'id' => $id]);
        if (!$p) return;
        $this->ins('products', [
            'kantin_id' => $kid, 'id' => $id, 'name' => self::s($p, 'name'), 'description' => self::s($p, 'desc') ?: null,
            'category' => self::s($p, 'cat') ?: null, 'unit' => self::s($p, 'unit') ?: null,
            'price' => self::n($p, 'price'), 'cost' => self::n($p, 'cost'), 'cost_source' => self::s($p, 'costSource') ?: 'manual',
            'hpp_menu_id' => self::s($p, 'hppMenu') ?: null, 'is_active' => self::b($p, 'active', true), 'track_stock' => self::b($p, 'trackStock'),
            'track_from' => $this->dt($p->trackFrom ?? null), 'min_stock' => self::n($p, 'minStock'), 'sort_order' => (int)self::n($p, 'order'),
            'has_photo' => self::s($p, 'photo') !== '' ? 1 : 0,
        ]);
    }

    /** One `days` document = all cashier transactions of one date. */
    private function day(string $kid, string $date, ?object $d): void
    {
        $this->del('sales', ['kantin_id' => $kid, 'sale_date' => $date]); // sale_items go with them (ON DELETE CASCADE)
        if (!$d || !is_object($d->tx ?? null)) return;
        foreach (get_object_vars($d->tx) as $tid => $t) {
            if (!is_object($t)) continue;
            $disc = is_object($t->discount ?? null) ? $t->discount : null;
            $validated = is_object($t->validated ?? null) ? $t->validated : null;
            $this->ins('sales', [
                'kantin_id' => $kid, 'id' => (string)$tid, 'sale_date' => self::date($date), 'receipt_no' => (int)self::n($t, 'no'),
                'sold_at' => $this->dt($t->at ?? null), 'customer' => self::s($t, 'customer') ?: null,
                'order_type' => self::s($t, 'orderType') === 'take' ? 'bungkus' : 'makan_di_tempat',
                'payment_method' => self::s($t, 'method') ?: null, 'wallet' => self::s($t, 'wallet') ?: null,
                'subtotal' => self::n($t, 'subtotal') ?: self::n($t, 'total'),
                'discount_type' => $disc ? (self::s($disc, 'type') ?: null) : null, 'discount_value' => $disc ? self::n($disc, 'value') : 0,
                'discount_amount' => $disc ? self::n($disc, 'amount') : 0, 'total' => self::n($t, 'total'), 'cost_total' => self::n($t, 'cost'),
                'cash_received' => is_numeric($t->paid ?? null) ? (float)$t->paid : null, 'change_given' => is_numeric($t->change ?? null) ? (float)$t->change : null,
                'queue_no' => is_numeric($t->queue ?? null) ? (int)$t->queue : null,
                'table_id' => self::s($t, 'table') ?: null, 'table_name' => self::s($t, 'tableName') ?: null, 'phone' => self::s($t, 'phone') ?: null,
                'user_id' => self::s($t, 'uid') ?: null, 'validated_by' => $validated ? (self::s($validated, 'by') ?: null) : null,
                'delivered_at' => $this->dt($t->deliveredAt ?? null),
                'is_void' => self::b($t, 'void'), 'voided_at' => $this->dt($t->voidAt ?? null),
            ]);
            foreach (is_array($t->items ?? null) ? $t->items : [] as $i => $it) {
                if (!is_object($it)) continue;
                $qty = self::n($it, 'qty');
                $this->ins('sale_items', [
                    'kantin_id' => $kid, 'sale_id' => (string)$tid, 'line_no' => $i + 1, 'product_id' => self::s($it, 'pid') ?: null,
                    'product_name' => self::s($it, 'name'), 'category' => self::s($it, 'cat') ?: null, 'unit' => self::s($it, 'unit') ?: null,
                    'price' => self::n($it, 'price'), 'cost' => self::n($it, 'cost'), 'qty' => $qty,
                    'amount' => round(self::n($it, 'price') * $qty), 'cost_amount' => round(self::n($it, 'cost') * $qty), 'note' => self::s($it, 'note') ?: null,
                ]);
            }
        }
    }

    /** Customer orders from the table QR code (and held cashier orders). */
    private function order(string $kid, string $id, ?object $o): void
    {
        $this->del('orders', ['kantin_id' => $kid, 'id' => $id]);
        if (!$o) return;
        $paid = is_object($o->paid ?? null) ? $o->paid : null;
        $claim = is_object($o->payClaim ?? null) ? $o->payClaim : null;
        $disc = is_object($o->disc ?? null) ? $o->disc : null;
        $this->ins('orders', [
            'kantin_id' => $kid, 'id' => $id, 'ordered_at' => $this->dt($o->at ?? null), 'customer' => self::s($o, 'customer') ?: null,
            'phone' => self::s($o, 'phone') ?: null, 'order_type' => self::s($o, 'type') === 'take' ? 'bungkus' : 'makan_di_tempat',
            'table_id' => self::s($o, 'table') ?: null, 'table_name' => self::s($o, 'tableName') ?: null,
            'payment_method' => self::s($o, 'method') ?: null, 'pay_at' => self::s($o, 'payMethod') ?: null,
            'status' => self::s($o, 'status') ?: 'baru', 'discount_type' => $disc ? (self::s($disc, 'type') ?: null) : null,
            'discount_value' => $disc ? self::n($disc, 'value') : 0, 'queue_no' => is_numeric($o->queue ?? null) ? (int)$o->queue : null,
            'payment_claimed_at' => $claim ? $this->dt($claim->at ?? null) : null, 'payment_rejected_at' => $this->dt($o->payRejected ?? null),
            'paid_at' => $paid ? $this->dt($paid->at ?? null) : null, 'sale_date' => $paid ? self::date(self::s($paid, 'day')) : null,
            'sale_id' => $paid ? (self::s($paid, 'txId') ?: null) : null, 'delivered_at' => $this->dt($o->deliveredAt ?? null),
            'is_cancelled' => self::b($o, 'cancelled') || self::s($o, 'status') === 'batal' ? 1 : 0,
            'guest_id' => self::s($o, 'guest') ?: null, 'user_id' => self::s($o, 'uid') ?: null,
        ]);
        $notes = is_object($o->notes ?? null) ? $o->notes : new \stdClass();
        foreach (is_object($o->cart ?? null) ? get_object_vars($o->cart) : [] as $pid => $qty) {
            if (!is_numeric($qty)) continue;
            $this->ins('order_items', ['kantin_id' => $kid, 'order_id' => $id, 'product_id' => (string)$pid, 'qty' => (float)$qty,
                'note' => is_string($notes->$pid ?? null) && $notes->$pid !== '' ? mb_substr($notes->$pid, 0, 200) : null]);
        }
    }

    private function kas(string $kid, string $id, ?object $k): void
    {
        $this->del('cash_entries', ['kantin_id' => $kid, 'id' => $id]);
        if (!$k) return;
        $this->ins('cash_entries', [
            'kantin_id' => $kid, 'id' => $id, 'entry_date' => self::date(self::s($k, 'date')), 'recorded_at' => $this->dt($k->at ?? null),
            'type' => self::s($k, 'type'), 'category' => self::s($k, 'cat') ?: null, 'amount' => self::n($k, 'amount'),
            'purchase_id' => self::s($k, 'pbId') ?: null, 'note' => self::s($k, 'note') ?: null,
        ]);
    }

    /** Stock in/out/correction of products (ready-to-sell goods). */
    private function stock(string $kid, string $id, ?object $m): void
    {
        $this->del('stock_movements', ['kantin_id' => $kid, 'id' => $id]);
        if (!$m) return;
        $this->ins('stock_movements', [
            'kantin_id' => $kid, 'id' => $id, 'moved_at' => $this->dt($m->at ?? null), 'product_id' => self::s($m, 'pid') ?: null,
            'product_name' => self::s($m, 'pname') ?: null, 'type' => self::s($m, 'type'), 'qty' => self::n($m, 'qty'),
            'price' => self::n($m, 'price'), 'expiry_date' => self::date(self::s($m, 'exp')), 'supplier_id' => self::s($m, 'sid') ?: null,
            'supplier_name' => self::s($m, 'sname') ?: null, 'purchase_id' => self::s($m, 'pbId') ?: null,
            'cash_entry_id' => self::s($m, 'kasId') ?: null, 'note' => self::s($m, 'note') ?: null,
        ]);
    }

    /** Raw materials and bought goods (Pembelian / Stok bahan). */
    private function item(string $kid, string $id, ?object $x): void
    {
        $this->del('items', ['kantin_id' => $kid, 'id' => $id]);
        if (!$x) return;
        $this->ins('items', [
            'kantin_id' => $kid, 'id' => $id, 'name' => self::s($x, 'name'), 'kind' => self::s($x, 'kind') ?: 'bahan',
            'unit' => self::s($x, 'unit') ?: null, 'min_stock' => self::n($x, 'minStock'), 'product_id' => self::s($x, 'pid') ?: null,
            'per_unit' => self::n($x, 'perUnit') ?: 1,
        ]);
    }

    private function itemMove(string $kid, string $id, ?object $m): void
    {
        $this->del('item_movements', ['kantin_id' => $kid, 'id' => $id]);
        if (!$m) return;
        $qty = self::n($m, 'qty');
        $this->ins('item_movements', [
            'kantin_id' => $kid, 'id' => $id, 'moved_at' => $this->dt($m->at ?? null), 'purchase_id' => self::s($m, 'pbId') ?: null,
            'item_id' => self::s($m, 'iid') ?: null, 'item_name' => self::s($m, 'iname') ?: null, 'type' => self::s($m, 'type'),
            'qty' => $qty, 'unit' => self::s($m, 'unit') ?: null, 'price' => self::n($m, 'price'), 'amount' => round(self::n($m, 'price') * $qty),
            'expiry_date' => self::date(self::s($m, 'exp')), 'supplier_id' => self::s($m, 'sid') ?: null, 'supplier_name' => self::s($m, 'sname') ?: null,
            'cash_entry_id' => self::s($m, 'kasId') ?: null, 'stock_movement_id' => self::s($m, 'stockId') ?: null, 'note' => self::s($m, 'note') ?: null,
        ]);
    }

    private function supplier(string $kid, string $id, ?object $x): void
    {
        $this->del('suppliers', ['kantin_id' => $kid, 'id' => $id]);
        if (!$x) return;
        $this->ins('suppliers', [
            'kantin_id' => $kid, 'id' => $id, 'name' => self::s($x, 'name'), 'phone' => self::s($x, 'phone') ?: null,
            'goods' => self::s($x, 'items') ?: null, 'address' => self::s($x, 'address') ?: null, 'note' => self::s($x, 'note') ?: null,
        ]);
    }

    private function evaluation(string $kid, string $id, ?object $x): void
    {
        $this->del('supplier_evaluations', ['kantin_id' => $kid, 'id' => $id]);
        if (!$x) return;
        $scores = [];
        foreach (get_object_vars($x) as $k => $v) if (!in_array($k, ['sid', 'at', 'note', 'id'], true) && is_numeric($v)) $scores[$k] = (float)$v;
        $this->ins('supplier_evaluations', [
            'kantin_id' => $kid, 'id' => $id, 'supplier_id' => self::s($x, 'sid') ?: null, 'evaluated_at' => $this->dt($x->at ?? null),
            'average_score' => $scores ? round(array_sum($scores) / count($scores), 2) : null,
            'scores' => json_encode($scores, JSON_UNESCAPED_UNICODE), 'note' => self::s($x, 'note') ?: null,
        ]);
    }

    /** Kalkulator HPP: one row per menu (recipe details stay in JSON). */
    private function hpp(string $kid, ?object $h): void
    {
        $this->del('hpp_menus', ['kantin_id' => $kid]);
        foreach ($h && is_array($h->menus ?? null) ? $h->menus : [] as $i => $m) {
            if (!is_object($m) || self::s($m, 'id') === '') continue;
            $this->ins('hpp_menus', [
                'kantin_id' => $kid, 'id' => $m->id, 'name' => self::s($m, 'name'), 'menu_type' => self::s($m, 'type') ?: null,
                'selling_price' => self::n($m, 'price'), 'product_id' => self::s($m, 'pid') ?: null, 'sort_order' => $i,
                'recipe' => json_encode($m->items ?? [], JSON_UNESCAPED_UNICODE),
            ]);
        }
    }

    /* ------------------------------------------------------------------ helpers */

    private function del(string $table, array $where): void
    {
        $w = implode(' AND ', array_map(fn($k) => "`$k` = ?", array_keys($where)));
        $this->pdo->prepare("DELETE FROM `$table` WHERE $w")->execute(array_values($where));
    }

    private function ins(string $table, array $row, bool $ignore = false): void
    {
        $cols = implode(',', array_map(fn($k) => "`$k`", array_keys($row)));
        $q = implode(',', array_fill(0, count($row), '?'));
        $this->pdo->prepare(($ignore ? 'INSERT IGNORE' : 'INSERT') . " INTO `$table` ($cols) VALUES ($q)")->execute(array_values($row));
    }

    private function upsert(string $table, array $key, array $row): void
    {
        $all = $key + $row;
        $cols = implode(',', array_map(fn($k) => "`$k`", array_keys($all)));
        $q = implode(',', array_fill(0, count($all), '?'));
        $set = implode(',', array_map(fn($k) => "`$k` = VALUES(`$k`)", array_keys($row)));
        $this->pdo->prepare("INSERT INTO `$table` ($cols) VALUES ($q) ON DUPLICATE KEY UPDATE $set")->execute(array_values($all));
    }

    /** Milliseconds since 1970 → 'Y-m-d H:i:s' in the app's time zone. */
    private function dt($ms): ?string
    {
        if (!is_numeric($ms) || $ms <= 0) return null;
        return (new \DateTimeImmutable('@' . intdiv((int)$ms, 1000)))->setTimezone($this->tz)->format('Y-m-d H:i:s');
    }

    private static function date(string $v): ?string
    {
        return preg_match('/^\d{4}-\d{2}-\d{2}$/', $v) ? $v : null;
    }

    private static function s(object $o, string $k): string
    {
        $v = $o->$k ?? '';
        return is_scalar($v) ? trim((string)$v) : '';
    }

    private static function n(object $o, string $k): float
    {
        $v = $o->$k ?? 0;
        return is_numeric($v) ? (float)$v : 0.0;
    }

    private static function b(object $o, string $k, bool $default = false): int
    {
        return (property_exists($o, $k) ? !empty($o->$k) : $default) ? 1 : 0;
    }

    /* ------------------------------------------------------------------ tables */

    /** @return string[] CREATE TABLE statements, parents before children. */
    public static function schema(): array
    {
        $e = ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci';
        $k = "kantin_id VARCHAR(20) NOT NULL COMMENT 'kantins.id'";
        return [
            "CREATE TABLE kantins (
                id VARCHAR(20) NOT NULL, name VARCHAR(120) NULL, description VARCHAR(255) NULL, is_active TINYINT(1) NOT NULL DEFAULT 1,
                shop_name VARCHAR(120) NULL, owner_name VARCHAR(120) NULL, opening_date DATE NULL,
                opening_cash DECIMAL(15,2) NOT NULL DEFAULT 0, opening_inventory DECIMAL(15,2) NOT NULL DEFAULT 0, equipment_value DECIMAL(15,2) NOT NULL DEFAULT 0,
                qr_base_url VARCHAR(255) NULL,
                PRIMARY KEY (id)
            )$e COMMENT='Kantin / usaha (salinan otomatis dari docs)'",
            "CREATE TABLE users (
                id VARCHAR(40) NOT NULL, kantin_id VARCHAR(20) NULL COMMENT 'kantins.id (kosong = super admin)', name VARCHAR(100) NOT NULL,
                username VARCHAR(50) NOT NULL, email VARCHAR(120) NULL, phone VARCHAR(30) NULL, password_hash VARCHAR(255) NOT NULL DEFAULT '',
                role VARCHAR(20) NOT NULL DEFAULT 'pemilik', business_name VARCHAR(120) NULL,
                is_active TINYINT(1) NOT NULL DEFAULT 1, is_pending TINYINT(1) NOT NULL DEFAULT 0, must_change_password TINYINT(1) NOT NULL DEFAULT 0,
                created_at DATETIME NULL, last_login_at DATETIME NULL,
                PRIMARY KEY (id), UNIQUE KEY uq_users_username (username), UNIQUE KEY uq_users_email (email), KEY idx_users_kantin (kantin_id)
            )$e COMMENT='Pengguna (Super Admin & Pemilik Usaha)'",
            "CREATE TABLE dining_tables (
                id VARCHAR(40) NOT NULL, kantin_id VARCHAR(20) NULL, name VARCHAR(80) NOT NULL, sort_order INT NOT NULL DEFAULT 0,
                PRIMARY KEY (id)
            )$e COMMENT='Meja & QR code'",
            "CREATE TABLE categories (
                $k, name VARCHAR(60) NOT NULL, sort_order INT NOT NULL DEFAULT 0,
                PRIMARY KEY (kantin_id, name)
            )$e COMMENT='Kategori produk'",
            "CREATE TABLE payment_methods (
                $k, code VARCHAR(30) NOT NULL, is_enabled TINYINT(1) NOT NULL DEFAULT 0, account_name VARCHAR(120) NULL,
                account_number VARCHAR(60) NULL, has_qr_image TINYINT(1) NOT NULL DEFAULT 0,
                PRIMARY KEY (kantin_id, code)
            )$e COMMENT='Metode bayar non-tunai (e-wallet, transfer)'",
            "CREATE TABLE products (
                $k, id VARCHAR(40) NOT NULL, name VARCHAR(120) NOT NULL, description VARCHAR(255) NULL, category VARCHAR(60) NULL, unit VARCHAR(30) NULL,
                price DECIMAL(15,2) NOT NULL DEFAULT 0, cost DECIMAL(15,2) NOT NULL DEFAULT 0, cost_source VARCHAR(10) NOT NULL DEFAULT 'manual',
                hpp_menu_id VARCHAR(40) NULL, is_active TINYINT(1) NOT NULL DEFAULT 1, track_stock TINYINT(1) NOT NULL DEFAULT 0, track_from DATETIME NULL,
                min_stock DECIMAL(12,3) NOT NULL DEFAULT 0, sort_order INT NOT NULL DEFAULT 0, has_photo TINYINT(1) NOT NULL DEFAULT 0,
                PRIMARY KEY (kantin_id, id), KEY idx_products_category (kantin_id, category)
            )$e COMMENT='Produk / menu'",
            "CREATE TABLE sales (
                $k, id VARCHAR(40) NOT NULL, sale_date DATE NOT NULL, receipt_no INT NOT NULL DEFAULT 0, sold_at DATETIME NULL,
                customer VARCHAR(120) NULL, order_type VARCHAR(20) NOT NULL, payment_method VARCHAR(20) NULL, wallet VARCHAR(30) NULL,
                subtotal DECIMAL(15,2) NOT NULL DEFAULT 0, discount_type VARCHAR(10) NULL, discount_value DECIMAL(15,2) NOT NULL DEFAULT 0,
                discount_amount DECIMAL(15,2) NOT NULL DEFAULT 0, total DECIMAL(15,2) NOT NULL DEFAULT 0, cost_total DECIMAL(15,2) NOT NULL DEFAULT 0,
                cash_received DECIMAL(15,2) NULL, change_given DECIMAL(15,2) NULL, queue_no INT NULL,
                table_id VARCHAR(40) NULL, table_name VARCHAR(80) NULL, phone VARCHAR(30) NULL, user_id VARCHAR(40) NULL,
                validated_by VARCHAR(120) NULL, delivered_at DATETIME NULL, is_void TINYINT(1) NOT NULL DEFAULT 0, voided_at DATETIME NULL,
                PRIMARY KEY (kantin_id, id), KEY idx_sales_date (kantin_id, sale_date), KEY idx_sales_method (payment_method)
            )$e COMMENT='Transaksi kasir (penjualan)'",
            "CREATE TABLE sale_items (
                $k, sale_id VARCHAR(40) NOT NULL, line_no INT NOT NULL, product_id VARCHAR(40) NULL, product_name VARCHAR(120) NOT NULL,
                category VARCHAR(60) NULL, unit VARCHAR(30) NULL, price DECIMAL(15,2) NOT NULL DEFAULT 0, cost DECIMAL(15,2) NOT NULL DEFAULT 0,
                qty DECIMAL(12,3) NOT NULL DEFAULT 0, amount DECIMAL(15,2) NOT NULL DEFAULT 0, cost_amount DECIMAL(15,2) NOT NULL DEFAULT 0, note VARCHAR(200) NULL,
                PRIMARY KEY (kantin_id, sale_id, line_no), KEY idx_sale_items_product (kantin_id, product_id),
                CONSTRAINT fk_sale_items_sale FOREIGN KEY (kantin_id, sale_id) REFERENCES sales (kantin_id, id) ON DELETE CASCADE
            )$e COMMENT='Rincian barang per transaksi'",
            "CREATE TABLE orders (
                $k, id VARCHAR(40) NOT NULL, ordered_at DATETIME NULL, customer VARCHAR(120) NULL, phone VARCHAR(30) NULL,
                order_type VARCHAR(20) NOT NULL, table_id VARCHAR(40) NULL, table_name VARCHAR(80) NULL, payment_method VARCHAR(20) NULL,
                pay_at VARCHAR(20) NULL COMMENT 'kasir / online', status VARCHAR(20) NOT NULL DEFAULT 'baru',
                discount_type VARCHAR(10) NULL, discount_value DECIMAL(15,2) NOT NULL DEFAULT 0, queue_no INT NULL,
                payment_claimed_at DATETIME NULL, payment_rejected_at DATETIME NULL, paid_at DATETIME NULL,
                sale_date DATE NULL, sale_id VARCHAR(40) NULL COMMENT 'sales.id setelah dibayar', delivered_at DATETIME NULL,
                is_cancelled TINYINT(1) NOT NULL DEFAULT 0, guest_id VARCHAR(40) NULL, user_id VARCHAR(40) NULL,
                PRIMARY KEY (kantin_id, id), KEY idx_orders_status (kantin_id, status), KEY idx_orders_sale (kantin_id, sale_id)
            )$e COMMENT='Pesanan pelanggan (QR meja) dan pesanan tersimpan'",
            "CREATE TABLE order_items (
                $k, order_id VARCHAR(40) NOT NULL, product_id VARCHAR(40) NOT NULL, qty DECIMAL(12,3) NOT NULL DEFAULT 0, note VARCHAR(200) NULL,
                PRIMARY KEY (kantin_id, order_id, product_id),
                CONSTRAINT fk_order_items_order FOREIGN KEY (kantin_id, order_id) REFERENCES orders (kantin_id, id) ON DELETE CASCADE
            )$e COMMENT='Isi keranjang pesanan'",
            "CREATE TABLE cash_entries (
                $k, id VARCHAR(40) NOT NULL, entry_date DATE NULL, recorded_at DATETIME NULL, type VARCHAR(20) NOT NULL,
                category VARCHAR(60) NULL, amount DECIMAL(15,2) NOT NULL DEFAULT 0, purchase_id VARCHAR(40) NULL, note VARCHAR(255) NULL,
                PRIMARY KEY (kantin_id, id), KEY idx_cash_date (kantin_id, entry_date), KEY idx_cash_type (kantin_id, type)
            )$e COMMENT='Buku kas: pembelian, beban, modal, prive'",
            "CREATE TABLE stock_movements (
                $k, id VARCHAR(40) NOT NULL, moved_at DATETIME NULL, product_id VARCHAR(40) NULL, product_name VARCHAR(120) NULL,
                type VARCHAR(20) NOT NULL COMMENT 'masuk / keluar / koreksi', qty DECIMAL(12,3) NOT NULL DEFAULT 0, price DECIMAL(15,2) NOT NULL DEFAULT 0,
                expiry_date DATE NULL, supplier_id VARCHAR(40) NULL, supplier_name VARCHAR(120) NULL, purchase_id VARCHAR(40) NULL,
                cash_entry_id VARCHAR(40) NULL, note VARCHAR(255) NULL,
                PRIMARY KEY (kantin_id, id), KEY idx_stock_product (kantin_id, product_id)
            )$e COMMENT='Mutasi stok produk'",
            "CREATE TABLE items (
                $k, id VARCHAR(40) NOT NULL, name VARCHAR(120) NOT NULL, kind VARCHAR(10) NOT NULL COMMENT 'bahan / jadi', unit VARCHAR(30) NULL,
                min_stock DECIMAL(12,3) NOT NULL DEFAULT 0, product_id VARCHAR(40) NULL, per_unit DECIMAL(12,3) NOT NULL DEFAULT 1,
                PRIMARY KEY (kantin_id, id)
            )$e COMMENT='Bahan baku & barang yang dibeli'",
            "CREATE TABLE item_movements (
                $k, id VARCHAR(40) NOT NULL, moved_at DATETIME NULL, purchase_id VARCHAR(40) NULL, item_id VARCHAR(40) NULL, item_name VARCHAR(120) NULL,
                type VARCHAR(20) NOT NULL COMMENT 'beli / pakai / koreksi', qty DECIMAL(12,3) NOT NULL DEFAULT 0, unit VARCHAR(30) NULL,
                price DECIMAL(15,2) NOT NULL DEFAULT 0, amount DECIMAL(15,2) NOT NULL DEFAULT 0, expiry_date DATE NULL,
                supplier_id VARCHAR(40) NULL, supplier_name VARCHAR(120) NULL, cash_entry_id VARCHAR(40) NULL, stock_movement_id VARCHAR(40) NULL, note VARCHAR(255) NULL,
                PRIMARY KEY (kantin_id, id), KEY idx_item_moves_item (kantin_id, item_id), KEY idx_item_moves_purchase (kantin_id, purchase_id)
            )$e COMMENT='Pembelian & pemakaian bahan'",
            "CREATE TABLE suppliers (
                $k, id VARCHAR(40) NOT NULL, name VARCHAR(120) NOT NULL, phone VARCHAR(40) NULL, goods VARCHAR(255) NULL,
                address VARCHAR(255) NULL, note VARCHAR(255) NULL,
                PRIMARY KEY (kantin_id, id)
            )$e COMMENT='Pemasok'",
            "CREATE TABLE supplier_evaluations (
                $k, id VARCHAR(40) NOT NULL, supplier_id VARCHAR(40) NULL, evaluated_at DATETIME NULL, average_score DECIMAL(4,2) NULL,
                scores TEXT NULL COMMENT 'nilai per kriteria (JSON)', note VARCHAR(255) NULL,
                PRIMARY KEY (kantin_id, id), KEY idx_evals_supplier (kantin_id, supplier_id)
            )$e COMMENT='Penilaian pemasok'",
            "CREATE TABLE hpp_menus (
                $k, id VARCHAR(40) NOT NULL, name VARCHAR(120) NOT NULL, menu_type VARCHAR(20) NULL, selling_price DECIMAL(15,2) NOT NULL DEFAULT 0,
                product_id VARCHAR(40) NULL, sort_order INT NOT NULL DEFAULT 0, recipe TEXT NULL COMMENT 'bahan per porsi (JSON)',
                PRIMARY KEY (kantin_id, id)
            )$e COMMENT='Menu di Kalkulator HPP'",
        ];
    }
}
