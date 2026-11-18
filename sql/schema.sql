-- Skema Database Oneklik Biz (MySQL / MariaDB, PHP Murni)
-- Tidak menggunakan tabel migrations; jalankan sekali atau otomatis oleh Database::connection().

CREATE TABLE IF NOT EXISTS docs (
    col VARCHAR(40) NOT NULL,
    id VARCHAR(80) NOT NULL,
    data LONGTEXT NOT NULL,
    PRIMARY KEY (col, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS meta (
    k VARCHAR(20) NOT NULL,
    v BIGINT NOT NULL,
    PRIMARY KEY (k)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS kantins (
    id VARCHAR(20) NOT NULL,
    name VARCHAR(120) NULL,
    description VARCHAR(255) NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    shop_name VARCHAR(120) NULL,
    owner_name VARCHAR(120) NULL,
    opening_date DATE NULL,
    opening_cash DECIMAL(15,2) NOT NULL DEFAULT 0,
    opening_inventory DECIMAL(15,2) NOT NULL DEFAULT 0,
    equipment_value DECIMAL(15,2) NOT NULL DEFAULT 0,
    qr_base_url VARCHAR(255) NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Kantin / usaha';

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(40) NOT NULL,
    kantin_id VARCHAR(20) NULL COMMENT 'kantins.id (kosong = super admin)',
    name VARCHAR(100) NOT NULL,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(120) NULL,
    phone VARCHAR(30) NULL,
    password_hash VARCHAR(255) NOT NULL DEFAULT '',
    role VARCHAR(20) NOT NULL DEFAULT 'pemilik',
    business_name VARCHAR(120) NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    is_pending TINYINT(1) NOT NULL DEFAULT 0,
    must_change_password TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NULL,
    last_login_at DATETIME NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_username (username),
    UNIQUE KEY uq_users_email (email),
    KEY idx_users_kantin (kantin_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Pengguna (Super Admin & Pemilik Usaha)';

CREATE TABLE IF NOT EXISTS dining_tables (
    id VARCHAR(40) NOT NULL,
    kantin_id VARCHAR(20) NULL,
    name VARCHAR(80) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Meja & QR code';

CREATE TABLE IF NOT EXISTS categories (
    kantin_id VARCHAR(20) NOT NULL COMMENT 'kantins.id',
    name VARCHAR(60) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    PRIMARY KEY (kantin_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Kategori produk';

CREATE TABLE IF NOT EXISTS payment_methods (
    kantin_id VARCHAR(20) NOT NULL COMMENT 'kantins.id',
    code VARCHAR(30) NOT NULL,
    is_enabled TINYINT(1) NOT NULL DEFAULT 0,
    account_name VARCHAR(120) NULL,
    account_number VARCHAR(60) NULL,
    has_qr_image TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (kantin_id, code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Metode bayar non-tunai';

CREATE TABLE IF NOT EXISTS products (
    kantin_id VARCHAR(20) NOT NULL COMMENT 'kantins.id',
    id VARCHAR(40) NOT NULL,
    name VARCHAR(120) NOT NULL,
    description VARCHAR(255) NULL,
    category VARCHAR(60) NULL,
    unit VARCHAR(30) NULL,
    price DECIMAL(15,2) NOT NULL DEFAULT 0,
    cost DECIMAL(15,2) NOT NULL DEFAULT 0,
    cost_source VARCHAR(10) NOT NULL DEFAULT 'manual',
    hpp_menu_id VARCHAR(40) NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    track_stock TINYINT(1) NOT NULL DEFAULT 0,
    track_from DATETIME NULL,
    min_stock DECIMAL(12,3) NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 0,
    has_photo TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (kantin_id, id),
    KEY idx_products_category (kantin_id, category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Produk / menu';

CREATE TABLE IF NOT EXISTS sales (
    kantin_id VARCHAR(20) NOT NULL COMMENT 'kantins.id',
    id VARCHAR(40) NOT NULL,
    sale_date DATE NOT NULL,
    receipt_no INT NOT NULL DEFAULT 0,
    sold_at DATETIME NULL,
    customer VARCHAR(120) NULL,
    order_type VARCHAR(20) NOT NULL,
    payment_method VARCHAR(20) NULL,
    wallet VARCHAR(30) NULL,
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
    discount_type VARCHAR(10) NULL,
    discount_value DECIMAL(15,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    total DECIMAL(15,2) NOT NULL DEFAULT 0,
    cost_total DECIMAL(15,2) NOT NULL DEFAULT 0,
    cash_received DECIMAL(15,2) NULL,
    change_given DECIMAL(15,2) NULL,
    queue_no INT NULL,
    table_id VARCHAR(40) NULL,
    table_name VARCHAR(80) NULL,
    phone VARCHAR(30) NULL,
    user_id VARCHAR(40) NULL,
    validated_by VARCHAR(120) NULL,
    delivered_at DATETIME NULL,
    is_void TINYINT(1) NOT NULL DEFAULT 0,
    voided_at DATETIME NULL,
    PRIMARY KEY (kantin_id, id),
    KEY idx_sales_date (kantin_id, sale_date),
    KEY idx_sales_method (payment_method)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Transaksi kasir (penjualan)';

CREATE TABLE IF NOT EXISTS sale_items (
    kantin_id VARCHAR(20) NOT NULL COMMENT 'kantins.id',
    sale_id VARCHAR(40) NOT NULL,
    line_no INT NOT NULL,
    product_id VARCHAR(40) NULL,
    product_name VARCHAR(120) NOT NULL,
    category VARCHAR(60) NULL,
    unit VARCHAR(30) NULL,
    price DECIMAL(15,2) NOT NULL DEFAULT 0,
    cost DECIMAL(15,2) NOT NULL DEFAULT 0,
    qty DECIMAL(12,3) NOT NULL DEFAULT 0,
    amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    cost_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    note VARCHAR(200) NULL,
    PRIMARY KEY (kantin_id, sale_id, line_no),
    KEY idx_sale_items_product (kantin_id, product_id),
    CONSTRAINT fk_sale_items_sale FOREIGN KEY (kantin_id, sale_id) REFERENCES sales (kantin_id, id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Rincian barang per transaksi';

CREATE TABLE IF NOT EXISTS orders (
    kantin_id VARCHAR(20) NOT NULL COMMENT 'kantins.id',
    id VARCHAR(40) NOT NULL,
    ordered_at DATETIME NULL,
    customer VARCHAR(120) NULL,
    phone VARCHAR(30) NULL,
    order_type VARCHAR(20) NOT NULL,
    table_id VARCHAR(40) NULL,
    table_name VARCHAR(80) NULL,
    payment_method VARCHAR(20) NULL,
    pay_at VARCHAR(20) NULL COMMENT 'kasir / online',
    status VARCHAR(20) NOT NULL DEFAULT 'baru',
    discount_type VARCHAR(10) NULL,
    discount_value DECIMAL(15,2) NOT NULL DEFAULT 0,
    queue_no INT NULL,
    payment_claimed_at DATETIME NULL,
    payment_rejected_at DATETIME NULL,
    paid_at DATETIME NULL,
    sale_date DATE NULL,
    sale_id VARCHAR(40) NULL COMMENT 'sales.id setelah dibayar',
    delivered_at DATETIME NULL,
    is_cancelled TINYINT(1) NOT NULL DEFAULT 0,
    guest_id VARCHAR(40) NULL,
    user_id VARCHAR(40) NULL,
    PRIMARY KEY (kantin_id, id),
    KEY idx_orders_status (kantin_id, status),
    KEY idx_orders_sale (kantin_id, sale_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Pesanan pelanggan (QR meja)';

CREATE TABLE IF NOT EXISTS order_items (
    kantin_id VARCHAR(20) NOT NULL COMMENT 'kantins.id',
    order_id VARCHAR(40) NOT NULL,
    product_id VARCHAR(40) NOT NULL,
    qty DECIMAL(12,3) NOT NULL DEFAULT 0,
    note VARCHAR(200) NULL,
    PRIMARY KEY (kantin_id, order_id, product_id),
    CONSTRAINT fk_order_items_order FOREIGN KEY (kantin_id, order_id) REFERENCES orders (kantin_id, id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Isi keranjang pesanan';

CREATE TABLE IF NOT EXISTS cash_entries (
    kantin_id VARCHAR(20) NOT NULL COMMENT 'kantins.id',
    id VARCHAR(40) NOT NULL,
    entry_date DATE NULL,
    recorded_at DATETIME NULL,
    type VARCHAR(20) NOT NULL,
    category VARCHAR(60) NULL,
    amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    purchase_id VARCHAR(40) NULL,
    note VARCHAR(255) NULL,
    PRIMARY KEY (kantin_id, id),
    KEY idx_cash_date (kantin_id, entry_date),
    KEY idx_cash_type (kantin_id, type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Buku kas';

CREATE TABLE IF NOT EXISTS stock_movements (
    kantin_id VARCHAR(20) NOT NULL COMMENT 'kantins.id',
    id VARCHAR(40) NOT NULL,
    moved_at DATETIME NULL,
    product_id VARCHAR(40) NULL,
    product_name VARCHAR(120) NULL,
    type VARCHAR(20) NOT NULL COMMENT 'masuk / keluar / koreksi',
    qty DECIMAL(12,3) NOT NULL DEFAULT 0,
    price DECIMAL(15,2) NOT NULL DEFAULT 0,
    expiry_date DATE NULL,
    supplier_id VARCHAR(40) NULL,
    supplier_name VARCHAR(120) NULL,
    purchase_id VARCHAR(40) NULL,
    cash_entry_id VARCHAR(40) NULL,
    note VARCHAR(255) NULL,
    PRIMARY KEY (kantin_id, id),
    KEY idx_stock_product (kantin_id, product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Mutasi stok produk';

CREATE TABLE IF NOT EXISTS items (
    kantin_id VARCHAR(20) NOT NULL COMMENT 'kantins.id',
    id VARCHAR(40) NOT NULL,
    name VARCHAR(120) NOT NULL,
    kind VARCHAR(10) NOT NULL COMMENT 'bahan / jadi',
    unit VARCHAR(30) NULL,
    min_stock DECIMAL(12,3) NOT NULL DEFAULT 0,
    product_id VARCHAR(40) NULL,
    per_unit DECIMAL(12,3) NOT NULL DEFAULT 1,
    PRIMARY KEY (kantin_id, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bahan baku & barang beli';

CREATE TABLE IF NOT EXISTS item_movements (
    kantin_id VARCHAR(20) NOT NULL COMMENT 'kantins.id',
    id VARCHAR(40) NOT NULL,
    moved_at DATETIME NULL,
    purchase_id VARCHAR(40) NULL,
    item_id VARCHAR(40) NULL,
    item_name VARCHAR(120) NULL,
    type VARCHAR(20) NOT NULL COMMENT 'beli / pakai / koreksi',
    qty DECIMAL(12,3) NOT NULL DEFAULT 0,
    unit VARCHAR(30) NULL,
    price DECIMAL(15,2) NOT NULL DEFAULT 0,
    amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    expiry_date DATE NULL,
    supplier_id VARCHAR(40) NULL,
    supplier_name VARCHAR(120) NULL,
    cash_entry_id VARCHAR(40) NULL,
    stock_movement_id VARCHAR(40) NULL,
    note VARCHAR(255) NULL,
    PRIMARY KEY (kantin_id, id),
    KEY idx_item_moves_item (kantin_id, item_id),
    KEY idx_item_moves_purchase (kantin_id, purchase_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Pembelian & pemakaian bahan';

CREATE TABLE IF NOT EXISTS suppliers (
    kantin_id VARCHAR(20) NOT NULL COMMENT 'kantins.id',
    id VARCHAR(40) NOT NULL,
    name VARCHAR(120) NOT NULL,
    phone VARCHAR(40) NULL,
    goods VARCHAR(255) NULL,
    address VARCHAR(255) NULL,
    note VARCHAR(255) NULL,
    PRIMARY KEY (kantin_id, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Pemasok';

CREATE TABLE IF NOT EXISTS supplier_evaluations (
    kantin_id VARCHAR(20) NOT NULL COMMENT 'kantins.id',
    id VARCHAR(40) NOT NULL,
    supplier_id VARCHAR(40) NULL,
    evaluated_at DATETIME NULL,
    average_score DECIMAL(4,2) NULL,
    scores TEXT NULL COMMENT 'nilai per kriteria (JSON)',
    note VARCHAR(255) NULL,
    PRIMARY KEY (kantin_id, id),
    KEY idx_evals_supplier (kantin_id, supplier_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Penilaian pemasok';

CREATE TABLE IF NOT EXISTS hpp_menus (
    kantin_id VARCHAR(20) NOT NULL COMMENT 'kantins.id',
    id VARCHAR(40) NOT NULL,
    name VARCHAR(120) NOT NULL,
    menu_type VARCHAR(20) NULL,
    selling_price DECIMAL(15,2) NOT NULL DEFAULT 0,
    product_id VARCHAR(40) NULL,
    sort_order INT NOT NULL DEFAULT 0,
    recipe TEXT NULL COMMENT 'bahan per porsi (JSON)',
    PRIMARY KEY (kantin_id, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menu di Kalkulator HPP';
