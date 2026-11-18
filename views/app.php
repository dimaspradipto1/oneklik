<?php
/**
 * Layout utama Oneklik Biz (PHP).
 * @var array $app
 * @var array<string, array{view: string, label: string, file: string}> $menuPages
 * @var string $currentPage
 * @var string $currentView
 */
$v = fn(string $f) => $f . '?v=' . (@filemtime(BASE_PATH . '/public/' . $f) ?: '1');
?><!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#3F962A">
<title><?= htmlspecialchars($app['name']) ?></title>
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%2064%2064%27%3E%3Cdefs%3E%3ClinearGradient%20id%3D%27g%27%20x1%3D%270%27%20y1%3D%270%27%20x2%3D%271%27%20y2%3D%271%27%3E%3Cstop%20offset%3D%270%27%20stop-color%3D%27%235BC23F%27%2F%3E%3Cstop%20offset%3D%271%27%20stop-color%3D%27%232A7A1C%27%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20x%3D%271%27%20y%3D%271%27%20width%3D%2762%27%20height%3D%2762%27%20rx%3D%2717%27%20fill%3D%27url(%23g)%27%20stroke%3D%27%23fff%27%20stroke-opacity%3D%27.35%27%20stroke-width%3D%272%27%2F%3E%3Cpath%20d%3D%27M26%2021v25l6.5-6.3%204.6%2010.3%204.8-2.1-4.6-10.2H46z%27%20fill%3D%27%23fff%27%20stroke%3D%27%23fff%27%20stroke-width%3D%272.2%27%20stroke-linejoin%3D%27round%27%2F%3E%3Cpath%20d%3D%27M19.5%2014.5l3%203M26%2010v4.5M13%2021h4.5M32.5%2014.5l-3%203%27%20stroke%3D%27%23fff%27%20stroke-width%3D%273%27%20stroke-linecap%3D%27round%27%2F%3E%3C%2Fsvg%3E">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="assets/icons/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="<?= htmlspecialchars($app['name']) ?>">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap">
<link rel="stylesheet" href="<?= $v('assets/css/app.css') ?>">
</head>
<body>

<div id="auth" hidden></div>
<div class="app">
  <aside class="side" id="side" aria-label="Menu utama"><?php require BASE_PATH . '/views/layouts/sidebar.php'; ?></aside>
  <div class="shell">
    <header class="top" id="top"></header>
    <div id="banner"></div>
    <main id="view"><?php require BASE_PATH . '/views/pages/' . $menuPages[$currentPage]['file']; ?></main>
  </div>
</div>
<div class="cartbar" id="cartbar"></div>
<nav class="nav" id="nav" aria-label="Menu utama"></nav>
<div class="drawer-wrap" id="drawer" hidden>
  <div class="sheet-bg" data-act="close-drawer"></div>
  <nav class="drawer" id="drawer-body" aria-label="Menu"></nav>
</div>
<div class="sheet-wrap" id="sheet" hidden>
  <div class="sheet-bg" data-act="close-sheet"></div>
  <div class="sheet" role="dialog" aria-modal="true"><div class="grip"></div><div id="sheet-body"></div></div>
</div>
<div id="print-area" aria-hidden="true"></div>
<div class="toast" id="toast" role="status" hidden></div>

<script>window.__ONEKLIK_PAGE__ = <?= json_encode($currentView) ?>;</script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js"></script>
<script src="<?= $v('assets/js/app.js') ?>"></script>
</body>
</html>
