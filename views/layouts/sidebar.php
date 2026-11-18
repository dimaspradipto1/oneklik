<?php
/**
 * Sidebar menu utama Oneklik Biz (PHP).
 * @var array<string, array{view: string, label: string, file: string}> $menuPages
 * @var string $currentPage
 */
?>
<div class="sbrand">
  <div>
    <b><?= htmlspecialchars($app['name'] ?? 'Oneklik Biz') ?></b>
    <small><?= htmlspecialchars($app['tagline'] ?? 'One Click, Grow Your Business.') ?></small>
  </div>
</div>
<nav class="snav" aria-label="Navigasi halaman">
  <?php foreach ($menuPages as $slug => $item): ?>
    <?php $isActive = ($slug === $currentPage); ?>
    <a class="si <?= $isActive ? 'on' : '' ?>"
       href="?page=<?= urlencode($slug) ?>"
       data-act="nav"
       data-v="<?= htmlspecialchars($item['view']) ?>"
       aria-current="<?= $isActive ? 'page' : 'false' ?>">
      <span><?= htmlspecialchars($item['label']) ?></span>
    </a>
  <?php endforeach; ?>
</nav>
