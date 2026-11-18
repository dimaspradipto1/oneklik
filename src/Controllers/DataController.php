<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Helpers\Request;
use App\Helpers\Response;
use App\Services\DumpService;
use App\Services\WriteService;

final class DataController
{
    public function __construct(private DumpService $dump, private WriteService $writer) {}

    /** GET ?op=dump: all data this caller may see. */
    public function dump(Request $r): void
    {
        Response::json($this->dump->build($r->context));
    }

    /** POST ?op=write {act, col, id, data} */
    public function write(Request $r): void
    {
        $rev = $this->writer->write($r->context, $r->body, strlen($r->raw));
        Response::json(['ok' => true, 'rev' => $rev]);
    }
}
