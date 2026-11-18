<?php
/*
 * API Oneklik Biz: api/?op=ping|rev|dump|write|login|logout|register
 * Daftar rute ada di src/Router.php.
 */
require dirname(__DIR__, 2) . '/src/bootstrap.php';

(new App\Router())->handle(App\Helpers\Request::capture());
