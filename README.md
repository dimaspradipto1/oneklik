# Oneklik Biz

*One Click, Grow Your Business.* Kasir, pesanan lewat QR meja, stok, pembelian, kas, HPP, dan laporan keuangan untuk banyak kantin, dengan Super Admin dan pendaftaran pemilik usaha.

- Backend: PHP 8 + MySQL/MariaDB, tanpa framework dan tanpa Composer.
- Frontend: satu halaman (vanilla JavaScript), bisa dipasang sebagai aplikasi (PWA).

## Struktur folder

```
oneklik/
├── config/
│   └── config.php           Pengaturan aplikasi, database, Super Admin, dan batas login/daftar
├── sql/
│   └── schema.sql           Skema lengkap 19 tabel MySQL/MariaDB (tanpa tabel migrations)
├── src/
│   ├── bootstrap.php        Autoload kelas App\… dari src/ dan muat config/config.php
│   ├── Router.php           Router API PHP murni (keamanan, sesi, JSON, auth, dispatch)
│   ├── Controllers/         AuthController, DataController, SystemController
│   ├── Models/              Context, Tenant, User, Order
│   ├── Services/            Database, AuthService, DumpService, WriteService, MirrorService, RateLimiter
│   ├── Repositories/        DocumentRepository, MetaRepository, SettingsRepository, UserRepository
│   ├── Validators/          WriteValidator, RegisterValidator, OrderValidator, UsernameRule
│   └── Helpers/             Request, Response, Json, Str, Password, Logger, HttpException
├── views/
│   └── app.php              Kerangka HTML halaman
├── tools/
│   ├── rebuild-mirror.php           Bangun ulang tabel salinan dari docs
│   └── reset-superadmin-password.php Reset password Super Admin via CLI
├── public/                  SATU-SATUNYA folder yang dibuka browser
│   ├── index.php            Halaman aplikasi
│   ├── api/index.php        API: api/?op=ping|rev|dump|write|login|logout|register
│   ├── assets/              css/app.css, js/app.js, img/, icons/
│   ├── manifest.webmanifest
│   └── sw.js                Service worker (PWA)
├── storage/logs/            Catatan error server (app-YYYY-MM-DD.log)
├── storage/uploads/         Tempat file unggahan (disiapkan)
├── tests/run.php            Tes unit + tes API
├── .htaccess                Mengarahkan semua permintaan ke public/ dan memblokir file sensitif
└── README.md
```

## Tabel database

Database berisi 19 tabel (tanpa tabel `migrations`).

**Tabel kerja aplikasi.** Hanya dua tabel ini yang dibaca dan ditulis langsung untuk sinkronisasi:

| Tabel | Isi |
|---|---|
| `docs` | Semua data sebagai dokumen JSON (koleksi + id). Dipakai untuk sinkronisasi antar-perangkat. |
| `meta` | Nomor revisi data, dipakai perangkat untuk tahu ada perubahan. |

**Tabel salinan (baca-saja).** Diisi otomatis setiap kali data disimpan, dari versi baru maupun `kantin-api.php` lama:

| Tabel | Isi |
|---|---|
| `kantins` | Kantin/usaha, saldo awal, alamat QR |
| `users` | Pengguna (`name`, `username` UNIQUE, `email` UNIQUE, `phone`, `password_hash`, `role`, dll.). |
| `dining_tables` | Meja & QR |
| `categories` | Kategori produk |
| `payment_methods` | Metode bayar per kantin |
| `products` | Produk/menu |
| `sales` | Transaksi kasir |
| `sale_items` | Rincian barang per transaksi (relasi ke `sales`) |
| `orders` | Pesanan pelanggan lewat QR meja |
| `order_items` | Isi keranjang pesanan (relasi ke `orders`) |
| `cash_entries` | Buku kas |
| `stock_movements` | Mutasi stok produk |
| `items` | Bahan baku & barang beli |
| `item_movements` | Pembelian & pemakaian bahan |
| `suppliers` | Pemasok |
| `supplier_evaluations` | Penilaian pemasok |
| `hpp_menus` | Menu di Kalkulator HPP |

Setiap tabel salinan punya kolom `kantin_id` yang merujuk ke `kantins.id`.

**Jangan mengubah tabel salinan di phpMyAdmin.** Aplikasi tidak membacanya, jadi perubahan di sana tidak berpengaruh dan akan tertimpa saat data berikutnya disimpan.

Contoh laporan penjualan per hari:

```sql
SELECT k.name AS kantin, s.sale_date, COUNT(*) AS transaksi, SUM(s.total) AS omzet
FROM sales s JOIN kantins k ON k.id = s.kantin_id
WHERE s.is_void = 0
GROUP BY k.name, s.sale_date ORDER BY s.sale_date DESC;
```

Isi tabel salinan dibuat ulang dari `docs` dengan perintah berikut. Aman dijalankan kapan saja.

```bash
php tools/rebuild-mirror.php
```

### Alur satu permintaan API

```
browser → public/api/index.php → Router
        → header keamanan → sesi → JSON → Database::ensureSchema → autentikasi
        → Controller → Service (+ Validator) → Repository → MySQL
```

## Menjalankan di XAMPP

1. Start **Apache** dan **MySQL** di XAMPP Control Panel.
2. Buka `http://localhost/oneklik/` di komputer yang menjalankan XAMPP.
3. File `.env` sudah memakai database `kantin_uis` (sama dengan aplikasi lama), jadi akun dan data langsung terpakai.

Dari perangkat lain di Wi-Fi yang sama, aplikasi mewajibkan HTTPS. Siapkan HTTPS untuk server lokal sebelum digunakan dari HP; HTTP hanya diizinkan dari `localhost`.

## Online di hosting

1. Hosting dengan **PHP 8.1+**, **MySQL/MariaDB**, dan **HTTPS**.
2. Buat database + user di panel hosting.
3. Unggah seluruh isi folder `oneklik/` kecuali `tests/` dan `.env` milik komputer ini.
4. Salin `.env.example` menjadi `.env`, lalu isi data database dan **SUPERADMIN_USER / SUPERADMIN_PASS**.
5. Arahkan *document root* domain ke folder `public/`. Kalau tidak bisa, biarkan: `.htaccess` di folder utama sudah mengarahkan ke `public/`.
6. Buka alamatnya. Tabel dan Super Admin dibuat otomatis, dan halaman masuk langsung tampil. Masuk lalu ganti password.
7. Memindahkan data lama: Export database `kantin_uis` di phpMyAdmin XAMPP, lalu Import di phpMyAdmin hosting sebelum langkah 6.

### Reset password Super Admin

Jalankan dari folder proyek:

```bash
php database/reset-superadmin-password.php
```

Perintah ini membuat password acak sekali pakai dan menampilkannya sekali di terminal. Password aslinya tidak disimpan; akun admin dengan username sesuai `SUPERADMIN_USER` wajib menggantinya setelah login.

## Hak akses (dicek di server)

| | Super Admin | Pemilik Usaha | Pelanggan (QR) |
|---|---|---|---|
| Kasir, riwayat, laporan, stok, pembelian, kas, HPP, produk | ✓ semua kantin | ✓ kantinnya saja | – |
| Master Data: metode bayar & kategori | ✓ semua kantin | ✓ kantinnya saja | – |
| Master Data: pengguna (termasuk menonaktifkan akun), kantin, meja & QR | ✓ | – | – |
| Pilih kantin, lihat menu, kirim/bayar/batalkan pesanan | – | – | ✓ hanya pesanannya |

- Pemilik usaha bisa **mendaftar sendiri** di halaman masuk. Akun dan kantinnya langsung aktif. Super Admin bisa **menonaktifkan** akun kapan saja.
- Password awal dari `.env` dan password sementara hasil reset wajib diganti saat masuk. Password lama diverifikasi secara kompatibel, lalu ditingkatkan ke hash Argon2id (atau algoritma bawaan PHP) setelah login berhasil.
- Password baru minimal 12 karakter dan di-hash oleh server. Hash maupun salt tidak dikirim ke browser atau tabel salinan.
- Kosongkan `SUPERADMIN_PASS` di `.env` setelah login pertama dan perubahan password selesai.

## Tes

```bash
php tests/run.php
```

Tes API membuat data uji, jadi jalankan hanya ke database uji:

```bash
set DB_DATABASE=kantin_uis_test
set SUPERADMIN_USER=superuji
set SUPERADMIN_PASS=rahasia-uji-1
php -S 127.0.0.1:8765 -t public
php tests/run.php http://127.0.0.1:8765/api/
```

## Keamanan & cadangan

- Jangan bagikan `.env`. File ini dan folder selain `public/` tidak bisa dibuka dari browser.
- HTTPS wajib untuk akses API selain `localhost`. Jika ada reverse proxy tepercaya yang mengakhiri TLS, atur `TRUST_PROXY=true`; jangan aktifkan kecuali proxy menghapus dan menulis ulang `X-Forwarded-Proto`.
- Ganti password `root` MySQL XAMPP, lalu isi `DB_PASSWORD` di `.env`.
- Backup rutin: phpMyAdmin → pilih database → **Export**.
