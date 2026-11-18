<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Helpers\Request;
use App\Helpers\Response;
use App\Repositories\MetaRepository;

final class SystemController
{
    public function __construct(private MetaRepository $meta) {}

    /** GET ?op=ping: the app checks this to know it runs with the PHP server. */
    public function ping(Request $r): void
    {
        Response::json(['ok' => true]);
    }

    /** GET ?op=rev: polled every 3 s; a new number means data changed. */
    public function rev(Request $r): void
    {
        Response::json(['rev' => $this->meta->rev(), 'staff' => $r->context->staff()]);
    }
}
