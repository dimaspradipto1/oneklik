<?php
declare(strict_types=1);

namespace App\Helpers;

final class Json
{
    public static function encode($data): string
    {
        return json_encode($data, JSON_UNESCAPED_UNICODE);
    }

    /** Keeps only the given top-level fields of a JSON document. */
    public static function pick(string $raw, array $fields): string
    {
        $d = json_decode($raw);
        $o = new \stdClass();
        foreach ($fields as $k) if (is_object($d) && property_exists($d, $k)) $o->$k = $d->$k;
        return self::encode($o);
    }

    /** Objects merge field by field (like the browser store); anything else is replaced. */
    public static function merge(object $a, object $b): object
    {
        foreach ($b as $k => $v) {
            if (is_object($v) && isset($a->$k) && is_object($a->$k)) $a->$k = self::merge($a->$k, $v);
            else $a->$k = $v;
        }
        return $a;
    }

    public static function without(string $raw, array $fields): string
    {
        $d = json_decode($raw);
        if (is_object($d)) foreach ($fields as $k) unset($d->$k);
        return self::encode($d);
    }
}
