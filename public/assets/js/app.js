/* ---------- helpers ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad = n => String(n).padStart(2, '0');
const pad3 = n => String(n).padStart(3, '0');
const rp = n => 'Rp ' + Math.round(Math.abs(n)).toLocaleString('id-ID');
const rpS = n => (n < 0 ? '−' : '') + rp(n);
const rpAcc = n => Math.round(n) < 0 ? '(' + rp(n) + ')' : rp(n);
const rpShort = n => n >= 1e6 ? (n / 1e6).toLocaleString('id-ID', {maximumFractionDigits: 1}) + ' jt' : n >= 1e3 ? Math.round(n / 1e3) + ' rb' : String(Math.round(n));
const digits = v => +String(v || '').replace(/\D/g, '') || 0;
const dayKey = t => { const d = new Date(t); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
const parseKey = k => { const [y, m, d] = String(k).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
const sod = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
const eod = t => { const d = new Date(t); d.setHours(23, 59, 59, 999); return d.getTime(); };
const fmtD = (t, o) => new Date(t).toLocaleDateString('id-ID', o || {day: 'numeric', month: 'long', year: 'numeric'});
const fmtT = t => new Date(t).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'});
const fmtRange = (a, b) => dayKey(a) === dayKey(b) ? fmtD(a) : fmtD(a, {day: 'numeric', month: 'short', year: new Date(a).getFullYear() === new Date(b).getFullYear() ? undefined : 'numeric'}) + ' – ' + fmtD(b);
const uid = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const initials = s => String(s).split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
const buzz = () => { try { navigator.vibrate && navigator.vibrate(12); } catch (e) {} };
const errMsg = e => (e && (e.message || e.code)) || 'coba lagi';

const CAT_DEFAULT = ['Makanan', 'Minuman'];
const BEBAN_CATS = ['Gas & Listrik', 'Gaji/Upah', 'Sewa Tempat', 'Kebersihan', 'Lain-lain'];
const KAS_TYPES = {
  pembelian: {label: 'Belanja bahan', short: 'BHN', sign: -1, hint: 'Beli bahan baku/stok. Masuk ke persediaan, menjadi HPP saat terjual.'},
  beban:     {label: 'Beban operasional', short: 'BBN', sign: -1, hint: 'Gas, listrik, upah, sewa, kebersihan. Mengurangi laba.'},
  peralatan: {label: 'Beli peralatan', short: 'ALT', sign: -1, hint: 'Kompor, termos, etalase. Dicatat sebagai aset tetap.'},
  modal:     {label: 'Setor modal', short: 'MDL', sign: 1, hint: 'Uang pemilik yang ditambahkan ke usaha.'},
  prive:     {label: 'Ambil prive', short: 'PRV', sign: -1, hint: 'Uang usaha yang diambil untuk keperluan pribadi pemilik.'}
};
const ICONS = {
  kasir: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><path d="M17.25 14v6.5M14 17.25h6.5"/></svg>',
  riwayat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2.8h12v18.4l-2.4-1.6-2.4 1.6-2.4-1.6-2.4 1.6L6 21.2z"/><path d="M9 8h6M9 12h6M9 16h3"/></svg>',
  laporan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16"/><rect x="5" y="11" width="3.4" height="6.5" rx="1"/><rect x="10.3" y="6" width="3.4" height="11.5" rx="1"/><rect x="15.6" y="9" width="3.4" height="8.5" rx="1"/></svg>',
  kas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3"/><rect x="3.5" y="7.5" width="17" height="12" rx="2.5"/><path d="M16 13.5h1.5"/></svg>',
  pilih: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 9.5L5 4h14l1.5 5.5"/><path d="M3.5 9.5a2.8 2.8 0 0 0 5.6 0 2.8 2.8 0 0 0 5.8 0 2.8 2.8 0 0 0 5.6 0"/><path d="M5 12v8h14v-8M10 20v-5h4v5"/></svg>',
  stok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 7.5L12 3l8.5 4.5v9L12 21l-8.5-4.5z"/><path d="M3.5 7.5L12 12l8.5-4.5M12 12v9"/></svg>',
  hpp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2.5" width="14" height="19" rx="2.5"/><rect x="8" y="5.5" width="8" height="4" rx="1"/><path d="M8.5 13h.01M12 13h.01M15.5 13h.01M8.5 16.5h.01M12 16.5h.01M15.5 16.5h.01"/></svg>',
  beli: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5h2l1.6 9.5h11L20 8H7"/><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/><path d="M12 2.5v4M10 4.5h4"/></svg>',
  more: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>',
  produk: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 12.6V4.5a1 1 0 0 1 1-1h8.1l8 8a1.5 1.5 0 0 1 0 2.1l-7 7a1.5 1.5 0 0 1-2.1 0z"/><circle cx="8.2" cy="8.2" r="1.5"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/></svg>',
  bellOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 16V11a6 6 0 0 1 9.5-4.9M18 11v5l1.5 2h-15"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0M3 3l18 18"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 6.5h16M4 12h11M4 17.5h16"/></svg>',
  master: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.2a6.5 6.5 0 0 1 3.5 5.8"/></svg>',
  pesan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h18a9 7 0 0 1-18 0z"/><path d="M8 8c0-1.5 1.5-1.5 1.5-3M12 8c0-1.5 1.5-1.5 1.5-3M16 8c0-1.5 1.5-1.5 1.5-3"/></svg>',
  pesananku: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2.8h12v18.4l-2.4-1.6-2.4 1.6-2.4-1.6-2.4 1.6L6 21.2z"/><path d="M9 8h6M9 12h6M9 16h3"/></svg>',
  note: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M10.5 18.5h3"/></svg>',
  printer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 9V3.5h10V9"/><rect x="3.5" y="9" width="17" height="8" rx="2"/><path d="M7 14h10v6.5H7z"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.5" r="1.2"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  eyeoff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6A17 17 0 0 0 2 12s3.6 7 10 7a9.8 9.8 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>',
  login: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M4 12h11M11 8l4 4-4 4"/></svg>',
  logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4"/><path d="M20 12H9M16 8l4 4-4 4"/></svg>',
  key: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3M15 8l2 2"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 6.5l8.5 6.5 8.5-6.5"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/></svg>',
  list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3.5" width="14" height="17.5" rx="2.5"/><path d="M9 3.5h6v3H9zM9 11h6M9 15h4"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',
  chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/></svg>',
  cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h2.2l2.3 11h10.8l2-8H6.4"/><circle cx="9.5" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/></svg>',
  bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h14l-1 12.5H6z"/><path d="M9 10V7a3 3 0 0 1 6 0v3"/></svg>',
  filter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg>',
  flame: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.6 2.5c.6 3-1.2 4.6-2.6 6.2C8.6 10.3 7 12 7 14.6A5 5 0 0 0 12 20a5 5 0 0 0 5-5.2c0-2.2-1-3.6-2-4.8.1 1.4-.5 2.6-1.6 3 .6-2.6.2-6.9-.8-10.5z"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  thumb: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2.5 10h3.5v11H2.5zM8 21h9.3a2 2 0 0 0 2-1.6l1.4-6.6A2 2 0 0 0 18.7 10.4H14l.8-4a2 2 0 0 0-2-2.4L8 10z"/></svg>'
};
const MARK = '<img src="data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%2064%2064%27%3E%3Cdefs%3E%3ClinearGradient%20id%3D%27g%27%20x1%3D%270%27%20y1%3D%270%27%20x2%3D%271%27%20y2%3D%271%27%3E%3Cstop%20offset%3D%270%27%20stop-color%3D%27%235BC23F%27%2F%3E%3Cstop%20offset%3D%271%27%20stop-color%3D%27%232A7A1C%27%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20x%3D%271%27%20y%3D%271%27%20width%3D%2762%27%20height%3D%2762%27%20rx%3D%2717%27%20fill%3D%27url(%23g)%27%20stroke%3D%27%23fff%27%20stroke-opacity%3D%27.35%27%20stroke-width%3D%272%27%2F%3E%3Cpath%20d%3D%27M26%2021v25l6.5-6.3%204.6%2010.3%204.8-2.1-4.6-10.2H46z%27%20fill%3D%27%23fff%27%20stroke%3D%27%23fff%27%20stroke-width%3D%272.2%27%20stroke-linejoin%3D%27round%27%2F%3E%3Cpath%20d%3D%27M19.5%2014.5l3%203M26%2010v4.5M13%2021h4.5M32.5%2014.5l-3%203%27%20stroke%3D%27%23fff%27%20stroke-width%3D%273%27%20stroke-linecap%3D%27round%27%2F%3E%3C%2Fsvg%3E" alt="">';

/* ---------- state ---------- */
const S = {
  mode: 'loading', sync: 'pending', loaded: {}, stale: false,
  products: {}, settings: null, days: {}, kas: {},
  cart: {}, cash: 0, bump: null, paying: false,
  view: (typeof window !== 'undefined' && window.__ONEKLIK_PAGE__) ? window.__ONEKLIK_PAGE__ : 'kasir', catFilter: 'Semua', period: 'today', report: 'penjualan',
  range: {from: dayKey(Date.now()), to: dayKey(Date.now())},
  histDate: dayKey(Date.now()), txLimit: 25, sheet: null, ver: 0,
  orders: {}, suppliers: {}, evals: {}, stokTab: 'stok', beliTab: 'catat', items: {}, itemMoves: {}, hppTab: 'ringkasan', users: {}, masterTab: 'users', authPage: 'login', hpp: null, draft: null, q: '', sort: 'default', meta: {customer: '', type: 'dine', savedId: null, method: 'tunai', disc: {type: 'pct', value: 0}}, totOpen: true, bannerOff: false
};
try { const v = localStorage.getItem('kantin-uis-ui'); if (v) Object.assign(S, JSON.parse(v), {histDate: dayKey(Date.now())}); } catch (e) {}
function saveUI() { try { localStorage.setItem('kantin-uis-ui', JSON.stringify({view: S.view, period: S.period, report: S.report, totOpen: S.totOpen, bannerOff: S.bannerOff, sort: S.sort, stokTab: S.stokTab, beliTab: S.beliTab, hppTab: S.hppTab})); } catch (e) {} }

/* ---------- kantin (tenant) ----------
   Each kantin keeps its own products, sales, stock, kas, purchases, orders and settings.
   Kantin "main" uses the plain collection names; the others use "k.<id>.<name>". */
const tcol = n => (S.kid && S.kid !== 'main' ? 'k.' + S.kid + '.' : '') + n;
const gset = () => S.gsettings || (S.kid === 'main' ? S.settings : null) || {};
function kantinsList() {
  const g = gset(), l = (Array.isArray(g.kantins) ? g.kantins : []).filter(k => k && k.id && k.name).map(k => ({...k}));
  if (!l.some(k => k.id === 'main')) l.unshift({id: 'main', name: g.shopName || 'Kantin 1', active: true});
  return l;
}
const activeKantins = () => kantinsList().filter(k => k.active !== false);
const kantinName = kid => (kantinsList().find(k => k.id === kid) || {}).name || 'Kantin';
function staffKid() { const u = me(); if (!u || isCust()) return null; return u.role === 'pemilik' ? (u.kid || 'main') : (S.adminKid || 'main'); }
try { S.adminKid = localStorage.getItem('kantin-uis-kid') || 'main'; } catch (e) { S.adminKid = 'main'; }
S.kid = 'main'; S.guestKid = null; S.gk = {};
function cfg() {
  const s = S.settings || {};
  return {
    shopName: s.shopName || kantinName(S.kid), ownerName: s.ownerName || '',
    openingDate: s.openingDate || dayKey(Date.now()),
    openingCash: +s.openingCash || 0, openingInventory: +s.openingInventory || 0, equipment: +s.equipment || 0,
    categories: Array.isArray(s.categories) && s.categories.length ? s.categories : CAT_DEFAULT,
    tables: Array.isArray(gset().tables) ? gset().tables.filter(t => t && t.id && t.name) : [], qrBase: gset().qrBase || ''
  };
}
const catKind = c => /minum/i.test(c) ? 'drink' : /makan/i.test(c) ? 'food' : 'other';
/* Units: count units add 1 per tap; weight units can hold decimals (1,5 kg). */
const UNITS = {
  porsi: {g: 'Satuan hitung', step: 1}, pcs: {g: 'Satuan hitung', step: 1}, buah: {g: 'Satuan hitung', step: 1},
  gelas: {g: 'Satuan hitung', step: 1}, cup: {g: 'Satuan hitung', step: 1}, botol: {g: 'Satuan hitung', step: 1}, bungkus: {g: 'Satuan hitung', step: 1},
  kg: {g: 'Satuan berat', step: 0.5, dec: true}, ons: {g: 'Satuan berat', step: 1, dec: true}, gram: {g: 'Satuan berat', step: 100, dec: true}
};
const unitOf = p => p && UNITS[p.unit] ? p.unit : (p && catKind(p.cat) === 'drink' ? 'gelas' : 'porsi');
const stepOf = p => UNITS[unitOf(p)].step;
const itUnit = it => it.unit || unitOf(S.products[it.pid] || {cat: it.cat});
const r3 = n => Math.round(n * 1000) / 1000;
const fq = n => (+n || 0).toLocaleString('id-ID', {maximumFractionDigits: 3});
const qu = (q, u) => fq(q) + '\u00a0' + u;
const lineAmt = (price, q) => Math.round((+price || 0) * (+q || 0));
const productsSorted = () => Object.values(S.products).filter(p => p && p.name).sort((a, b) => {
  const cs = cfg().categories; const ca = cs.indexOf(a.cat), cb = cs.indexOf(b.cat);
  return (ca < 0 ? 99 : ca) - (cb < 0 ? 99 : cb) || (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name);
});
const activeProducts = () => productsSorted().filter(p => p.active !== false);
function allCats() { const cs = [...cfg().categories]; for (const p of Object.values(S.products)) if (p.cat && !cs.includes(p.cat)) cs.push(p.cat); return cs; }

let _txMemo = {ver: -1, list: []};
function allTx() {
  if (_txMemo.ver === S.ver) return _txMemo.list;
  const out = [];
  for (const k in S.days) {
    const tx = (S.days[k] && S.days[k].tx) || {};
    for (const id in tx) { const t = tx[id]; if (t && t.at && Array.isArray(t.items)) out.push({...t, id, day: k}); }
  }
  out.sort((a, b) => a.at - b.at);
  _txMemo = {ver: S.ver, list: out};
  return out;
}
const kasList = () => Object.values(S.kas).filter(e => e && e.at && KAS_TYPES[e.type]).sort((a, b) => a.at - b.at);

/* ---------- accounting ---------- */
function ledger(start, end) {
  const r = {sales: 0, grossSales: 0, disc: 0, byMethod: {}, cogs: 0, byCat: {}, cogsByCat: {}, tx: 0, items: 0, pembelian: 0, beban: 0, bebanByCat: {}, peralatan: 0, modal: 0, prive: 0};
  for (const t of allTx()) {
    if (t.void || t.at < start || t.at > end) continue;
    r.tx++;
    const da = +(t.discount && t.discount.amount) || 0; r.disc += da; r.sales -= da;
    r.byMethod[methodOf(t)] = (r.byMethod[methodOf(t)] || 0) + (+t.total || 0);
    for (const it of t.items) {
      const q = +it.qty || 0, rev = lineAmt(it.price, q), c = lineAmt(it.cost, q);
      r.sales += rev; r.grossSales += rev; r.cogs += c; r.items += q;
      r.byCat[it.cat] = (r.byCat[it.cat] || 0) + rev; r.cogsByCat[it.cat] = (r.cogsByCat[it.cat] || 0) + c;
    }
  }
  for (const e of kasList()) {
    if (e.at < start || e.at > end) continue;
    const a = +e.amount || 0; r[e.type] += a;
    if (e.type === 'beban') { const k = e.cat || 'Lain-lain'; r.bebanByCat[k] = (r.bebanByCat[k] || 0) + a; }
  }
  r.gross = r.sales - r.cogs; r.net = r.gross - r.beban;
  return r;
}
function position(end) {
  const c = cfg(), L = ledger(-Infinity, end);
  const kas = c.openingCash + L.sales + L.modal - L.pembelian - L.beban - L.peralatan - L.prive;
  const inv = c.openingInventory + L.pembelian - L.cogs;
  const eq = c.equipment + L.peralatan;
  const modalAwal = c.openingCash + c.openingInventory + c.equipment;
  return {kas, inv, eq, assets: kas + inv + eq, modalAwal, modalTambah: L.modal, laba: L.net, prive: L.prive, equity: modalAwal + L.modal + L.net - L.prive};
}
function periodRange() {
  const now = Date.now();
  switch (S.period) {
    case 'week': { const s = new Date(now); s.setDate(s.getDate() - 6); return {start: sod(s), end: eod(now)}; }
    case 'month': { const d = new Date(now); return {start: new Date(d.getFullYear(), d.getMonth(), 1).getTime(), end: eod(now)}; }
    case 'all': { const tx = allTx(); let s = parseKey(cfg().openingDate).getTime(); if (tx.length) s = Math.min(s, sod(tx[0].at)); return {start: s, end: eod(now)}; }
    case 'custom': { let a = sod(parseKey(S.range.from)), b = eod(parseKey(S.range.to)); if (a > b) [a, b] = [sod(b), eod(a)]; return {start: a, end: b}; }
    default: return {start: sod(now), end: eod(now)};
  }
}

/* ---------- storage: shared db when available, this device otherwise ---------- */
const LKEY = 'kantin-uis-data-v1';
const Store = {
  db: null,
  async init() {
    let db = null;
    try { db = window.claude && typeof window.claude.use === 'function' ? await window.claude.use('db') : null; } catch (e) { db = null; }
    if (db) { this.db = db; S.mode = 'db'; this.subscribe(); }
    else if (await detectBackend()) { this.db = remoteDB(API_URL); this.remote = true; S.mode = 'db'; S.sync = 'ok'; this.subscribe(); }
    else { S.mode = 'local'; S.sync = 'local'; this.loadLocal(); }
    render();
  },
  subscribe() {
    const db = this.db;
    db.collection('users').onSnapshot(s => { S.users = Object.fromEntries(s.docs.map(d => [d.id, {...d.data(), id: d.id}])); if (!s.metadata.fromCache || s.size) S.usersLoaded = true; render(); }, () => { S.usersLoaded = true; render(); });
    db.doc('settings/main').onSnapshot(s => { S.gsettings = s.exists ? {...s.data()} : null; render(); }, () => {});
    this.bindTenant(S.kid || 'main');
  },
  /* Switch every per-kantin subscription to another kantin. */
  bindTenant(kid) {
    (this.tsubs || []).forEach(u => { try { u(); } catch (e) {} });
    this.tsubs = [];
    S.kid = kid;
    Object.assign(S, {products: {}, settings: null, days: {}, kas: {}, stock: {}, items: {}, itemMoves: {}, suppliers: {}, evals: {}, orders: {}, hpp: null, loaded: {}, cart: {}, cash: 0, meta: newMeta()});
    S.ver++;
    if (!this.db) return;
    const db = this.db, need = ['products', 'settings', 'days', 'kas'], on = (ref, fn, err) => { this.tsubs.push(ref.onSnapshot(fn, err)); };
    const timer = setTimeout(() => { if (S.kid === kid && need.some(k => !S.loaded[k])) { S.stale = true; render(); } }, 10000);
    this.tsubs.push(() => clearTimeout(timer));
    const done = (k, snap) => {
      S.ver++;
      if (!snap.metadata.fromCache) S.loaded[k] = true;
      S.sync = snap.metadata.hasPendingWrites ? 'pending' : 'ok';
      if (need.every(n => S.loaded[n])) { clearTimeout(timer); S.stale = false; }
      render();
    };
    const fail = k => e => { S.loaded[k] = true; S.stale = true; S.sync = 'stale'; render(); };
    const map = (s2, withId) => Object.fromEntries(s2.docs.map(d => [d.id, withId ? {...d.data(), id: d.id} : d.data()]));
    on(db.collection(tcol('products')), s2 => { S.products = map(s2, true); done('products', s2); }, fail('products'));
    on(db.doc(tcol('settings') + '/main'), s2 => { S.settings = s2.exists ? {...s2.data()} : null; done('settings', s2); }, fail('settings'));
    on(db.collection(tcol('days')), s2 => { S.days = map(s2, false); done('days', s2); }, fail('days'));
    on(db.collection(tcol('kas')), s2 => { S.kas = map(s2, true); done('kas', s2); }, fail('kas'));
    on(db.collection(tcol('stock')), s2 => { S.stock = map(s2, true); S.ver++; render(); }, () => {});
    on(db.collection(tcol('items')), s2 => { S.items = map(s2, true); S.ver++; render(); }, () => {});
    on(db.collection(tcol('itemMoves')), s2 => { S.itemMoves = map(s2, true); S.ver++; render(); }, () => {});
    on(db.collection(tcol('suppliers')), s2 => { S.suppliers = map(s2, true); render(); }, () => {});
    on(db.collection(tcol('evals')), s2 => { S.evals = map(s2, true); render(); }, () => {});
    on(db.collection(tcol('orders')), s2 => { S.orders = map(s2, true); render(); }, () => {});
    on(db.doc(tcol('hpp') + '/main'), s2 => {
      if (!s2.exists) return;
      const j2 = JSON.stringify(s2.data()); if (j2 === S.hppSent) return;
      S.hpp = JSON.parse(j2);
      const typing = document.activeElement && document.activeElement.matches('input,select') && $('#view').contains(document.activeElement);
      if (S.view === 'hpp' && !S.sheet && !typing) render();
    }, () => {});
  },
  /* Customers see their orders from every kantin on "Pesanan saya", even before choosing one. */
  watchGuest() {
    if (!this.db || !S.guestTable) return;
    this.gsubs = this.gsubs || {};
    for (const k of kantinsList()) {
      if (this.gsubs[k.id]) continue;
      const kid = k.id, pre = kid === 'main' ? '' : 'k.' + kid + '.', box = S.gk[kid] = S.gk[kid] || {products: {}, settings: null, orders: {}};
      const map = s2 => Object.fromEntries(s2.docs.map(d => [d.id, {...d.data(), id: d.id}]));
      const list = this.gsubs[kid] = [];
      list.push(
        this.db.collection(pre + 'orders').onSnapshot(s2 => { box.orders = map(s2); render(); }, () => {}),
        this.db.collection(pre + 'products').onSnapshot(s2 => { box.products = map(s2); render(); }, () => {}),
        this.db.doc(pre + 'settings/main').onSnapshot(s2 => { box.settings = s2.exists ? {...s2.data()} : null; render(); }, () => {})
      );
    }
  },
  async saveGlobal(patch) {
    if (!this.db) return this.local(() => { S.settings = {...(S.settings || {}), ...patch}; S.gsettings = S.settings; });
    await this.db.doc('settings/main').set({...gset(), ...patch});
  },
  loadLocal() {
    let data = null;
    try { data = JSON.parse(localStorage.getItem(LKEY) || 'null'); } catch (e) {}
    if (!data) { data = buildDemo(Date.now()); data.days = {}; data.kas = {}; data.demo = true; }
    Object.assign(S, {products: data.products || {}, settings: data.settings || null, days: data.days || {}, kas: data.kas || {}, orders: data.orders || {}, stock: data.stock || {}, suppliers: data.suppliers || {}, evals: data.evals || {}, items: data.items || {}, itemMoves: data.itemMoves || {}, hpp: data.hpp || null, users: data.users || {}, demo: !!data.demo});
    for (const k of ['products', 'settings', 'days', 'kas']) S.loaded[k] = true;
    S.ver++; this.saveLocal();
  },
  saveLocal() {
    try { localStorage.setItem(LKEY, JSON.stringify({products: S.products, settings: S.settings, days: S.days, kas: S.kas, orders: S.orders, stock: S.stock, suppliers: S.suppliers, evals: S.evals, items: S.items, itemMoves: S.itemMoves, hpp: S.hpp, users: S.users, demo: S.demo})); }
    catch (e) { if (S.mode === 'local') setTimeout(() => toast('Penyimpanan browser penuh. Kecilkan atau hapus beberapa foto produk.'), 0); }
  },
  local(fn) { fn(); S.ver++; this.saveLocal(); render(); },
  async addSale(key, id, tx) {
    if (!this.db) return this.local(() => { S.days[key] = S.days[key] || {date: key, tx: {}}; S.days[key].tx = {...S.days[key].tx, [id]: tx}; });
    const ref = this.db.doc(tcol('days') + '/' + key);
    if (S.days[key]) await ref.update({tx: {[id]: tx}});
    else await ref.set({date: key, tx: {[id]: tx}});
  },
  async voidSale(key, id) {
    const patch = {void: true, voidAt: Date.now()};
    if (!this.db) return this.local(() => { S.days[key].tx = {...S.days[key].tx, [id]: {...S.days[key].tx[id], ...patch}}; });
    await this.db.doc(tcol('days') + '/' + key).update({tx: {[id]: patch}});
  },
  async delProduct(id) { if (!this.db) return this.local(() => { const k = {...S.products}; delete k[id]; S.products = k; }); await this.db.doc(tcol('products') + '/' + id).delete(); },
  async saveProduct(p) { if (!this.db) return this.local(() => { S.products = {...S.products, [p.id]: p}; }); const {id, ...body} = p; await this.db.doc(tcol('products') + '/' + id).set(body); },
  async saveSettings(s) { if (!this.db) return this.local(() => { S.settings = s; }); await this.db.doc(tcol('settings') + '/main').set(s); },
  async addKas(e) { if (!this.db) return this.local(() => { S.kas = {...S.kas, [e.id]: e}; }); const {id, ...body} = e; await this.db.doc(tcol('kas') + '/' + id).set(body); },
  async delTx(key, ids) {
    const d = S.days[key]; if (!d) return;
    const tx = {...(d.tx || {})}; for (const id of ids) delete tx[id];
    if (!this.db) return this.local(() => { const days = {...S.days}; if (Object.keys(tx).length) days[key] = {...d, tx}; else delete days[key]; S.days = days; });
    if (Object.keys(tx).length) await this.db.doc(tcol('days') + '/' + key).set({...d, tx});
    else await this.db.doc(tcol('days') + '/' + key).delete();
  },
  async clearTx(opt) {
    if (!this.db) return this.local(() => { if (opt.sales) S.days = {}; if (opt.kas) S.kas = {}; if (opt.stock) S.stock = {}; if (opt.orders) S.orders = {}; S.demo = false; });
    const del = async (col, ids) => { for (const id of ids) await this.db.doc(tcol(col) + '/' + id).delete(); };
    if (opt.sales) await del('days', Object.keys(S.days));
    if (opt.kas) await del('kas', Object.keys(S.kas));
    if (opt.stock) await del('stock', Object.keys(S.stock || {}));
    if (opt.orders) await del('orders', Object.keys(S.orders || {}));
  },
  async delKas(id) { if (!this.db) return this.local(() => { const k = {...S.kas}; delete k[id]; S.kas = k; }); await this.db.doc(tcol('kas') + '/' + id).delete(); },
  async saveItem(x) { if (!this.db) return this.local(() => { S.items = {...S.items, [x.id]: x}; }); const {id, ...body} = x; await this.db.doc(tcol('items') + '/' + id).set(body); },
  async delItem(id) { if (!this.db) return this.local(() => { const k = {...S.items}; delete k[id]; S.items = k; }); await this.db.doc(tcol('items') + '/' + id).delete(); },
  async addItemMove(m) { if (!this.db) return this.local(() => { S.itemMoves = {...S.itemMoves, [m.id]: m}; }); const {id, ...body} = m; await this.db.doc(tcol('itemMoves') + '/' + id).set(body); },
  async delItemMove(id) { if (!this.db) return this.local(() => { const k = {...S.itemMoves}; delete k[id]; S.itemMoves = k; }); await this.db.doc(tcol('itemMoves') + '/' + id).delete(); },
  async addStock(m) { if (!this.db) return this.local(() => { S.stock = {...S.stock, [m.id]: m}; }); const {id, ...body} = m; await this.db.doc(tcol('stock') + '/' + id).set(body); },
  async delStock(id) { if (!this.db) return this.local(() => { const k = {...S.stock}; delete k[id]; S.stock = k; }); await this.db.doc(tcol('stock') + '/' + id).delete(); },
  async saveSupplier(x) { if (!this.db) return this.local(() => { S.suppliers = {...S.suppliers, [x.id]: x}; }); const {id, ...body} = x; await this.db.doc(tcol('suppliers') + '/' + id).set(body); },
  async delSupplier(id) { if (!this.db) return this.local(() => { const k = {...S.suppliers}; delete k[id]; S.suppliers = k; }); await this.db.doc(tcol('suppliers') + '/' + id).delete(); },
  async addEval(x) { if (!this.db) return this.local(() => { S.evals = {...S.evals, [x.id]: x}; }); const {id, ...body} = x; await this.db.doc(tcol('evals') + '/' + id).set(body); },
  async delEval(id) { if (!this.db) return this.local(() => { const k = {...S.evals}; delete k[id]; S.evals = k; }); await this.db.doc(tcol('evals') + '/' + id).delete(); },
  async saveUser(u) { if (!this.db) return this.local(() => { S.users = {...S.users, [u.id]: u}; }); const {id, ...body} = u; await this.db.doc('users/' + id).set(body); },
  async delUser(id) { if (!this.db) return this.local(() => { const k = {...S.users}; delete k[id]; S.users = k; }); await this.db.doc('users/' + id).delete(); },
  async saveHpp(h) { if (!this.db) { this.saveLocal(); return; } S.hppSent = JSON.stringify(h); await this.db.doc(tcol('hpp') + '/main').set(JSON.parse(S.hppSent)); },
  async updateOrder(id, patch) { if (!this.db) return this.local(() => { if (S.orders[id]) S.orders = {...S.orders, [id]: {...S.orders[id], ...patch}}; }); await this.db.doc(tcol('orders') + '/' + id).update(patch); },
  async saveOrder(o) { if (!this.db) return this.local(() => { S.orders = {...S.orders, [o.id]: o}; }); const {id, ...body} = o; await this.db.doc(tcol('orders') + '/' + id).set(body); },
  async delOrder(id) { if (!this.db) return this.local(() => { const k = {...S.orders}; delete k[id]; S.orders = k; }); await this.db.doc(tcol('orders') + '/' + id).delete(); }
};

/* Example data for this-device mode only (the shared store is seeded separately). */
function buildDemo(now) {
  let seed = 20261112;
  const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const P = [
    {id: 'p-nasgor', name: 'Nasi Goreng Spesial', cat: 'Makanan', price: 15000, cost: 9000},
    {id: 'p-mieayam', name: 'Mie Ayam Bakso', cat: 'Makanan', price: 13000, cost: 7500},
    {id: 'p-esteh', name: 'Es Teh Manis', cat: 'Minuman', price: 4000, cost: 1500},
    {id: 'p-esjeruk', name: 'Es Jeruk Peras', cat: 'Minuman', price: 6000, cost: 2500}
  ];
  const products = {}; P.forEach((p, i) => { products[p.id] = {...p, unit: p.cat === 'Minuman' ? 'gelas' : 'porsi', active: true, order: i}; });
  const D = i => { const d = new Date(sod(now)); d.setDate(d.getDate() - 6 + i); return d; };
  const settings = {shopName: 'Oneklik Biz', openingDate: dayKey(D(0)), openingCash: 1500000, openingInventory: 600000, equipment: 3500000, categories: ['Makanan', 'Minuman']};
  const line = (p, q) => ({pid: p.id, name: p.name, cat: p.cat, price: p.price, cost: p.cost, qty: q, unit: p.cat === 'Minuman' ? 'gelas' : 'porsi'});
  const days = {};
  const nowD = new Date(now), nowMin = nowD.getHours() * 60 + nowD.getMinutes();
  for (let i = 0; i < 7; i++) {
    const d = D(i), wk = d.getDay() === 0 || d.getDay() === 6, startMin = 450;
    let n = wk ? 6 + Math.floor(rnd() * 5) : 20 + Math.floor(rnd() * 11);
    const endMin = i === 6 ? Math.min(900, nowMin) : 900;
    if (endMin <= startMin) n = 0; else if (i === 6) n = Math.round(n * (endMin - startMin) / (900 - startMin));
    const times = Array.from({length: n}, () => startMin + rnd() * (endMin - startMin)).sort((a, b) => a - b);
    const tx = {};
    times.forEach((m, j) => {
      const at = new Date(d); at.setHours(0, Math.floor(m), Math.floor(rnd() * 60), 0);
      const items = [], food = rnd() < 0.8;
      if (food) items.push(line(P[rnd() < 0.55 ? 0 : 1], rnd() < 0.82 ? 1 : 2));
      if (!food || rnd() < 0.75) items.push(line(P[rnd() < 0.6 ? 2 : 3], rnd() < 0.7 ? 1 : rnd() < 0.7 ? 2 : 3));
      tx['t' + at.getTime().toString(36) + j] = {no: j + 1, at: at.getTime(), items,
        total: items.reduce((s, x) => s + x.price * x.qty, 0), cost: items.reduce((s, x) => s + x.cost * x.qty, 0)};
    });
    if (n) days[dayKey(d)] = {date: dayKey(d), tx};
  }
  const K = [
    [0, 7, 50, 'pembelian', '', 450000, 'Beras 10 kg, ayam, telur, bumbu'],
    [0, 8, 5, 'beban', 'Gas & Listrik', 44000, 'Gas LPG 3 kg × 2 tabung'],
    [3, 7, 40, 'pembelian', '', 520000, 'Belanja pasar: ayam 5 kg, mie, sayur, jeruk'],
    [3, 13, 10, 'peralatan', '', 185000, 'Termos es 25 liter'],
    [4, 16, 0, 'beban', 'Gas & Listrik', 75000, 'Token listrik'],
    [5, 7, 35, 'pembelian', '', 380000, 'Beras, telur, teh, gula'],
    [5, 15, 30, 'prive', '', 200000, 'Keperluan pribadi pemilik'],
    [5, 15, 40, 'beban', 'Kebersihan', 25000, 'Sabun cuci piring & kantong plastik'],
    [6, 7, 20, 'beban', 'Gaji/Upah', 350000, 'Upah pembantu dapur (5 hari)']
  ];
  const kas = {};
  K.forEach(([i, h, m, type, cat, amount, note], j) => {
    const at = new Date(D(i)); at.setHours(h, m, 0, 0);
    if (at.getTime() > now) return;
    const id = 'k' + at.getTime().toString(36) + j;
    kas[id] = {id, at: at.getTime(), date: dayKey(at), type, cat, amount, note};
  });
  return {products, settings, days, kas};
}

/* ---------- views ---------- */
function vHeader() {
  const c = cfg(), L = ledger(sod(Date.now()), eod(Date.now()));
  const syncLabel = {ok: 'Tersimpan', pending: 'Menyimpan', stale: 'Belum tersambung', local: 'Perangkat ini'}[S.sync] || '';
  return `<button class="iconbtn plain hamb" data-act="open-drawer" aria-label="Buka menu">${ICONS.menu}</button><div class="mark" aria-hidden="true">${MARK}</div>
    <div class="brand"><h1>Oneklik Biz</h1><p>${esc(c.shopName)} · ${fmtD(Date.now(), {weekday: 'long', day: 'numeric', month: 'short'})}</p></div>
    ${isCust() ? `<div class="today"><small>${esc((tableOf(S.guestTable) || {}).name || 'Pelanggan')}</small><b>${esc(me().name.split(' ')[0])}</b></div>` : `<div class="today"><small><span class="dot ${S.sync}" title="${syncLabel}"></span>Omzet hari ini</small><b class="num">${rp(L.sales)}</b></div>`}`;
}
function vBanner() {
  if (isCust()) return '';
  if (S.mode === 'local') return S.bannerOff ? '' : `<div class="banner"><span>${S.demo ? '<b>Berisi contoh data.</b> ' : ''}Data tersimpan di browser perangkat ini. Jangan hapus riwayat/data situs browser agar transaksi tidak hilang.</span><button data-act="hide-banner">Tutup</button></div>`;
  if (S.stale) return `<div class="banner">${esc(S.remoteErr || 'Data belum bisa dijangkau. Periksa koneksi internet; tampilan bisa belum terbaru.')}</div>`;
  return '';
}
function vNav() {
  const tabs = me() ? ROLES[role()].views.map(v => [v, VIEW_LABEL[v][0]]) : [];
  let bar = tabs;
  if (tabs.length > 5) { bar = tabs.slice(0, 4); if (!bar.some(([k]) => k === S.view)) { const cur = tabs.find(([k]) => k === S.view); if (cur) bar[3] = cur; } bar = [...bar, ['more', 'Lainnya']]; }
  return `<div class="nav-in" style="grid-template-columns:repeat(${bar.length},minmax(0,1fr))">${bar.map(([k, l]) => k === 'more' ? `<button data-act="open-drawer" aria-label="Menu lainnya"><span class="ic">${ICONS.more}</span>${l}</button>` : `<button class="${S.view === k ? 'on' : ''}" data-act="nav" data-v="${k}" aria-current="${S.view === k ? 'page' : 'false'}"><span class="ic">${ICONS[k]}</span>${l}</button>`).join('')}</div>`;
}
const isLoading = () => S.mode === 'loading' || (S.mode === 'db' && !(S.loaded.products && S.loaded.settings) && !S.stale);

function soldToday() {
  const m = {}, k = dayKey(Date.now());
  for (const t of allTx()) if (t.day === k && !t.void) for (const it of t.items) m[it.pid] = (m[it.pid] || 0) + (+it.qty || 0);
  return m;
}
function cartLines() {
  return Object.entries(S.cart).map(([id, q]) => ({p: S.products[id], q})).filter(l => l.p && l.q > 0);
}
const cartTotal = lines => lines.reduce((s, l) => s + lineAmt(l.p.price, l.q), 0);
const cartCount = () => cartLines().reduce((s, l) => s + l.q, 0);

/* Illustrations used when a product has no photo; colours come from the category. */
const ILL = {
  food: '<svg class="ill" viewBox="0 0 120 90" aria-hidden="true"><circle class="b" cx="60" cy="47" r="40"/><path class="s" stroke-width="3" d="M47 22c-4-5 4-8 0-13M60 20c-4-5 4-8 0-13M73 22c-4-5 4-8 0-13"/><path class="a" opacity=".45" d="M30 50c2-14 16-21 30-21s28 7 30 21z"/><circle class="c" cx="47" cy="42" r="2.6"/><circle class="c" cx="60" cy="37" r="2.6"/><circle class="c" cx="72" cy="43" r="2.6"/><path class="a" d="M22 50H98A38 30 0 0 1 22 50Z"/><rect class="c" x="34" y="56" width="52" height="4" rx="2" opacity=".55"/></svg>',
  drink: '<svg class="ill" viewBox="0 0 120 90" aria-hidden="true"><circle class="b" cx="60" cy="47" r="40"/><path class="s" stroke-width="4" d="M67 36L76 8h10"/><path class="g" d="M40 24h40l-5 58H45z"/><path class="a" d="M42 40h36l-3.4 39.5H45.4z"/><rect class="c" x="49" y="46" width="9" height="9" rx="2" opacity=".85"/><rect class="c" x="61" y="53" width="9" height="9" rx="2" opacity=".85"/></svg>',
  other: '<svg class="ill" viewBox="0 0 120 90" aria-hidden="true"><circle class="b" cx="60" cy="47" r="40"/><rect class="a" x="34" y="30" width="52" height="44" rx="9"/><path class="c" opacity=".7" d="M34 44h52v6H34z"/><circle class="c" cx="60" cy="61" r="5"/></svg>'
};
const productImg = p => p && p.photo ? `<img src="${esc(p.photo)}" alt="" loading="lazy">` : ILL[catKind(p ? p.cat : '')];
const CAT_ICON = {
  all: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/></svg>',
  food: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h18a9 7 0 0 1-18 0z"/><path d="M8 8c0-1.5 1.5-1.5 1.5-3M12 8c0-1.5 1.5-1.5 1.5-3M16 8c0-1.5 1.5-1.5 1.5-3"/></svg>',
  drink: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 7h12l-1.5 13.5h-9z"/><path d="M14 7l2-4h3"/><path d="M6.6 12h10.8"/></svg>',
  other: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 8l8-4 8 4-8 4z"/><path d="M4 8v8l8 4 8-4V8M12 12v8"/></svg>'
};
const HERO_ART = `<svg viewBox="0 0 360 230" aria-hidden="true">
  <defs><radialGradient id="hr1" cx="50%" cy="35%" r="65%"><stop offset="0" stop-color="#FFE7A6"/><stop offset="1" stop-color="#EFA933"/></radialGradient>
  <linearGradient id="hr2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D9772F"/><stop offset="1" stop-color="#7A3510"/></linearGradient></defs>
  <path d="M308 18c34 12 50 44 38 86-32-12-50-44-38-86z" fill="#8CCB55" opacity=".55"/>
  <path d="M330 120c18 6 26 22 20 44-17-6-26-22-20-44z" fill="#B6E07A" opacity=".45"/>
  <g transform="translate(236 38)">
    <path d="M0 8h72l-8 150H8z" fill="#FFFFFF" opacity=".3"/>
    <path d="M4 42h64l-6.6 114H10.6z" fill="url(#hr2)"/>
    <rect x="14" y="54" width="18" height="18" rx="4" fill="#FFFFFF" opacity=".55"/><rect x="37" y="66" width="18" height="18" rx="4" fill="#FFFFFF" opacity=".5"/><rect x="22" y="90" width="16" height="16" rx="4" fill="#FFFFFF" opacity=".38"/>
    <path d="M46 32L60-12h14" stroke="#F3BD3B" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M0 8h72" stroke="#FFFFFF" stroke-width="3" opacity=".75"/>
    <circle cx="6" cy="10" r="15" fill="#F7D24A"/><circle cx="6" cy="10" r="10" fill="#FBE79A"/><path d="M6 0v20M-4 10h20" stroke="#F7D24A" stroke-width="1.5"/>
  </g>
  <ellipse cx="150" cy="200" rx="132" ry="24" fill="#06301A" opacity=".35"/>
  <ellipse cx="150" cy="186" rx="128" ry="34" fill="#F6F8F3"/>
  <ellipse cx="150" cy="181" rx="104" ry="25" fill="#E4EADF"/>
  <path d="M66 178c4-56 44-86 84-86s80 30 84 86c-42 11-126 11-168 0z" fill="url(#hr1)"/>
  <g fill="#FFF4D2" opacity=".9"><ellipse cx="104" cy="150" rx="4" ry="2.2"/><ellipse cx="128" cy="164" rx="4" ry="2.2"/><ellipse cx="176" cy="150" rx="4" ry="2.2"/><ellipse cx="198" cy="168" rx="4" ry="2.2"/><ellipse cx="150" cy="140" rx="4" ry="2.2"/><ellipse cx="90" cy="170" rx="4" ry="2.2"/><ellipse cx="214" cy="146" rx="4" ry="2.2"/></g>
  <g fill="#C2532A" opacity=".75"><circle cx="118" cy="138" r="3"/><circle cx="186" cy="132" r="3"/><circle cx="160" cy="160" r="3"/><circle cx="206" cy="160" r="2.5"/></g>
  <ellipse cx="136" cy="112" rx="38" ry="17" fill="#FFFFFF" transform="rotate(-10 136 112)"/>
  <circle cx="131" cy="112" r="11" fill="#F6A21E"/><circle cx="128" cy="109" r="3.5" fill="#FFD27A"/>
  <path d="M176 100c8-11 23-11 30 0-9 9-21 9-30 0z" fill="#4CAF35"/><path d="M178 100h26" stroke="#2E7D22" stroke-width="1.5"/>
  <circle cx="226" cy="172" r="13" fill="#8BC34A"/><circle cx="226" cy="172" r="9" fill="#DCEDC1"/>
  <circle cx="244" cy="183" r="11" fill="#E8503A"/><circle cx="244" cy="183" r="7" fill="#F59A8A"/>
  <path d="M52 170c-8-20 8-38 28-33 6 18-7 35-28 33z" fill="#F7E6B5"/><path d="M60 162c4-6 10-10 16-11" stroke="#E2C27E" stroke-width="2" fill="none"/>
  <path d="M34 44l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" fill="#F3BD3B"/><path d="M214 30l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#FFFFFF" opacity=".8"/>
</svg>`;
function campusArt() {
  let win = '';
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) win += `<rect x="${80 + c * 21}" y="${52 + r * 20}" width="11" height="12"/>`;
  for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) win += `<rect x="${28 + c * 20}" y="${88 + r * 18}" width="10" height="10"/><rect x="${180 + c * 20}" y="${82 + r * 18}" width="10" height="10"/>`;
  return `<svg viewBox="0 0 240 160" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true">
    <path d="M4 156h232"/><path d="M28 26a9 9 0 0 1 17-4 7 7 0 0 1 12 6H24a4 4 0 0 1 4-2z"/><path d="M180 18a8 8 0 0 1 15-3 6 6 0 0 1 10 5h-29a4 4 0 0 1 4-2z"/>
    <rect x="70" y="40" width="100" height="116"/><path d="M62 40h116M74 30h92v10M120 18v12M112 22h16"/>
    <rect x="20" y="78" width="50" height="78"/><rect x="170" y="72" width="52" height="84"/>${win}
    <path d="M106 156v-26h28v26M100 130h40M120 130v26"/>
    <circle cx="12" cy="134" r="10"/><path d="M12 144v12"/><circle cx="230" cy="130" r="11"/><path d="M230 141v15"/></svg>`;
}
const SORTS = {default: 'Urutan bawaan', laris: 'Terlaris hari ini', murah: 'Harga termurah', mahal: 'Harga termahal', nama: 'Nama A–Z'};
const greetWord = () => { const h = new Date().getHours(); return h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 18 ? 'Selamat sore' : 'Selamat malam'; };

function vSide() {
  const tabs = me() ? ROLES[role()].views.map(v => [v, VIEW_LABEL[v][1]]) : [], cust = isCust();
  const L = ledger(sod(Date.now()), eod(Date.now())), sv = cust ? myOrders().length : savedOrders().length;
  return `<div class="sbrand"><span class="slogo">${MARK}</span><div><b>Oneklik Biz</b><small>One Click, Grow Your Business.</small></div></div>
    ${kantinBox()}
    <div class="snav">${tabs.map(([k, l]) => `<button class="si ${S.view === k ? 'on' : ''}" data-act="nav" data-v="${k}" aria-current="${S.view === k ? 'page' : 'false'}">${ICONS[k]}<span>${l}</span>${(k === 'kasir' || k === 'pesananku') && sv ? `<em title="Pesanan menunggu">${sv}</em>` : ''}${k === 'stok' && stockAlertCount() ? `<em title="Notifikasi stok">${stockAlertCount()}</em>` : ''}${k === 'master' && pendingRegs().length ? `<em title="Pendaftaran pemilik menunggu persetujuan">${pendingRegs().length}</em>` : ''}</button>`).join('')}</div>
    ${cust ? '' : `<div class="scard"><small>Omzet hari ini</small><b class="num">${rp(L.sales)}</b><span>${L.tx} transaksi · laba kotor ${rp(L.gross)}</span></div>`}
    ${!isCust() && S.installEvt ? `<button class="btn primary block sinstall" data-act="install-app">${ICONS.check}Pasang aplikasi di perangkat ini</button>` : ''}
    ${accountBox()}
    <div class="sart">${campusArt()}</div>`;
}
function kantinBox() {
  const u = me(); if (!u) return '';
  if (isCust()) return S.guestKid ? `<div class="kswitch"><small>Kantin</small><b>${esc(kantinName(S.kid))}</b><button class="linkbtn inl" data-act="nav" data-v="pilih">Ganti</button></div>` : '';
  if (u.role === 'admin') return `<label class="kswitch"><small>Kantin yang dikelola</small><select data-kid aria-label="Pilih kantin">${kantinsList().map(k => `<option value="${esc(k.id)}" ${S.kid === k.id ? 'selected' : ''}>${esc(k.name)}${k.active === false ? ' (nonaktif)' : ''}</option>`).join('')}</select></label>`;
  return `<div class="kswitch"><small>Kantin Anda</small><b>${esc(kantinName(S.kid))}</b></div>`;
}
function vGreet() {
  if (isCust()) return `<h2>${esc(kantinName(S.kid))}</h2><p>Selamat datang, ${esc(me().name)}. Pilih menu favoritmu · <button class="linkbtn inl" data-act="nav" data-v="pilih">Ganti kantin</button></p>`;
  const name = (me() && me().name) || cfg().ownerName || 'Pemilik Kantin';
  return `<h2>${greetWord()}, ${esc(name)}</h2><p>Kelola pesanan &amp; penjualan di Oneklik Biz · ${fmtD(Date.now(), {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'})}</p>`;
}
function vKicons() {
  if (isCust()) { const n = cartCount(), mo = myOrders().length; return `<button class="roundbtn" data-act="nav" data-v="pesananku" aria-label="Pesanan saya (${mo})" title="Pesanan saya">${ICONS.bell}${mo ? `<span class="badge">${mo}</span>` : ''}</button><button class="roundbtn" data-act="focus-order" aria-label="Keranjang (${fq(n)})" title="Keranjang">${ICONS.cart}${n ? `<span class="badge green">${fq(n)}</span>` : ''}</button>`; }
  const sv = savedOrders().length, al = alerts().length, n = cartCount();
  return `<button class="roundbtn" data-act="notif" aria-label="Notifikasi (${al})" title="Notifikasi stok & kedaluwarsa">${ICONS.bell}${al ? `<span class="badge">${al}</span>` : ''}</button>
    <button class="roundbtn" data-act="saved" aria-label="Pesanan tersimpan (${sv})" title="Pesanan tersimpan">${ICONS.list}${sv ? `<span class="badge green">${sv}</span>` : ''}</button>
    <button class="roundbtn" data-act="focus-order" aria-label="Pesanan saat ini (${fq(n)} item)" title="Pesanan saat ini">${ICONS.cart}${n ? `<span class="badge green">${fq(n)}</span>` : ''}</button>`;
}
function topSeller() {
  const sold = soldToday(); let best = null;
  for (const p of activeProducts()) if ((sold[p.id] || 0) > 0 && (!best || sold[p.id] > sold[best.id])) best = p;
  return best;
}
function vHero() {
  const L = ledger(sod(Date.now()), eod(Date.now())), top = topSeller();
  return `<div class="hero-txt"><h3><span>Menu Spesial</span><span>Oneklik Biz</span></h3>
      <svg class="swoosh" viewBox="0 0 200 14" aria-hidden="true"><path d="M4 10C60 2 140 0 196 5" stroke="#F3BD3B" stroke-width="6" fill="none" stroke-linecap="round"/></svg>
      <p>Enak · Bersih · Terjangkau</p>
      ${isCust() ? (top ? `<div class="hero-stats"><span><small>Terlaris hari ini</small><b>${esc(top.name)}</b></span></div>` : '') : `<div class="hero-stats"><span><small>Omzet hari ini</small><b class="num">${rp(L.sales)}</b></span><span><small>Transaksi</small><b class="num">${L.tx}</b></span>${top ? `<span><small>Terlaris</small><b>${esc(top.name)}</b></span>` : ''}</div>`}</div>
    <div class="hero-art">${HERO_ART}</div>`;
}

function vKasir() {
  if (isLoading()) return `<div class="pgrid" style="padding-top:12px"><div class="skel"></div><div class="skel"></div><div class="skel"></div><div class="skel"></div></div>`;
  if (!activeProducts().length && isCust()) return `<div class="empty"><b>Menu belum tersedia</b>Kantin belum menambahkan menu. Coba lagi nanti.</div>`;
  if (!activeProducts().length) return `<div class="empty"><b>Belum ada menu</b>Tambahkan makanan dan minuman yang dijual kantin, lengkap dengan harga jual dan modalnya.<br><button class="btn primary" data-act="new-prod">Tambah produk pertama</button></div>`;
  return `<div class="kpos">
    <header class="khead"><button class="iconbtn plain khamb" data-act="open-drawer" aria-label="Buka menu">${ICONS.menu}</button>
      <div class="greet" id="greet">${vGreet()}</div><div class="kicons" id="kicons">${vKicons()}</div></header>
    <section class="catalog" aria-label="Daftar menu">
      <div id="kb">${vBanner()}</div>
      <div class="hero" id="hero">${vHero()}</div>
      <div class="srow"><label class="searchbar">${ICONS.search}<input id="q" type="search" placeholder="Cari menu (mis. nasi goreng, es teh…)" value="${esc(S.q)}" autocomplete="off" aria-label="Cari menu"></label>
        <button class="filterbtn" data-act="sort" aria-label="Urutkan menu: ${SORTS[S.sort] || SORTS.default}" title="Urutkan menu" id="filterbtn">${ICONS.filter}${S.sort !== 'default' ? '<i></i>' : ''}</button></div>
      <div class="cats" id="chips">${vChips()}</div>
      <div id="menus">${vMenus()}</div>
    </section>
    <aside class="order" id="order" aria-label="Pesanan">${orderHead(false)}<div class="obody" id="obody">${orderBody(false)}</div></aside>
  </div>`;
}
function vChips() {
  const prods = activeProducts(), cats = allCats().filter(c => prods.some(p => p.cat === c));
  if (S.catFilter !== 'Semua' && !cats.includes(S.catFilter)) S.catFilter = 'Semua';
  const chip = (k, n, kind) => { const on = S.catFilter === k; return `<button class="cat ${kind === 'all' ? '' : kind} ${on ? 'on' : ''}" data-act="cat" data-v="${esc(k)}" aria-pressed="${on}"><i>${CAT_ICON[kind]}</i>${esc(k)} <small>${n}</small></button>`; };
  return chip('Semua', prods.length, 'all') + cats.map(c => chip(c, prods.filter(p => p.cat === c).length, catKind(c))).join('');
}
function vMenus() {
  const q = S.q.trim().toLowerCase(), sold = soldToday(), top = topSeller();
  let list = activeProducts().filter(p => (S.catFilter === 'Semua' || p.cat === S.catFilter) && (!q || p.name.toLowerCase().includes(q)));
  if (S.sort === 'laris') list = list.slice().sort((a, b) => (sold[b.id] || 0) - (sold[a.id] || 0));
  else if (S.sort === 'murah') list = list.slice().sort((a, b) => a.price - b.price);
  else if (S.sort === 'mahal') list = list.slice().sort((a, b) => b.price - a.price);
  else if (S.sort === 'nama') list = list.slice().sort((a, b) => a.name.localeCompare(b.name, 'id'));
  const title = q ? 'Hasil pencarian' : S.catFilter === 'Semua' ? 'Semua Menu' : S.catFilter;
  const head = `<div class="sec-h"><h3>${ICONS.flame}${esc(title)}</h3><span>${list.length} menu${S.sort !== 'default' ? ' · ' + SORTS[S.sort] : ''}</span></div>`;
  if (!list.length) return head + `<div class="empty"><b>Menu tidak ditemukan</b>${q ? `Tidak ada menu dengan kata “${esc(S.q.trim())}”.` : 'Belum ada menu di kategori ini.'}</div>`;
  return head + `<div class="pgrid" id="pgrid">${list.map(p => productCard(p, sold[p.id] || 0, top && top.id === p.id)).join('')}</div>`;
}
function productCard(p, sold, isTop) {
  const q = S.cart[p.id] || 0, id = esc(p.id), nm = esc(p.name), u = unitOf(p);
  return `<div class="pc ${catKind(p.cat)} ${q ? 'sel' : ''}">
    <button class="pc-hit" data-act="add" data-id="${id}" aria-label="Tambah ${nm}, ${rp(p.price)} per ${u}${q ? ', ' + qu(q, u) + ' di pesanan' : ''}">
      <span class="pc-img">${productImg(p)}${isTop ? `<span class="pc-badge">${ICONS.thumb}Terlaris</span>` : ''}${q ? `<span class="pc-qty num ${S.bump === p.id ? 'bump' : ''}" aria-hidden="true">${fq(q)}</span>` : ''}</span>
      <span class="pc-name">${nm}</span>${p.desc ? `<span class="pc-desc">${esc(p.desc)}</span>` : ''}
      <span class="pc-meta"><b class="pc-price num">${rp(p.price)}<i class="pc-unit">/${u}</i></b><small>${tracked(p) ? `<span class="spill ${stockState(p, stockOf(p.id) - q).k}">Stok ${qu(r3(stockOf(p.id) - q), u)}</span>` : qu(sold, u) + ' terjual'}</small></span>
    </button>
    ${q ? `<div class="pc-step"><button data-act="sub" data-id="${id}" aria-label="Kurangi ${nm}">−</button><span class="num">${qu(q, u)}</span><button data-act="add" data-id="${id}" aria-label="Tambah ${nm}">+</button></div>`
        : `<button class="pc-add" data-act="add" data-id="${id}" tabindex="-1" aria-hidden="true">${ICONS.cart}Tambah</button>`}
  </div>`;
}
function orderHead(inSheet) {
  if (isCust()) return `<div class="ohd">${ICONS.cart}<h3>Pesanan Anda <span id="${inSheet ? 'ocount-s' : 'ocount'}">(${cartCount()})</span></h3></div>`;
  return `<div class="ohd">${ICONS.cart}<h3>Pesanan Anda <span id="${inSheet ? 'ocount-s' : 'ocount'}">(${cartCount()})</span></h3></div>
    <label class="cust">${ICONS.user}<input id="${inSheet ? 'cust-s' : 'cust'}" data-cust value="${esc(S.meta.customer)}" placeholder="Nama pelanggan (opsional)" maxlength="30" autocomplete="off" aria-label="Nama pelanggan (opsional)"></label>`;
}
function orderBody(inSheet) {
  if (isCust()) return custOrderBody(inSheet);
  const lines = cartLines(), sub = cartTotal(lines), total = sub - discAmt(sub), n = lines.reduce((s, l) => s + l.q, 0);
  const list = lines.length
    ? `<ul class="olines">${lines.map(l => { const id = esc(l.p.id), nm = esc(l.p.name), u = unitOf(l.p); return `<li class="ol ${catKind(l.p.cat)}"><span class="othumb">${productImg(l.p)}</span>
        <div class="oinfo"><div class="oname">${nm} (${qu(l.q, u)})</div><div class="oprice num">${rp(lineAmt(l.p.price, l.q))}</div><div class="ocalc num">${qu(l.q, u)} × ${rp(l.p.price)}/${u}</div>
          <div class="stepper"><button data-act="sub" data-id="${id}" aria-label="Kurangi ${nm}">−</button><input class="qtyin num" data-qty="${id}" value="${fq(l.q)}" inputmode="${UNITS[u].dec ? 'decimal' : 'numeric'}" aria-label="Jumlah ${nm} (${u})"><em>${u}</em><button class="plus" data-act="add" data-id="${id}" aria-label="Tambah ${nm}">+</button></div>${noteIn(l.p.id, nm)}</div>
        <button class="otrash" data-act="remove" data-id="${id}" aria-label="Hapus ${nm} dari pesanan">${ICONS.trash}</button></li>`; }).join('')}</ul>
      <button class="addmore" data-act="add-more">${ICONS.plus}Tambah Menu</button>`
    : `<div class="o-empty food">${ILL.food}<b>Belum ada pesanan</b>${inSheet ? 'Ketuk menu untuk menambah.' : 'Ketuk menu di sebelah kiri. Setiap ketukan menambah 1 satuan.'}</div>`;
  const cashOpts = [...new Set([total, ...[5000, 10000, 20000, 50000, 100000].filter(v => v > total)])].slice(0, 4);
  const cash = lines.length && S.meta.method === 'tunai' ? `<div class="cash"><label class="cash-lb" for="${inSheet ? 'cash-s' : 'cash'}">Uang diterima</label>
      <div class="cash-in"><span>Rp</span><input id="${inSheet ? 'cash-s' : 'cash'}" data-cash inputmode="numeric" autocomplete="off" placeholder="Ketik jumlah uang" value="${S.cash ? S.cash.toLocaleString('id-ID') : ''}" enterkeyhint="done">${S.cash ? '<button type="button" data-act="cash-clear" aria-label="Hapus uang diterima">×</button>' : ''}</div>
      <div class="chips">${cashOpts.map(v => `<button class="chip ${S.cash === v ? 'on' : ''}" data-act="cash" data-v="${v}">${v === total ? 'Uang pas' : rp(v)}</button>`).join('')}</div>
      <div class="change-slot" aria-live="polite">${changeHtml(total)}</div></div>` : lines.length ? `<p class="hint">Pastikan pembayaran ${METHODS[S.meta.method]} sebesar <b>${rp(total)}</b> sudah masuk sebelum menekan Bayar.</p>` : '';
  const d = S.meta.disc || {}, did = inSheet ? 'disc-s' : 'disc';
  const extra = lines.length ? `<div class="paym" role="group" aria-label="Metode pembayaran">${Object.entries(METHODS).map(([k, l]) => `<button class="${S.meta.method === k ? 'on' : ''}" data-act="method" data-v="${k}" aria-pressed="${S.meta.method === k}">${l}</button>`).join('')}</div>
    <div class="discrow"><label class="cash-lb" for="${did}">Diskon</label><div class="dtype" role="group" aria-label="Jenis diskon"><button class="${d.type !== 'rp' ? 'on' : ''}" data-act="disc-type" data-v="pct" aria-pressed="${d.type !== 'rp'}">%</button><button class="${d.type === 'rp' ? 'on' : ''}" data-act="disc-type" data-v="rp" aria-pressed="${d.type === 'rp'}">Rp</button></div><input id="${did}" class="num" data-disc inputmode="numeric" autocomplete="off" placeholder="0" value="${+d.value ? (+d.value).toLocaleString('id-ID') : ''}" aria-label="Nilai diskon ${d.type === 'rp' ? 'rupiah' : 'persen'}"></div>` : '';
  return `<div class="olines-wrap">${list}</div><div class="ofoot">
    ${S.meta.savedId ? `<div class="resumed">Melanjutkan pesanan tersimpan${S.meta.gi ? ` · ${esc(S.meta.gi.tableName || '')} · ${esc(S.meta.gi.phone || '')}` : ''}</div>` : ''}
    ${S.meta.payMethod && S.meta.payMethod !== 'kasir' ? `<div class="resumed paynote">Pelanggan memilih <b>${payLabel(S.meta.payMethod)}</b>${S.meta.payClaim ? ` dan menyatakan sudah bayar pukul ${fmtT(S.meta.payClaim.at)}. <b>Cek mutasi/notifikasi ${payLabel(S.meta.payMethod)}</b> sebelum menekan Bayar.` : ', tetapi belum menyatakan sudah bayar.'}</div>` : ''}
    <div class="otype" role="group" aria-label="Jenis pesanan"><button class="${S.meta.type !== 'take' ? 'on' : ''}" data-act="otype" data-v="dine" aria-pressed="${S.meta.type !== 'take'}">Makan di tempat</button><button class="${S.meta.type === 'take' ? 'on' : ''}" data-act="otype" data-v="take" aria-pressed="${S.meta.type === 'take'}">Bungkus</button></div>
    ${extra}
    <div class="totslot">${totalsHtml(sub)}</div>
    ${cash}
    <div class="oact three"><button class="btn save" data-act="park" ${n ? '' : 'disabled'} title="Simpan pesanan yang belum dibayar">${ICONS.list}Simpan</button><button class="btn printbtn" data-act="print-cart" ${n ? '' : 'disabled'} title="Cetak pesanan untuk dapur, bayar belakangan">${ICONS.printer}${S.meta.status ? 'Cetak ulang' : 'Cetak'}</button><button class="btn paynow" data-act="pay" ${n && !S.paying ? '' : 'disabled'}>${ICONS.bag}Bayar Sekarang</button></div>
    ${n ? '<button class="linkbtn" data-act="clear-cart">Kosongkan pesanan</button>' : ''}</div>`;
}
function changeHtml(total) {
  if (!S.cash) return '';
  const c = S.cash - total;
  return `<div class="change ${c < 0 ? 'short' : ''}"><span>${c < 0 ? 'Uang kurang' : 'Kembalian'}</span><span class="num">${rp(c)}</span></div>`;
}
/* A product stays deletable only while no transaction in the reports uses it; cancelled transactions no longer count. */
/* ---------- stock ----------
   Stock is derived, never stored: stock in + corrections − quantity sold in transactions that are not cancelled.
   Cancelling a sale therefore returns its quantity to stock automatically. */
const tracked = p => !!(p && p.trackStock) && !S.guestTable;
const stockMoves = () => Object.values(S.stock || {}).filter(m => m && m.pid && m.at).sort((a, b) => b.at - a.at);
function stockMap() {
  const m = {};
  for (const x of stockMoves()) m[x.pid] = r3((m[x.pid] || 0) + (+x.qty || 0));
  for (const t of allTx()) if (!t.void) for (const it of t.items) { const p = S.products[it.pid]; if (p && t.at >= (+p.trackFrom || 0)) m[it.pid] = r3((m[it.pid] || 0) - (+it.qty || 0)); }
  return m;
}
const stockOf = pid => stockMap()[pid] || 0;
function stockState(p, q) {
  if (!tracked(p)) return {k: 'off', l: 'Tidak dipantau'};
  if (q <= 0) return {k: 'out', l: 'Habis'};
  if (q <= (+p.minStock || 0)) return {k: 'low', l: 'Menipis'};
  return {k: 'ok', l: 'Aman'};
}
/* ---------- payment & discount ---------- */
const METHODS = {tunai: 'Tunai', qris: 'QRIS', transfer: 'Transfer', ewallet: 'E-Wallet'};
const methodOf = t => METHODS[t.method] ? t.method : 'tunai';
function discAmt(sub, d) {
  d = d || S.meta.disc || {}; const v = +d.value || 0;
  if (!v || !sub) return 0;
  return d.type === 'rp' ? Math.min(v, sub) : Math.round(sub * Math.min(v, 100) / 100);
}
const payTotal = () => { const sub = cartTotal(cartLines()); return sub - discAmt(sub); };
const discLabel = d => d && +d.value ? (d.type === 'rp' ? rp(d.value) : fq(d.value) + '%') : '';
function totalsHtml(sub) {
  const d = discAmt(sub), n = cartLines().length;
  return (d ? `<div class="subrow"><span>Subtotal</span><span class="num">${rp(sub)}</span></div><div class="subrow disc-amt"><span>Diskon ${discLabel(S.meta.disc)}</span><span class="num">−${rp(d)}</span></div>` : '')
    + `<div class="totrow"><span>Total Harga<small>${n} jenis menu</small></span><b class="num">${rp(sub - d)}</b></div>`;
}

/* ---------- sound notifications ----------
   Tones are made by the browser (no audio files). Browsers only allow sound after the page
   has been tapped/clicked once, so the audio is unlocked on the first interaction. */
const SND = {ctx: null, since: Date.now(), kid: null, seen: {}};
const soundOn = () => { try { return localStorage.getItem('kantin-uis-sound') !== 'off'; } catch (e) { return true; } };
function audioCtx() {
  try { if (!SND.ctx) { const A = window.AudioContext || window.webkitAudioContext; if (!A) return null; SND.ctx = new A(); } if (SND.ctx.state === 'suspended') SND.ctx.resume(); return SND.ctx; } catch (e) { return null; }
}
['pointerdown', 'keydown', 'touchstart'].forEach(ev => document.addEventListener(ev, () => { if (soundOn()) audioCtx(); }, {passive: true}));
const TONES = {
  order: [[880, 0, .16], [1318, .17, .26], [880, .5, .16], [1318, .67, .3]],
  pay: [[784, 0, .14], [988, .15, .14], [1175, .3, .14], [1568, .45, .32]],
  status: [[1046, 0, .18], [1318, .2, .34]],
  paid: [[659, 0, .14], [880, .15, .14], [1318, .3, .4]]
};
function playTone(kind) {
  if (!soundOn()) return;
  const c = audioCtx(); if (!c || c.state !== 'running') return;
  const t0 = c.currentTime + .02;
  for (const [hz, at, dur] of TONES[kind] || TONES.status) {
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.value = hz;
    g.gain.setValueAtTime(0, t0 + at); g.gain.linearRampToValueAtTime(.32, t0 + at + .015); g.gain.exponentialRampToValueAtTime(.001, t0 + at + dur);
    o.connect(g).connect(c.destination); o.start(t0 + at); o.stop(t0 + at + dur + .05);
  }
  if (isCust() && navigator.vibrate) try { navigator.vibrate(kind === 'status' ? [120] : [120, 80, 120]); } catch (e) {}
}
/* Compares the orders on screen with what was seen before and rings once per new event. */
function soundWatch() {
  const u = me(); if (!u) return;
  const cust = isCust(), scope = cust ? 'g' : 'k:' + S.kid;
  if (SND.kid !== scope) { SND.kid = scope; SND.seen = {}; SND.since = Date.now(); SND.primed = false; }
  const list = cust ? (S.guestTable ? guestAllOrders() : myOrders()) : savedOrders().filter(o => o.guest || o.uid);
  let ring = null, msg = '';
  const rank = {order: 1, status: 2, paid: 3, pay: 4};
  const hit = (k, m) => { if (!ring || rank[k] > rank[ring]) { ring = k; msg = m; } };
  const next = {};
  for (const o of list) {
    const sig = {st: o.status || '', claim: o.payClaim ? o.payClaim.at || 1 : 0, paid: o.paid ? 1 : 0}, old = SND.seen[o.id];
    next[o.id] = sig;
    if (cust) {
      if (!old) continue;
      if (sig.paid && !old.paid) hit('paid', 'Pembayaran Anda sudah diterima kasir. Terima kasih!');
      else if (sig.st !== old.st && sig.st === 'diantar') hit('status', 'Pesanan Anda sudah diantar. Selamat menikmati!');
      else if (sig.st !== old.st && sig.st === 'diproses') hit('status', 'Pesanan Anda sedang disiapkan.');
    } else {
      if (!old && !o.status && (o.at || 0) > SND.since - 5000) hit('order', `Pesanan baru${o.tableName ? ' · ' + o.tableName : ''} · ${o.customer || 'pelanggan'}`);
      if (sig.claim && (!old || !old.claim) && !o.paid && (o.payClaim.at || 0) > SND.since - 5000) hit('pay', `${o.customer || 'Pelanggan'} menyatakan sudah bayar · ${payLabel(o.payMethod)}`);
    }
  }
  SND.seen = next;
  if (ring) { playTone(ring); toast(msg); }
}

/* ---------- notifications ---------- */
const stockAlertCount = () => alerts().length - pendingRegs().length;
function alerts() {
  const map = stockMap(), out = [];
  for (const u of pendingRegs()) out.push({k: 'low', t: `Pendaftaran pemilik baru · ${u.bizName || u.name}`, s: `${u.name} · ${u.contact || ''} · menunggu persetujuan`, act: 'reg-open', id: u.id, btn: 'Tinjau'});
  for (const o of savedOrders()) if (needsVal(o)) out.push({k: 'low', t: `Validasi pembayaran · ${payLabel(o.payMethod)} · ${o.customer || 'pelanggan'}`, s: `${o.tableName ? o.tableName + ' · ' : ''}klaim bayar ${fmtT(o.payClaim.at)} · ${rp(orderTotal(o))}`, act: 'val-list', id: o.id, btn: 'Validasi'});
  for (const o of savedOrders()) if ((o.uid || o.guest) && !o.status && S.meta.savedId !== o.id) { const it = orderItems(o); out.push({k: 'low', t: `Pesanan masuk${o.tableName ? ' · ' + o.tableName : ''} · ${o.customer || 'pelanggan'}`, s: `${fmtT(o.at)}${o.phone ? ' · ' + o.phone : ''} · ${itemsText(o, false)}${o.payMethod && o.payMethod !== 'kasir' ? ' · ' + payLabel(o.payMethod) + (o.payClaim ? ' (sudah bayar, cek mutasi)' : ' (belum bayar)') : ''} · ${rp(it.reduce((a, x) => a + lineAmt(x.p.price, x.q), 0))}`, act: 'print-order', id: o.id, btn: 'Cetak & proses'}); }
  for (const p of productsSorted()) {
    if (!tracked(p) || p.active === false) continue;
    const q = map[p.id] || 0, st = stockState(p, q);
    if (st.k === 'out' || st.k === 'low') out.push({k: st.k, t: `${p.name} ${st.k === 'out' ? 'habis' : 'menipis'}`, s: `Sisa ${qu(q, unitOf(p))}${+p.minStock ? ' · batas ' + qu(p.minStock, unitOf(p)) : ''}`, act: 'stock-in', id: p.id, btn: 'Tambah stok'});
  }
  const imap = itemStockMap(), seen = new Set(itemMoves().map(m => m.iid));
  for (const it of itemsList()) { if (!seen.has(it.id)) continue; const q = imap[it.id] || 0, st = itemState(it, q); if (st.k !== 'ok' && (q <= 0 || +it.minStock)) out.push({k: st.k, t: `${it.name} ${st.k === 'out' ? 'habis' : 'menipis'}`, s: `Stok pembelian · sisa ${qu(q, it.unit)}${+it.minStock ? ' · batas ' + qu(it.minStock, it.unit) : ''}`, act: 'buy-item', id: it.id, btn: 'Beli'}); }
  for (const b of expBatches()) if (b.k !== 'ok') out.push({k: b.k, t: `${b.it.name} ${b.days < 0 ? 'sudah kedaluwarsa' : 'segera kedaluwarsa'}`, s: `${qu(b.left, b.it.unit)} · kedaluwarsa ${fmtD(parseKey(b.m.exp))}`, act: 'goto-exp', id: b.it.id, btn: 'Lihat'});
  return out;
}
function notifSheet() {
  const list = alerts(), sv = savedOrders().length;
  return `<h3>Notifikasi</h3>
    ${list.length ? `<div class="list">${list.map(a => `<div class="li"><span class="ico nt ${a.k}">${a.k === 'out' ? '!' : '•'}</span><div><div class="t">${esc(a.t)}</div><div class="s">${esc(a.s)}</div></div><button class="btn ghost sm" data-act="${a.act}" data-id="${esc(a.id)}">${a.btn}</button></div>`).join('')}</div>`
      : '<div class="o-empty"><b>Semua aman</b>Tidak ada stok menipis atau barang yang mendekati kedaluwarsa.</div>'}
    <button class="btn ghost block" style="margin-top:12px" data-act="saved">Pesanan tersimpan (${sv})</button>`;
}

/* ---------- suppliers ---------- */
const suppliers = () => Object.values(S.suppliers || {}).filter(x => x && x.name).sort((a, b) => a.name.localeCompare(b.name, 'id'));
const CRIT = {ketepatan: 'Ketepatan waktu', kualitas: 'Kualitas barang', harga: 'Harga', pelayanan: 'Pelayanan'};
function supStats(id) {
  const buys = purchases().filter(m => m.sid === id), evs = Object.values(S.evals || {}).filter(e => e && e.sid === id).sort((a, b) => b.at - a.at);
  const avg = {}; for (const k in CRIT) { const v = evs.map(e => +e[k]).filter(Boolean); avg[k] = v.length ? v.reduce((s, x) => s + x, 0) / v.length : 0; }
  const scores = Object.values(avg).filter(Boolean), score = scores.length ? scores.reduce((s, x) => s + x, 0) / scores.length : 0;
  const grade = !score ? {k: 'off', l: 'Belum dievaluasi'} : score >= 4.5 ? {k: 'ok', l: 'Sangat baik'} : score >= 3.5 ? {k: 'ok', l: 'Baik'} : score >= 2.5 ? {k: 'low', l: 'Cukup'} : {k: 'out', l: 'Kurang'};
  return {buys, evs, avg, score, grade, spend: buys.reduce((s, m) => s + lineAmt(m.price, m.qty), 0), last: buys[0]};
}
const stars = v => `<span class="stars" aria-label="${fq(Math.round(v * 10) / 10)} dari 5">${[1, 2, 3, 4, 5].map(i => `<i class="${v >= i - .25 ? 'on' : ''}">★</i>`).join('')}</span>`;
function supForm(x) {
  x = x || {};
  return `<h3>${x.id ? 'Ubah supplier' : 'Tambah supplier'}</h3><form data-form="supplier" data-id="${esc(x.id || '')}" novalidate>
    <div class="field"><label for="sp-name">Nama supplier</label><input id="sp-name" name="name" value="${esc(x.name || '')}" maxlength="50" placeholder="mis. Toko Sembako Berkah"></div>
    <div class="two"><div class="field"><label for="sp-phone">No. HP / WA</label><input id="sp-phone" name="phone" value="${esc(x.phone || '')}" inputmode="tel" maxlength="20"></div>
      <div class="field"><label for="sp-items">Barang yang dipasok</label><input id="sp-items" name="items" value="${esc(x.items || '')}" maxlength="80" placeholder="mis. beras, telur, minyak"></div></div>
    <div class="field"><label for="sp-addr">Alamat</label><input id="sp-addr" name="address" value="${esc(x.address || '')}" maxlength="100"></div>
    <div class="field"><label for="sp-note">Catatan</label><input id="sp-note" name="note" value="${esc(x.note || '')}" maxlength="100" placeholder="mis. kirim tiap Senin & Kamis"></div>
    <p class="err" id="sp-err" hidden></p>
    <div class="two"><button type="button" class="btn ghost" data-act="close-sheet">Batal</button><button class="btn primary" type="submit">Simpan</button></div></form>`;
}
function evalForm(x) {
  return `<h3>Evaluasi supplier · ${esc(x.name)}</h3><form data-form="eval" data-id="${esc(x.id)}" novalidate>
    <p class="muted" style="margin:-6px 0 0">Beri nilai 1 (sangat kurang) sampai 5 (sangat baik).</p>
    ${Object.entries(CRIT).map(([k, l]) => `<div class="field"><span class="lb">${l}</span><div class="radios rate">${[1, 2, 3, 4, 5].map(i => `<label><input type="radio" name="${k}" value="${i}" ${i === 4 ? 'checked' : ''}><span>${i}</span></label>`).join('')}</div></div>`).join('')}
    <div class="field"><label for="ev-note">Catatan</label><input id="ev-note" name="note" maxlength="120" placeholder="mis. telur datang terlambat 1 jam"></div>
    <div class="two"><button type="button" class="btn ghost" data-act="close-sheet">Batal</button><button class="btn primary" type="submit">Simpan evaluasi</button></div></form>`;
}
function supDetail(x) {
  const st = supStats(x.id);
  return `<h3>${esc(x.name)}</h3><p class="muted" style="margin-top:-6px">${[x.phone, x.address, x.items].filter(Boolean).map(esc).join(' · ') || 'Belum ada detail kontak'}</p>
    <div class="card"><h3>Hasil evaluasi <span class="spill ${st.grade.k}">${st.grade.l}</span></h3>
      ${Object.entries(CRIT).map(([k, l]) => `<div class="st-row"><span>${l}</span><span>${st.avg[k] ? stars(st.avg[k]) + ' <b class="num">' + fq(Math.round(st.avg[k] * 10) / 10) + '</b>' : '<span class="muted">–</span>'}</span></div>`).join('')}
      ${st.evs.length ? `<div class="list" style="margin-top:8px">${st.evs.slice(0, 5).map(e => `<div class="li"><span class="ico">${fq(Math.round(Object.keys(CRIT).reduce((s, k) => s + (+e[k] || 0), 0) / 4 * 10) / 10)}</span><div><div class="t">${fmtD(e.at)}</div><div class="s">${esc(e.note || 'Tanpa catatan')}</div></div><button class="iconbtn danger-ic" data-act="del-eval" data-id="${esc(e.id)}" aria-label="Hapus evaluasi">${ICONS.trash}</button></div>`).join('')}</div>` : ''}</div>
    <div class="card" style="margin-top:12px"><h3>Riwayat pembelian · ${rp(st.spend)}</h3>${st.buys.length ? purchaseList(st.buys.slice(0, 20)) : '<p class="muted" style="margin:0">Belum ada pembelian dari supplier ini.</p>'}</div>
    <div class="two" style="margin-top:12px"><button class="btn ghost" data-act="close-sheet">Tutup</button><button class="btn primary" data-act="eval-sup" data-id="${esc(x.id)}">Evaluasi sekarang</button></div>`;
}
/* ---------- Stok produk (sellable stock only) ---------- */
function vStok() {
  return `<div class="vhead"><div><h2>Stok produk</h2><p class="muted">Stok produk siap jual. Berkurang otomatis setiap ada penjualan, dan kembali bila transaksi dibatalkan</p></div>
      <button class="btn ghost" data-act="notif">${ICONS.bell} Notifikasi${alerts().length ? ` <span class="spill out">${alerts().length}</span>` : ''}</button></div>
    <div class="banner"><span>Stok bahan baku dan barang jadi yang dibeli dari supplier dicatat di menu <b>Pembelian</b>, dan otomatis masuk ke Kas &amp; Biaya.</span><button data-act="nav" data-v="beli">Buka Pembelian</button></div>
    ${vStokList()}`;
}
function vStokList() {
  const map = stockMap(), prods = productsSorted();
  const tr = prods.filter(tracked), low = tr.filter(p => stockState(p, map[p.id] || 0).k !== 'ok');
  const value = tr.reduce((s, p) => s + Math.max(0, map[p.id] || 0) * (+p.cost || 0), 0);
  const moves = stockMoves().slice(0, 40);
  let rows = '';
  for (const cat of allCats()) {
    const list = prods.filter(p => p.cat === cat); if (!list.length) continue;
    rows += `<div class="li-h">${esc(cat)}</div>` + list.map(p => {
      const q = map[p.id] || 0, st = stockState(p, q), u = unitOf(p);
      return `<div class="li ${catKind(p.cat)} ${p.active === false ? 'off' : ''}"><span class="ico" style="background:var(--k-soft);color:var(--k-ink)">${esc(initials(p.name))}</span>
        <div><div class="t">${esc(p.name)} <span class="spill ${st.k}">${st.l}</span></div>
          <div class="s num">${tracked(p) ? `Sisa <b>${qu(q, u)}</b>${+p.minStock ? ' · batas menipis ' + qu(p.minStock, u) : ''}` : 'Aktifkan pemantauan dengan menambah stok'}</div></div>
        <div class="li-act"><button class="btn primary sm" data-act="stock-in" data-id="${esc(p.id)}">+ Stok</button>${tracked(p) ? `<button class="btn ghost sm" data-act="stock-fix" data-id="${esc(p.id)}">Koreksi</button>` : ''}</div></div>`;
    }).join('');
  }
  return `<div class="stack"><div class="stats">
      <div class="stat"><small>Produk dipantau</small><b class="num">${tr.length} / ${prods.length}</b></div>
      <div class="stat"><small>Habis / menipis</small><b class="num ${low.length ? 'neg' : ''}">${low.length}</b><em>${low.slice(0, 2).map(p => esc(p.name)).join(', ') || 'semua aman'}</em></div>
      <div class="stat"><small>Nilai stok (harga modal)</small><b class="num">${rp(value)}</b></div>
      <div class="stat"><small>Catatan stok</small><b class="num">${stockMoves().length}</b></div></div>
    ${prods.length ? `<div class="list">${rows}</div>` : '<div class="empty"><b>Belum ada produk</b>Tambahkan produk di menu Produk terlebih dahulu.</div>'}
    <div class="card"><h3>Riwayat stok produk</h3>${moves.length ? `<div class="list">${moves.map(m => { const p = S.products[m.pid]; const u = p ? unitOf(p) : ''; return `<div class="li"><span class="ico">${m.type === 'koreksi' ? 'KOR' : 'IN'}</span>
        <div><div class="t">${esc(p ? p.name : (m.pname || 'Produk dihapus'))} <span class="num ${m.qty < 0 ? 'neg' : 'pos'}">${m.qty > 0 ? '+' : '−'}${qu(Math.abs(m.qty), u)}</span></div><div class="s">${m.type === 'koreksi' ? 'Koreksi stok' : m.pbId ? 'Dari pembelian' : 'Stok masuk'}${m.sname ? ' · ' + esc(m.sname) : ''}${m.note ? ' · ' + esc(m.note) : ''} · ${fmtD(m.at, {day: 'numeric', month: 'short'})} ${fmtT(m.at)}</div></div>
        ${m.pbId ? '<span class="tag">Pembelian</span>' : `<button class="iconbtn danger-ic" data-act="del-stock" data-id="${esc(m.id)}" aria-label="Hapus catatan stok">${ICONS.trash}</button>`}</div>`; }).join('')}</div>` : '<p class="muted" style="margin:0">Belum ada catatan stok masuk atau koreksi.</p>'}</div></div>`;
}
function stockForm(p, mode) {
  const u = unitOf(p), q = stockOf(p.id), dec = UNITS[u].dec;
  return `<h3>${mode === 'fix' ? 'Koreksi stok' : 'Tambah stok produk'} · ${esc(p.name)}</h3><form data-form="stock" data-id="${esc(p.id)}" data-mode="${mode}" novalidate>
    <p class="muted" style="margin:-6px 0 0">Stok tercatat sekarang: <b>${qu(q, u)}</b></p>
    <div class="field"><label for="st-qty">${mode === 'fix' ? 'Jumlah stok sebenarnya (hasil hitung fisik)' : 'Jumlah siap jual yang ditambahkan'} (${u})</label><input id="st-qty" name="qty" inputmode="${dec ? 'decimal' : 'numeric'}" autocomplete="off" placeholder="${dec ? 'mis. 2,5' : 'mis. 20'}"></div>
    ${mode === 'fix' ? '' : `<div class="field"><label for="st-min">Batas stok menipis (${u})</label><input id="st-min" name="min" inputmode="${dec ? 'decimal' : 'numeric'}" value="${p.minStock ? fq(p.minStock) : ''}" placeholder="mis. 5"><span class="hint">Muncul notifikasi bila sisa stok sama atau di bawah angka ini.</span></div>`}
    <div class="field"><label for="st-note">Keterangan</label><input id="st-note" name="note" maxlength="80" placeholder="${mode === 'fix' ? 'mis. hasil hitung akhir hari / rusak' : 'mis. hasil masak pagi'}"></div>
    ${mode === 'fix' ? '' : '<p class="hint">Untuk barang yang dibeli dari supplier, catat di menu <b>Pembelian</b> agar biayanya masuk Kas &amp; Biaya.</p>'}
    <p class="err" id="st-err" hidden></p>
    <div class="two"><button type="button" class="btn ghost" data-act="close-sheet">Batal</button><button class="btn primary" type="submit">Simpan</button></div></form>`;
}

/* ---------- Pembelian: bahan baku & barang jadi ----------
   One purchase (nota) = one Kas entry "Belanja bahan" + one itemMove per line.
   Item stock = purchases + corrections − usage. Barang jadi linked to a product also add to that product's sellable stock. */
const ITEM_UNITS = ['kg', 'gram', 'ons', 'liter', 'ml', 'pcs', 'buah', 'butir', 'botol', 'bungkus', 'pak', 'dus', 'karung', 'ikat'];
const ITEM_KINDS = {bahan: 'Bahan baku', jadi: 'Barang jadi'};
const itemsList = () => Object.values(S.items || {}).filter(x => x && x.name).sort((a, b) => (a.kind || '').localeCompare(b.kind || '') || a.name.localeCompare(b.name, 'id'));
const itemMoves = () => Object.values(S.itemMoves || {}).filter(m => m && m.iid && m.at).sort((a, b) => b.at - a.at);
function itemStockMap() { const m = {}; for (const x of itemMoves()) m[x.iid] = r3((m[x.iid] || 0) + (+x.qty || 0)); return m; }
const itemDec = u => ['kg', 'gram', 'ons', 'liter', 'ml'].includes(u);
const itemState = (it, q) => q <= 0 ? {k: 'out', l: 'Habis'} : q <= (+it.minStock || 0) ? {k: 'low', l: 'Menipis'} : {k: 'ok', l: 'Aman'};
const purchases = () => [...itemMoves().filter(m => m.type === 'beli'), ...stockMoves().filter(m => m.type === 'masuk' && !m.pbId && (m.sid || m.price))];
function purchaseGroups() {
  const g = {};
  for (const m of purchases()) { const k = m.pbId || m.id; const x = g[k] || (g[k] = {id: k, at: m.at, sid: m.sid, sname: m.sname, kasId: m.kasId, note: m.note, editedAt: m.editedAt || 0, legacy: !m.pbId, lines: []}); x.lines.push(m); }
  return Object.values(g).map(x => ({...x, total: x.lines.reduce((s, m) => s + lineAmt(m.price, m.qty), 0)})).sort((a, b) => b.at - a.at);
}
const moveName = m => m.iname || (S.items[m.iid] || {}).name || (S.products[m.pid] || {}).name || m.pname || 'Barang dihapus';
const moveUnit = m => m.unit || (S.items[m.iid] || {}).unit || (S.products[m.pid] ? unitOf(S.products[m.pid]) : '');
function expBatches() {
  const map = itemStockMap(), out = [], today = sod(Date.now());
  for (const it of itemsList()) {
    const ins = itemMoves().filter(m => m.iid === it.id && m.qty > 0).sort((a, b) => (a.exp || '9999').localeCompare(b.exp || '9999') || a.at - b.at);
    let used = Math.max(0, r3(ins.reduce((s, m) => s + m.qty, 0) - Math.max(0, map[it.id] || 0)));
    for (const m of ins) {
      const take = Math.min(used, m.qty); used = r3(used - take);
      const left = r3(m.qty - take);
      if (left > 0 && m.exp) { const days = Math.round((sod(parseKey(m.exp)) - today) / 864e5); out.push({m, it, left, days, k: days < 0 ? 'out' : days <= 3 ? 'low' : 'ok', l: days < 0 ? 'Kedaluwarsa' : days === 0 ? 'Hari ini' : days + ' hari lagi'}); }
    }
  }
  return out.sort((a, b) => a.days - b.days);
}
function purchaseList(list) {
  return `<div class="list">${list.map(m => { const u = moveUnit(m); return `<div class="li"><span class="ico">IN</span>
    <div><div class="t">${esc(moveName(m))} · ${qu(m.qty, u)}</div><div class="s">${fmtD(m.at, {day: 'numeric', month: 'short', year: 'numeric'})} · ${esc(m.sname || 'Tanpa supplier')}${m.price ? ' · ' + rp(m.price) + '/' + u : ''}${m.exp ? ' · kedaluwarsa ' + fmtD(parseKey(m.exp), {day: 'numeric', month: 'short'}) : ''}</div></div>
    <b class="a num">${m.price ? rp(lineAmt(m.price, m.qty)) : '–'}</b></div>`; }).join('')}</div>`;
}
const BELI_TABS = [['catat', 'Riwayat pembelian'], ['barang', 'Stok bahan & barang'], ['exp', 'Kedaluwarsa'], ['supplier', 'Supplier']];
function vBeliPage() {
  const tab = BELI_TABS.some(([k]) => k === S.beliTab) ? S.beliTab : 'catat', nExp = expBatches().filter(b => b.k !== 'ok').length;
  return `<div class="vhead"><div><h2>Pembelian</h2><p class="muted">Belanja bahan baku &amp; barang jadi dari supplier. Setiap pembelian otomatis tercatat di Kas &amp; Biaya.</p></div><button class="btn primary" data-act="buy-new">+ Catat pembelian</button></div>
    <div class="seg scroll" role="tablist">${BELI_TABS.map(([k, l]) => `<button role="tab" class="${tab === k ? 'on' : ''}" aria-selected="${tab === k}" data-act="beli-tab" data-v="${k}">${l}${k === 'exp' && nExp ? ` <span class="spill out">${nExp}</span>` : ''}</button>`).join('')}</div>
    ${({catat: vBeliCatat, barang: vBarang, exp: vExp, supplier: vSupplier})[tab]()}`;
}
function vBeliCatat() {
  const groups = purchaseGroups(), m0 = new Date(), monthStart = new Date(m0.getFullYear(), m0.getMonth(), 1).getTime();
  const month = groups.filter(g => g.at >= monthStart);
  return `<div class="stack"><div class="stats">
      <div class="stat"><small>Pembelian bulan ini</small><b class="num">${rp(month.reduce((s, g) => s + g.total, 0))}</b></div>
      <div class="stat"><small>Jumlah nota</small><b class="num">${month.length}</b><em>bulan ini</em></div>
      <div class="stat"><small>Supplier aktif</small><b class="num">${new Set(month.map(g => g.sid).filter(Boolean)).size}</b></div>
      <div class="stat"><small>Total semua pembelian</small><b class="num">${rp(groups.reduce((s, g) => s + g.total, 0))}</b></div></div>
    ${groups.length ? `<div class="receipts">${groups.map(g => `<article class="rcpt"><header><b>${esc(g.sname || 'Tanpa supplier')}</b><span>${fmtD(g.at, {day: 'numeric', month: 'short', year: 'numeric'})}</span></header>
      <ul>${g.lines.map(m => `<li><span>${esc(moveName(m))}<small class="num">${qu(m.qty, moveUnit(m))} × ${rp(m.price || 0)}${m.exp ? ' · kedaluwarsa ' + fmtD(parseKey(m.exp), {day: 'numeric', month: 'short'}) : ''}</small></span><b class="num">${rp(lineAmt(m.price, m.qty))}</b></li>`).join('')}</ul>
      <footer><span>Total</span><b class="num">${rp(g.total)}</b></footer>
      <div class="paidrow"><span>${g.kasId && S.kas[g.kasId] ? '<span class="spill ok">Tercatat di Kas &amp; Biaya</span>' : '<span class="spill">Tidak tercatat di Kas</span>'}</span>${g.note ? `<span>${esc(g.note)}</span>` : ''}</div>
      <div class="buyact">${g.legacy ? '<span class="muted" style="font-size:12px">Data lama, tidak bisa diubah</span>' : `<button class="btn ghost sm" data-act="edit-buy" data-id="${esc(g.id)}">${ICONS.edit}Ubah</button>`}<button class="linkbtn" data-act="del-buy" data-id="${esc(g.id)}">Hapus pembelian</button></div>${g.editedAt ? `<p class="hint" style="margin:6px 0 0">Diubah ${fmtD(g.editedAt, {day: 'numeric', month: 'short'})} ${fmtT(g.editedAt)}</p>` : ''}</article>`).join('')}</div>`
      : '<div class="empty"><b>Belum ada pembelian</b>Tekan “+ Catat pembelian” setiap kali belanja bahan baku atau barang jadi.</div>'}</div>`;
}
function vBarang() {
  const map = itemStockMap(), list = itemsList();
  const lastPrice = id => { const m = itemMoves().find(x => x.iid === id && x.type === 'beli' && x.price); return m ? m.price : 0; };
  const value = list.reduce((s, it) => s + Math.max(0, map[it.id] || 0) * lastPrice(it.id), 0);
  let rows = '';
  for (const [k, l] of Object.entries(ITEM_KINDS)) {
    const xs = list.filter(it => (it.kind || 'bahan') === k); if (!xs.length) continue;
    rows += `<div class="li-h">${l} · ${xs.length}</div>` + xs.map(it => { const q = map[it.id] || 0, st = itemState(it, q), p = it.pid && S.products[it.pid], lp = lastPrice(it.id);
      return `<div class="li"><span class="ico">${esc(initials(it.name))}</span><div><div class="t">${esc(it.name)} <span class="spill ${st.k}">${st.l}</span></div>
        <div class="s num">Sisa <b>${qu(q, it.unit)}</b>${+it.minStock ? ' · batas ' + qu(it.minStock, it.unit) : ''}${lp ? ' · harga terakhir ' + rp(lp) + '/' + it.unit : ''}${p ? ` · masuk ke stok “${esc(p.name)}”${+it.perUnit > 1 ? ' (1 ' + it.unit + ' = ' + fq(it.perUnit) + ' ' + unitOf(p) + ')' : ''}` : ''}</div></div>
        <div class="li-act"><button class="btn primary sm" data-act="buy-item" data-id="${esc(it.id)}">Beli</button><button class="btn ghost sm" data-act="item-use" data-id="${esc(it.id)}">Pakai</button><button class="btn ghost sm" data-act="item-fix" data-id="${esc(it.id)}">Koreksi</button><button class="iconbtn" data-act="item-edit" data-id="${esc(it.id)}" aria-label="Ubah ${esc(it.name)}">${ICONS.edit}</button><button class="iconbtn danger-ic" data-act="item-del" data-id="${esc(it.id)}" aria-label="Hapus ${esc(it.name)}">${ICONS.trash}</button></div></div>`; }).join('');
  }
  const moves = itemMoves().filter(m => m.type !== 'beli').slice(0, 30);
  return `<div class="stack"><div class="stats">
      <div class="stat"><small>Bahan baku</small><b class="num">${list.filter(x => (x.kind || 'bahan') === 'bahan').length}</b></div>
      <div class="stat"><small>Barang jadi</small><b class="num">${list.filter(x => x.kind === 'jadi').length}</b></div>
      <div class="stat"><small>Habis / menipis</small><b class="num">${list.filter(it => itemState(it, map[it.id] || 0).k !== 'ok').length}</b></div>
      <div class="stat"><small>Nilai stok (harga beli terakhir)</small><b class="num">${rp(value)}</b></div></div>
    <div><button class="btn primary" data-act="item-new">+ Tambah barang</button></div>
    ${list.length ? `<div class="list">${rows}</div>` : '<div class="empty"><b>Belum ada barang</b>Tambahkan bahan baku (beras, ayam, minyak…) atau barang jadi (air mineral, kerupuk…) yang dibeli dari supplier.</div>'}
    <div class="card"><h3>Pemakaian &amp; koreksi</h3>${moves.length ? `<div class="list">${moves.map(m => `<div class="li"><span class="ico">${m.type === 'pakai' ? 'OUT' : 'KOR'}</span><div><div class="t">${esc(moveName(m))} <span class="num ${m.qty < 0 ? 'neg' : 'pos'}">${m.qty > 0 ? '+' : '−'}${qu(Math.abs(m.qty), moveUnit(m))}</span></div><div class="s">${m.type === 'pakai' ? 'Dipakai' : 'Koreksi'}${m.note ? ' · ' + esc(m.note) : ''} · ${fmtD(m.at, {day: 'numeric', month: 'short'})} ${fmtT(m.at)}</div></div><button class="iconbtn danger-ic" data-act="del-imove" data-id="${esc(m.id)}" aria-label="Hapus catatan">${ICONS.trash}</button></div>`).join('')}</div>` : '<p class="muted" style="margin:0">Belum ada catatan pemakaian atau koreksi.</p>'}</div></div>`;
}
function vExp() {
  const list = expBatches();
  return `<div class="stack"><p class="muted" style="margin:0">Isi tanggal kedaluwarsa saat mencatat pembelian. Barang yang dipakai dianggap diambil dari stok yang paling dulu kedaluwarsa.</p>
    ${list.length ? `<div class="list">${list.map(b => `<div class="li"><span class="ico">${esc(initials(b.it.name))}</span>
      <div><div class="t">${esc(b.it.name)} <span class="spill ${b.k}">${b.l}</span></div><div class="s num">Sisa dari pembelian ${fmtD(b.m.at, {day: 'numeric', month: 'short'})}: <b>${qu(b.left, b.it.unit)}</b> · kedaluwarsa ${fmtD(parseKey(b.m.exp))}</div></div>
      ${b.days < 0 ? `<button class="btn ghost sm" data-act="item-fix" data-id="${esc(b.it.id)}">Buang/koreksi</button>` : ''}</div>`).join('')}</div>`
      : '<div class="empty"><b>Belum ada data kedaluwarsa</b>Tanggal kedaluwarsa diisi saat mencatat pembelian.</div>'}</div>`;
}
function vSupplier() {
  const list = suppliers();
  return `<div class="stack"><div><button class="btn primary" data-act="new-sup">+ Tambah supplier</button></div>
    ${list.length ? `<div class="receipts">${list.map(x => { const st = supStats(x.id); return `<article class="card sup">
      <div class="sup-h"><div><b>${esc(x.name)}</b><small>${esc(x.items || 'Barang belum diisi')}</small></div><span class="spill ${st.grade.k}">${st.grade.l}</span></div>
      <div class="sup-score">${stars(st.score)} <b class="num">${st.score ? fq(Math.round(st.score * 10) / 10) : '–'}</b><span class="muted">· ${st.evs.length} evaluasi</span></div>
      <div class="sup-meta"><span><small>Pembelian</small><b class="num">${st.buys.length}×</b></span><span><small>Total belanja</small><b class="num">${rp(st.spend)}</b></span><span><small>Terakhir</small><b>${st.last ? fmtD(st.last.at, {day: 'numeric', month: 'short'}) : '–'}</b></span></div>
      ${x.phone ? `<p class="muted" style="margin:0;font-size:13px">${esc(x.phone)}${x.address ? ' · ' + esc(x.address) : ''}</p>` : ''}
      <div class="li-act"><button class="btn ghost sm" data-act="sup-detail" data-id="${esc(x.id)}">Detail</button><button class="btn primary sm" data-act="eval-sup" data-id="${esc(x.id)}">Evaluasi</button><button class="iconbtn" data-act="edit-sup" data-id="${esc(x.id)}" aria-label="Ubah ${esc(x.name)}">${ICONS.edit}</button><button class="iconbtn danger-ic" data-act="del-sup" data-id="${esc(x.id)}" aria-label="Hapus ${esc(x.name)}">${ICONS.trash}</button></div></article>`; }).join('')}</div>`
      : '<div class="empty"><b>Belum ada supplier</b>Tambahkan pemasok bahan dan minuman agar pembelian dan evaluasinya tercatat.</div>'}</div>`;
}
function itemForm(it) {
  it = it || {kind: 'bahan', unit: 'kg'};
  return `<h3>${it.id ? 'Ubah barang' : 'Tambah barang'}</h3><form data-form="item" data-id="${esc(it.id || '')}" novalidate>
    <div class="field"><label for="it-name">Nama barang</label><input id="it-name" name="name" value="${esc(it.name || '')}" maxlength="50" placeholder="mis. Beras, Daging ayam, Air mineral 600 ml"></div>
    <div class="two"><div class="field"><label for="it-kind">Jenis</label><select id="it-kind" name="kind">${Object.entries(ITEM_KINDS).map(([k, l]) => `<option value="${k}" ${(it.kind || 'bahan') === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      <div class="field"><label for="it-unit">Satuan beli</label><select id="it-unit" name="unit">${ITEM_UNITS.map(u => `<option ${u === it.unit ? 'selected' : ''}>${u}</option>`).join('')}</select></div></div>
    <div class="field"><label for="it-min">Batas stok menipis</label><input id="it-min" name="min" inputmode="decimal" value="${it.minStock ? fq(it.minStock) : ''}" placeholder="mis. 2"><span class="hint">Muncul notifikasi bila sisa sama atau di bawah angka ini.</span></div>
    <div class="hppbox" id="it-jadi" ${it.kind === 'jadi' ? '' : 'hidden'}>
      <div class="field"><label for="it-pid">Masukkan otomatis ke stok produk kasir (opsional)</label><select id="it-pid" name="pid"><option value="">— Tidak —</option>${productsSorted().map(p => `<option value="${esc(p.id)}" ${p.id === it.pid ? 'selected' : ''}>${esc(p.name)} (${unitOf(p)})</option>`).join('')}</select></div>
      <div class="field" style="margin-top:10px"><label for="it-per">Isi per satuan beli (dalam satuan produk)</label><input id="it-per" name="per" inputmode="decimal" value="${it.perUnit ? fq(it.perUnit) : '1'}" placeholder="mis. 24 bila 1 dus = 24 botol"></div></div>
    <p class="err" id="it-err" hidden></p>
    <div class="two"><button type="button" class="btn ghost" data-act="close-sheet">Batal</button><button class="btn primary" type="submit">Simpan</button></div></form>`;
}
function itemMoveForm(it, mode) {
  const q = itemStockMap()[it.id] || 0;
  return `<h3>${mode === 'fix' ? 'Koreksi stok' : 'Catat pemakaian'} · ${esc(it.name)}</h3><form data-form="itemmove" data-id="${esc(it.id)}" data-mode="${mode}" novalidate>
    <p class="muted" style="margin:-6px 0 0">Stok tercatat sekarang: <b>${qu(q, it.unit)}</b></p>
    <div class="field"><label for="im-qty">${mode === 'fix' ? 'Jumlah sebenarnya (hasil stok opname)' : 'Jumlah yang dipakai'} (${it.unit})</label><input id="im-qty" name="qty" inputmode="decimal" autocomplete="off"></div>
    <div class="field"><label for="im-note">Keterangan</label><input id="im-note" name="note" maxlength="80" placeholder="${mode === 'fix' ? 'mis. stok opname akhir bulan / rusak' : 'mis. untuk produksi hari ini'}"></div>
    <p class="err" id="im-err" hidden></p>
    <div class="two"><button type="button" class="btn ghost" data-act="close-sheet">Batal</button><button class="btn primary" type="submit">Simpan</button></div></form>`;
}
function buySheet() {
  const d = S.draft, items = itemsList(), sups = suppliers();
  const total = d.rows.reduce((s, r) => s + lineAmt(r.price, r.qty), 0);
  return `<h3>${d.editId ? 'Ubah pembelian' : 'Catat pembelian'}</h3>${d.editId ? '<p class="hint" style="margin:-6px 0 8px">Stok barang, stok produk terkait, dan catatan di Kas &amp; Biaya ikut disesuaikan.</p>' : ''}<div class="rform">
    <div class="two"><div class="field"><label for="bd-sid">Supplier</label><select id="bd-sid" data-bd="sid"><option value="">— Tanpa supplier —</option>${sups.map(x => `<option value="${esc(x.id)}" ${x.id === d.sid ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></div>
      <div class="field"><label for="bd-date">Tanggal pembelian</label><input type="date" id="bd-date" data-bd="date" value="${d.date}" max="${dayKey(Date.now())}"></div></div>
    ${items.length ? '' : '<p class="err">Belum ada barang. Tambahkan dulu di tab “Stok bahan &amp; barang”.</p>'}
    <span class="lb">Barang yang dibeli</span><span class="hint" style="margin-top:-8px">Isi tanggal kedaluwarsa bila barang punya masa simpan (daging, susu, roti, minuman kemasan). Dipakai untuk notifikasi “segera kedaluwarsa”.</span>
    <div class="bcards">${d.rows.map((r, i) => { const it = S.items[r.iid]; return `<div class="bcard">
      <div class="bc-top"><span class="bc-no">${i + 1}</span><select data-br="${i}" data-bk="iid" aria-label="Barang ${i + 1}"><option value="">Pilih barang…</option>${items.map(x => `<option value="${esc(x.id)}" ${x.id === r.iid ? 'selected' : ''}>${esc(x.name)} (${x.unit})</option>`).join('')}</select>
        <button type="button" class="iconbtn danger-ic" data-act="br-del" data-v="${i}" aria-label="Hapus barang ${i + 1}">${ICONS.trash}</button></div>
      <div class="bc-grid">
        <label class="bf"><span>Jumlah</span><div class="pin sm"><input data-br="${i}" data-bk="qty" class="num" inputmode="decimal" value="${r.qty ? fq(r.qty) : ''}" placeholder="0" aria-label="Jumlah barang ${i + 1}"><span>${it ? it.unit : ''}</span></div></label>
        <label class="bf"><span>Harga satuan${it ? ' (per ' + it.unit + ')' : ''}</span><div class="pin sm"><span>Rp</span><input data-br="${i}" data-bk="price" class="num" inputmode="numeric" value="${r.price ? (+r.price).toLocaleString('id-ID') : ''}" placeholder="0" aria-label="Harga satuan barang ${i + 1}"></div></label>
        <label class="bf"><span>Tgl kedaluwarsa <i>(opsional)</i></span><input type="date" data-br="${i}" data-bk="exp" value="${r.exp || ''}" aria-label="Tanggal kedaluwarsa barang ${i + 1} (opsional)"></label>
      </div>
      <div class="bc-sub"><span>Subtotal</span><b class="num" id="bsub-${i}">${rp(lineAmt(r.price, r.qty))}</b></div></div>`; }).join('')}</div>
    <button type="button" class="btn ghost sm" data-act="br-add">+ Tambah barang</button>
    <div class="change" id="bd-total"><span>Total pembelian</span><span class="num">${rp(total)}</span></div>
    <div class="field"><label for="bd-note">Keterangan</label><input id="bd-note" data-bd="note" value="${esc(d.note || '')}" maxlength="80" placeholder="mis. nota no. 123 / belanja pasar pagi"></div>
    <p class="hint" style="margin:0">Total otomatis dicatat di <b>Kas &amp; Biaya</b> sebagai “Belanja bahan”. Barang jadi yang terhubung ke produk ikut menambah stok produk.</p>
    <p class="err" id="bd-err" hidden></p>
    <div class="two"><button type="button" class="btn ghost" data-act="close-sheet">Batal</button><button type="button" class="btn primary" data-act="buy-save">${d.editId ? 'Simpan perubahan' : 'Simpan pembelian'}</button></div></div>`;
}
function openBuy(iid) {
  S.draft = {kind: 'buy', sid: '', date: dayKey(Date.now()), note: '', rows: [{iid: iid || '', qty: 0, price: iid ? (itemMoves().find(m => m.iid === iid && m.price) || {}).price || 0 : 0, exp: ''}]};
  openSheet(buySheet);
}
async function saveBuy() {
  const d = S.draft, err = m => { const e = $('#bd-err'); e.textContent = m; e.hidden = false; };
  const rows = d.rows.filter(r => S.items[r.iid] && +r.qty > 0);
  if (!rows.length) return err('Pilih barang dan isi jumlahnya.');
  if (rows.some(r => !itemDec(S.items[r.iid].unit) && +r.qty !== Math.round(+r.qty))) return err('Jumlah untuk satuan hitung harus bilangan bulat.');
  const day = parseKey(d.date || dayKey(Date.now())), now = new Date();
  if (dayKey(day) === dayKey(now)) day.setHours(now.getHours(), now.getMinutes(), now.getSeconds()); else day.setHours(12, 0, 0);
  const old = d.editId ? purchaseGroups().find(g => g.id === d.editId) : null;
  if (d.editId && !old) return err('Pembelian ini sudah tidak ada. Tutup lalu muat ulang.');
  const at = old && dayKey(old.at) === dayKey(day) ? old.at : day.getTime(), pbId = old ? old.id : uid('pb'), sp = S.suppliers[d.sid], total = rows.reduce((s, r) => s + lineAmt(r.price, r.qty), 0);
  const kasId = total ? (old && old.kasId ? old.kasId : uid('k')) : '', editedAt = old ? Date.now() : 0;
  const btn = document.querySelector('[data-act="buy-save"]'); if (btn) btn.disabled = true;
  try {
    if (kasId) await Store.addKas({id: kasId, at, date: dayKey(at), type: 'pembelian', cat: '', amount: total, pbId, note: `Pembelian${sp ? ' dari ' + sp.name : ''}: ${rows.map(r => S.items[r.iid].name).join(', ')}`.slice(0, 120)});
    for (const r of rows) {
      const it = S.items[r.iid], mv = {id: uid('im'), pbId, at, iid: it.id, iname: it.name, type: 'beli', qty: r3(+r.qty), unit: it.unit, price: +r.price || 0, exp: r.exp || '', sid: sp ? d.sid : '', sname: sp ? sp.name : '', note: d.note || '', kasId, ...(editedAt ? {editedAt} : {})};
      const p = it.kind === 'jadi' && it.pid && S.products[it.pid];
      if (p) {
        const sm = {id: uid('s'), at, pid: p.id, pname: p.name, type: 'masuk', qty: r3(+r.qty * (+it.perUnit || 1)), note: `Dari pembelian ${it.name}`, pbId};
        await Store.addStock(sm); mv.stockId = sm.id;
        if (!p.trackStock) await Store.saveProduct({...p, trackStock: true, trackFrom: at - 1000});
      }
      await Store.addItemMove(mv);
    }
    if (old) {
      for (const m of old.lines) { if (m.stockId) await Store.delStock(m.stockId); await Store.delItemMove(m.id); }
      if (old.kasId && !kasId && S.kas[old.kasId]) await Store.delKas(old.kasId);
    }
    closeSheet(); render(); toast(old ? `Pembelian diperbarui · ${rp(total)}${kasId ? ' · Kas & Biaya ikut disesuaikan' : ''}` : `Pembelian ${rp(total)} dicatat${kasId ? ' dan masuk ke Kas & Biaya' : ''}`);
  } catch (e) { if (btn) btn.disabled = false; err('Gagal menyimpan: ' + errMsg(e)); }
}

/* ---------- Kalkulator HPP ----------
   Bahan baku are bought in a purchase unit and costed per base unit (gram, ml, pcs).
   Bahan olahan are batch recipes made from bahan baku; their cost is spread over the batch yield.
   Menu recipes use bahan baku and/or olahan per porsi; operating costs are spread over porsi per bulan. */
const HU = {kg: {b: 'gram', f: 1000}, ons: {b: 'gram', f: 100}, gram: {b: 'gram', f: 1}, liter: {b: 'ml', f: 1000}, ml: {b: 'ml', f: 1}, pcs: {b: 'pcs', f: 1}};
const YU = ['gram', 'ml', 'butir', 'porsi', 'pcs'];
const HPP_TABS = [['ringkasan', 'Ringkasan'], ['bahan', 'Bahan baku'], ['olahan', 'Bahan olahan'], ['menu', 'Menu & resep'], ['ops', 'Biaya operasional'], ['sim', 'Simulasi']];
function hppDefaults() {
  const B = (id, name, qty, unit, price) => ({id, name, qty, unit, price}), I = (ref, qty) => ({ref, qty});
  return {
    demo: true, target: 40, porsiBulan: 2000,
    bahan: [B('mie', 'Mie basah', 1, 'kg', 18000), B('ayam', 'Daging ayam fillet', 1, 'kg', 45000), B('kulit', 'Kulit & lemak ayam', 1, 'kg', 20000),
      B('tulang', 'Tulang & ceker ayam', 1, 'kg', 15000), B('sapi', 'Daging sapi giling', 1, 'kg', 120000), B('tapioka', 'Tepung tapioka', 1, 'kg', 14000),
      B('kecap', 'Kecap manis', 520, 'ml', 22000), B('bputih', 'Bawang putih', 1, 'kg', 40000), B('bmerah', 'Bawang merah', 1, 'kg', 45000),
      B('bumbu', 'Garam, merica & penyedap', 1, 'kg', 25000), B('sawi', 'Sawi hijau', 1, 'kg', 12000), B('dbawang', 'Daun bawang', 1, 'kg', 25000),
      B('bgoreng', 'Bawang goreng', 1, 'kg', 80000), B('minyak', 'Minyak goreng', 2, 'liter', 36000),
      B('mangkuk', 'Mangkuk styrofoam', 50, 'pcs', 25000), B('plastik', 'Plastik kuah', 100, 'pcs', 12000), B('sendok', 'Sendok plastik', 100, 'pcs', 15000)],
    olahan: [
      {id: 'topping', name: 'Topping ayam kecap', yield: 1200, yunit: 'gram', items: [I('b:ayam', 1000), I('b:kecap', 150), I('b:bputih', 40), I('b:bmerah', 40), I('b:minyak', 60), I('b:bumbu', 15)]},
      {id: 'kaldu', name: 'Kuah kaldu', yield: 5000, yunit: 'ml', items: [I('b:tulang', 1500), I('b:bputih', 40), I('b:bumbu', 40), I('b:dbawang', 50)]},
      {id: 'minyakayam', name: 'Minyak ayam', yield: 400, yunit: 'ml', items: [I('b:kulit', 500), I('b:minyak', 300), I('b:bputih', 50)]},
      {id: 'bakso', name: 'Bakso sapi', yield: 120, yunit: 'butir', items: [I('b:sapi', 1000), I('b:tapioka', 400), I('b:bputih', 40), I('b:bumbu', 25)]}],
    menus: [
      {id: 'biasa', name: 'Mie Ayam Biasa', price: 12000, type: 'utama', pid: '', items: [I('b:mie', 150), I('o:topping', 60), I('o:kaldu', 250), I('o:minyakayam', 10), I('b:sawi', 30), I('b:dbawang', 5), I('b:bgoreng', 3)]},
      {id: 'mbakso', name: 'Mie Ayam Bakso', price: 16000, type: 'utama', pid: '', items: [I('b:mie', 150), I('o:topping', 60), I('o:kaldu', 250), I('o:minyakayam', 10), I('b:sawi', 30), I('b:dbawang', 5), I('b:bgoreng', 3), I('o:bakso', 3)]},
      {id: 'jumbo', name: 'Mie Ayam Jumbo', price: 20000, type: 'utama', pid: '', items: [I('b:mie', 225), I('o:topping', 90), I('o:kaldu', 300), I('o:minyakayam', 15), I('b:sawi', 40), I('b:dbawang', 5), I('b:bgoreng', 4), I('o:bakso', 3)]},
      {id: 'bkuah', name: 'Bakso Kuah', price: 15000, type: 'utama', pid: '', items: [I('o:bakso', 7), I('o:kaldu', 350), I('b:sawi', 20), I('b:dbawang', 5), I('b:bgoreng', 3)]},
      {id: 'xbakso', name: 'Ekstra Bakso (3 butir)', price: 5000, type: 'tambahan', pid: '', items: [I('o:bakso', 3)]},
      {id: 'bungkus', name: 'Bungkus (kemasan)', price: 2000, type: 'tambahan', pid: '', items: [I('b:mangkuk', 1), I('b:plastik', 1), I('b:sendok', 1)]}],
    ops: [{name: 'Gas LPG 3 kg (12 tabung)', amount: 264000}, {name: 'Listrik', amount: 300000}, {name: 'Sewa tempat', amount: 500000}, {name: 'Gaji karyawan', amount: 1500000}, {name: 'Air & kebersihan', amount: 150000}],
    sim: {biasa: 700, mbakso: 600, jumbo: 250, bkuah: 300, xbakso: 150, bungkus: 500}, opname: {}
  };
}
const HP = () => S.hpp || (S.hpp = hppDefaults());
const bUnitCost = b => (+b.price || 0) / (((+b.qty || 0) * (HU[b.unit] || HU.gram).f) || 1);
const bBase = b => (HU[b.unit] || HU.gram).b;
function refInfo(ref) {
  const h = HP(), [k, id] = String(ref || '').split(':');
  if (k === 'b') { const b = h.bahan.find(x => x.id === id); return b ? {name: b.name, unit: bBase(b), cost: bUnitCost(b)} : null; }
  if (k === 'o') { const o = h.olahan.find(x => x.id === id); return o ? {name: o.name, unit: o.yunit, cost: olahCost(o).unit} : null; }
  return null;
}
function olahCost(o) {
  const batch = (o.items || []).reduce((s, it) => { const r = String(it.ref).startsWith('b:') ? refInfo(it.ref) : null; return s + (r ? r.cost * (+it.qty || 0) : 0); }, 0);
  return {batch, unit: +o.yield ? batch / o.yield : 0};
}
const recipeCost = items => (items || []).reduce((s, it) => { const r = refInfo(it.ref); return s + (r ? r.cost * (+it.qty || 0) : 0); }, 0);
const opsTotal = () => HP().ops.reduce((s, x) => s + (+x.amount || 0), 0);
const opsPer = () => +HP().porsiBulan ? opsTotal() / HP().porsiBulan : 0;
const up500 = n => Math.ceil(n / 500) * 500;
const rpd = n => 'Rp ' + (+n || 0).toLocaleString('id-ID', {maximumFractionDigits: Math.abs(n) < 100 ? 2 : 0});
const pctf = n => (Math.round((+n || 0) * 10) / 10).toLocaleString('id-ID') + '%';
function fmtBase(q, u) { if (u === 'gram' && Math.abs(q) >= 1000) return fq(r3(q / 1000)) + ' kg'; if (u === 'ml' && Math.abs(q) >= 1000) return fq(r3(q / 1000)) + ' liter'; return fq(r3(q)) + ' ' + u; }
function menuCalc(m) {
  const t = Math.min(+HP().target || 0, 95), bahan = recipeCost(m.items), ops = m.type === 'tambahan' ? 0 : opsPer(), hpp = bahan + ops, price = +m.price || 0, laba = price - hpp;
  return {bahan, ops, hpp, price, laba, margin: price ? laba / price * 100 : 0, food: price ? bahan / price * 100 : 0, saran: up500(hpp / (1 - t / 100))};
}
function usage() {
  const h = HP(), u = {}, add = (id, q) => { u[id] = (u[id] || 0) + q; };
  for (const m of h.menus) {
    const n = +h.sim[m.id] || 0; if (!n) continue;
    for (const it of m.items || []) {
      const [k, id] = String(it.ref).split(':'), q = (+it.qty || 0) * n;
      if (k === 'b') add(id, q);
      else if (k === 'o') { const o = h.olahan.find(x => x.id === id); if (o && +o.yield) for (const x of o.items || []) if (String(x.ref).startsWith('b:')) add(x.ref.slice(2), (+x.qty || 0) * q / o.yield); }
    }
  }
  return u;
}
let hppTimer;
function hppChanged(redraw) {
  HP().demo = false;
  clearTimeout(hppTimer);
  hppTimer = setTimeout(() => Store.saveHpp(S.hpp).then(syncHppCosts).catch(e => toast('Gagal menyimpan kalkulator HPP: ' + errMsg(e))), 600);
  if (redraw) render();
}
const olahanUsing = bid => HP().olahan.filter(o => (o.items || []).some(i => i.ref === 'b:' + bid));
function bahanOids(b) {
  if (!b) return [];
  if (Array.isArray(b.oids)) return b.oids.filter(id => HP().olahan.some(o => o.id === id));
  return b.id ? olahanUsing(b.id).map(o => o.id) : [];
}
function bahanPids(b) {
  if (!b) return [];
  if (Array.isArray(b.pids)) return b.pids.filter(id => S.products[id]);
  return b.id ? [...new Set(menusUsing(b.id).map(x => x.m.pid).filter(id => id && S.products[id]))] : [];
}
function menusUsing(bid) {
  const ol = olahanUsing(bid), out = [];
  for (const m of HP().menus) {
    const refs = (m.items || []).map(i => i.ref), direct = refs.includes('b:' + bid), via = ol.filter(o => refs.includes('o:' + o.id)).map(o => o.name);
    if (direct || via.length) out.push({m, via: direct ? [] : via});
  }
  return out;
}
const usedIn = ref => [...HP().olahan.filter(o => (o.items || []).some(i => i.ref === ref)).map(o => o.name), ...HP().menus.filter(m => (m.items || []).some(i => i.ref === ref)).map(m => m.name)];

function vHpp() {
  const tab = HPP_TABS.some(([k]) => k === S.hppTab) ? S.hppTab : 'ringkasan', h = HP();
  return `<div class="vhead"><div><h2>Kalkulator HPP</h2><p class="muted">Hitung modal per porsi, harga jual ideal, dan pemakaian bahan standar${h.demo ? ' · <b>berisi data contoh</b>, ubah sesuai harga Anda' : ''}</p></div>
      ${h.demo ? '<button class="btn ghost" data-act="hpp-reset">Mulai dari kosong</button>' : ''}</div>
    <div class="seg scroll" role="tablist">${HPP_TABS.map(([k, l]) => `<button role="tab" class="${tab === k ? 'on' : ''}" aria-selected="${tab === k}" data-act="hpp-tab" data-v="${k}">${l}</button>`).join('')}</div>
    ${({ringkasan: hRing, bahan: hBahan, olahan: hOlah, menu: hMenu, ops: hOps, sim: hSim})[tab]()}`;
}
function hRing() {
  const h = HP();
  return `<div class="stack"><div class="stats">
      <div class="stat"><label for="hpp-target"><small>Target margin laba</small></label><div class="pin"><input id="hpp-target" class="num" inputmode="decimal" value="${fq(h.target)}"><span>%</span></div></div>
      <div class="stat"><small>Biaya operasional per porsi</small><b class="num">${rp(opsPer())}</b><em>${rp(opsTotal())} ÷ ${fq(h.porsiBulan)} porsi/bulan</em></div>
      <div class="stat"><small>Jumlah menu</small><b class="num">${h.menus.length}</b><em>${h.menus.filter(m => m.type === 'tambahan').length} tambahan</em></div>
      <div class="stat"><small>Bahan baku</small><b class="num">${h.bahan.length}</b><em>${h.olahan.length} bahan olahan</em></div></div>
    <div id="hpp-sum">${hSumTable()}</div>
    <p class="hint">HPP per porsi = biaya bahan + biaya operasional per porsi (menu tambahan tanpa biaya operasional). Saran harga = HPP ÷ (1 − target margin), dibulatkan ke atas per Rp 500. Untuk “modal” produk di kasir, pakai HPP bahan saja, karena gas, listrik, sewa dan gaji sudah dicatat sebagai beban di menu Kas.</p></div>`;
}
function hSumTable() {
  const h = HP(), t = +h.target || 0;
  if (!h.menus.length) return '<div class="empty"><b>Belum ada menu</b>Tambahkan menu & resep di tab “Menu & resep”.</div>';
  return `<div class="tbl-wrap"><table class="wide"><thead><tr><th>Menu</th><th class="n">Harga jual</th><th class="n">Biaya bahan</th><th class="n">Biaya operasional</th><th class="n">HPP / porsi</th><th class="n">Laba</th><th class="n">Margin</th><th class="n">Food cost</th><th class="n">Saran harga</th><th>Kasir</th></tr></thead><tbody>
    ${h.menus.map(m => { const c = menuCalc(m), p = m.pid && S.products[m.pid]; return `<tr><td><b>${esc(m.name)}</b>${m.type === 'tambahan' ? '<span class="tag">Tambahan</span>' : ''}</td><td class="n">${rp(c.price)}</td><td class="n">${rp(c.bahan)}</td><td class="n">${rp(c.ops)}</td><td class="n"><b>${rp(c.hpp)}</b></td>
      <td class="n ${c.laba < 0 ? 'neg' : ''}">${rpS(c.laba)}</td><td class="n"><span class="spill ${c.margin >= t ? 'ok' : c.margin >= t / 2 ? 'low' : 'out'}">${pctf(c.margin)}</span></td><td class="n">${pctf(c.food)}</td>
      <td class="n">${c.saran > c.price ? `<b>${rp(c.saran)}</b>` : `<span class="muted">${rp(c.saran)}</span>`}</td>
      <td>${p ? `<button class="btn ghost sm" data-act="hpp-apply" data-id="${esc(m.id)}" title="Modal ${esc(p.name)} sekarang ${rp(p.cost)}">Modal = ${rp(Math.round(c.bahan))}</button>` : '<span class="muted" style="font-size:12px">belum terhubung</span>'}</td></tr>`; }).join('')}
    </tbody></table></div>`;
}
function hBahan() {
  const h = HP();
  return `<div class="stack"><div><button class="btn primary" data-act="hb-new">+ Tambah bahan baku</button></div>
    ${h.bahan.length ? `<div class="tbl-wrap"><table><thead><tr><th>Bahan</th><th class="n">Beli</th><th class="n">Harga beli</th><th class="n">Harga per satuan dasar</th><th>Bahan olahan</th><th>Dipakai di produk</th><th></th></tr></thead><tbody>
      ${h.bahan.map(b => { const ol = bahanOids(b).map(id => HP().olahan.find(o => o.id === id)).filter(Boolean); return `<tr><td><b>${esc(b.name)}</b></td><td class="n">${fq(b.qty)} ${b.unit}</td><td class="n">${rp(b.price)}</td><td class="n"><b>${rpd(bUnitCost(b))}</b> / ${bBase(b)}</td><td>${ol.length ? `<div class="uselist">${ol.map(o => `<span class="uchip ol">${esc(o.name)}</span>`).join('')}</div>` : '<span class="muted" style="font-size:12.5px">–</span>'}</td>
        <td>${(() => { const ps = bahanPids(b).map(id => S.products[id]).filter(Boolean); return ps.length ? `<ul class="umenu">${ps.map(p => `<li><b>${esc(p.name)}</b><small>${esc(p.cat)}</small></li>`).join('')}</ul>` : '<span class="muted" style="font-size:12.5px">belum dipilih</span>'; })()}</td>
        <td><div class="li-act"><button class="iconbtn" data-act="hb-edit" data-id="${esc(b.id)}" aria-label="Ubah ${esc(b.name)}">${ICONS.edit}</button><button class="iconbtn danger-ic" data-act="hb-del" data-id="${esc(b.id)}" aria-label="Hapus ${esc(b.name)}">${ICONS.trash}</button></div></td></tr>`; }).join('')}</tbody></table></div>`
      : '<div class="empty"><b>Belum ada bahan baku</b>Masukkan bahan sesuai cara membelinya, mis. 1 kg ayam Rp 45.000. Harga per gram dihitung otomatis.</div>'}</div>`;
}
function recipeLines(items) {
  return `<ul class="rlist">${(items || []).map(it => { const r = refInfo(it.ref); return r ? `<li><span>${esc(r.name)} <small class="muted">${fmtBase(+it.qty || 0, r.unit)}</small></span><span class="num">${rp(r.cost * (+it.qty || 0))}</span></li>` : ''; }).join('')}</ul>`;
}
function hOlah() {
  const h = HP();
  return `<div class="stack"><div><button class="btn primary" data-act="ho-new">+ Tambah bahan olahan</button></div>
    ${h.olahan.length ? `<div class="receipts">${h.olahan.map(o => { const c = olahCost(o); return `<article class="card rcard"><div class="sup-h"><div><b>${esc(o.name)}</b><small>Hasil 1 batch: ${fmtBase(+o.yield || 0, o.yunit)}</small></div>
      <div class="li-act"><button class="iconbtn" data-act="ho-edit" data-id="${esc(o.id)}" aria-label="Ubah ${esc(o.name)}">${ICONS.edit}</button><button class="iconbtn danger-ic" data-act="ho-del" data-id="${esc(o.id)}" aria-label="Hapus ${esc(o.name)}">${ICONS.trash}</button></div></div>
      ${recipeLines(o.items)}<div class="sup-meta"><span><small>Biaya per batch</small><b class="num">${rp(c.batch)}</b></span><span><small>Biaya per ${o.yunit === 'gram' || o.yunit === 'ml' ? o.yunit : 1 + ' ' + o.yunit}</small><b class="num">${rpd(c.unit)}</b></span><span><small>Dipakai di</small><b>${usedIn('o:' + o.id).length} menu</b></span></div></article>`; }).join('')}</div>`
      : '<div class="empty"><b>Belum ada bahan olahan</b>Contoh: 1 kg daging sapi + 250 g tapioka menjadi 100 butir bakso.</div>'}</div>`;
}
function hMenu() {
  const h = HP();
  return `<div class="stack"><div><button class="btn primary" data-act="hm-new">+ Tambah menu</button></div>
    ${h.menus.length ? `<div class="receipts">${h.menus.map(m => { const c = menuCalc(m), p = m.pid && S.products[m.pid]; return `<article class="card rcard"><div class="sup-h"><div><b>${esc(m.name)}</b>${m.type === 'tambahan' ? '<span class="tag">Tambahan</span>' : ''}<small>Harga jual ${rp(m.price)}${p ? ' · terhubung ke ' + esc(p.name) : ''}</small></div>
      <div class="li-act"><button class="iconbtn" data-act="hm-edit" data-id="${esc(m.id)}" aria-label="Ubah ${esc(m.name)}">${ICONS.edit}</button><button class="iconbtn danger-ic" data-act="hm-del" data-id="${esc(m.id)}" aria-label="Hapus ${esc(m.name)}">${ICONS.trash}</button></div></div>
      ${recipeLines(m.items)}<div class="sup-meta"><span><small>Biaya bahan</small><b class="num">${rp(c.bahan)}</b></span><span><small>HPP / porsi</small><b class="num">${rp(c.hpp)}</b></span><span><small>Margin</small><b class="num ${c.laba < 0 ? 'neg' : ''}">${pctf(c.margin)}</b></span></div></article>`; }).join('')}</div>`
      : '<div class="empty"><b>Belum ada menu</b>Tambahkan menu dan takaran bahan per porsi.</div>'}</div>`;
}
function hOps() {
  const h = HP();
  return `<div class="stack"><div class="card"><h3>Biaya operasional per bulan</h3>
      <div class="oplist">${h.ops.map((x, i) => `<div class="oprow"><input data-op="${i}" data-opk="name" value="${esc(x.name)}" aria-label="Nama biaya" placeholder="Nama biaya"><div class="pin"><span>Rp</span><input data-op="${i}" data-opk="amount" class="num" inputmode="numeric" value="${(+x.amount || 0).toLocaleString('id-ID')}" aria-label="Jumlah per bulan"></div><button class="iconbtn danger-ic" data-act="op-del" data-v="${i}" aria-label="Hapus biaya">${ICONS.trash}</button></div>`).join('')}</div>
      <button class="btn ghost sm" data-act="op-add" style="margin-top:10px">+ Tambah biaya</button></div>
    <div class="card"><div class="field" style="max-width:280px"><label for="hpp-porsi">Perkiraan porsi terjual per bulan</label><div class="pin"><input id="hpp-porsi" class="num" inputmode="numeric" value="${(+h.porsiBulan || 0).toLocaleString('id-ID')}"><span>porsi</span></div><span class="hint">Hanya menu utama. Menu tambahan tidak menanggung biaya operasional.</span></div></div>
    <div id="ops-out">${opsOut()}</div></div>`;
}
const opsOut = () => `<div class="stats"><div class="stat"><small>Total per bulan</small><b class="num">${rp(opsTotal())}</b></div><div class="stat"><small>Per hari (30 hari)</small><b class="num">${rp(opsTotal() / 30)}</b></div><div class="stat"><small>Per porsi</small><b class="num">${rp(opsPer())}</b></div><div class="stat"><small>Porsi per hari</small><b class="num">${fq(Math.round((+HP().porsiBulan || 0) / 30))}</b></div></div>`;
function hSim() {
  const h = HP();
  return `<div class="stack"><div class="card"><h3>Jumlah porsi terjual</h3><p class="muted" style="margin:-4px 0 10px">Isi jumlah terjual untuk satu periode (mis. sehari, seminggu, atau sebulan).</p>
      <div class="simgrid">${h.menus.map(m => `<label class="simrow"><span>${esc(m.name)}${m.type === 'tambahan' ? ' <span class="tag">Tambahan</span>' : ''}</span><input data-sim="${esc(m.id)}" class="num" inputmode="numeric" value="${(+h.sim[m.id] || 0).toLocaleString('id-ID')}" aria-label="Porsi ${esc(m.name)}"></label>`).join('')}</div></div>
    <div id="sim-out">${simOut()}</div></div>`;
}
function simOut() {
  const h = HP(); let omzet = 0, bahan = 0, porsiUtama = 0;
  const rows = h.menus.map(m => { const n = +h.sim[m.id] || 0, c = menuCalc(m); omzet += n * c.price; bahan += n * c.bahan; if (m.type !== 'tambahan') porsiUtama += n;
    return `<tr><td>${esc(m.name)}</td><td class="n">${fq(n)}</td><td class="n">${rp(n * c.price)}</td><td class="n">${rp(n * c.bahan)}</td><td class="n">${rp(n * (c.price - c.bahan))}</td></tr>`; }).join('');
  const ops = porsiUtama * opsPer(), laba = omzet - bahan - ops, use = usage();
  return `<div class="stack"><div class="stats">
      <div class="stat"><small>Omzet</small><b class="num">${rp(omzet)}</b></div>
      <div class="stat"><small>Biaya bahan (HPP bahan)</small><b class="num">${rp(bahan)}</b><em>food cost ${pctf(omzet ? bahan / omzet * 100 : 0)}</em></div>
      <div class="stat"><small>Biaya operasional teralokasi</small><b class="num">${rp(ops)}</b><em>${fq(porsiUtama)} porsi × ${rp(opsPer())}</em></div>
      <div class="stat"><small>Laba bersih</small><b class="num ${laba < 0 ? 'neg' : ''}">${rpS(laba)}</b><em>margin ${pctf(omzet ? laba / omzet * 100 : 0)}</em></div></div>
    <div class="tbl-wrap"><div class="tcap"><h3>Per menu</h3></div><table><thead><tr><th>Menu</th><th class="n">Porsi</th><th class="n">Omzet</th><th class="n">Biaya bahan</th><th class="n">Laba kotor</th></tr></thead><tbody>${rows}</tbody>
      <tfoot><tr><td>Total</td><td></td><td class="n">${rp(omzet)}</td><td class="n">${rp(bahan)}</td><td class="n">${rp(omzet - bahan)}</td></tr></tfoot></table></div>
    <div class="tbl-wrap"><div class="tcap"><h3>Pemakaian standar bahan mentah</h3></div>
      <p class="muted" style="margin:0 14px 8px;font-size:13px">Cocokkan dengan stok opname. Isi pemakaian sebenarnya (stok awal + pembelian − stok akhir) dalam satuan dasar untuk melihat selisihnya.</p>
      <table><thead><tr><th>Bahan</th><th class="n">Pemakaian standar</th><th class="n">Nilai</th><th class="n">Pemakaian aktual (opname)</th><th class="n">Selisih</th></tr></thead><tbody>
      ${h.bahan.filter(b => use[b.id]).map(b => { const q = use[b.id], u = bBase(b), act = h.opname[b.id]; return `<tr><td>${esc(b.name)}</td><td class="n"><b>${fmtBase(q, u)}</b></td><td class="n">${rp(q * bUnitCost(b))}</td>
        <td class="n"><div class="pin sm"><input data-opn="${esc(b.id)}" class="num" inputmode="decimal" value="${act != null && act !== '' ? fq(act) : ''}" placeholder="–" aria-label="Pemakaian aktual ${esc(b.name)} (${u})"><span>${u}</span></div></td>
        <td class="n" id="opd-${esc(b.id)}">${opnDiff(b, q)}</td></tr>`; }).join('') || '<tr><td colspan="5" class="muted">Isi jumlah porsi di atas.</td></tr>'}</tbody></table></div></div>`;
}
function opnDiff(b, q) {
  const act = HP().opname[b.id]; if (act == null || act === '') return '<span class="muted">–</span>';
  const d = act - q, p = q ? d / q * 100 : 0;
  return `<span class="spill ${Math.abs(p) <= 5 ? 'ok' : Math.abs(p) <= 10 ? 'low' : 'out'}">${d > 0 ? '+' : d < 0 ? '−' : ''}${fmtBase(Math.abs(d), bBase(b))} (${pctf(p)})</span>`;
}
function hbForm(b) {
  b = b || {qty: 1, unit: 'kg'};
  return `<h3>${b.id ? 'Ubah bahan baku' : 'Tambah bahan baku'}</h3><form data-form="hb" data-id="${esc(b.id || '')}" novalidate>
    <div class="field"><label for="hb-name">Nama bahan</label><input id="hb-name" name="name" value="${esc(b.name || '')}" maxlength="50" placeholder="mis. Daging ayam fillet"></div>
    <div class="two"><div class="field"><label for="hb-qty">Jumlah beli</label><input id="hb-qty" name="qty" inputmode="decimal" value="${b.qty ? fq(b.qty) : ''}"></div>
      <div class="field"><label for="hb-unit">Satuan beli</label><select id="hb-unit" name="unit">${Object.keys(HU).map(k => `<option ${k === b.unit ? 'selected' : ''}>${k}</option>`).join('')}</select></div></div>
    ${money('hb-price', 'Harga beli', b.price)}
    <fieldset class="field pfield"><legend class="lb">Bahan olahan</legend>
      ${HP().olahan.length ? `<div class="plist">${HP().olahan.map(o => `<label class="pcheck other"><input type="checkbox" name="oids" value="${esc(o.id)}" ${bahanOids(b).includes(o.id) ? 'checked' : ''}><span class="ico" style="background:var(--k-soft);color:var(--k-ink)">${esc(initials(o.name))}</span><span><b>${esc(o.name)}</b><small>Hasil 1 batch: ${fmtBase(+o.yield || 0, o.yunit)}</small></span></label>`).join('')}</div>`
        : '<p class="muted" style="margin:0">Belum ada bahan olahan. Tambahkan di tab Bahan olahan.</p>'}
      <span class="hint">Centang bahan olahan yang memakai bahan ini. Olahan yang resepnya sudah memakai bahan ini otomatis tercentang; takarannya diatur di tab Bahan olahan.</span></fieldset>
    <fieldset class="field pfield"><legend class="lb">Dipakai di produk</legend>
      ${productsSorted().length ? `<div class="plist">${productsSorted().map(p => `<label class="pcheck ${catKind(p.cat)}"><input type="checkbox" name="pids" value="${esc(p.id)}" ${bahanPids(b).includes(p.id) ? 'checked' : ''}><span class="ico" style="background:var(--k-soft);color:var(--k-ink)">${esc(initials(p.name))}</span><span><b>${esc(p.name)}</b><small>${esc(p.cat)}${p.active === false ? ' · disembunyikan' : ''}</small></span></label>`).join('')}</div>`
        : '<p class="muted" style="margin:0">Belum ada produk di kasir. Tambahkan di menu Produk.</p>'}
      <span class="hint">Centang produk kasir yang memakai bahan ini. Produk yang terhubung lewat Menu & resep sudah otomatis tercentang.</span></fieldset>
    <p class="hint" id="hb-hint"></p><p class="err" id="hb-err" hidden></p>
    <div class="two"><button type="button" class="btn ghost" data-act="close-sheet">Batal</button><button class="btn primary" type="submit">Simpan</button></div></form>`;
}
function hbHint() {
  const el = $('#hb-hint'); if (!el) return;
  const b = {qty: parseQty($('#hb-qty').value), unit: $('#hb-unit').value, price: digits($('#hb-price').value)};
  el.textContent = b.qty && b.price ? `= ${rpd(bUnitCost(b))} per ${bBase(b)}` : 'Harga per gram/ml/pcs dihitung otomatis.';
}
function recipeSheet() {
  const d = S.draft, isMenu = d.kind === 'menu', h = HP();
  const opts = [...h.bahan.map(b => ['b:' + b.id, b.name + ' (' + bBase(b) + ')']), ...(isMenu ? h.olahan.map(o => ['o:' + o.id, '◆ ' + o.name + ' (' + o.yunit + ')']) : [])];
  return `<h3>${d.id ? 'Ubah' : 'Tambah'} ${isMenu ? 'menu & resep' : 'bahan olahan'}</h3><div class="rform">
    <div class="field"><label for="rd-name">${isMenu ? 'Nama menu' : 'Nama bahan olahan'}</label><input id="rd-name" data-d="name" value="${esc(d.name || '')}" maxlength="50" placeholder="${isMenu ? 'mis. Mie Ayam Bakso' : 'mis. Bakso sapi'}"></div>
    ${isMenu ? `<div class="two">${money('rd-price', 'Harga jual', d.price).replace('<input', '<input data-d="price"')}<div class="field"><label for="rd-type">Jenis</label><select id="rd-type" data-d="type"><option value="utama" ${d.type !== 'tambahan' ? 'selected' : ''}>Menu utama</option><option value="tambahan" ${d.type === 'tambahan' ? 'selected' : ''}>Tambahan (ekstra/bungkus)</option></select></div></div>
      <div class="field"><label for="rd-pid">Hubungkan ke produk kasir (opsional)</label><select id="rd-pid" data-d="pid"><option value="">— Tidak dihubungkan —</option>${productsSorted().map(p => `<option value="${esc(p.id)}" ${p.id === d.pid ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></div>`
    : `<div class="two"><div class="field"><label for="rd-yield">Hasil 1 batch</label><input id="rd-yield" data-d="yield" inputmode="decimal" value="${d.yield ? fq(d.yield) : ''}" placeholder="mis. 100"></div><div class="field"><label for="rd-yunit">Satuan hasil</label><select id="rd-yunit" data-d="yunit">${YU.map(u => `<option ${u === d.yunit ? 'selected' : ''}>${u}</option>`).join('')}</select></div></div>`}
    <span class="lb">${isMenu ? 'Takaran per porsi' : 'Bahan untuk 1 batch'}</span>
    <div class="rrows">${d.items.map((it, i) => { const r = refInfo(it.ref); return `<div class="rrow"><select data-r="${i}" data-rk="ref" aria-label="Bahan ${i + 1}"><option value="">Pilih bahan…</option>${opts.map(([v, l]) => `<option value="${v}" ${v === it.ref ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>
      <div class="pin sm"><input data-r="${i}" data-rk="qty" class="num" inputmode="decimal" value="${it.qty ? fq(it.qty) : ''}" placeholder="0" aria-label="Takaran ${i + 1}"><span>${r ? r.unit : ''}</span></div>
      <button type="button" class="iconbtn danger-ic" data-act="r-del" data-v="${i}" aria-label="Hapus baris">${ICONS.trash}</button></div>`; }).join('')}</div>
    <button type="button" class="btn ghost sm" data-act="r-add">+ Tambah bahan</button>
    <div class="change" id="r-cost">${draftCost()}</div>
    <p class="err" id="rd-err" hidden></p>
    <div class="two"><button type="button" class="btn ghost" data-act="close-sheet">Batal</button><button type="button" class="btn primary" data-act="r-save">Simpan</button></div></div>`;
}
function draftCost() {
  const d = S.draft, c = recipeCost(d.items.filter(i => d.kind === 'menu' || String(i.ref).startsWith('b:')));
  if (d.kind === 'menu') return `<span>Biaya bahan per porsi</span><span class="num">${rp(c)}</span>`;
  return `<span>Per batch ${rp(c)}</span><span class="num">${+d.yield ? rpd(c / d.yield) + ' / ' + (d.yunit || '') : '–'}</span>`;
}
const redrawSheet = () => { if (S.sheet) $('#sheet-body').innerHTML = S.sheet.render(); };
function openRecipe(kind, obj) {
  const base = kind === 'menu' ? {kind, name: '', price: 0, type: 'utama', pid: '', items: []} : {kind, name: '', yield: 0, yunit: 'gram', items: []};
  S.draft = {...base, ...(obj ? JSON.parse(JSON.stringify(obj)) : {}), kind};
  if (!S.draft.items.length) S.draft.items.push({ref: '', qty: 0});
  openSheet(recipeSheet);
}
function saveRecipe() {
  const d = S.draft, h = HP(), err = m => { const e = $('#rd-err'); e.textContent = m; e.hidden = false; };
  const name = String(d.name || '').trim(), items = d.items.filter(i => refInfo(i.ref) && +i.qty > 0).map(i => ({ref: i.ref, qty: +i.qty}));
  if (!name) return err('Isi nama.');
  if (!items.length) return err('Tambahkan minimal satu bahan dengan takarannya.');
  if (d.kind === 'menu') {
    if (!(+d.price > 0)) return err('Isi harga jual.');
    const m = {id: d.id || uid('m'), name, price: +d.price, type: d.type === 'tambahan' ? 'tambahan' : 'utama', pid: d.pid || '', items};
    const i = h.menus.findIndex(x => x.id === m.id); if (i >= 0) h.menus[i] = m; else h.menus.push(m);
  } else {
    if (!(+d.yield > 0)) return err('Isi jumlah hasil 1 batch.');
    const o = {id: d.id || uid('o'), name, yield: +d.yield, yunit: d.yunit || 'gram', items};
    const i = h.olahan.findIndex(x => x.id === o.id); if (i >= 0) h.olahan[i] = o; else h.olahan.push(o);
  }
  closeSheet(); hppChanged(true); toast('Tersimpan');
}

/* ---------- HPP report ---------- */
function rHPP(R) {
  const L = ledger(R.start, R.end), a = position(R.start - 1).inv, z = position(R.end).inv;
  const tx = allTx().filter(t => !t.void && t.at >= R.start && t.at <= R.end), g = {};
  for (const t of tx) for (const it of t.items) {
    const k = it.pid + '|' + it.cost, x = g[k] || (g[k] = {name: it.name, unit: itUnit(it), cost: +it.cost, qty: 0, hpp: 0, sales: 0});
    x.qty = r3(x.qty + (+it.qty || 0)); x.hpp += lineAmt(it.cost, it.qty); x.sales += lineAmt(it.price, it.qty);
  }
  const rows = Object.values(g).sort((p, q) => q.hpp - p.hpp);
  return `<div class="stack"><section class="statement">${stHead('Laporan Harga Pokok Penjualan', 'Periode ' + fmtRange(R.start, R.end))}
    ${row('Persediaan bahan awal', a)}${row('Pembelian bahan', L.pembelian, 'ind')}${row('Barang tersedia untuk dijual', a + L.pembelian, 'sub')}
    ${row('Persediaan bahan akhir', -z, 'ind')}${row('Harga pokok penjualan', a + L.pembelian - z, 'total')}
    <p class="st-note">HPP = persediaan awal + pembelian − persediaan akhir. Persediaan dihitung dari saldo awal, belanja bahan di Kas, dan modal per satuan setiap barang yang terjual. Rasio HPP terhadap penjualan: <b>${L.sales ? fq(Math.round((L.cogs / L.sales) * 1000) / 10) : 0}%</b>.</p></section>
    <div class="tbl-wrap"><div class="tcap"><h3>HPP per produk</h3></div>
      ${rows.length ? `<table><thead><tr><th>Produk</th><th class="n">Qty</th><th class="n">Modal/satuan</th><th class="n">HPP</th><th class="n">% dari penjualan</th></tr></thead><tbody>
      ${rows.map(x => `<tr><td>${esc(x.name)}</td><td class="n">${qu(x.qty, x.unit)}</td><td class="n">${rp(x.cost)}</td><td class="n">${rp(x.hpp)}</td><td class="n">${x.sales ? fq(Math.round(x.hpp / x.sales * 1000) / 10) : 0}%</td></tr>`).join('')}</tbody>
      <tfoot><tr><td>Total</td><td></td><td></td><td class="n">${rp(L.cogs)}</td><td class="n">${L.sales ? fq(Math.round(L.cogs / L.sales * 1000) / 10) : 0}%</td></tr></tfoot></table>` : '<p class="muted" style="padding:0 14px 14px;margin:0">Belum ada penjualan pada periode ini.</p>'}</div></div>`;
}
const parseQty = v => r3(parseFloat(String(v || '').replace(/\./g, '').replace(',', '.')) || 0);
function productUsage(pid) { return allTx().filter(t => !t.void && t.items.some(it => it.pid === pid)).reverse(); }
function prodBlockedSheet(p, used) {
  const qty = used.reduce((s, t) => s + t.items.filter(it => it.pid === p.id).reduce((a, it) => a + (+it.qty || 0), 0), 0);
  const days = [...new Set(used.map(t => t.day))];
  return `<h3>Produk belum bisa dihapus</h3>
    <p class="muted" style="margin-top:-4px">“${esc(p.name)}” masih tercatat di <b>${used.length} transaksi</b> pada laporan (${qu(r3(qty), unitOf(p))} terjual, ${days.length} hari). Hapus dulu transaksi tersebut dari laporan lewat tombol <b>Batalkan (hapus dari laporan)</b> di Riwayat atau ikon hapus di Laporan Penjualan. Setelah semuanya terhapus, produk bisa dihapus.</p>
    <div class="list" style="margin:12px 0">${used.slice(0, 5).map(t => `<div class="li"><span class="ico">${pad3(t.no || 0)}</span><div><div class="t">${fmtD(t.at, {weekday: 'short', day: 'numeric', month: 'short'})} · ${fmtT(t.at)}</div><div class="s">${t.items.map(it => qu(it.qty, itUnit(it)) + ' ' + esc(it.name)).join(', ')}</div></div><button class="btn ghost sm" data-act="goto-tx" data-v="${t.day}">Lihat</button></div>`).join('')}
      ${used.length > 5 ? `<div class="li-h">dan ${used.length - 5} transaksi lainnya</div>` : ''}</div>
    <p class="hint">Kalau produk hanya tidak dijual lagi, sembunyikan saja dari kasir. Riwayat dan laporannya tetap utuh.</p>
    <div class="two" style="margin-top:12px"><button class="btn ghost" data-act="close-sheet">Tutup</button>${p.active === false ? '' : `<button class="btn primary" data-act="hide-prod" data-id="${esc(p.id)}">Sembunyikan dari kasir</button>`}</div>`;
}
function histDelSheet() {
  const d = S.histDel || (S.histDel = {from: S.histDate, to: S.histDate});
  const a = d.from <= d.to ? d.from : d.to, b = d.from <= d.to ? d.to : d.from;
  const txs = allTx().filter(t => t.day >= a && t.day <= b), act = txs.filter(t => !t.void), vd = txs.length - act.length;
  return `<h3>Hapus riwayat transaksi</h3><form data-form="hist-del" novalidate>
    <p class="muted" style="margin:-6px 0 0">Transaksi penjualan pada rentang tanggal ini dihapus permanen dari riwayat dan semua laporan.</p>
    <div class="two"><div class="field"><label for="hd-from">Dari tanggal</label><input type="date" id="hd-from" data-hd="from" value="${esc(d.from)}" max="${dayKey(Date.now())}"></div>
      <div class="field"><label for="hd-to">Sampai tanggal</label><input type="date" id="hd-to" data-hd="to" value="${esc(d.to)}" max="${dayKey(Date.now())}"></div></div>
    <div class="chips" style="margin:0"><button type="button" class="chip" data-act="hd-range" data-v="day">Tanggal ini saja</button><button type="button" class="chip" data-act="hd-range" data-v="month">Bulan ini</button><button type="button" class="chip" data-act="hd-range" data-v="all">Semua tanggal</button></div>
    <div class="change" style="margin:4px 0 0">${txs.length ? `Akan dihapus: <b>${txs.length} transaksi</b>${vd ? ` (${vd} sudah dibatalkan)` : ''} senilai <b>${rp(act.reduce((x, t) => x + (+t.total || 0), 0))}</b>, dari ${[...new Set(txs.map(t => t.day))].length} hari.` : 'Tidak ada transaksi pada rentang ini.'}</div>
    <div class="field"><label for="hd-confirm">Ketik <b>HAPUS</b> untuk melanjutkan</label><input id="hd-confirm" name="confirm" autocomplete="off" placeholder="HAPUS"></div>
    <p class="hint warn">Tidak bisa dikembalikan. Omzet, laba, neraca, dan arus kas pada tanggal tersebut ikut berubah, dan stok produk yang terjual dikembalikan. Catatan kas dan pembelian tidak terhapus. Untuk sekadar membatalkan satu transaksi tapi tetap menyimpan catatannya, gunakan <b>Batalkan</b> pada struk.</p>
    <p class="err" id="hd-err" hidden></p>
    <div class="two"><button type="button" class="btn ghost" data-act="close-sheet">Batal</button><button class="btn danger" type="submit" ${txs.length ? '' : 'disabled'}>Hapus permanen</button></div></form>`;
}
function clearTxSheet() {
  const nTx = allTx().length, nDay = Object.keys(S.days).length, nKas = kasList().length, nStock = stockMoves().length, nOrd = savedOrders().length;
  const box = (name, n, label, on) => `<label class="check"><input type="checkbox" name="${name}" ${on && n ? 'checked' : ''} ${n ? '' : 'disabled'}> ${label} <span class="muted">(${n})</span></label>`;
  return `<h3>Hapus data transaksi</h3><form data-form="clear-tx" novalidate>
    <p class="muted" style="margin:-6px 0 0">Pilih data yang dihapus. Menu, harga, supplier, saldo awal, dan Kalkulator HPP tetap tersimpan.</p>
    ${box('sales', nTx, `Semua transaksi penjualan (${nDay} hari)`, true)}
    ${box('kas', nKas, 'Semua catatan kas (belanja bahan, beban, modal, prive)', true)}
    ${box('stock', nStock, 'Semua catatan stok masuk, koreksi & pembelian supplier', false)}
    ${box('orders', nOrd, 'Pesanan tersimpan yang belum dibayar', false)}
    <div class="field"><label for="ct-confirm">Ketik <b>HAPUS</b> untuk melanjutkan</label><input id="ct-confirm" name="confirm" autocomplete="off" placeholder="HAPUS"></div>
    <p class="hint warn">Data yang dihapus tidak bisa dikembalikan. Laporan penjualan, laba rugi, neraca, dan arus kas akan mulai dari nol (hanya saldo awal).</p>
    <p class="err" id="ct-err" hidden></p>
    <div class="two"><button type="button" class="btn ghost" data-act="close-sheet">Batal</button><button class="btn danger" type="submit">Hapus permanen</button></div></form>`;
}
function sortSheet() {
  return `<h3>Urutkan menu</h3><div class="sortlist">${Object.entries(SORTS).map(([k, l]) => `<button class="${S.sort === k ? 'on' : ''}" data-act="set-sort" data-v="${k}">${l}${S.sort === k ? ICONS.check : ''}</button>`).join('')}</div>`;
}
function vCartBar() {
  if (isCust()) { const n = cartCount(), mo = myOrders().length; return `<div class="cb-in"><button class="cb-saved" data-act="nav" data-v="pesananku" aria-label="Pesanan saya (${mo})">${ICONS.pesananku}${mo ? `<span class="badge">${mo}</span>` : ''}</button><button class="cb-sum" data-act="open-cart"><span class="cb-count num">${fq(n)}</span><span><small>${n ? 'Lihat keranjang' : 'Keranjang kosong'}</small><b class="num">${rp(cartTotal(cartLines()))}</b></span></button><button class="paybig" data-act="c-send" ${n ? '' : 'disabled'}>Pesan</button></div>`; }
  const lines = cartLines(), total = payTotal(), n = lines.reduce((s, l) => s + l.q, 0), sv = alerts().length;
  return `<div class="cb-in"><button class="cb-saved" data-act="notif" aria-label="Notifikasi (${sv})">${ICONS.bell}${sv ? `<span class="badge">${sv}</span>` : ''}</button>
    <button class="cb-sum" data-act="open-cart"><span class="cb-count num">${n}</span><span><small>${n ? 'Lihat pesanan' : 'Belum ada pesanan'}</small><b class="num">${rp(total)}</b></span></button>
    <button class="paybig" data-act="pay" ${n && !S.paying ? '' : 'disabled'}>Bayar</button></div>`;
}

function receipt(t, noVoid) {
  return `<article class="rcpt ${t.void ? 'void' : ''}"><header><b>No. ${pad3(t.no || 0)}${t.customer ? ' · ' + esc(t.customer) : ''}${t.orderType === 'take' ? ' <span class="tag">Bungkus</span>' : ''}${t.tableName ? ` <span class="tag">${esc(t.tableName)}</span>` : ''}</b><span>${fmtD(t.at, {day: 'numeric', month: 'short'})} · ${fmtT(t.at)}</span></header>
    <ul>${t.items.map(it => `<li><span>${esc(it.name)}<small class="num">${qu(it.qty, itUnit(it))} × ${rp(it.price)}</small>${it.note ? `<small class="inote">Catatan: ${esc(it.note)}</small>` : ''}</span><b class="num">${rp(lineAmt(it.price, it.qty))}</b></li>`).join('')}</ul>
    ${t.discount ? `<div class="paidrow"><span>Subtotal <b class="num">${rp(t.subtotal)}</b></span><span>Diskon ${discLabel(t.discount)} <b class="num">−${rp(t.discount.amount)}</b></span></div>` : ''}
    <footer><span>${t.deliveredAt ? 'Diantar ' + fmtT(t.deliveredAt) + ' · ' : ''}Total · ${METHODS[methodOf(t)]}${t.wallet ? ' (' + payLabel(t.wallet) + ')' : ''}${t.queue ? ' · Antrian ' + t.queue : ''}</span><b class="num">${rp(t.total)}</b></footer>
    ${t.paid ? `<div class="paidrow"><span>Tunai <b class="num">${rp(t.paid)}</b></span><span>Kembali <b class="num">${rp(t.change || 0)}</b></span></div>` : ''}
    ${t.void ? '<span class="stamp">DIBATALKAN</span>' : noVoid ? '' : `<button class="linkbtn" data-act="void" data-id="${esc(t.id)}" data-v="${esc(t.day)}">Batalkan (hapus dari laporan)</button>`}
    ${noVoid ? '' : `<button class="linkbtn" data-act="tx-print" data-id="${esc(t.id)}" data-v="${esc(t.day)}">${ICONS.printer}Cetak struk</button>`}
    ${noVoid ? '' : `<button class="linkbtn danger-txt rdel" data-act="tx-del" data-id="${esc(t.id)}" data-v="${esc(t.day)}">${ICONS.trash}Hapus permanen</button>`}</article>`;
}
function vRiwayat() {
  const key = S.histDate, txs = allTx().filter(t => t.day === key).slice().reverse();
  const L = ledger(sod(parseKey(key)), eod(parseKey(key)));
  return `<div class="vhead"><div><h2>Riwayat transaksi</h2><p class="muted">${fmtD(parseKey(key), {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'})}</p></div>
      <div class="li-act" style="align-items:flex-end"><div class="field" style="width:180px"><label for="hist-date">Tanggal</label><input type="date" id="hist-date" value="${key}" max="${dayKey(Date.now())}"></div><button class="btn ghost danger-txt" data-act="hist-del">${ICONS.trash}Hapus riwayat</button></div></div>
    <div class="stack"><div class="stats">
      <div class="stat"><small>Omzet</small><b class="num">${rp(L.sales)}</b></div>
      <div class="stat"><small>Transaksi</small><b class="num">${L.tx}</b></div>
      <div class="stat"><small>Barang terjual</small><b class="num">${fq(L.items)}</b><em>semua satuan</em></div>
      <div class="stat"><small>Laba kotor</small><b class="num">${rp(L.gross)}</b></div></div>
    ${txs.length ? `<div class="receipts">${txs.map(t => receipt(t)).join('')}</div>` : `<div class="empty"><b>Tidak ada transaksi</b>Belum ada penjualan tercatat pada tanggal ini.</div>`}</div>`;
}

/* reports */
const PERIODS = [['today', 'Hari ini'], ['week', '7 hari'], ['month', 'Bulan ini'], ['all', 'Semua'], ['custom', 'Pilih tanggal']];
const REPORTS = [['penjualan', 'Penjualan'], ['hpp', 'HPP'], ['labarugi', 'Laba Rugi'], ['neraca', 'Neraca'], ['aruskas', 'Arus Kas']];
function vLaporan() {
  const R = periodRange();
  return `<div class="vhead"><div><h2>Laporan keuangan</h2><p class="muted">${esc(kantinName(S.kid))} · ${S.report === 'neraca' ? 'Posisi per ' + fmtD(R.end) : 'Periode ' + fmtRange(R.start, R.end)}</p></div><button class="btn ghost" data-act="report-print">${ICONS.printer}Cetak laporan</button></div>
    <div class="seg" role="tablist">${REPORTS.map(([k, l]) => `<button role="tab" class="${S.report === k ? 'on' : ''}" aria-selected="${S.report === k}" data-act="report" data-v="${k}">${l}</button>`).join('')}</div>
    <div class="chips">${PERIODS.map(([k, l]) => `<button class="chip ${S.period === k ? 'on' : ''}" data-act="period" data-v="${k}">${l}</button>`).join('')}</div>
    ${S.period === 'custom' ? `<div class="two" style="margin-bottom:14px;max-width:420px"><div class="field"><label for="rf">Dari</label><input type="date" id="rf" value="${S.range.from}"></div><div class="field"><label for="rt">Sampai</label><input type="date" id="rt" value="${S.range.to}"></div></div>` : ''}
    <div id="report-body">${isLoading() ? '<div class="skel"></div>' : ({penjualan: rSales, hpp: rHPP, labarugi: rPL, neraca: rBS, aruskas: rCF}[S.report] || rSales)(R)}</div>`;
}
function stHead(title, sub) { return `<header class="st-head"><b>${esc(kantinName(S.kid))}</b><h3>${title}</h3><span>${sub}</span></header>`; }
const row = (label, val, cls = '') => `<div class="st-row ${cls}"><span>${label}</span><span class="num ${Math.round(val) < 0 ? 'neg' : ''}">${rpAcc(val)}</span></div>`;
const sec = t => `<div class="st-sec">${t}</div>`;

function chartData(R) {
  const tx = allTx().filter(t => !t.void && t.at >= R.start && t.at <= R.end);
  if (dayKey(R.start) === dayKey(R.end)) {
    const by = {}; let lo = 7, hi = 16;
    for (const t of tx) { const h = new Date(t.at).getHours(); by[h] = (by[h] || 0) + t.total; lo = Math.min(lo, h); hi = Math.max(hi, h); }
    const pts = []; for (let h = lo; h <= hi; h++) pts.push({label: pad(h), value: by[h] || 0, full: pad(h) + '.00–' + pad(h) + '.59'});
    return {pts, title: 'Omzet per jam'};
  }
  const days = Math.round((sod(R.end) - sod(R.start)) / 864e5) + 1;
  if (days > 62) {
    const by = {}; for (const t of tx) { const d = new Date(t.at), k = d.getFullYear() + '-' + pad(d.getMonth() + 1); by[k] = (by[k] || 0) + t.total; }
    const pts = []; const d = new Date(R.start); d.setDate(1);
    while (d.getTime() <= R.end) { const k = d.getFullYear() + '-' + pad(d.getMonth() + 1); pts.push({label: d.toLocaleDateString('id-ID', {month: 'short'}), value: by[k] || 0, full: d.toLocaleDateString('id-ID', {month: 'long', year: 'numeric'})}); d.setMonth(d.getMonth() + 1); }
    return {pts, title: 'Omzet per bulan'};
  }
  const by = {}; for (const t of tx) by[t.day] = (by[t.day] || 0) + t.total;
  const pts = []; const d = new Date(R.start);
  while (d.getTime() <= R.end) { const k = dayKey(d); pts.push({label: d.getDate() + '/' + (d.getMonth() + 1), value: by[k] || 0, full: fmtD(d)}); d.setDate(d.getDate() + 1); }
  return {pts, title: 'Omzet per hari'};
}
function niceStep(v) { const raw = v / 3, p = Math.pow(10, Math.floor(Math.log10(raw || 1))); for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= raw) return m * p; return 10 * p; }
function barChart({pts, title}) {
  const maxV = Math.max(...pts.map(p => p.value), 0);
  if (!maxV) return `<div class="card"><h3>${title}</h3><p class="muted" style="margin:0">Belum ada penjualan pada periode ini.</p></div>`;
  const step = niceStep(maxV), top = step * 3, iMax = pts.findIndex(p => p.value === maxV);
  const every = Math.ceil(pts.length / 12);
  return `<div class="card"><h3>${title}</h3>
    <div class="plot"><div class="yax">${[0, 1, 2, 3].map(i => `<span style="bottom:${i * 33.333}%">${rpShort(step * i)}</span>`).join('')}</div>
      <div class="bars">${pts.map((p, i) => `<div class="bc" title="${esc(p.full)}: ${rp(p.value)}"><div class="bar ${i === iMax ? 'hi' : ''}" style="height:${(p.value / top * 100).toFixed(2)}%">${i === iMax || (pts.length <= 8 && p.value) ? `<span class="bv">${rpShort(p.value)}</span>` : ''}</div></div>`).join('')}</div></div>
    <div class="bls">${pts.map((p, i) => `<span>${i % every === 0 ? esc(p.label) : ''}</span>`).join('')}</div>
    <div class="legend"><span><i style="background:var(--accent)"></i>Tertinggi: ${esc(pts[iMax].full)} · ${rp(maxV)}</span></div></div>`;
}
function rSales(R) {
  const L = ledger(R.start, R.end);
  const tx = allTx().filter(t => !t.void && t.at >= R.start && t.at <= R.end);
  const groups = {};
  for (const t of tx) for (const it of t.items) {
    const k = it.pid + '|' + it.price;
    const g = groups[k] || (groups[k] = {name: it.name, cat: it.cat, unit: itUnit(it), price: +it.price, cost: +it.cost, qty: 0, total: 0, hpp: 0});
    g.qty = r3(g.qty + (+it.qty || 0)); g.total += lineAmt(it.price, it.qty); g.hpp += lineAmt(it.cost, it.qty);
  }
  const cats = [...new Set([...allCats(), ...Object.values(groups).map(g => g.cat)])];
  let body = '';
  for (const c of cats) {
    const gs = Object.values(groups).filter(g => g.cat === c).sort((a, b) => b.total - a.total);
    if (!gs.length) continue;
    const sameU = gs.every(g => g.unit === gs[0].unit), q = sameU ? qu(r3(gs.reduce((s, g) => s + g.qty, 0)), gs[0].unit) : '', tot = gs.reduce((s, g) => s + g.total, 0), lb = gs.reduce((s, g) => s + g.total - g.hpp, 0);
    body += `<tr class="grp"><td colspan="5">${esc(c)}</td></tr>` + gs.map(g => `<tr><td>${esc(g.name)}</td><td class="n">${rp(g.price)}/${g.unit}</td><td class="n">${qu(g.qty, g.unit)}</td><td class="n">${rp(g.total)}</td><td class="n">${rp(g.total - g.hpp)}</td></tr>`).join('')
      + `<tr class="subt"><td>Subtotal ${esc(c)}</td><td></td><td class="n">${q}</td><td class="n">${rp(tot)}</td><td class="n">${rp(lb)}</td></tr>`;
  }
  const list = tx.slice().reverse();
  const margin = L.sales ? Math.round(L.gross / L.sales * 100) : 0;
  return `<div class="stack">
    <div class="stats">
      <div class="stat"><small>Omzet penjualan</small><b class="num">${rp(L.sales)}</b></div>
      <div class="stat"><small>Jumlah transaksi</small><b class="num">${L.tx}</b><em>rata-rata ${rp(L.tx ? L.sales / L.tx : 0)}</em></div>
      <div class="stat"><small>Barang terjual</small><b class="num">${fq(L.items)}</b><em>semua satuan</em></div>
      <div class="stat"><small>Laba kotor</small><b class="num">${rp(L.gross)}</b><em>margin ${margin}%</em></div></div>
    ${barChart(chartData(R))}
    <div class="tbl-wrap"><div class="tcap"><h3>Rekap per produk</h3><button class="btn ghost sm" data-act="csv">Unduh CSV</button></div>
      ${Object.keys(groups).length ? `<table><thead><tr><th>Produk</th><th class="n">Harga</th><th class="n">Qty</th><th class="n">Jumlah</th><th class="n">Laba kotor</th></tr></thead><tbody>${body}</tbody>
      <tfoot>${L.disc ? `<tr><td>Subtotal</td><td></td><td></td><td class="n">${rp(L.grossSales)}</td><td></td></tr><tr><td>Diskon penjualan</td><td></td><td></td><td class="n neg">(${rp(L.disc)})</td><td></td></tr>` : ''}<tr><td>Total</td><td></td><td class="n"></td><td class="n">${rp(L.sales)}</td><td class="n">${rp(L.gross)}</td></tr></tfoot></table>` : '<p class="muted" style="padding:0 14px 14px;margin:0">Belum ada penjualan pada periode ini.</p>'}</div>
    ${L.tx ? `<div class="tbl-wrap"><div class="tcap"><h3>Per metode pembayaran</h3></div><table><thead><tr><th>Metode</th><th class="n">Transaksi</th><th class="n">Jumlah</th><th class="n">Persen</th></tr></thead><tbody>${Object.entries(METHODS).map(([k, l]) => { const n = tx.filter(t => methodOf(t) === k).length; return `<tr><td>${l}</td><td class="n">${n}</td><td class="n">${rp(L.byMethod[k] || 0)}</td><td class="n">${L.sales ? Math.round((L.byMethod[k] || 0) / L.sales * 100) : 0}%</td></tr>`; }).join('')}</tbody><tfoot><tr><td>Total</td><td class="n">${L.tx}</td><td class="n">${rp(L.sales)}</td><td class="n">100%</td></tr></tfoot></table></div>` : ''}
    ${list.length ? `<div class="tbl-wrap"><div class="tcap"><h3>Rincian transaksi</h3><span class="muted" style="font-size:13px">${list.length} transaksi</span></div>
      <table><thead><tr><th>Waktu</th><th>No.</th><th>Item</th><th class="n">Harga × Qty</th><th class="n">Jumlah</th><th><span class="sr">Hapus</span></th></tr></thead><tbody>
      ${list.slice(0, S.txLimit).map(t => t.items.map((it, i) => `<tr>${i === 0 ? `<td rowspan="${t.items.length}" style="white-space:nowrap">${fmtD(t.at, {day: 'numeric', month: 'short'})}<br><span class="muted">${fmtT(t.at)}</span></td><td rowspan="${t.items.length}">${pad3(t.no || 0)}<br><span class="muted">${METHODS[methodOf(t)]}${t.discount ? ' · diskon ' + rp(t.discount.amount) : ''}</span></td>` : ''}<td>${esc(it.name)}${it.note ? `<br><small class="inote">Catatan: ${esc(it.note)}</small>` : ''}</td><td class="n">${rp(it.price)} × ${qu(it.qty, itUnit(it))}</td><td class="n">${rp(lineAmt(it.price, it.qty))}</td>${i === 0 ? `<td rowspan="${t.items.length}" class="tdel"><button class="iconbtn danger-ic" data-act="void" data-id="${esc(t.id)}" data-v="${esc(t.day)}" aria-label="Hapus transaksi No. ${pad3(t.no || 0)} dari laporan" title="Hapus dari laporan">${ICONS.trash}</button></td>` : ''}</tr>`).join('')).join('')}
      </tbody></table>${list.length > S.txLimit ? `<div style="padding:12px 14px"><button class="btn ghost sm" data-act="more-tx">Tampilkan ${Math.min(50, list.length - S.txLimit)} lagi</button></div>` : ''}</div>` : ''}
  </div>`;
}
function rPL(R) {
  const L = ledger(R.start, R.end);
  const cats = [...new Set([...allCats(), ...Object.keys(L.byCat)])].filter(c => L.byCat[c] || cfg().categories.includes(c));
  const bcats = [...new Set([...BEBAN_CATS, ...Object.keys(L.bebanByCat)])].filter(c => L.bebanByCat[c]);
  const margin = L.sales ? (L.net / L.sales * 100).toFixed(1).replace('.', ',') : '0';
  return `<section class="statement">${stHead('Laporan Laba Rugi', 'Periode ' + fmtRange(R.start, R.end))}
    ${sec('Pendapatan')}${cats.map(c => row('Penjualan ' + esc(c), L.byCat[c] || 0, 'ind')).join('')}${L.disc ? row('Diskon penjualan', -L.disc, 'ind') : ''}${row('Total pendapatan', L.sales, 'sub')}
    ${sec('Harga pokok penjualan')}${cats.map(c => row('HPP ' + esc(c), -(L.cogsByCat[c] || 0), 'ind')).join('')}${row('Total HPP', -L.cogs, 'sub')}
    ${row('Laba kotor', L.gross, 'big')}
    ${sec('Beban operasional')}${bcats.length ? bcats.map(c => row(esc(c), -L.bebanByCat[c], 'ind')).join('') : '<div class="st-row ind muted"><span>Tidak ada beban tercatat</span><span class="num">Rp0</span></div>'}${row('Total beban operasional', -L.beban, 'sub')}
    ${row(L.net >= 0 ? 'Laba bersih' : 'Rugi bersih', L.net, 'total')}
    <p class="st-note">Margin laba bersih ${margin}% dari pendapatan. HPP dihitung dari modal per satuan yang tercatat pada setiap transaksi.</p></section>`;
}
function rBS(R) {
  const P = position(R.end), diff = Math.round(P.assets - P.equity);
  return `<section class="statement wide">${stHead('Neraca', 'Per ' + fmtD(R.end))}
    <div class="neraca"><div>
      ${sec('Aset')}<div class="st-row"><span><b>Aset lancar</b></span><span></span></div>
      ${row('Kas', P.kas, 'ind')}${row('Persediaan bahan', P.inv, 'ind')}
      <div class="st-row"><span><b>Aset tetap</b></span><span></span></div>${row('Peralatan', P.eq, 'ind')}
      ${row('Total aset', P.assets, 'total')}
    </div><div>
      ${sec('Kewajiban')}${row('Utang usaha', 0, 'ind')}${row('Total kewajiban', 0, 'sub')}
      ${sec('Ekuitas')}${row('Modal awal', P.modalAwal, 'ind')}${row('Setoran modal', P.modalTambah, 'ind')}${row('Laba ditahan', P.laba, 'ind')}${row('Prive', -P.prive, 'ind')}${row('Total ekuitas', P.equity, 'sub')}
      ${row('Total kewajiban & ekuitas', P.equity, 'total')}
    </div></div>
    <p class="st-note"><span class="pill ${diff === 0 ? 'ok' : 'bad'}">${diff === 0 ? '✓ Seimbang' : 'Selisih ' + rp(diff)}</span>
    Modal awal = kas awal ${rp(cfg().openingCash)} + persediaan awal ${rp(cfg().openingInventory)} + peralatan awal ${rp(cfg().equipment)}, mulai ${fmtD(parseKey(cfg().openingDate))}. Laba ditahan adalah akumulasi laba bersih sampai tanggal neraca.${P.inv < 0 ? ' <b class="neg">Persediaan minus: catat belanja bahan di menu Kas.</b>' : ''}</p></section>`;
}
function rCF(R) {
  const L = ledger(R.start, R.end), open = position(R.start - 1).kas, close = position(R.end).kas;
  const op = L.sales - L.pembelian - L.beban, inv = -L.peralatan, fin = L.modal - L.prive, net = op + inv + fin;
  return `<section class="statement">${stHead('Laporan Arus Kas', 'Periode ' + fmtRange(R.start, R.end))}
    ${sec('Arus kas dari aktivitas operasi')}${row('Penerimaan dari penjualan', L.sales, 'ind')}${row('Pembayaran bahan baku', -L.pembelian, 'ind')}${row('Pembayaran beban operasional', -L.beban, 'ind')}${row('Kas bersih dari operasi', op, 'sub')}
    ${sec('Arus kas dari aktivitas investasi')}${row('Pembelian peralatan', inv, 'ind')}${row('Kas bersih dari investasi', inv, 'sub')}
    ${sec('Arus kas dari aktivitas pendanaan')}${row('Setoran modal pemilik', L.modal, 'ind')}${row('Pengambilan prive', -L.prive, 'ind')}${row('Kas bersih dari pendanaan', fin, 'sub')}
    ${row(net >= 0 ? 'Kenaikan kas bersih' : 'Penurunan kas bersih', net, 'big')}
    ${row('Saldo kas awal periode', open)}
    ${row('Saldo kas akhir periode', close, 'total')}
    <p class="st-note">Metode langsung. Saldo kas akhir sama dengan pos Kas di neraca per ${fmtD(R.end)}.</p></section>`;
}

function vKas() {
  const P = position(Date.now()), now = Date.now();
  const m = new Date(now), M = ledger(new Date(m.getFullYear(), m.getMonth(), 1).getTime(), eod(now));
  const list = kasList().slice().reverse();
  let html = '', lastDay = '';
  for (const e of list) {
    const k = dayKey(e.at), T = KAS_TYPES[e.type];
    if (k !== lastDay) { html += `<div class="li-h">${fmtD(e.at, {weekday: 'long', day: 'numeric', month: 'long'})}</div>`; lastDay = k; }
    html += `<div class="li"><span class="ico">${T.short}</span><div><div class="t">${esc(e.note || T.label)}</div><div class="s">${T.label}${e.cat ? ' · ' + esc(e.cat) : ''} · ${fmtT(e.at)}${e.pbId ? ' · <span class="tag">dari Pembelian</span>' : ''}</div></div>
      <div style="display:flex;gap:8px;align-items:center"><span class="a num ${T.sign > 0 ? 'pos' : ''}">${T.sign > 0 ? '+' : '−'}${rp(e.amount)}</span><button class="iconbtn" data-act="del-kas" data-id="${esc(e.id)}" aria-label="Hapus catatan">${ICONS.trash}</button></div></div>`;
  }
  return `<div class="vhead"><div><h2>Kas & biaya</h2><p class="muted">Catat uang keluar-masuk di luar penjualan. Belanja bahan &amp; barang otomatis masuk dari menu Pembelian.</p></div><button class="btn primary" data-act="new-kas">+ Catat kas</button></div>
    <div class="stack"><div class="stats">
      <div class="stat"><small>Saldo kas saat ini</small><b class="num ${P.kas < 0 ? 'neg' : ''}">${rpS(P.kas)}</b></div>
      <div class="stat"><small>Penjualan bulan ini</small><b class="num">${rp(M.sales)}</b></div>
      <div class="stat"><small>Belanja bahan bulan ini</small><b class="num">${rp(M.pembelian)}</b></div>
      <div class="stat"><small>Beban bulan ini</small><b class="num">${rp(M.beban)}</b></div></div>
    ${list.length ? `<div class="list">${html}</div>` : `<div class="empty"><b>Belum ada catatan kas</b>Catat belanja bahan, gas, listrik, upah, atau setoran modal agar neraca dan arus kas akurat.</div>`}</div>`;
}
function vProduk() {
  const c = cfg(), prods = productsSorted();
  let html = '';
  for (const cat of allCats()) {
    const list = prods.filter(p => p.cat === cat);
    if (!list.length) continue;
    html += `<div class="li-h">${esc(cat)} · ${list.length} produk</div>` + list.map(p => {
      const mg = p.price - p.cost, pct = p.price ? Math.round(mg / p.price * 100) : 0;
      return `<div class="li ${p.active === false ? 'off' : ''} ${catKind(p.cat)}"><span class="ico" style="background:var(--k-soft);color:var(--k-ink)">${p.photo ? `<img src="${esc(p.photo)}" alt="">` : esc(initials(p.name))}</span>
        <div><div class="t">${esc(p.name)}${p.active === false ? '<span class="tag">Disembunyikan</span>' : ''}</div>${p.desc ? `<div class="s">${esc(p.desc)}</div>` : ''}<div class="s num">Jual ${rp(p.price)}/${unitOf(p)} · Modal ${rp(p.cost)}${p.costSource === 'hpp' ? ' <span class="tag">dari HPP</span>' : ''} · Laba ${rpS(mg)} (${pct}%)</div></div>
        <div class="li-act"><button class="iconbtn" data-act="edit-prod" data-id="${esc(p.id)}" aria-label="Ubah ${esc(p.name)}" title="Ubah">${ICONS.edit}</button><button class="iconbtn danger-ic" data-act="del-prod" data-id="${esc(p.id)}" aria-label="Hapus ${esc(p.name)}" title="Hapus">${ICONS.trash}</button></div></div>`;
    }).join('');
  }
  return `<div class="vhead"><div><h2>Produk & pengaturan</h2><p class="muted">${prods.length} produk di ${allCats().length} kategori</p></div><button class="btn primary" data-act="new-prod">+ Tambah produk</button></div>
    <div class="row2">
      ${prods.length ? `<div class="list">${html}</div>` : `<div class="empty"><b>Belum ada produk</b>Tambahkan menu makanan dan minuman beserta harga jual dan modalnya.</div>`}
      <div class="card"><h3>Saldo awal usaha</h3>
        <div class="st-row"><span>Mulai pencatatan</span><b>${fmtD(parseKey(c.openingDate))}</b></div>
        ${row('Kas awal', c.openingCash)}${row('Persediaan bahan awal', c.openingInventory)}${row('Peralatan awal', c.equipment)}
        ${row('Modal awal', c.openingCash + c.openingInventory + c.equipment, 'sub')}
        <p class="hint">Saldo awal menjadi dasar neraca dan arus kas.</p>
        <button class="btn ghost block" data-act="settings">Ubah saldo awal & nama usaha</button>
        <button class="btn ghost block danger-txt" style="margin-top:8px" data-act="clear-tx">Hapus data transaksi…</button></div>
    </div>`;
}

/* ---------- sheets ---------- */
function openSheet(renderFn, live) {
  S.sheet = {render: renderFn, live: !!live};
  $('#sheet-body').innerHTML = renderFn();
  $('#sheet').hidden = false;
  const f = $('#sheet-body').querySelector('input:not([type=hidden]):not([type=radio]),select');
  if (f && !live && window.matchMedia('(min-width:700px)').matches) f.focus();
}
function closeSheet() { S.sheet = null; $('#sheet').hidden = true; $('#sheet-body').innerHTML = ''; }
function confirmSheet(title, text, yes, fn, danger) {
  S.confirmFn = fn;
  openSheet(() => `<h3>${title}</h3><p class="muted" style="margin-top:-4px">${text}</p><div class="two" style="margin-top:16px"><button class="btn ghost" data-act="close-sheet">Kembali</button><button class="btn ${danger ? 'danger' : 'primary'}" data-act="confirm-yes">${yes}</button></div>`);
}
const money = (id, label, val, hint) => `<div class="field"><label for="${id}">${label}</label><input id="${id}" name="${id}" inputmode="numeric" autocomplete="off" data-money value="${val ? Number(val).toLocaleString('id-ID') : ''}" placeholder="0">${hint ? `<span class="hint">${hint}</span>` : ''}</div>`;

function prodForm(p) {
  const isNew = !p; p = p || {name: '', cat: S.catFilter !== 'Semua' ? S.catFilter : cfg().categories[0], price: '', cost: '', active: true};
  return `<h3>${isNew ? 'Tambah produk' : 'Ubah produk'}</h3><form data-form="prod" data-id="${esc(p.id || '')}" novalidate>
    <div class="field"><label for="pf-name">Nama produk</label><input id="pf-name" name="name" value="${esc(p.name)}" placeholder="mis. Ayam Geprek" required maxlength="40"></div>
    <div class="field"><label for="pf-desc">Keterangan</label><textarea id="pf-desc" name="desc" rows="2" maxlength="140" placeholder="mis. Pedas sedang, isi 2 bakso, porsi besar">${esc(p.desc || '')}</textarea><span class="hint">Tampil di kartu menu kasir dan pelanggan.</span></div>
    <div class="field"><label for="pf-cat">Kategori</label><select id="pf-cat" name="cat">${allCats().map(c => `<option ${c === p.cat ? 'selected' : ''}>${esc(c)}</option>`).join('')}<option value="__new">+ Kategori baru…</option></select></div>
    <div class="field" id="pf-newcat-f" hidden><label for="pf-newcat">Nama kategori baru</label><input id="pf-newcat" name="newcat" placeholder="mis. Camilan" maxlength="24"></div>
    <div class="field"><span class="lb">Foto produk (opsional)</span>
      <div class="photo-row ${catKind(p.cat)}"><span class="pc-img" id="pf-prev">${productImg(p)}</span>
        <div><div class="btns"><label class="btn ghost sm" for="pf-photo" tabindex="0">Pilih foto</label><button type="button" class="btn ghost sm" data-act="photo-clear">Hapus foto</button></div>
        <p class="hint" style="margin:6px 0 0">Tanpa foto, kartu memakai gambar sesuai kategori. Foto dikecilkan otomatis.</p></div></div>
      <input type="file" id="pf-photo" accept="image/*" hidden><input type="hidden" name="photo" id="pf-photo-data" value="${esc(p.photo || '')}"></div>
    <div class="field"><label for="pf-unit">Satuan</label><select id="pf-unit" name="unit">${[...new Set(Object.values(UNITS).map(x => x.g))].map(g => `<optgroup label="${g}">${Object.entries(UNITS).filter(([, x]) => x.g === g).map(([k]) => `<option value="${k}" ${k === unitOf(p) ? 'selected' : ''}>${k}</option>`).join('')}</optgroup>`).join('')}</select><span class="hint" id="pf-unit-hint">${unitHint(unitOf(p))}</span></div>
    ${(() => { const src = p.costSource === 'hpp' ? 'hpp' : 'manual', ms = HP().menus; return `<div class="field"><span class="lb">Sumber harga modal</span>
      <div class="otype" role="group" aria-label="Sumber harga modal"><button type="button" class="${src === 'manual' ? 'on' : ''}" data-act="cost-src" data-v="manual" aria-pressed="${src === 'manual'}">Isi manual</button><button type="button" class="${src === 'hpp' ? 'on' : ''}" data-act="cost-src" data-v="hpp" aria-pressed="${src === 'hpp'}">Dari Kalkulator HPP</button></div>
      <input type="hidden" name="costSource" id="pf-src" value="${src}"></div>
    <div class="hppbox" id="pf-hpp" ${src === 'hpp' ? '' : 'hidden'}>
      ${ms.length ? `<div class="two"><div class="field"><label for="pf-hmenu">Menu di Kalkulator HPP</label><select id="pf-hmenu" name="hppMenu"><option value="">— Pilih menu —</option>${ms.map(m => `<option value="${esc(m.id)}" ${m.id === (p.hppMenu || (ms.find(x => x.pid && x.pid === p.id) || {}).id) ? 'selected' : ''}>${esc(m.name)}</option>`).join('')}</select></div>
        <div class="field"><label for="pf-hbasis">Dasar modal</label><select id="pf-hbasis" name="hppBasis"><option value="bahan" ${p.hppBasis !== 'total' ? 'selected' : ''}>HPP bahan (disarankan)</option><option value="total" ${p.hppBasis === 'total' ? 'selected' : ''}>HPP total (bahan + operasional)</option></select></div></div>
        <p class="hint" id="pf-hhint"></p>`
        : '<p class="muted" style="margin:0">Belum ada menu di Kalkulator HPP. Buat resepnya dulu di menu Kalkulator HPP → Menu & resep.</p>'}</div>`; })()}
    <div class="two">${money('pf-price', 'Harga jual per satuan', p.price)}${money('pf-cost', 'Modal per satuan', p.cost)}</div>
    <p class="hint" id="pf-margin"></p>
    <label class="check"><input type="checkbox" id="pf-active" name="active" ${p.active !== false ? 'checked' : ''}> Tampilkan di kasir</label>
    <label class="check"><input type="checkbox" id="pf-track" name="trackStock" ${p.trackStock ? 'checked' : ''}> Pantau stok barang ini</label>
    <p class="err" id="pf-err" hidden></p>
    <div class="two"><button type="button" class="btn ghost" data-act="close-sheet">Batal</button><button class="btn primary" type="submit">Simpan</button></div>
    ${isNew ? '' : `<p class="hint">Perubahan harga hanya berlaku untuk transaksi berikutnya; transaksi lama tetap memakai harga saat terjual.</p><button type="button" class="linkbtn" data-act="del-prod" data-id="${esc(p.id)}">Hapus produk ini</button>`}</form>`;
}
function settingsForm() {
  const c = cfg();
  return `<h3>Saldo awal usaha</h3><form data-form="settings" novalidate>
    <div class="field"><label for="sf-owner">Nama pemilik (untuk sapaan di layar kasir)</label><input id="sf-owner" name="ownerName" value="${esc(c.ownerName)}" maxlength="40" placeholder="mis. Bu Mira"></div>
    <div class="field"><label for="sf-name">Nama usaha</label><input id="sf-name" name="shopName" value="${esc(c.shopName)}" maxlength="60"></div>
    <div class="field"><label for="sf-date">Tanggal mulai pencatatan</label><input type="date" id="sf-date" name="openingDate" value="${c.openingDate}"></div>
    ${money('sf-cash', 'Kas awal', c.openingCash, 'Uang tunai di laci/rekening usaha saat mulai.')}
    ${money('sf-inv', 'Persediaan bahan awal', c.openingInventory, 'Nilai bahan baku yang sudah ada saat mulai.')}
    ${money('sf-eq', 'Peralatan awal', c.equipment, 'Kompor, etalase, alat masak, meja.')}
    <div class="two"><button type="button" class="btn ghost" data-act="close-sheet">Batal</button><button class="btn primary" type="submit">Simpan</button></div></form>`;
}
function kasForm() {
  const today = dayKey(Date.now());
  return `<h3>Catat kas</h3><form data-form="kas" novalidate>
    <div class="field"><span class="lb">Jenis</span><div class="radios">${Object.entries(KAS_TYPES).filter(([k]) => k !== 'pembelian').map(([k, t], i) => `<label><input type="radio" name="type" value="${k}" ${i === 0 ? 'checked' : ''}><span>${t.label}</span></label>`).join('')}</div><span class="hint" id="kf-hint">${KAS_TYPES.beban.hint}</span><span class="hint">Belanja bahan baku/barang jadi dicatat di menu <b>Pembelian</b>.</span></div>
    <div class="field" id="kf-cat-f"><label for="kf-cat">Jenis beban</label><select id="kf-cat" name="cat">${BEBAN_CATS.map(c => `<option>${c}</option>`).join('')}</select></div>
    ${money('kf-amount', 'Jumlah', '')}
    <div class="field"><label for="kf-note">Keterangan</label><input id="kf-note" name="note" placeholder="mis. Beras 10 kg, gas 2 tabung" maxlength="80"></div>
    <div class="field"><label for="kf-date">Tanggal</label><input type="date" id="kf-date" name="date" value="${today}" max="${today}"></div>
    <p class="err" id="kf-err" hidden></p>
    <div class="two"><button type="button" class="btn ghost" data-act="close-sheet">Batal</button><button class="btn primary" type="submit">Simpan</button></div></form>`;
}
function unitHint(u) {
  const x = UNITS[u] || UNITS.porsi;
  return `Satu ketukan di kasir menambah ${qu(x.step, u)}.${x.dec ? ' Jumlah bisa diketik desimal di panel pesanan, mis. 1,5.' : ''}`;
}
function hppCostFor(menuId, basis) {
  const m = HP().menus.find(x => x.id === menuId); if (!m) return null;
  const c = menuCalc(m); return Math.round(basis === 'total' ? c.hpp : c.bahan);
}
function setCostSrc(v) {
  const src = v === 'hpp' ? 'hpp' : 'manual', inp = $('#pf-cost'); if (!inp) return;
  $('#pf-src').value = src;
  document.querySelectorAll('[data-act="cost-src"]').forEach(b => { b.classList.toggle('on', b.dataset.v === src); b.setAttribute('aria-pressed', b.dataset.v === src); });
  $('#pf-hpp').hidden = src !== 'hpp';
  inp.readOnly = src === 'hpp'; inp.classList.toggle('ro', src === 'hpp');
  if (src === 'hpp') fillHppCost(); else { const h = $('#pf-hhint'); if (h) h.textContent = ''; }
  updateMargin();
}
function fillHppCost() {
  const sel = $('#pf-hmenu'), basis = $('#pf-hbasis'), inp = $('#pf-cost'), hint = $('#pf-hhint'); if (!sel || !inp) return;
  const m = HP().menus.find(x => x.id === sel.value);
  if (!m) { if (hint) hint.textContent = 'Pilih menu untuk mengambil HPP-nya.'; return; }
  const c = menuCalc(m), v = hppCostFor(m.id, basis.value);
  inp.value = v.toLocaleString('id-ID');
  if (hint) hint.textContent = `${m.name}: HPP bahan ${rp(c.bahan)} · operasional ${rp(c.ops)} · HPP total ${rp(c.hpp)}. Modal ikut berubah otomatis setiap resep atau harga bahan di kalkulator diubah.`;
  updateMargin();
}
/* Products that take their modal from the calculator follow it whenever the calculator changes. */
async function syncHppCosts() {
  for (const p of Object.values(S.products)) {
    if (p.costSource !== 'hpp') continue;
    const c = hppCostFor(p.hppMenu, p.hppBasis);
    if (c != null && c !== +p.cost) await Store.saveProduct({...p, cost: c});
  }
}
function updateMargin() {
  const pr = digits($('#pf-price') && $('#pf-price').value), co = digits($('#pf-cost') && $('#pf-cost').value), el = $('#pf-margin');
  if (!el) return;
  if (!pr) { el.textContent = ''; return; }
  const mg = pr - co; el.className = 'hint' + (mg < 0 ? ' warn' : '');
  el.textContent = mg < 0 ? `Modal lebih besar dari harga jual (rugi ${rp(-mg)} per satuan).` : `Laba per satuan ${rp(mg)} (${Math.round(mg / pr * 100)}% dari harga jual).`;
}

/* ---------- toast ---------- */
let toastTimer;
function toast(msg, action) {
  const t = $('#toast');
  t.innerHTML = `<span>${esc(msg)}</span>${action ? `<button type="button">${esc(action.label)}</button>` : ''}`;
  t.hidden = false;
  if (action) t.querySelector('button').onclick = () => { t.hidden = true; action.fn(); };
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, action ? 6000 : 3200);
}

/* ---------- accounts & roles ----------
   Offline accounts use the legacy pure-JS hash. Server accounts are hashed and verified by PHP. */
function sha256hex(str) {
  const rr = (v, a) => (v >>> a) | (v << (32 - a)), K = [], H = [], comp = {};
  for (let c = 2, n = 0; n < 64; c++) if (!comp[c]) { for (let i = 0; i < 313; i += c) comp[i] = c; H[n] = (Math.pow(c, .5) * 0x100000000) | 0; K[n++] = (Math.pow(c, 1 / 3) * 0x100000000) | 0; }
  const bytes = new TextEncoder().encode(str), len = bytes.length, total = ((len + 9 + 63) >> 6) << 6;
  const buf = new Uint8Array(total); buf.set(bytes); buf[len] = 0x80;
  const dv = new DataView(buf.buffer); dv.setUint32(total - 4, (len * 8) >>> 0); dv.setUint32(total - 8, Math.floor(len * 8 / 0x100000000));
  const hash = H.slice(0, 8), w = new Array(64);
  for (let off = 0; off < total; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4);
    for (let i = 16; i < 64; i++) { const a = w[i - 15], b = w[i - 2]; w[i] = (w[i - 16] + (rr(a, 7) ^ rr(a, 18) ^ (a >>> 3)) + w[i - 7] + (rr(b, 17) ^ rr(b, 19) ^ (b >>> 10))) | 0; }
    let [a, b, c, d, e, f, g, h] = hash;
    for (let i = 0; i < 64; i++) {
      const t1 = (h + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) | 0, t2 = ((rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    [a, b, c, d, e, f, g, h].forEach((v, i) => { hash[i] = (hash[i] + v) | 0; });
  }
  return hash.map(x => (x >>> 0).toString(16).padStart(8, '0')).join('');
}
function hashPw(pw, salt) { let h = salt + ':' + pw; for (let i = 0; i < 2000; i++) h = sha256hex(salt + h); return h; }
const newSalt = () => Array.from({length: 4}, () => Math.random().toString(36).slice(2, 8)).join('');

const ROLES = {
  admin: {l: 'Super Admin', views: ['kasir', 'riwayat', 'laporan', 'stok', 'beli', 'kas', 'hpp', 'produk', 'master']},
  pemilik: {l: 'Pemilik Usaha', views: ['kasir', 'riwayat', 'laporan', 'stok', 'beli', 'kas', 'hpp', 'produk', 'master']},
  pelanggan: {l: 'Pelanggan (QR meja)', views: ['pilih', 'pesan', 'pesananku']}
};
const VIEW_LABEL = {kasir: ['Kasir', 'Kasir'], riwayat: ['Riwayat', 'Riwayat'], laporan: ['Laporan', 'Laporan'], hpp: ['HPP', 'Kalkulator HPP'], stok: ['Stok', 'Stok Produk'], beli: ['Beli', 'Pembelian'],
  kas: ['Kas', 'Kas & Biaya'], produk: ['Produk', 'Produk'], master: ['Master', 'Master Data'], gantipw: ['Password', 'Ganti Password'], pilih: ['Kantin', 'Pilih Kantin'], pesan: ['Menu', 'Pesan Menu'], pesananku: ['Pesanan', 'Pesanan Saya']};
const users = () => Object.values(S.users || {}).filter(u => u && u.username);
function me() {
  if (S.guestTable) return S.guest && S.guest.name && S.guest.phone && tableOf(S.guestTable) ? {id: 'g:' + S.guest.gid, name: S.guest.name, phone: S.guest.phone, role: 'pelanggan'} : null;
  const u = S.session && S.users[S.session]; return u && u.active !== false && ROLES[u.role] ? u : null; }
const role = () => (me() || {}).role;
const isCust = () => role() === 'pelanggan';
const canView = v => !!me() && ROLES[role()].views.includes(v);
const homeView = () => isCust() ? (S.guestKid ? 'pesan' : 'pilih') : 'kasir';
const findLogin = id => { const k = String(id || '').trim().toLowerCase(); return k ? users().find(u => u.username.toLowerCase() === k || String(u.contact || '').trim().toLowerCase() === k) : null; };
const takenBy = (field, val, exceptId) => { const k = String(val || '').trim().toLowerCase(); return k && users().find(u => u.id !== exceptId && (String(u.username).toLowerCase() === k || String(u.contact || '').toLowerCase() === k)); };
const activeAdmins = () => users().filter(u => u.role === 'admin' && u.active !== false);
/* Turning an owner off also hides their kantin from customers when no other active owner runs it; turning on shows it again. */
async function syncKantinFor(kid, ownerActive, exceptId) {
  const list = kantinsList(), k = list.find(x => x.id === kid); if (!k) return;
  const othersActive = users().some(o => o.id !== exceptId && o.role === 'pemilik' && (o.kid || 'main') === kid && o.active !== false && !o.pending);
  const want = ownerActive || othersActive;
  if ((k.active !== false) !== want) { k.active = want; await Store.saveGlobal({kantins: list}); }
}
async function setUserActive(u, active) {
  await Store.saveUser({...u, active});
  if (u.role === 'pemilik') await syncKantinFor(u.kid || 'main', active, u.id);
}
const pendingRegs = () => role() === 'admin' ? users().filter(u => u.pending).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)) : [];
function setSession(id) { S.session = id; try { if (id) localStorage.setItem('kantin-uis-session', id); else localStorage.removeItem('kantin-uis-session'); } catch (e) {} }
try { S.session = localStorage.getItem('kantin-uis-session') || null; } catch (e) { S.session = null; }
function authMode() {
  if (S.guestTable) return S.mode === 'loading' || (S.mode === 'db' && !S.loaded.settings && !S.stale) ? 'loading' : 'guest';
  if (S.mode === 'loading' || (S.mode === 'db' && !S.usersLoaded && !S.stale)) return 'loading';
  // Online (PHP server) the super admin comes from kantin-config.php, so there is no first-admin screen.
  if (!Store.remote && !users().length) return 'setup';
  return ['register', 'registered'].includes(S.authPage) ? S.authPage : 'login';
}

/* ---------- login screen ---------- */
const APP_ICON = '<svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="aig" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5BBE3C"/><stop offset="1" stop-color="#2E8A22"/></linearGradient></defs><rect x="2" y="2" width="60" height="60" rx="16" fill="url(#aig)"/><path d="M22 13v14a4 4 0 0 0 4 4v20" stroke="#fff" stroke-width="4.2" fill="none" stroke-linecap="round"/><path d="M18 13v11M26 13v11M30 13v14a4 4 0 0 1-4 4" stroke="#fff" stroke-width="3.4" fill="none" stroke-linecap="round"/><ellipse cx="42" cy="21" rx="7" ry="9.5" fill="#fff"/><path d="M42 30v21" stroke="#fff" stroke-width="4.2" stroke-linecap="round"/><path d="M10 47c8 6 20 8 33 3" stroke="#B8F08F" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".85"/></svg>';
const G_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.2-2.7l-3.5-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.2v2.8A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.8 14.2a6.6 6.6 0 0 1 0-4.3V7.1H2.2a11 11 0 0 0 0 9.9z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3 .6 4.2 1.6l3.1-3.1A11 11 0 0 0 2.2 7.1l3.6 2.8C6.7 7.3 9.1 5.4 12 5.4z"/></svg>';
/* Login photo: a file next to the page on XAMPP; embedded in the online copy. */
const LOGIN_BG = 'assets/img/login-kantin.webp?v=5';
function authArt() {
  return `<svg class="aart" viewBox="0 0 800 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs><linearGradient id="awall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#EAF4E4"/><stop offset="1" stop-color="#F6EFE2"/></linearGradient>
      <linearGradient id="asign" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1E7A35"/><stop offset="1" stop-color="#0E4F22"/></linearGradient>
      <radialGradient id="aglow" cx="50%" cy="0%" r="70%"><stop offset="0" stop-color="#FFF4C9"/><stop offset="1" stop-color="#FFF4C9" stop-opacity="0"/></radialGradient></defs>
    <rect width="800" height="900" fill="url(#awall)"/>
    <g opacity=".55">${[0, 1, 2, 3].map(i => `<rect x="${20 + i * 46}" y="120" width="38" height="430" rx="4" fill="#CFE6C4"/>`).join('')}</g>
    <rect x="170" y="110" width="560" height="190" rx="14" fill="url(#asign)"/>
    <g transform="translate(205 145) scale(1.9)">${APP_ICON.replace('<svg viewBox="0 0 64 64" aria-hidden="true">', '').replace('</svg>', '').replace(/aig/g, 'aig2')}</g>
    <defs><linearGradient id="aig2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5BBE3C"/><stop offset="1" stop-color="#2E8A22"/></linearGradient></defs>
    <text x="345" y="210" font-family="Plus Jakarta Sans, system-ui, sans-serif" font-weight="800" font-size="68" fill="#fff" transform="rotate(4 345 210)">Oneklik Biz</text>
    <text x="350" y="258" font-family="Plus Jakarta Sans, system-ui, sans-serif" font-weight="700" font-size="28" fill="#DDF3D2" transform="rotate(4 350 258)">One Click, Grow Your Business.</text>
    ${[0, 1, 2].map(i => `<g transform="translate(${205 + i * 150} 318) rotate(4)"><rect width="138" height="84" rx="8" fill="#16231A"/><circle cx="69" cy="50" r="24" fill="${['#F2A93B', '#F6C344', '#C9692C'][i]}"/><rect x="10" y="10" width="44" height="8" rx="4" fill="#3E5C46"/></g>`).join('')}
    ${[230, 470, 690].map(x => `<line x1="${x}" y1="0" x2="${x}" y2="${x === 470 ? 70 : 95}" stroke="#2F3B32" stroke-width="3"/><path d="M${x - 34} ${x === 470 ? 100 : 125}a34 30 0 0 1 68 0z" fill="#1F6B34"/><ellipse cx="${x}" cy="${x === 470 ? 104 : 129}" rx="26" ry="7" fill="url(#aglow)"/><circle cx="${x}" cy="${x === 470 ? 104 : 129}" r="8" fill="#FFE9A6"/>`).join('')}
    <rect x="140" y="430" width="640" height="34" rx="6" fill="#D9C7A6"/>
    <rect x="160" y="464" width="600" height="140" fill="#EADBC0"/>
    ${Array.from({length: 13}, (_, i) => `<rect x="${170 + i * 45}" y="474" width="30" height="120" rx="6" fill="#E2CFAE"/>`).join('')}
    <rect x="300" y="384" width="300" height="50" rx="8" fill="#F7F3EA" opacity=".85"/>
    ${[0, 1, 2, 3, 4].map(i => `<ellipse cx="${330 + i * 58}" cy="${410}" rx="22" ry="9" fill="#E7A84B"/>`).join('')}
    <g fill="#3E9A2C">${[[110, 600], [700, 590], [60, 700]].map(([x, y]) => `<path d="M${x} ${y}c-30-40-10-80 0-90 10 10 30 50 0 90z"/><path d="M${x} ${y}c-50-20-60-60-55-70 15 0 50 30 55 70z" fill="#5BBE3C"/><path d="M${x} ${y}c50-20 60-60 55-70-15 0-50 30-55 70z" fill="#2E7D22"/><rect x="${x - 22}" y="${y}" width="44" height="46" rx="8" fill="#F4F1EA"/>`).join('')}</g>
    <rect x="0" y="690" width="800" height="210" fill="#D8B88C"/><rect x="0" y="690" width="800" height="14" fill="#C9A577"/>
    <g transform="translate(150 560) scale(1.55)">${HERO_ART.replace(/<svg[^>]*>/, '').replace('</svg>', '')}</g>
  </svg>`;
}
function vAuth(mode) {
  const brand = `<div class="auth-app"><span class="auth-icon auth-logo">${MARK}</span><div><h1>Oneklik Biz</h1><p class="akep">One Click, Grow Your Business.</p></div></div>`;
  const pwField = (id, name, label, ac) => `<label class="ain" for="${id}">${ICONS.lock}<input id="${id}" name="${name}" type="password" placeholder="${label}" autocomplete="${ac}" required><button type="button" class="aeye" data-act="pw-eye" data-v="${id}" aria-label="Tampilkan password">${ICONS.eyeoff}</button></label>`;
  let body;
  if (mode === 'loading') body = `<h2>Memuat akun…</h2><p class="asub">Menyiapkan data pengguna Oneklik Biz.</p><div class="skel" style="height:56px;margin-top:18px"></div>`;
  else if (mode === 'setup') body = `<h2>Buat akun super admin</h2><p class="asub">Belum ada pengguna. Akun ini mengelola master data dan semua menu.</p>
    <form data-form="setup" class="aform" novalidate>
      <label class="ain" for="su-name">${ICONS.user}<input id="su-name" name="name" placeholder="Nama lengkap" autocomplete="name" maxlength="50" required></label>
      <label class="ain" for="su-user">${ICONS.user}<input id="su-user" name="username" placeholder="Username admin" autocomplete="username" maxlength="30" required></label>
      ${pwField('su-pw', 'pw', 'Password (min. 12 karakter)', 'new-password')}${pwField('su-pw2', 'pw2', 'Ulangi password', 'new-password')}
      <p class="err" id="au-err" hidden></p>
      <button class="abtn" type="submit">${ICONS.login}Buat akun &amp; masuk</button></form>`;
  else if (mode === 'guest') body = guestForm();
  else if (mode === 'registered') body = `<h2>Pendaftaran terkirim</h2><p class="asub">Terima kasih! Akun pemilik usaha Anda sedang ditinjau super admin Oneklik Biz.</p>
    <p style="margin:16px 0;padding:12px 14px;border-radius:12px;background:#EAF6E3;color:#24461C;font-size:14px;line-height:1.5">Anda bisa masuk dengan username dan password yang baru dibuat <b>setelah pendaftaran disetujui</b>. Kantin Anda juga baru tampil ke pelanggan setelah disetujui.</p>
    <button class="abtn" data-act="auth-mode" data-v="login">${ICONS.login}Kembali ke halaman masuk</button>`;
  else if (mode === 'register') body = `<h2>Daftar pemilik usaha</h2><p class="asub">Buka kantin Anda di Oneklik Biz. Akun langsung aktif setelah mendaftar.</p>
    <form data-form="register" class="aform" novalidate>
      <label class="ain" for="rg-name">${ICONS.user}<input id="rg-name" name="name" placeholder="Nama lengkap pemilik" autocomplete="name" maxlength="50" required></label>
      <label class="ain" for="rg-biz">${ICONS.user}<input id="rg-biz" name="bizName" placeholder="Nama usaha / kantin, mis. Kantin Bu Siti" autocomplete="organization" maxlength="40" required></label>
      <label class="ain" for="rg-contact">${ICONS.mail}<input id="rg-contact" name="contact" placeholder="No. HP / Email" autocomplete="email" maxlength="60" required></label>
      <label class="ain" for="rg-user">${ICONS.user}<input id="rg-user" name="username" placeholder="Username" autocomplete="username" maxlength="30" required></label>
      ${pwField('rg-pw', 'pw', 'Password (min. 12 karakter)', 'new-password')}${pwField('rg-pw2', 'pw2', 'Ulangi password', 'new-password')}
      <p class="err" id="au-err" hidden></p>
      <button class="abtn" type="submit">${ICONS.login}Daftar &amp; masuk</button></form>
    <p class="aalt">Sudah punya akun? <button class="alink" data-act="auth-mode" data-v="login">Masuk</button></p>`;
  else body = `<h2>Masuk ke Akun Anda</h2><p class="asub">Pesan menu favorit, cepat dan praktis!</p>
    <form data-form="login" class="aform" novalidate>
      <label class="ain" for="lg-id">${ICONS.user}<input id="lg-id" name="id" placeholder="Username / NIM / Email" autocomplete="username" required></label>
      ${pwField('lg-pw', 'pw', 'Password', 'current-password')}
      <div class="arow"><label class="acheck"><input type="checkbox" name="remember" checked> Ingat saya</label><button type="button" class="alink" data-act="forgot">Lupa Password?</button></div>
      <p class="err" id="au-err" hidden></p>
      <button class="abtn" type="submit">${ICONS.login}Masuk</button></form>
    <div class="aor"><span>atau</span></div>
    <button class="agoogle" data-act="google">${G_ICON}Masuk dengan Google</button>
    <p class="aalt">Punya usaha kantin? <button class="alink" data-act="auth-mode" data-v="register">Daftar sebagai pemilik usaha</button></p>
    <p class="aalt" style="margin-top:6px">Pelanggan tidak perlu akun: cukup scan QR code di meja untuk memesan.</p>`;
  return `<div class="auth"><div class="auth-left"><div class="aphoto" role="img" aria-label="Suasana kantin" style="background-image:url('${LOGIN_BG}')"></div></div>
    <div class="auth-right"><svg class="awave" viewBox="0 0 800 220" preserveAspectRatio="none" aria-hidden="true"><path d="M0 150C160 60 300 210 470 140S700 40 800 70V220H0z" fill="#CDEBBF"/><path d="M120 220C260 120 420 210 560 170S740 110 800 130V220z" fill="#5BBE3C" opacity=".75"/><path d="M380 220C520 170 660 210 800 180V220z" fill="#2E8A22"/></svg>
      <div class="auth-card">${brand}${body}</div></div></div>`;
}

/* ---------- master data ---------- */
const masterTabs = () => role() === 'admin' ? [['users', 'Pengguna'], ['kantin', 'Kantin'], ['meja', 'Meja & QR code'], ['bayar', 'Metode bayar'], ['kategori', 'Kategori produk']] : [['bayar', 'Metode bayar'], ['kategori', 'Kategori produk']];
function vMaster() {
  const mt = masterTabs(), tab = mt.some(([k]) => k === S.masterTab) ? S.masterTab : mt[0][0];
  return `<div class="vhead"><div><h2>Master data</h2><p class="muted">${role() === 'admin' ? 'Kelola pengguna, kantin, meja & QR code, metode bayar, dan kategori' : 'Kelola metode bayar dan kategori produk ' + esc(kantinName(S.kid))}</p></div></div>
    <div class="seg" role="tablist">${mt.map(([k, l]) => `<button role="tab" class="${tab === k ? 'on' : ''}" aria-selected="${tab === k}" data-act="master-tab" data-v="${k}">${l}</button>`).join('')}</div>
    ${({users: vMasterUsers, kantin: vMasterKantin, meja: vMasterMeja, bayar: vMasterBayar, kategori: vMasterCat})[tab]()}`;
}
function vMasterUsers() {
  const list = users().sort((a, b) => Object.keys(ROLES).indexOf(a.role) - Object.keys(ROLES).indexOf(b.role) || a.name.localeCompare(b.name, 'id'));
  const count = r => list.filter(u => u.role === r && !u.pending).length, pend = pendingRegs();
  return `<div class="stack">${pend.length ? `<div class="card"><h3>Pendaftaran pemilik usaha baru <span class="tag">${pend.length}</span></h3>
      <p class="hint" style="margin-top:0">Setujui untuk mengaktifkan akun dan membuat kantinnya. Kantin langsung tampil ke pelanggan dan bisa diatur di tab Kantin.</p>
      <div class="list">${pend.map(u => `<div class="li"><span class="ico">${esc(initials(u.bizName || u.name))}</span>
        <div><div class="t">${esc(u.bizName || '–')}</div><div class="s">${esc(u.name)} · ${esc(u.contact || '–')} · username ${esc(u.username)} · daftar ${fmtD(u.createdAt, {day: 'numeric', month: 'short'})} ${fmtT(u.createdAt)}</div></div>
        <div class="li-act"><button class="btn ghost sm" data-act="reg-no" data-id="${esc(u.id)}">Tolak</button><button class="btn primary sm" data-act="reg-ok" data-id="${esc(u.id)}">Setujui</button></div></div>`).join('')}</div></div>` : ''}
    <div class="stats">
      <div class="stat"><small>Total pengguna</small><b class="num">${list.length - pend.length}</b></div>
      ${Object.entries(ROLES).filter(([k]) => k !== 'pelanggan').map(([k, r]) => `<div class="stat"><small>${r.l}</small><b class="num">${count(k)}</b></div>`).join('')}</div>
    <div><button class="btn primary" data-act="u-new">+ Tambah pengguna</button></div>
    <div class="tbl-wrap"><table><thead><tr><th>Nama</th><th>Username</th><th>NIM / Email</th><th>Role</th><th>Kantin</th><th>Status</th><th>Terakhir masuk</th><th></th></tr></thead><tbody>
      ${list.filter(u => !u.pending).map(u => `<tr><td><b>${esc(u.name)}</b>${u.id === S.session ? ' <span class="tag">Anda</span>' : ''}</td><td>${esc(u.username)}</td><td>${esc(u.contact || '–')}</td>
        <td><span class="rpill ${u.role}">${ROLES[u.role] ? ROLES[u.role].l : esc(u.role)}</span></td><td>${u.role === 'pemilik' ? esc(kantinName(u.kid || 'main')) : '<span class="muted">semua kantin</span>'}</td><td><span class="spill ${u.active === false ? 'out' : 'ok'}">${u.active === false ? 'Nonaktif' : 'Aktif'}</span></td>
        <td style="white-space:nowrap;font-size:13px">${u.lastLogin ? fmtD(u.lastLogin, {day: 'numeric', month: 'short'}) + ' ' + fmtT(u.lastLogin) : '<span class="muted">belum pernah</span>'}</td>
        <td><div class="li-act"><button class="iconbtn" data-act="u-edit" data-id="${esc(u.id)}" aria-label="Ubah ${esc(u.name)}" title="Ubah">${ICONS.edit}</button><button class="iconbtn" data-act="u-pw" data-id="${esc(u.id)}" aria-label="Reset password ${esc(u.name)}" title="Reset password">${ICONS.key}</button>${u.id === S.session ? '' : `<button class="btn ghost sm" data-act="u-toggle" data-id="${esc(u.id)}">${u.active === false ? 'Aktifkan' : 'Nonaktifkan'}</button>`}${u.id === S.session ? '' : `<button class="iconbtn danger-ic" data-act="u-del" data-id="${esc(u.id)}" aria-label="Hapus ${esc(u.name)}" title="Hapus">${ICONS.trash}</button>`}</div></td></tr>`).join('')}
    </tbody></table></div>
    <div class="card"><h3>Hak akses per role</h3><div class="tbl-wrap" style="border:0"><table><thead><tr><th>Menu</th>${Object.values(ROLES).map(r => `<th class="n">${r.l}</th>`).join('')}</tr></thead><tbody>
      ${Object.keys(VIEW_LABEL).filter(v => v !== 'gantipw').map(v => `<tr><td>${VIEW_LABEL[v][1]}</td>${Object.values(ROLES).map(r => `<td class="n">${r.views.includes(v) ? '<span class="spill ok">✓</span>' : '<span class="muted">–</span>'}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div></div>`;
}
function vMasterKantin() {
  const list = kantinsList(), owners = kid => users().filter(u => u.role === 'pemilik' && (u.kid || 'main') === kid);
  return `<div class="stack"><p class="hint" style="margin:0">Setiap kantin punya menu, pesanan, stok, kas, laporan, dan akun pembayaran sendiri. Satu QR meja dipakai bersama: pelanggan memilih kantin setelah scan. Hubungkan akun Pemilik Usaha ke kantinnya di tab Pengguna.</p>
    <form data-form="kantin-new" class="catnew" novalidate><input name="name" placeholder="Nama kantin baru, mis. Kantin Bu Siti" maxlength="40" aria-label="Nama kantin baru"><button class="btn primary" type="submit">+ Tambah kantin</button><p class="err" id="kn-err" hidden></p></form>
    <div class="list">${list.map(k => `<div class="li ${k.active === false ? 'off' : ''}"><span class="ico">${esc(initials(k.name))}</span>
      <div><div class="t">${esc(k.name)}${k.id === S.kid ? ' <span class="tag">sedang dikelola</span>' : ''}${k.active === false ? ' <span class="tag">Nonaktif</span>' : ''}</div><div class="s">${k.desc ? esc(k.desc) + ' · ' : ''}Pemilik: ${owners(k.id).map(u => esc(u.name)).join(', ') || 'belum ada'}</div></div>
      <div class="li-act">${k.id === S.kid ? '' : `<button class="btn ghost sm" data-act="kantin-open" data-v="${esc(k.id)}">Kelola</button>`}<button class="iconbtn" data-act="kantin-edit" data-v="${esc(k.id)}" aria-label="Ubah ${esc(k.name)}">${ICONS.edit}</button>${k.id === 'main' || list.length <= 1 ? '' : `<button class="iconbtn danger-ic" data-act="kantin-del" data-v="${esc(k.id)}" aria-label="Hapus ${esc(k.name)}">${ICONS.trash}</button>`}</div></div>`).join('')}</div></div>`;
}
function kantinForm(k) {
  return `<h3>Ubah kantin</h3><form data-form="kantin-edit" data-v="${esc(k.id)}" novalidate>
    <div class="field"><label for="ke-name">Nama kantin</label><input id="ke-name" name="name" value="${esc(k.name)}" maxlength="40"></div>
    <div class="field"><label for="ke-desc">Keterangan</label><input id="ke-desc" name="desc" value="${esc(k.desc || '')}" maxlength="80" placeholder="mis. Nasi & lauk, minuman segar"></div>
    <label class="check"><input type="checkbox" name="active" ${k.active !== false ? 'checked' : ''}> Tampilkan ke pelanggan</label>
    <p class="err" id="ke-err" hidden></p>
    <div class="two"><button type="button" class="btn ghost" data-act="close-sheet">Batal</button><button class="btn primary" type="submit">Simpan</button></div></form>`;
}
function vMasterCat() {
  const cats = allCats(), prods = productsSorted();
  return `<div class="stack"><form data-form="cat-new" class="catnew" novalidate><input name="name" placeholder="Nama kategori baru, mis. Camilan" maxlength="24" aria-label="Nama kategori baru"><button class="btn primary" type="submit">+ Tambah</button><p class="err" id="cn-err" hidden></p></form>
    <div class="list">${cats.map(c => { const n = prods.filter(p => p.cat === c).length; return `<div class="li ${catKind(c)}"><span class="ico" style="background:var(--k-soft);color:var(--k-ink)">${esc(initials(c))}</span><div><div class="t">${esc(c)}</div><div class="s">${n} produk</div></div>
      <div class="li-act"><button class="iconbtn" data-act="cat-edit" data-v="${esc(c)}" aria-label="Ubah nama ${esc(c)}">${ICONS.edit}</button><button class="iconbtn danger-ic" data-act="cat-del" data-v="${esc(c)}" aria-label="Hapus ${esc(c)}">${ICONS.trash}</button></div></div>`; }).join('')}</div></div>`;
}
function userForm(u) {
  const isNew = !u; u = u || {role: 'pemilik', active: true};
  return `<h3>${isNew ? 'Tambah pengguna' : 'Ubah pengguna'}</h3><form data-form="user" data-id="${esc(u.id || '')}" novalidate>
    <div class="field"><label for="uf-name">Nama lengkap</label><input id="uf-name" name="name" value="${esc(u.name || '')}" maxlength="50"></div>
    <div class="two"><div class="field"><label for="uf-user">Username</label><input id="uf-user" name="username" value="${esc(u.username || '')}" maxlength="30" autocomplete="off"></div>
      <div class="field"><label for="uf-contact">NIM / Email</label><input id="uf-contact" name="contact" value="${esc(u.contact || '')}" maxlength="60" autocomplete="off"></div></div>
    <div class="field"><label for="uf-kid">Kantin (untuk Pemilik Usaha)</label><select id="uf-kid" name="kid">${kantinsList().map(k => `<option value="${esc(k.id)}" ${(u.kid || 'main') === k.id ? 'selected' : ''}>${esc(k.name)}</option>`).join('')}</select><span class="hint">Pemilik hanya bisa melihat dan mengelola kantin ini. Admin bisa mengelola semua kantin.</span></div>
    <div class="field"><label for="uf-role">Role</label><select id="uf-role" name="role">${Object.entries(ROLES).filter(([k]) => k !== 'pelanggan').map(([k, r]) => `<option value="${k}" ${u.role === k ? 'selected' : ''}>${r.l}</option>`).join('')}</select></div>
    ${isNew ? `<div class="field"><label for="uf-pw">Password awal</label><div class="ain"><input id="uf-pw" name="pw" type="password" autocomplete="new-password" placeholder="min. 12 karakter" style="padding-left:12px"><button type="button" class="aeye" data-act="pw-eye" data-v="uf-pw" aria-label="Tampilkan password">${ICONS.eyeoff}</button></div></div>` : ''}
    <label class="check"><input type="checkbox" name="active" ${u.active !== false ? 'checked' : ''}> Akun aktif (bisa masuk)</label>
    <p class="err" id="uf-err" hidden></p>
    <div class="two"><button type="button" class="btn ghost" data-act="close-sheet">Batal</button><button class="btn primary" type="submit">Simpan</button></div></form>`;
}
function vGantiPw() {
  const u = me(), by = u.pwResetBy ? esc(u.pwResetBy) : 'admin';
  return `<div class="vhead"><div><h2>Ganti password dulu</h2><p class="muted">Demi keamanan data usaha Anda.</p></div></div>
    <div class="card forcepw"><div class="change" style="margin:0 0 14px">${u.pwResetAt && u.createdAt !== u.pwResetAt ? `Password akun Anda <b>diatur ulang oleh ${by}</b> pada ${fmtD(u.pwResetAt, {day: 'numeric', month: 'long', year: 'numeric'})} pukul ${fmtT(u.pwResetAt)}. Bila Anda tidak memintanya, hubungi pengelola kantin.` : `Akun Anda dibuat oleh ${by} dengan password sementara.`} Buat password baru yang hanya Anda ketahui sebelum melanjutkan.</div>
    ${pwForm(u, true).replace(/<h3>[\s\S]*?<\/h3>/, '').replace('<button type="button" class="btn ghost" data-act="close-sheet">Batal</button>', '<button type="button" class="btn ghost" data-act="logout">Keluar</button>')}</div>`;
}
function pwForm(u, self) {
  const box = (id, name, ac, ph = '') => `<div class="ain"><input id="${id}" name="${name}" type="password" autocomplete="${ac}"${ph ? ` placeholder="${ph}"` : ''} style="padding-left:12px"><button type="button" class="aeye" data-act="pw-eye" data-v="${id}" aria-label="Tampilkan password">${ICONS.eyeoff}</button></div>`;
  return `<h3>${self ? 'Ubah password' : 'Reset password · ' + esc(u.name)}</h3><form data-form="pw" data-id="${esc(u.id)}" data-self="${self ? 1 : ''}" novalidate>
    ${self ? `<div class="field"><label for="pw-old">Password lama</label>${box('pw-old', 'old', 'current-password')}</div>` : ''}
    ${self ? '' : '<p class="hint" style="margin-top:-4px">Password ini bersifat sementara. Pemilik akun wajib menggantinya sendiri saat masuk berikutnya, dan akan diberi tahu bahwa passwordnya direset admin.</p>'}
    <div class="field"><label for="pw-new">Password baru</label>${box('pw-new', 'pw', 'new-password', 'min. 12 karakter')}</div>
    <div class="field"><label for="pw-new2">Ulangi password baru</label>${box('pw-new2', 'pw2', 'new-password')}</div>
    <p class="err" id="pw-err" hidden></p>
    <div class="two"><button type="button" class="btn ghost" data-act="close-sheet">Batal</button><button class="btn primary" type="submit">Simpan</button></div></form>`;
}
function catForm(c) {
  return `<h3>Ubah nama kategori</h3><form data-form="cat-edit" data-v="${esc(c)}" novalidate>
    <div class="field"><label for="cf-name">Nama kategori</label><input id="cf-name" name="name" value="${esc(c)}" maxlength="24"></div>
    <p class="hint">Semua produk di kategori “${esc(c)}” ikut dipindahkan ke nama baru.</p><p class="err" id="cf-err" hidden></p>
    <div class="two"><button type="button" class="btn ghost" data-act="close-sheet">Batal</button><button class="btn primary" type="submit">Simpan</button></div></form>`;
}
const saveTables = list => Store.saveGlobal({tables: list});
const soundBtn = () => `<button class="iconbtn plain" data-act="sound-toggle" aria-pressed="${soundOn()}" aria-label="${soundOn() ? 'Matikan' : 'Nyalakan'} notifikasi suara" title="Notifikasi suara: ${soundOn() ? 'aktif' : 'mati'}">${soundOn() ? ICONS.bell : ICONS.bellOff}</button>`;
function accountBox() {
  const u = me(); if (!u) return '';
  if (S.guestTable) return `<div class="ubox"><span class="uav">${esc(initials(u.name))}</span><div><b>${esc(u.name)}</b><small>${esc((tableOf(S.guestTable) || {}).name || '')} · ${esc(u.phone)}</small></div><div class="ubtn">${soundBtn()}<button class="iconbtn plain" data-act="guest-edit" aria-label="Ubah data pemesan" title="Ubah data pemesan">${ICONS.edit}</button></div></div>`;
  return `<div class="ubox"><span class="uav">${esc(initials(u.name))}</span><div><b>${esc(u.name)}</b><small>${ROLES[u.role].l}</small></div>
    <div class="ubtn">${soundBtn()}<button class="iconbtn plain" data-act="my-pw" aria-label="Ubah password" title="Ubah password">${ICONS.key}</button><button class="iconbtn plain" data-act="logout" aria-label="Keluar" title="Keluar">${ICONS.logout}</button></div></div>`;
}

/* ---------- customer ---------- */
const myOrders = () => S.guestTable ? savedOrders().filter(o => o.guest && S.guest && o.guest === S.guest.gid) : savedOrders().filter(o => o.uid && o.uid === S.session);
const noteOf = pid => ((S.meta && S.meta.notes) || {})[pid] || '';
const notesFor = (lines) => { const n = {}; for (const l of lines) { const v = noteOf(l.p.id).trim(); if (v) n[l.p.id] = v.slice(0, 100); } return n; };
const noteIn = (pid, nm) => `<label class="noteline">${ICONS.note}<input data-note="${esc(pid)}" value="${esc(noteOf(pid))}" maxlength="100" placeholder="Catatan, mis. tanpa cabai" aria-label="Catatan untuk ${nm}"></label>`;
const itemsText = (o, html) => orderItems(o).map(x => { const n = (o.notes || {})[x.p.id]; return html ? `${qu(x.q, unitOf(x.p))} ${esc(x.p.name)}${n ? ` <i class="inote">(${esc(n)})</i>` : ''}` : `${qu(x.q, unitOf(x.p))} ${x.p.name}${n ? ' (' + n + ')' : ''}`; }).join(', ');
/* Customer payment choices. Money goes straight to the owner's own QRIS / e-wallet accounts;
   the app does not see the payment, so the cashier confirms it in the merchant app before pressing Bayar. */
const PAY_OPTS = {kasir: {l: 'Bayar di kasir'}, qris: {l: 'QRIS'}, shopeepay: {l: 'ShopeePay', wallet: true}, gopay: {l: 'GoPay', wallet: true}};
const payCfg = () => { const p = (S.settings && S.settings.pay) || {}; return {kasir: p.kasir !== false, qris: p.qris || {}, shopeepay: p.shopeepay || {}, gopay: p.gopay || {}}; };
const payReady = k => { const p = payCfg(); if (k === 'kasir') return p.kasir; const x = p[k] || {}; return !!x.enabled && (k === 'qris' ? !!x.img : !!x.number); };
const payLabel = k => (PAY_OPTS[k] || PAY_OPTS.kasir).l;
function payPill(o, forCustomer) {
  const k = o.payMethod || 'kasir';
  if (o.paid) return `<span class="spill ok">✓ Lunas · ${k === 'kasir' ? 'di kasir' : payLabel(k)}</span>`;
  if (k !== 'kasir' && !o.payClaim && o.payRejected) return `<span class="spill out">${payLabel(k)} · ${forCustomer ? 'pembayaran belum diterima, silakan bayar ulang atau bayar di kasir' : 'ditolak, menunggu bayar ulang'}</span>`;
  if (k === 'kasir') return forCustomer ? '' : '<span class="spill">Bayar di kasir</span>';
  if (o.payClaim) return `<span class="spill pay">${payLabel(k)} · ${forCustomer ? 'menunggu verifikasi kasir' : 'pelanggan sudah bayar, cek mutasi'}</span>`;
  return `<span class="spill low">${payLabel(k)} · belum dibayar</span>`;
}
function statusPill(o, forCustomer) {
  const pay = payPill(o, forCustomer);
  if (o.status === 'diantar') return `<span class="spill deliv">${forCustomer ? 'Sudah diantar' : 'Sudah diantar'}${o.deliveredAt ? ' ' + fmtT(o.deliveredAt) : ''} · Antrian ${o.queue || '-'}</span> ${pay || '<span class="muted" style="font-size:12px">belum dibayar</span>'}`;
  if (o.status === 'diproses') return `<span class="spill ok">${forCustomer ? 'Sedang disiapkan' : 'Diproses dapur'} · Antrian ${o.queue || '-'}</span> ${pay || '<span class="muted" style="font-size:12px">belum dibayar</span>'}`;
  return `<span class="spill low">${forCustomer ? 'Menunggu konfirmasi kasir' : 'Belum diproses'}</span> ${pay}`;
}
function orderTotal(o) { return orderItems(o).reduce((a, x) => a + lineAmt(x.p.price, x.q), 0); }
const needsVal = o => o.payMethod && o.payMethod !== 'kasir' && !o.paid && !!o.payClaim;
function svActions(o, cur) {
  const id = esc(o.id), print = `<button class="btn ghost sm" data-act="print-order" data-id="${id}">${ICONS.printer}${o.status ? 'Cetak ulang' : 'Cetak & proses'}</button>`;
  const deliv = o.status === 'diantar' ? `<button class="btn ghost sm" data-act="undeliver" data-id="${id}">Batal diantar</button>` : `<button class="btn deliv sm" data-act="deliver" data-id="${id}">${ICONS.check}${o.paid ? 'Diantar & selesai' : 'Sudah diantar'}</button>`;
  if (o.paid) return print + deliv;
  const val = o.payMethod && o.payMethod !== 'kasir' ? `<button class="btn val sm" data-act="pay-validate" data-id="${id}">${ICONS.check}Validasi</button>${o.payClaim ? `<button class="btn ghost sm" data-act="pay-reject" data-id="${id}">Tolak</button>` : ''}` : '';
  return `${val}<button class="btn ghost sm" data-act="del-order" data-id="${id}">Hapus</button>${print}${deliv}${cur ? '' : `<button class="btn primary sm" data-act="resume" data-id="${id}">Bayar</button>`}`;
}
function valSheet() {
  const all = savedOrders().filter(o => o.payMethod && o.payMethod !== 'kasir' && !o.paid), claimed = all.filter(o => o.payClaim), wait = all.filter(o => !o.payClaim);
  const card = o => `<article class="sv ${o.payClaim ? 'claim' : ''}"><div class="sv-top"><span>${esc(o.customer || 'Pelanggan')}${o.tableName ? ` <span class="tag">${esc(o.tableName)}</span>` : ''}</span><span class="num">${rp(orderTotal(o))}</span></div>
    <div class="sv-sub">${payPill(o)}${o.payClaim ? ' · klaim ' + fmtT(o.payClaim.at) : ''}${o.phone ? ' · ' + esc(o.phone) : ''}${o.queue ? ' · Antrian ' + o.queue : ''}</div>
    <div class="sv-items">${itemsText(o, true)}</div><div class="sv-act">${svActions(o, S.meta.savedId === o.id).split('<button class="btn ghost sm" data-act="del-order"')[0]}</div></article>`;
  return `<h3>Validasi pembayaran</h3>
    <p class="hint" style="margin-top:-6px">Cek notifikasi/mutasi di aplikasi QRIS, ShopeePay, atau GoPay milik kantin. Tekan <b>Validasi</b> bila uangnya sudah masuk: pesanan langsung tercatat <b>lunas</b> dan masuk ke laporan keuangan.</p>
    <h4 class="valh">Pelanggan menyatakan sudah bayar · ${claimed.length}</h4>${claimed.length ? `<div class="saved">${claimed.map(card).join('')}</div>` : '<p class="muted" style="margin:0">Tidak ada yang menunggu validasi.</p>'}
    ${wait.length ? `<h4 class="valh">Memilih QRIS/e-wallet, belum menyatakan bayar · ${wait.length}</h4><div class="saved">${wait.map(card).join('')}</div>` : ''}`;
}
async function validateOrder(id) {
  const o = S.orders[id]; if (!o || o.paid) return null;
  if (S.mode === 'db' && !S.loaded.days) throw {message: 'Data penjualan masih dimuat, coba lagi sebentar.'};
  const items = orderItems(o).map(x => { const n = (o.notes || {})[x.p.id]; return {pid: x.p.id, name: x.p.name, cat: x.p.cat, unit: unitOf(x.p), price: +x.p.price, cost: +x.p.cost, qty: x.q, ...(n ? {note: n} : {})}; });
  if (!items.length) throw {message: 'Produk di pesanan ini sudah dihapus.'};
  const now = Date.now(), key = dayKey(now), dayTx = (S.days[key] && S.days[key].tx) || {}, k = o.payMethod || 'kasir', wallet = PAY_OPTS[k] && PAY_OPTS[k].wallet;
  const total = items.reduce((a, x) => a + lineAmt(x.price, x.qty), 0);
  const tx = {no: Object.keys(dayTx).length + 1, at: now, customer: o.customer || '', orderType: o.type === 'take' ? 'take' : 'dine', items, total, subtotal: total,
    cost: items.reduce((a, x) => a + lineAmt(x.cost, x.qty), 0), method: k === 'qris' ? 'qris' : wallet ? 'ewallet' : 'tunai', validated: {at: now, by: (me() || {}).name || ''}};
  if (wallet) tx.wallet = k;
  if (o.queue) tx.queue = o.queue;
  if (o.deliveredAt) tx.deliveredAt = o.deliveredAt;
  if (o.uid) tx.uid = o.uid;
  if (o.guest) Object.assign(tx, {table: o.table, tableName: o.tableName, phone: o.phone, guest: o.guest});
  const tid = uid('t');
  await Store.addSale(key, tid, tx);
  if (o.status === 'diantar') await Store.delOrder(id);
  else await Store.saveOrder({...o, paid: {at: now, day: key, txId: tid, no: tx.no}});
  return tx;
}
function payChooser(id, justSent) {
  const o = (S.orders || {})[id]; if (!o) return '<h3>Pesanan tidak ditemukan</h3><button class="btn ghost block" data-act="close-sheet">Tutup</button>';
  const opts = ['kasir', 'qris', 'shopeepay', 'gopay'].filter(payReady), total = orderTotal(o), cur = o.payMethod || 'kasir';
  const sub = {kasir: 'Bayar tunai/non-tunai saat mengambil pesanan', qris: 'Scan QRIS kantin dari aplikasi bank/e-wallet apa pun', shopeepay: 'Kirim ke ShopeePay pemilik kantin', gopay: 'Kirim ke GoPay pemilik kantin'};
  return `${justSent ? '<div class="sentok">' + ICONS.check + '<div><b>Pesanan terkirim ke kasir</b><span>' + esc(o.tableName || '') + ' · ' + esc(o.customer || '') + '</span></div></div>' : ''}
    <h3>Pilih metode pembayaran</h3><div class="payhead"><span class="muted">Total bayar</span><b class="num">${rp(total)}</b></div>
    <div class="paychoices">${opts.map(k => `<button class="paychoice ${cur === k ? 'on' : ''}" data-act="c-choose" data-id="${esc(o.id)}" data-v="${k}" aria-pressed="${cur === k}">
      ${k === 'kasir' ? `<span class="paylogo kasir">${ICONS.bag}</span>` : `<span class="paylogo ${k}">${k === 'qris' ? 'QRIS' : payLabel(k)}</span>`}<span class="pc-txt"><b>${payLabel(k)}</b><small>${sub[k]}</small></span>${cur === k ? ICONS.check : ''}</button>`).join('')}</div>
    <p class="hint">Pilihan Anda langsung terlihat di kasir.</p>`;
}
function payScreen(id) {
  const o = (S.orders || {})[id]; if (!o) return '<h3>Pesanan tidak ditemukan</h3><button class="btn ghost block" data-act="close-sheet">Tutup</button>';
  const k = o.payMethod, c = payCfg()[k] || {}, total = orderTotal(o);
  const head = `<div class="payhead ${k}"><span class="paylogo ${k}">${k === 'qris' ? 'QRIS' : payLabel(k)}</span><div><small>Total bayar</small><b class="num">${rp(total)}</b></div></div>`;
  const body = c.img && k === 'qris' ? `<div class="payqr"><img src="${esc(c.img)}" alt="${k === 'qris' ? 'QRIS' : payLabel(k)} ${esc(c.name || cfg().shopName)}"></div>` : '';
  const acct = PAY_OPTS[k].wallet && c.number ? `<div class="payacct"><div><small>Nomor ${payLabel(k)}</small><b class="num">${esc(c.number)}</b><span>a.n. ${esc(c.name || cfg().shopName)}</span></div><button class="btn ghost sm" data-act="copy-text" data-v="${esc(c.number)}">Salin</button></div>` : '';
  const steps = k === 'qris' ? ['Buka aplikasi bank atau e-wallet apa pun yang mendukung QRIS.', 'Scan kode QR di atas (atau simpan gambar lalu unggah di aplikasi).', `Masukkan nominal <b>${rp(total)}</b>, lalu bayar.`]
    : [`Buka aplikasi ${payLabel(k)}.`, `Pilih <b>Transfer/Kirim</b>, lalu masukkan nomor ${payLabel(k)} di atas (cek nama penerima: <b>${esc(c.name || cfg().shopName)}</b>).`, `Masukkan nominal <b>${rp(total)}</b>, lalu bayar.`];
  return `<h3>Bayar dengan ${payLabel(k)}</h3>${head}${body}${acct}
    <ol class="paysteps">${steps.map(x => `<li>${x}</li>`).join('')}<li>Tekan <b>Saya sudah bayar</b>. Kasir mengecek pembayaran sebelum pesanan diserahkan.</li></ol>
    ${o.payClaim ? '<div class="change">Terima kasih! Pembayaran menunggu verifikasi kasir.</div>' : `<button class="btn paynow block" data-act="c-paid" data-id="${esc(o.id)}">Saya sudah bayar</button>`}
    <div class="two" style="margin-top:10px">${o.payClaim || o.status ? '' : `<button class="btn ghost" data-act="c-paykasir" data-id="${esc(o.id)}">Bayar di kasir saja</button>`}<button class="btn ghost" data-act="close-sheet">Tutup</button></div>`;
}
function vMasterBayar() {
  const p = payCfg();
  const card = (k, title, hint) => { const x = p[k] || {}, wallet = PAY_OPTS[k].wallet; return `<form class="card payset" data-form="payset" data-v="${k}" novalidate>
    <div class="payset-h"><span class="paylogo ${k}">${k === 'qris' ? 'QRIS' : title}</span><label class="check"><input type="checkbox" name="enabled" ${x.enabled ? 'checked' : ''}> Tampilkan ke pelanggan</label></div>
    <p class="hint" style="margin:0">${hint}</p>
    ${wallet ? `<div class="two"><div class="field"><label for="pp-${k}">Nomor HP terdaftar di ${title}</label><input id="pp-${k}" name="number" value="${esc(x.number || '')}" inputmode="tel" maxlength="20" placeholder="08xxxxxxxxxx"></div><div class="field"><label for="pn-${k}">Nama pemilik akun</label><input id="pn-${k}" name="name" value="${esc(x.name || '')}" maxlength="50" placeholder="sesuai nama di ${title}"></div></div>` : `<div class="payset-b"><div class="payprev" id="pv-${k}">${x.img ? `<img src="${esc(x.img)}" alt="">` : '<span>Belum ada gambar QR</span>'}</div>
      <div class="stack" style="gap:10px;min-width:0;flex:1">
        <label class="btn ghost sm filebtn">${ICONS.edit}Pilih gambar QR<input type="file" accept="image/*" data-payimg="${k}" hidden></label>
        <input type="hidden" name="img" value="${esc(x.img || '')}" id="pi-${k}">
        ${x.img ? `<button type="button" class="linkbtn" data-act="pay-img-clear" data-v="${k}">Hapus gambar</button>` : ''}
        <div class="field"><label for="pn-${k}">Nama pemilik akun</label><input id="pn-${k}" name="name" value="${esc(x.name || '')}" maxlength="50" placeholder="mis. nama usaha / nama pemilik"></div>
      </div></div>`}
    <p class="err" id="pe-${k}" hidden></p>
    <button class="btn primary" type="submit">Simpan ${title}</button></form>`; };
  return `<div class="stack"><div class="card"><h3>Metode bayar untuk pelanggan</h3>
      <label class="check" style="margin-top:4px"><input type="checkbox" data-paykasir ${p.kasir ? 'checked' : ''}> Izinkan “Bayar di kasir”</label>
      <p class="hint" style="margin:8px 0 0">Pembayaran QRIS, ShopeePay, dan GoPay langsung masuk ke akun pemilik usaha. Aplikasi tidak bisa melihat uang yang masuk, jadi kasir tetap mengecek notifikasi/mutasi di aplikasi merchant sebelum menekan Bayar.</p></div>
    ${card('qris', 'QRIS', 'Unggah gambar QRIS statis milik kantin (dari aplikasi bank atau penyedia QRIS). Pelanggan akan melihat gambar ini di HP-nya.')}
    ${card('shopeepay', 'ShopeePay', 'Cukup isi nomor HP yang terdaftar di akun ShopeePay pemilik. Pelanggan mentransfer ke nomor ini (tanpa QR code).')}
    ${card('gopay', 'GoPay', 'Cukup isi nomor HP yang terdaftar di akun GoPay pemilik. Pelanggan mentransfer ke nomor ini (tanpa QR code).')}</div>`;
}
async function readQrImage(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((ok, bad) => { const i = new Image(); i.onload = () => ok(i); i.onerror = bad; i.src = url; });
    const max = 900, sc = Math.min(1, max / Math.max(img.width, img.height));
    const cv = document.createElement('canvas'); cv.width = Math.round(img.width * sc); cv.height = Math.round(img.height * sc);
    const cx = cv.getContext('2d'); cx.fillStyle = '#ffffff'; cx.fillRect(0, 0, cv.width, cv.height); cx.drawImage(img, 0, 0, cv.width, cv.height);
    const png = cv.toDataURL('image/png'); return png.length < 450000 ? png : cv.toDataURL('image/jpeg', 0.92);
  } finally { URL.revokeObjectURL(url); }
}
const savePay = patch => Store.saveSettings({...(S.settings || {}), categories: cfg().categories, pay: {...((S.settings && S.settings.pay) || {}), ...patch}});
function nextQueue() {
  const today = dayKey(Date.now()); let max = 0;
  for (const o of savedOrders()) if (o.queue && o.printedAt && dayKey(o.printedAt) === today) max = Math.max(max, +o.queue);
  for (const t of allTx()) if (t.queue && t.day === today) max = Math.max(max, +t.queue);
  return max + 1;
}
function ticketHtml(o) {
  const it = orderItems(o), total = it.reduce((a, x) => a + lineAmt(x.p.price, x.q), 0), c = cfg();
  return `<div class="ticket"><div class="tk-head"><b>ONEKLIK BIZ</b><span>${esc(c.shopName)}</span></div>
    <div class="tk-title">PESANAN DAPUR</div>
    <div class="tk-queue">Antrian <b>${o.queue || '-'}</b></div>
    <div class="tk-meta">${o.tableName ? `<div><span>Meja</span><b>${esc(o.tableName)}</b></div>` : ''}<div><span>Nama</span><b>${esc(o.customer || '-')}</b></div>${o.phone ? `<div><span>HP</span><b>${esc(o.phone)}</b></div>` : ''}
      <div><span>Jenis</span><b>${o.type === 'take' ? 'BUNGKUS' : 'Makan di tempat'}</b></div><div><span>Waktu</span><b>${fmtD(o.printedAt || Date.now(), {day: 'numeric', month: 'short'})} ${fmtT(o.printedAt || Date.now())}</b></div></div>
    <table class="tk-items">${it.map(x => { const n = (o.notes || {})[x.p.id]; return `<tr><td class="q">${fq(x.q)}×</td><td>${esc(x.p.name)}${unitOf(x.p) !== 'porsi' ? ` <small>(${unitOf(x.p)})</small>` : ''}${n ? `<div class="tk-note">» ${esc(n)}</div>` : ''}</td></tr>`; }).join('')}</table>
    <div class="tk-total"><span>Total (${o.paid ? 'LUNAS' + (o.payMethod && o.payMethod !== 'kasir' ? ' · ' + payLabel(o.payMethod) : '') : o.payMethod && o.payMethod !== 'kasir' ? payLabel(o.payMethod) + (o.payClaim ? ', diklaim lunas' : ', belum bayar') : 'belum dibayar'})</span><b>${rp(total)}</b></div>
    <div class="tk-foot">Bayar di kasir saat mengambil pesanan</div></div>`;
}
function printTicket(o) {
  const html = ticketHtml(o);
  if (window.claude) {
    openSheet(() => `<h3>Cetak pesanan</h3><div class="tk-preview">${html}</div><p class="hint">Tampilan online tidak bisa membuka dialog cetak. Cetak dari versi XAMPP (http://…/oneklik/) atau browser biasa.</p><button class="btn primary block" data-act="close-sheet">Tutup</button>`);
    return;
  }
  $('#print-area').innerHTML = html;
  document.body.classList.add('print-ticket');
  const done = () => { document.body.classList.remove('print-ticket'); window.removeEventListener('afterprint', done); };
  window.addEventListener('afterprint', done);
  setTimeout(() => window.print(), 50);
}
function saleReceiptHtml(t) {
  const c = cfg(), method = METHODS[methodOf(t)] + (t.wallet ? ' (' + payLabel(t.wallet) + ')' : '');
  return `<div class="ticket"><div class="tk-head"><b>${esc(kantinName(S.kid))}</b><span>${esc(c.shopName)}</span></div>
    <div class="tk-title">STRUK PEMBAYARAN</div>
    <div class="tk-meta"><div><span>No. Struk</span><b>#${pad3(t.no || 0)}</b></div>${t.customer ? `<div><span>Pelanggan</span><b>${esc(t.customer)}</b></div>` : ''}${t.tableName ? `<div><span>Meja</span><b>${esc(t.tableName)}</b></div>` : ''}
      <div><span>Jenis</span><b>${t.orderType === 'take' ? 'Bungkus' : 'Makan di tempat'}</b></div>
      <div><span>Waktu</span><b>${fmtD(t.at, {day: 'numeric', month: 'short', year: 'numeric'})} ${fmtT(t.at)}</b></div>
      <div><span>Bayar</span><b>${esc(method)}</b></div></div>
    <table class="tk-items">${t.items.map(it => `<tr><td class="q">${fq(it.qty)}×</td><td>${esc(it.name)}<div class="tk-note">${rp(it.price)}</div>${it.note ? `<div class="tk-note">» ${esc(it.note)}</div>` : ''}</td><td style="text-align:right;font-weight:700">${rp(lineAmt(it.price, it.qty))}</td></tr>`).join('')}</table>
    ${t.discount ? `<div class="tk-total"><span>Subtotal</span><b>${rp(t.subtotal)}</b></div><div class="tk-total"><span>Diskon ${discLabel(t.discount)}</span><b>−${rp(t.discount.amount)}</b></div>` : ''}
    <div class="tk-total"><span>TOTAL</span><b>${rp(t.total)}</b></div>
    ${t.paid ? `<div class="tk-total"><span>Tunai</span><b>${rp(t.paid)}</b></div><div class="tk-total"><span>Kembali</span><b>${rp(t.change || 0)}</b></div>` : ''}
    <div class="tk-foot">${t.void ? '*** TRANSAKSI DIBATALKAN ***' : 'Terima kasih atas kunjungan Anda!'}</div></div>`;
}
function printSaleReceipt(t) {
  const html = saleReceiptHtml(t);
  $('#print-area').innerHTML = html;
  document.body.classList.add('print-ticket');
  const done = () => { document.body.classList.remove('print-ticket'); window.removeEventListener('afterprint', done); };
  window.addEventListener('afterprint', done);
  setTimeout(() => window.print(), 50);
}
async function processOrder(o) {
  if (!o.status) {
    o = {...o, status: 'diproses', queue: nextQueue(), printedAt: Date.now()};
    await Store.saveOrder(o);
    if (S.meta.savedId === o.id) Object.assign(S.meta, {status: o.status, queue: o.queue, printedAt: o.printedAt});
  }
  printTicket(o);
  return o;
}
function orderItems(o) { return Object.entries(o.cart || {}).map(([pid, q]) => ({p: S.products[pid], q})).filter(x => x.p); }
function custPay() {
  const want = S.meta.pay || 'kasir';
  if (payReady(want)) return want;
  return ['kasir', 'qris', 'shopeepay', 'gopay'].find(payReady) || 'kasir';
}
function custPayPicker() {
  const ready = ['kasir', 'qris', 'shopeepay', 'gopay'].filter(payReady); if (ready.length < 2) return '';
  const cur = custPay(), wallets = ready.filter(k => PAY_OPTS[k].wallet), group = PAY_OPTS[cur].wallet ? 'ewallet' : cur;
  const top = [...(ready.includes('kasir') ? [['kasir', 'Bayar di kasir']] : []), ...(ready.includes('qris') ? [['qris', 'QRIS']] : []), ...(wallets.length ? [['ewallet', 'E-Wallet']] : [])];
  return `<div><span class="cash-lb">Metode pembayaran</span><div class="paym" style="grid-template-columns:repeat(${top.length},minmax(0,1fr))">${top.map(([k, l]) => `<button class="${group === k ? 'on' : ''}" data-act="c-pay" data-v="${k === 'ewallet' ? (PAY_OPTS[cur].wallet ? cur : wallets[0]) : k}" aria-pressed="${group === k}">${l}</button>`).join('')}</div>
    ${group === 'ewallet' ? `<div class="walletpick">${wallets.map(k => `<button class="${cur === k ? 'on' : ''}" data-act="c-pay" data-v="${k}" aria-pressed="${cur === k}"><span class="paylogo ${k}">${payLabel(k)}</span></button>`).join('')}</div>` : ''}</div>`;
}
function custOrderBody(inSheet) {
  const lines = cartLines(), total = cartTotal(lines), n = lines.reduce((s, l) => s + l.q, 0);
  const list = lines.length
    ? `<ul class="olines">${lines.map(l => { const id = esc(l.p.id), nm = esc(l.p.name), u = unitOf(l.p); return `<li class="ol ${catKind(l.p.cat)}"><span class="othumb">${productImg(l.p)}</span>
        <div class="oinfo"><div class="oname">${nm} (${qu(l.q, u)})</div><div class="oprice num">${rp(lineAmt(l.p.price, l.q))}</div>
          <div class="stepper"><button data-act="sub" data-id="${id}" aria-label="Kurangi ${nm}">−</button><span class="num">${fq(l.q)}</span><button class="plus" data-act="add" data-id="${id}" aria-label="Tambah ${nm}">+</button></div>${noteIn(l.p.id, nm)}</div>
        <button class="otrash" data-act="remove" data-id="${id}" aria-label="Hapus ${nm} dari pesanan">${ICONS.trash}</button></li>`; }).join('')}</ul>`
    : `<div class="o-empty food">${ILL.food}<b>Keranjang masih kosong</b>Pilih menu favoritmu, lalu kirim pesanan ke kasir.</div>`;
  return `<div class="olines-wrap">${list}</div><div class="ofoot">
    <div class="otype" role="group" aria-label="Jenis pesanan"><button class="${S.meta.type !== 'take' ? 'on' : ''}" data-act="otype" data-v="dine" aria-pressed="${S.meta.type !== 'take'}">Makan di tempat</button><button class="${S.meta.type === 'take' ? 'on' : ''}" data-act="otype" data-v="take" aria-pressed="${S.meta.type === 'take'}">Bungkus</button></div>
    <div class="totrow"><span>Total Harga<small>${lines.length} jenis menu</small></span><b class="num">${rp(total)}</b></div>
    <div class="oact" style="grid-template-columns:1fr"><button class="btn paynow" data-act="c-send" ${n ? '' : 'disabled'}>${ICONS.bag}Kirim Pesanan</button></div>
    <p class="hint" style="margin:0">Setelah pesanan terkirim, Anda memilih cara bayar: ${['kasir', 'qris', 'shopeepay', 'gopay'].filter(payReady).map(payLabel).join(', ')}.</p></div>`;
}
function vPesananku() {
  if (S.guestTable) return vGuestOrders();
  const open = myOrders(), done = allTx().filter(t => t.uid && t.uid === S.session).slice().reverse().slice(0, 30);
  return `<div class="vhead"><div><h2>Pesanan saya</h2><p class="muted">Pesanan yang dikirim ke kasir dan riwayat pembelian</p></div><button class="btn primary" data-act="nav" data-v="pesan">+ Pesan lagi</button></div>
    <div class="stack"><div class="card"><h3>Menunggu diproses · ${open.length}</h3>
      ${open.length ? `<div class="saved">${open.map(o => { const it = orderItems(o), tot = it.reduce((s, x) => s + lineAmt(x.p.price, x.q), 0); return `<article class="sv"><div class="sv-top"><span>${fmtD(o.at, {day: 'numeric', month: 'short'})} · ${fmtT(o.at)}</span><span class="num">${rp(tot)}</span></div>
        <div class="sv-sub">${o.type === 'take' ? 'Bungkus' : 'Makan di tempat'} · ${statusPill(o, true)}</div><div class="sv-items">${itemsText(o, true)}</div>
        <div class="sv-act">${o.payClaim || o.paid ? '' : `${o.payMethod && o.payMethod !== 'kasir' ? `<button class="btn primary sm" data-act="c-payopen" data-id="${esc(o.id)}">Bayar ${payLabel(o.payMethod)}</button>` : ''}${['kasir', 'qris', 'shopeepay', 'gopay'].filter(payReady).length > 1 ? `<button class="btn ghost sm" data-act="c-paychoose" data-id="${esc(o.id)}">${o.payMethod && o.payMethod !== 'kasir' ? 'Ubah metode bayar' : 'Pilih metode bayar'}</button>` : ''}`}${o.status ? '' : `<button class="btn ghost sm" data-act="c-cancel" data-id="${esc(o.id)}">Batalkan pesanan</button>`}</div>${o.status === 'diantar' ? `<p class="hint" style="margin:0">Pesanan sudah diantar. Selamat menikmati!${!o.payMethod || o.payMethod === 'kasir' ? ' Silakan bayar di kasir.' : ''}</p>` : o.status === 'diproses' ? `<p class="hint" style="margin:0">Pesanan sedang disiapkan.${!o.payMethod || o.payMethod === 'kasir' ? ' Silakan bayar di kasir saat mengambil pesanan.' : ''}</p>` : ''}</article>`; }).join('')}</div>` : '<p class="muted" style="margin:0">Tidak ada pesanan yang sedang menunggu.</p>'}</div>
    <div class="card"><h3>Riwayat pembelian</h3>${done.length ? `<div class="receipts">${done.map(t => receipt(t, true)).join('')}</div>` : '<p class="muted" style="margin:0">Belum ada pembelian yang selesai.</p>'}</div></div>`;
}
const CUST_ACTS = new Set(['sound-toggle', 'confirm-yes', 'c-hist-del', 'c-hist-clear', 'pick-kantin', 'c-paychoose', 'c-choose', 'c-pay', 'c-payopen', 'c-paid', 'c-paykasir', 'copy-text', 'guest-edit', 'nav', 'cat', 'add', 'sub', 'remove', 'otype', 'open-cart', 'close-sheet', 'c-send', 'c-cancel', 'logout', 'my-pw', 'open-drawer', 'close-drawer', 'sort', 'set-sort', 'hide-banner', 'focus-order', 'add-more']);
const AUTH_ACTS = new Set(['auth-mode', 'pw-eye', 'google', 'forgot', 'close-sheet']);

/* ---------- PHP backend (public/api) ----------
   Same document interface the page already uses (collection/doc, set/update/delete, onSnapshot),
   backed by PHP + MySQL. Changes from other devices arrive by polling a revision number. */
const API_URL = 'api/';
function deepMerge(a, b) {
  for (const k in b) { const v = b[k]; if (v && typeof v === 'object' && !Array.isArray(v) && a[k] && typeof a[k] === 'object' && !Array.isArray(a[k])) a[k] = deepMerge(a[k], v); else a[k] = v; }
  return a;
}
function remoteDB(url) {
  const st = {rev: -1, docs: {}, subs: new Set(), ready: false};
  const clone = v => v === undefined ? undefined : JSON.parse(JSON.stringify(v));
  async function req(op, body) {
    let r;
    try { r = await fetch(url + '?op=' + op, {method: body ? 'POST' : 'GET', credentials: 'same-origin', headers: {'Content-Type': 'application/json', 'X-Guest': (S.guest && S.guest.gid) || ''}, body: body ? JSON.stringify(body) : undefined}); }
    catch (e) { throw {code: 'unavailable', message: 'Server kantin tidak bisa dihubungi. Periksa Wi-Fi dan XAMPP.'}; }
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw {code: r.status === 503 ? 'unavailable' : 'invalid_argument', status: r.status, message: j.error || ('Server menjawab ' + r.status)};
    return j;
  }
  const fire = () => { for (const s of st.subs) s(); };
  async function refresh() {
    const d = await req('dump');
    st.docs = d.docs || {}; st.rev = d.rev; st.ready = true;
    S.hasUsers = !!d.hasUsers; S.remoteErr = ''; S.stale = false;
    if (!d.me && S.session && !S.guestTable) setSession(null);
    fire();
  }
  async function poll() {
    try { const r = await req('rev'); if (r.rev !== st.rev) await refresh(); else if (S.stale) { S.stale = false; S.remoteErr = ''; render(); } }
    catch (e) { if (!S.stale) { S.stale = true; S.remoteErr = e.message; render(); } }
  }
  const snap = (col, id) => { const d = (st.docs[col] || {})[id]; return {id, exists: d !== undefined, data: () => clone(d), metadata: {fromCache: false, hasPendingWrites: false}}; };
  const sub = fn => { st.subs.add(fn); if (st.ready) fn(); return () => st.subs.delete(fn); };
  async function write(act, col, id, data) {
    const c = st.docs[col] || (st.docs[col] = {}), prev = c[id];
    if (act === 'update' && prev === undefined) throw {code: 'invalid_argument', message: 'Data tidak ditemukan.'};
    if (act === 'set') c[id] = clone(data); else if (act === 'update') c[id] = deepMerge(clone(prev), clone(data)); else delete c[id];
    fire();
    try { await req('write', {act, col, id, data}); }
    catch (e) { if (prev === undefined) delete c[id]; else c[id] = prev; fire(); throw e; }
  }
  const docRef = (col, id) => ({id, path: col + '/' + id, get: async () => snap(col, id),
    set: d => write('set', col, id, d), update: d => write('update', col, id, d), delete: () => write('delete', col, id),
    onSnapshot: next => sub(() => next(snap(col, id)))});
  const colRef = col => ({path: col, doc: id => docRef(col, id || uid('d')),
    onSnapshot: next => sub(() => { const docs = Object.keys(st.docs[col] || {}).map(id => snap(col, id)); next({docs, size: docs.length, empty: !docs.length, metadata: {fromCache: false, hasPendingWrites: false}, docChanges: () => []}); })});
  refresh().catch(e => { S.stale = true; S.remoteErr = e.message; S.usersLoaded = true; render(); });
  setInterval(poll, 3000);
  return {collection: colRef, doc: p => { const [c, i] = String(p).split('/'); return docRef(c, i); }, refresh, req};
}
async function detectBackend() {
  if (!/^https?:$/.test(location.protocol) || window.claude) return false;
  try {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 2500);
    const r = await fetch(API_URL + '?op=ping', {signal: ctl.signal, credentials: 'same-origin'}); clearTimeout(t);
    const j = await r.json(); return !!(j && (j.ok || j.error));
  } catch (e) { return false; }
}

/* ---------- customers from a table QR code (no account) ---------- */
S.guestTable = (() => {
  const h = location.hash.match(/^#meja-([A-Za-z0-9_-]{1,40})$/); if (h) return h[1];
  try { const q = new URLSearchParams(location.search).get('meja'); return q && /^[A-Za-z0-9_-]{1,40}$/.test(q) ? q : null; } catch (e) { return null; }
})();
S.guest = null;
if (S.guestTable) {
  try { S.guest = JSON.parse(localStorage.getItem('kantin-uis-guest') || 'null'); } catch (e) {}
  if (!S.guest || !S.guest.gid) S.guest = {gid: 'g' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8), name: '', phone: ''};
  try { localStorage.setItem('kantin-uis-guest', JSON.stringify(S.guest)); } catch (e) {}
}
const saveGuest = () => { try { localStorage.setItem('kantin-uis-guest', JSON.stringify(S.guest)); } catch (e) {} };
const tables = () => cfg().tables;
const tableOf = id => tables().find(t => t.id === id);
const normPhone = v => { let d = String(v || '').replace(/[^\d+]/g, ''); if (d.startsWith('+62')) d = '0' + d.slice(3); else if (d.startsWith('62')) d = '0' + d.slice(2); return d.replace(/\D/g, ''); };
const validPhone = v => /^08\d{8,12}$/.test(normPhone(v));
function guestHistory() { try { return JSON.parse(localStorage.getItem('kantin-uis-guest-orders') || '[]'); } catch (e) { return []; } }
function setGuestHistory(h) { try { localStorage.setItem('kantin-uis-guest-orders', JSON.stringify(h)); } catch (e) {} }
function addGuestHistory(x) { const h = [x, ...guestHistory()].slice(0, 30); try { localStorage.setItem('kantin-uis-guest-orders', JSON.stringify(h)); } catch (e) {} }
function guestForm() {
  const t = tableOf(S.guestTable), g = S.guest || {};
  if (!t) return `<h2>QR meja tidak dikenali</h2><p class="asub">Kode meja ini tidak terdaftar atau sudah dihapus. Minta QR code yang baru ke kasir.</p>`;
  return `<div class="ameja">${ICONS.pesan}<span>Anda memesan dari</span><b>${esc(t.name)}</b></div>
    <h2>Isi data pemesan</h2><p class="asub">Tanpa daftar akun. Nama dan nomor HP dipakai kasir untuk memanggil Anda saat pesanan siap.</p>
    <form data-form="guest" class="aform" novalidate>
      <label class="ain" for="gs-name">${ICONS.user}<input id="gs-name" name="name" value="${esc(g.name || '')}" placeholder="Nama Anda" autocomplete="name" maxlength="40" required></label>
      <label class="ain" for="gs-phone">${ICONS.phone}<input id="gs-phone" name="phone" value="${esc(g.phone || '')}" placeholder="Nomor HP, mis. 0812 3456 7890" autocomplete="tel" inputmode="tel" maxlength="18" required></label>
      <p class="err" id="au-err" hidden></p>
      <button class="abtn" type="submit">${ICONS.pesan}Mulai Pesan</button></form>
    <p class="aalt" style="font-size:13px">Pembayaran dilakukan di kasir: tunai, QRIS, transfer, atau e-wallet.</p>`;
}

/* ---------- tables & QR codes ---------- */
function qrBase() {
  const b = cfg().qrBase; if (b) return b;
  if (window.claude) return '';
  return location.origin + location.pathname;
}
const tableUrl = t => { const b = qrBase(); return b ? b.replace(/#.*$/, '') + '#meja-' + t.id : ''; };
function qrSvg(text) {
  if (!text) return '<div class="qrfail">Isi alamat aplikasi dulu</div>';
  if (!window.qrcode) return '<div class="qrfail">QR belum bisa dibuat. Pustaka QR perlu internet saat halaman dibuka.</div>';
  const q = qrcode(0, 'M'); q.addData(text); q.make();
  return q.createSvgTag({cellSize: 4, margin: 2, scalable: true});
}
function vMasterMeja() {
  const list = tables(), base = qrBase(), local = /\/\/(localhost|127\.0\.0\.1|\[::1\])/i.test(base);
  return `<div class="stack">
    <div class="card"><h3>Alamat aplikasi di QR code</h3>
      <form data-form="qrbase" class="catnew" novalidate><input name="base" value="${esc(cfg().qrBase || '')}" placeholder="${esc(window.claude ? 'Tempel link aplikasi ini' : location.origin + location.pathname)}" aria-label="Alamat aplikasi"><button class="btn primary" type="submit">Simpan</button><p class="err" id="qb-err" hidden></p></form>
      <p class="hint ${local || !base ? 'warn' : ''}" style="margin:8px 0 0">${!base ? 'Belum ada alamat. Tempel alamat aplikasi yang bisa dibuka dari HP pelanggan.' : local ? `Alamat <b>${esc(base)}</b> hanya bisa dibuka di komputer ini. Agar HP pelanggan bisa membuka QR, isi dengan alamat IP komputer kasir di Wi-Fi kantin, mis. <b>http://192.168.1.10/kantin-uis.html</b> (lihat IP dengan perintah <code>ipconfig</code>).` : `QR mengarah ke <b>${esc(base)}</b>. Pastikan HP pelanggan tersambung ke Wi-Fi yang sama dengan komputer kasir.`}</p></div>
    <div class="card"><h3>Tambah meja</h3>
      <form data-form="table-new" class="tblnew" novalidate><input name="name" placeholder="Nama meja, mis. Meja 1 / Teras A" maxlength="30" aria-label="Nama meja"><button class="btn primary" type="submit">+ Tambah</button>
        <span class="muted">atau</span><div class="pin sm"><input name="count" class="num" inputmode="numeric" placeholder="10" aria-label="Jumlah meja sekaligus"><span>meja</span></div><button class="btn ghost" type="submit" name="bulk" value="1">Buat sekaligus</button>
        <p class="err" id="tb-err" hidden></p></form></div>
    ${list.length ? `<div class="qrbar"><b>${list.length} meja</b>${window.claude ? '' : '<button class="btn ghost sm" data-act="qr-print">Cetak semua QR</button>'}</div>
      <div class="qrgrid" id="qrgrid">${list.map(t => { const u = tableUrl(t); return `<article class="qrcard"><div class="qrhead"><span class="mark">${MARK}</span><div><b>Oneklik Biz</b><small>Scan untuk memesan</small></div></div>
        <div class="qrimg">${qrSvg(u)}</div><h4>${esc(t.name)}</h4><p class="qrurl">${esc(u || 'alamat belum diisi')}</p>
        <div class="qract"><button class="btn ghost sm" data-act="qr-copy" data-id="${esc(t.id)}">Salin link</button><button class="btn ghost sm" data-act="qr-png" data-id="${esc(t.id)}">Unduh PNG</button><button class="iconbtn" data-act="table-edit" data-id="${esc(t.id)}" aria-label="Ubah nama ${esc(t.name)}">${ICONS.edit}</button><button class="iconbtn danger-ic" data-act="table-del" data-id="${esc(t.id)}" aria-label="Hapus ${esc(t.name)}">${ICONS.trash}</button></div></article>`; }).join('')}</div>`
      : '<div class="empty"><b>Belum ada meja</b>Tambahkan meja, lalu cetak QR code-nya dan tempel di setiap meja.</div>'}</div>`;
}
async function qrPng(t) {
  const u = tableUrl(t); if (!u || !window.qrcode) { toast('QR belum bisa dibuat.'); return; }
  const q = qrcode(0, 'M'); q.addData(u); q.make();
  const img = await new Promise((ok, bad) => { const i = new Image(); i.onload = () => ok(i); i.onerror = bad; i.src = q.createDataURL(10, 0); });
  const cv = document.createElement('canvas'); cv.width = 600; cv.height = 760; const c = cv.getContext('2d');
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, 600, 760);
  c.fillStyle = '#1B6E2A'; c.fillRect(0, 0, 600, 110);
  c.fillStyle = '#ffffff'; c.font = 'bold 44px "Plus Jakarta Sans", sans-serif'; c.textAlign = 'center'; c.fillText('Oneklik Biz', 300, 62);
  c.font = '22px "Plus Jakarta Sans", sans-serif'; c.fillText('Scan untuk memesan', 300, 94);
  c.imageSmoothingEnabled = false; c.drawImage(img, 90, 140, 420, 420);
  c.fillStyle = '#14261B'; c.font = 'bold 54px "Plus Jakarta Sans", sans-serif'; c.fillText(t.name, 300, 640);
  c.fillStyle = '#54655A'; c.font = '20px "Plus Jakarta Sans", sans-serif'; c.fillText('One Click, Grow Your Business.', 300, 690);
  const name = 'qr-' + t.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.png';
  let dl = null; try { dl = window.claude && window.claude.use ? await window.claude.use('downloads') : null; } catch (e) {}
  if (dl) { const blob = await new Promise(r => cv.toBlob(r, 'image/png')); try { await dl.save({filename: name, data: blob}); toast('QR disimpan'); } catch (e) {} return; }
  const a = document.createElement('a'); a.href = cv.toDataURL('image/png'); a.download = name; document.body.appendChild(a); a.click(); a.remove();
}

function vPilih() {
  const list = activeKantins(), t = tableOf(S.guestTable);
  return `<div class="vhead"><div><h2>Pilih kantin</h2><p class="muted">${t ? esc(t.name) + ' · ' : ''}Satu QR meja untuk semua kantin. Pilih kantin, lalu pilih menunya.</p></div></div>
    ${list.length ? `<div class="kgrid">${list.map(k => `<button class="kcard ${S.guestKid === k.id ? 'on' : ''}" data-act="pick-kantin" data-v="${esc(k.id)}"><span class="kc-ico">${esc(initials(k.name))}</span><span class="kc-t"><b>${esc(k.name)}</b>${k.desc ? `<small>${esc(k.desc)}</small>` : ''}</span><span class="kc-go" aria-hidden="true">›</span></button>`).join('')}</div>`
      : '<div class="empty"><b>Belum ada kantin yang buka</b>Silakan tanyakan ke petugas kantin.</div>'}`;
}
function guestAllOrders() {
  const gid = S.guest && S.guest.gid, out = [];
  if (Store.db && Object.keys(S.gk).length) {
    for (const [kid, b] of Object.entries(S.gk)) for (const o of Object.values(kid === S.kid ? S.orders || {} : b.orders || {})) if (o && o.cart && o.guest && o.guest === gid) out.push({...o, kid});
    if (!S.gk[S.kid]) for (const o of myOrders()) out.push({...o, kid: S.kid});
  } else for (const o of myOrders()) out.push({...o, kid: o.kid || S.kid});
  return out.sort((a, b) => b.at - a.at);
}
function inKantin(kid, fn) {
  if (kid === S.kid || !S.gk[kid]) return fn();
  const keep = [S.products, S.settings], b = S.gk[kid];
  S.products = b.products || {}; S.settings = b.settings;
  try { return fn(); } finally { [S.products, S.settings] = keep; }
}
function vGuestOrders() {
  const open = guestAllOrders(), openIds = new Set(open.map(o => o.id)), hist = guestHistory().filter(h => !openIds.has(h.id)), t = tableOf(S.guestTable);
  return `<div class="vhead"><div><h2>Pesanan saya</h2><p class="muted">${S.guestKid ? esc(kantinName(S.kid)) + ' · ' : ''}${esc(S.guest.name)} · ${esc(S.guest.phone)}${t ? ' · ' + esc(t.name) : ''}</p></div><div class="li-act"><button class="btn ghost" data-act="guest-edit">Ubah data</button><button class="btn primary" data-act="nav" data-v="${S.guestKid ? 'pesan' : 'pilih'}">+ Pesan${S.guestKid ? ' lagi' : ''}</button></div></div>
    <div class="stack"><div class="card"><h3>Menunggu diproses · ${open.length}</h3>
      ${open.length ? `<div class="saved">${open.map(o => inKantin(o.kid, () => { const it = orderItems(o), tot = it.reduce((a, x) => a + lineAmt(x.p.price, x.q), 0); return `<article class="sv"><div class="sv-top"><span>${esc(o.kantinName || kantinName(o.kid))} · ${esc(o.tableName || '')} · ${fmtT(o.at)}</span><span class="num">${rp(tot)}</span></div>
        <div class="sv-sub">${o.type === 'take' ? 'Bungkus' : 'Makan di tempat'} · ${statusPill(o, true)}</div><div class="sv-items">${itemsText(o, true)}</div>
        <div class="sv-act">${o.payClaim || o.paid ? '' : `${o.payMethod && o.payMethod !== 'kasir' ? `<button class="btn primary sm" data-act="c-payopen" data-id="${esc(o.id)}">Bayar ${payLabel(o.payMethod)}</button>` : ''}${['kasir', 'qris', 'shopeepay', 'gopay'].filter(payReady).length > 1 ? `<button class="btn ghost sm" data-act="c-paychoose" data-id="${esc(o.id)}">${o.payMethod && o.payMethod !== 'kasir' ? 'Ubah metode bayar' : 'Pilih metode bayar'}</button>` : ''}`}${o.status ? '' : `<button class="btn ghost sm" data-act="c-cancel" data-id="${esc(o.id)}">Batalkan pesanan</button>`}</div>${o.status === 'diantar' ? `<p class="hint" style="margin:0">Pesanan sudah diantar. Selamat menikmati!${!o.payMethod || o.payMethod === 'kasir' ? ' Silakan bayar di kasir.' : ''}</p>` : o.status === 'diproses' ? `<p class="hint" style="margin:0">Pesanan sedang disiapkan.${!o.payMethod || o.payMethod === 'kasir' ? ' Silakan bayar di kasir saat mengambil pesanan.' : ''}</p>` : ''}</article>`; })).join('')}</div>` : '<p class="muted" style="margin:0">Tidak ada pesanan yang sedang menunggu.</p>'}</div>
    <div class="card"><div class="histhead"><h3>Riwayat dari HP ini</h3>${hist.length ? `<button class="btn ghost sm" data-act="c-hist-clear">${ICONS.trash}Hapus semua</button>` : ""}</div>${hist.length ? `<div class="list">${hist.map(h => `<div class="li"><span class="ico nt ${h.cancelled ? 'out' : ''}">${h.cancelled ? '×' : '✓'}</span><div><div class="t">${h.kantin ? esc(h.kantin) + ' · ' : ''}${esc(h.tableName || '')} · ${fmtD(h.at, {day: 'numeric', month: 'short'})} ${fmtT(h.at)} <span class="spill ${h.cancelled ? 'out' : 'ok'}">${h.cancelled ? 'Dibatalkan' : 'Sudah diproses kasir'}</span></div><div class="s">${esc(h.items)}</div></div><span class="histend"><b class="a num">${rp(h.total)}</b><button class="iconbtn" data-act="c-hist-del" data-id="${esc(h.id)}" aria-label="Hapus riwayat ini">${ICONS.trash}</button></span></div>`).join('')}</div>` : '<p class="muted" style="margin:0">Belum ada pesanan sebelumnya.</p>'}</div></div>`;
}
/* ---------- actions ---------- */
function newMeta() { return {status: '', queue: 0, notes: {}, customer: '', type: 'dine', savedId: null, uid: '', gi: null, method: 'tunai', disc: {type: 'pct', value: 0}}; }
function syncCustInputs() { document.querySelectorAll('[data-cust]').forEach(i => { i.value = S.meta.customer; }); }
function savedOrders() { return Object.values(S.orders || {}).filter(o => o && o.cart && o.id).sort((a, b) => b.at - a.at); }

async function pay() {
  const lines = cartLines();
  if (!lines.length || S.paying) return;
  if (S.mode === 'db' && !S.loaded.days) { toast('Data penjualan masih dimuat, coba lagi sebentar.'); return; }
  const now = Date.now(), key = dayKey(now), dayTx = (S.days[key] && S.days[key].tx) || {};
  const items = lines.map(l => { const n = noteOf(l.p.id).trim(); return {pid: l.p.id, name: l.p.name, cat: l.p.cat, unit: unitOf(l.p), price: +l.p.price, cost: +l.p.cost, qty: l.q, ...(n ? {note: n.slice(0, 100)} : {})}; });
  const tx = {no: Object.keys(dayTx).length + 1, at: now, customer: S.meta.customer.trim(), orderType: S.meta.type === 'take' ? 'take' : 'dine', items,
    total: items.reduce((s, x) => s + lineAmt(x.price, x.qty), 0), cost: items.reduce((s, x) => s + lineAmt(x.cost, x.qty), 0), method: METHODS[S.meta.method] ? S.meta.method : 'tunai'};
  tx.subtotal = tx.total;
  if (S.meta.uid) tx.uid = S.meta.uid;
  if (S.meta.queue) tx.queue = S.meta.queue;
  if (S.meta.deliveredAt) tx.deliveredAt = S.meta.deliveredAt;
  if (tx.method === 'ewallet' && S.meta.wallet) tx.wallet = S.meta.wallet;
  if (S.meta.gi) Object.assign(tx, {table: S.meta.gi.table, tableName: S.meta.gi.tableName, phone: S.meta.gi.phone, guest: S.meta.gi.guest});
  const dA = discAmt(tx.subtotal); if (dA) { tx.discount = {type: S.meta.disc.type, value: +S.meta.disc.value, amount: dA}; tx.total = tx.subtotal - dA; }
  if (tx.method !== 'tunai') S.cash = 0;
  if (S.cash && S.cash < tx.total) {
    toast(`Uang diterima kurang ${rp(tx.total - S.cash)}. Perbaiki jumlahnya atau kosongkan kolom uang.`);
    const i = $(S.sheet ? '#cash-s' : '#cash'); if (i) i.focus();
    return;
  }
  if (S.cash) { tx.paid = S.cash; tx.change = S.cash - tx.total; }
  const id = uid('t'), before = {cart: {...S.cart}, meta: {...S.meta, disc: {...S.meta.disc}}}, savedId = S.meta.savedId;
  S.cart = {}; S.cash = 0; S.meta = newMeta(); S.paying = true; syncCustInputs(); closeSheet(); render();
  try {
    await Store.addSale(key, id, tx);
    if (savedId) Store.delOrder(savedId).catch(() => {});
    buzz();
    toast(`No. ${pad3(tx.no)} tersimpan · ${METHODS[tx.method]} ${rp(tx.total)}${tx.paid ? ' · Kembalian ' + rp(tx.change) : ''}`, {label: 'Cetak Struk', fn: () => printSaleReceipt({...tx, id, day: key})});
  } catch (e) { S.cart = before.cart; S.meta = before.meta; syncCustInputs(); toast('Gagal menyimpan: ' + errMsg(e)); }
  finally { S.paying = false; render(); }
}
async function park(silent) {
  const lines = cartLines();
  if (!lines.length) { toast('Pesanan masih kosong'); return; }
  const o = {id: S.meta.savedId || uid('o'), uid: S.meta.uid || '', ...(S.meta.gi || {}), ...(S.meta.status ? {status: S.meta.status, queue: S.meta.queue, printedAt: S.meta.printedAt || 0, deliveredAt: S.meta.deliveredAt || 0} : {}), customer: S.meta.customer.trim(), type: S.meta.type, method: S.meta.method, disc: {...S.meta.disc}, cart: Object.fromEntries(lines.map(l => [l.p.id, l.q])), notes: notesFor(lines), at: Date.now()};
  const before = {cart: {...S.cart}, meta: {...S.meta}};
  S.cart = {}; S.cash = 0; S.meta = newMeta(); syncCustInputs(); closeSheet(); render();
  try { await Store.saveOrder(o); if (!silent) toast(`Pesanan ${o.customer || 'tanpa nama'} disimpan. Buka lagi lewat ikon daftar.`); }
  catch (e) { S.cart = before.cart; S.meta = before.meta; syncCustInputs(); render(); toast('Gagal menyimpan pesanan: ' + errMsg(e)); }
}
async function resume(id) {
  const o = S.orders[id]; if (!o) return;
  if (o.paid) { toast('Pesanan ini sudah lunas. Tandai “Diantar & selesai” setelah diserahkan.'); return; }
  if (cartLines().length && S.meta.savedId !== id) await park(true);
  S.cart = {};
  for (const [pid, q] of Object.entries(o.cart)) if (S.products[pid] && q > 0) S.cart[pid] = q;
  S.meta = {status: o.status || '', queue: o.queue || 0, printedAt: o.printedAt || 0, deliveredAt: o.deliveredAt || 0, customer: o.customer || '', type: o.type || 'dine', savedId: id, uid: o.uid || '', gi: o.guest ? {guest: o.guest, table: o.table, tableName: o.tableName, phone: o.phone} : null, method: o.payMethod === 'qris' ? 'qris' : PAY_OPTS[o.payMethod] && PAY_OPTS[o.payMethod].wallet ? 'ewallet' : METHODS[o.method] ? o.method : 'tunai', wallet: PAY_OPTS[o.payMethod] && PAY_OPTS[o.payMethod].wallet ? o.payMethod : '', payClaim: o.payClaim || null, payMethod: o.payMethod || '', disc: o.disc ? {...o.disc} : {type: 'pct', value: 0}, notes: {...(o.notes || {})}}; S.cash = 0;
  S.view = 'kasir'; syncCustInputs(); closeSheet(); render(); syncCustInputs();
  toast(`Pesanan ${o.customer || 'tanpa nama'} dibuka`);
}
function savedSheet() {
  const list = savedOrders();
  if (!list.length) return `<h3>Pesanan tersimpan</h3><div class="o-empty food">${ILL.food}<b>Belum ada pesanan tersimpan</b>Tekan “Simpan Pesanan” untuk menyimpan pesanan yang belum dibayar, misalnya pelanggan yang bayar belakangan.</div><button class="btn ghost block" data-act="close-sheet">Tutup</button>`;
  const cnt = k => list.filter(o => (o.status || '') === k).length;
  return `<h3>Pesanan aktif · ${list.length}</h3><div class="ostat"><span class="spill low">Belum diproses ${cnt('')}</span><span class="spill ok">Diproses dapur ${cnt('diproses')}</span><span class="spill deliv">Sudah diantar ${cnt('diantar')}</span>${list.some(needsVal) ? `<button class="btn val sm" data-act="val-list">${ICONS.check}Validasi pembayaran (${list.filter(needsVal).length})</button>` : ''}</div><div class="saved">${list.map(o => {
    const items = Object.entries(o.cart).map(([pid, q]) => ({p: S.products[pid], q})).filter(x => x.p);
    const total = items.reduce((s, x) => s + lineAmt(x.p.price, x.q), 0), cur = S.meta.savedId === o.id;
    const when = dayKey(o.at) === dayKey(Date.now()) ? fmtT(o.at) : fmtD(o.at, {day: 'numeric', month: 'short'}) + ' ' + fmtT(o.at);
    return `<article class="sv ${cur ? 'cur' : ''}"><div class="sv-top"><span>${esc(o.customer || 'Tanpa nama')}${o.guest ? ` <span class="tag">${esc(o.tableName || 'QR meja')}</span>` : o.uid ? ' <span class="tag">Pesanan online</span>' : ''}</span><span class="num">${rp(total)}</span></div>
      <div class="sv-sub">${when} · ${o.type === 'take' ? 'Bungkus' : 'Makan di tempat'}${o.phone ? ' · ' + esc(o.phone) : ''}${cur ? ' · sedang dibuka' : ''}</div>
      <div class="sv-items">${itemsText(o, true) || 'Produk sudah dihapus'}</div>
      <div class="sv-sub">${statusPill(o)}</div>
      <div class="sv-act">${svActions(o, cur)}</div></article>`;
  }).join('')}</div>`;
}
function openDrawer() { $('#drawer-body').innerHTML = vSide(); $('#drawer').hidden = false; }
function closeDrawer() { $('#drawer').hidden = true; }

async function readPhoto(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((ok, bad) => { const i = new Image(); i.onload = () => ok(i); i.onerror = bad; i.src = url; });
    const max = 360, sc = Math.min(1, max / Math.max(img.width, img.height));
    const cv = document.createElement('canvas'); cv.width = Math.round(img.width * sc); cv.height = Math.round(img.height * sc);
    const cx = cv.getContext('2d'); cx.fillStyle = '#ffffff'; cx.fillRect(0, 0, cv.width, cv.height); cx.drawImage(img, 0, 0, cv.width, cv.height);
    return cv.toDataURL('image/jpeg', 0.8);
  } finally { URL.revokeObjectURL(url); }
}

const ACT = {
  nav: (el, id, v) => {
    S.view = v; S.txLimit = 25; closeDrawer(); saveUI();
    try {
      const slug = v === 'beli' ? 'pembelian' : v;
      if (['kasir', 'riwayat', 'laporan', 'stok', 'pembelian', 'kas', 'hpp', 'produk', 'master'].includes(slug)) {
        const u = new URL(location.href); u.searchParams.set('page', slug);
        history.replaceState(null, '', u.pathname + u.search + u.hash);
      }
    } catch (e) {}
    render(); window.scrollTo(0, 0);
  },
  'open-drawer': () => openDrawer(),
  'close-drawer': () => closeDrawer(),
  cat: (el, id, v) => { S.catFilter = v; render(); },
  add: (el, id) => { const p = S.products[id]; if (tracked(p) && r3((S.cart[id] || 0) + stepOf(p)) > stockOf(id)) { toast(`Stok ${p.name} tidak cukup (sisa ${qu(r3(Math.max(0, stockOf(id) - (S.cart[id] || 0))), unitOf(p))}). Tambah stok di menu Stok.`); return; } S.cart[id] = r3((S.cart[id] || 0) + stepOf(p)); S.bump = id; buzz(); render(); S.bump = null; },
  sub: (el, id) => { const n = r3((S.cart[id] || 0) - stepOf(S.products[id])); if (n > 0) S.cart[id] = n; else delete S.cart[id]; if (!cartLines().length) S.cash = 0; render(); },
  'cash-clear': () => { S.cash = 0; render(); const i = $(S.sheet ? '#cash-s' : '#cash'); if (i) i.focus(); },
  cash: (el, id, v) => { S.cash = S.cash === +v ? 0 : +v; render(); },
  otype: (el, id, v) => { S.meta.type = v; render(); },
  remove: (el, id) => { delete S.cart[id]; if (S.meta.notes) delete S.meta.notes[id]; if (!cartLines().length) S.cash = 0; render(); },
  'add-more': () => {
    closeSheet();
    const q = $('#q'); if (!q) return;
    q.scrollIntoView({behavior: 'smooth', block: 'center'}); setTimeout(() => q.focus({preventScroll: true}), 250);
  },
  'focus-order': () => {
    if (!window.matchMedia('(min-width:768px)').matches) { openSheet(() => orderHead(true) + orderBody(true), true); return; }
    const o = $('#order'); if (!o) return;
    o.classList.remove('flash'); void o.offsetWidth; o.classList.add('flash');
    const i = $('#cust'); if (i && !cartLines().length) i.focus();
  },
  sort: () => openSheet(sortSheet),
  'set-sort': (el, id, v) => { S.sort = SORTS[v] ? v : 'default'; saveUI(); closeSheet(); render(); },
  'clear-cart': () => { S.cart = {}; S.cash = 0; S.meta = newMeta(); syncCustInputs(); render(); },
  'open-cart': () => openSheet(() => orderHead(true) + orderBody(true), true),
  pay: () => pay(),
  park: () => park(false),
  saved: () => openSheet(savedSheet, true),
  resume: (el, id) => resume(id),
  'del-order': (el, id) => {
    const o = S.orders[id]; if (!o) return;
    confirmSheet('Hapus pesanan tersimpan?', `Pesanan ${esc(o.customer || 'tanpa nama')} akan dihapus dan tidak bisa dibuka lagi. Penjualan yang sudah dibayar tidak terpengaruh.`, 'Hapus',
      () => Store.delOrder(id).then(() => { if (S.meta.savedId === id) S.meta.savedId = null; render(); toast('Pesanan dihapus'); }).catch(e => toast('Gagal: ' + errMsg(e))), true);
  },
  'hide-banner': () => { S.bannerOff = true; saveUI(); render(); },
  report: (el, id, v) => { S.report = v; S.txLimit = 25; saveUI(); render(); },
  period: (el, id, v) => { S.period = v; S.txLimit = 25; saveUI(); render(); },
  'more-tx': () => { S.txLimit += 50; render(); },
  'report-print': () => {
    if (isLoading()) return;
    // Print every transaction row, not just the ones shown on screen.
    const keep = S.txLimit; S.txLimit = 1e9; render();
    const body = document.getElementById('report-body'), clone = body ? body.cloneNode(true) : null;
    S.txLimit = keep; render();
    if (!clone) return;
    clone.querySelectorAll('button, .sr, .legend').forEach(n => n.remove());
    const R = periodRange(), title = (REPORTS.find(([k]) => k === S.report) || [0, 'Penjualan'])[1], now = Date.now(), u = me();
    const html = `<div class="rp-doc"><header class="rp-head"><div class="rp-biz"><b>${esc(kantinName(S.kid))}</b><span>${esc(cfg().shopName && cfg().shopName !== kantinName(S.kid) ? cfg().shopName + ' · ' : '')}Oneklik Biz</span></div>
      <div class="rp-title"><h1>Laporan ${esc(title)}</h1><span>${S.report === 'neraca' ? 'Posisi per ' + fmtD(R.end) : 'Periode ' + fmtRange(R.start, R.end)}</span></div></header>
      ${clone.innerHTML}
      <footer class="rp-foot"><span>Dicetak ${fmtD(now, {day: 'numeric', month: 'long', year: 'numeric'})} pukul ${fmtT(now)}${u ? ' oleh ' + esc(u.name) : ''}</span><span>${esc(kantinName(S.kid))} · Oneklik Biz</span></footer></div>`;
    if (window.claude) { openSheet(() => '<h3>Cetak laporan</h3><p class="muted">Tampilan online di Claude tidak bisa membuka dialog cetak. Cetak dari aplikasi di XAMPP atau hosting.</p><button class="btn primary block" data-act="close-sheet">Mengerti</button>'); return; }
    $('#print-area').innerHTML = html;
    document.body.classList.add('print-report');
    const done = () => { document.body.classList.remove('print-report'); $('#print-area').innerHTML = ''; window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    setTimeout(() => window.print(), 50);
  },
  'tx-del': (el, id, day) => {
    const t = allTx().find(x => x.id === id && x.day === day); if (!t) return;
    confirmSheet('Hapus transaksi permanen?', `No. ${pad3(t.no || 0)}${t.customer ? ' · ' + esc(t.customer) : ''} pukul ${fmtT(t.at)} senilai <b>${rp(t.total)}</b> akan dihapus dari riwayat dan semua laporan. Tindakan ini tidak bisa dikembalikan.`, 'Hapus permanen',
      () => Store.delTx(day, [id]).then(() => { render(); toast('Transaksi dihapus'); }).catch(e => toast('Gagal: ' + errMsg(e))), true);
  },
  'hist-del': () => { S.histDel = {from: S.histDate, to: S.histDate}; openSheet(histDelSheet); },
  'hd-range': (el, id, v) => {
    const days = Object.keys(S.days).sort(), today = dayKey(Date.now());
    S.histDel = v === 'day' ? {from: S.histDate, to: S.histDate} : v === 'month' ? {from: today.slice(0, 8) + '01', to: today} : {from: days[0] || today, to: today};
    redrawSheet();
  },
  void: (el, id, day) => {
    const t = allTx().find(x => x.id === id && x.day === day); if (!t) return;
    confirmSheet('Hapus transaksi dari laporan?', `No. ${pad3(t.no)} pukul ${fmtT(t.at)} senilai ${rp(t.total)} akan ditandai batal dan tidak dihitung di laporan. Catatannya tetap terlihat di riwayat.`, 'Ya, hapus dari laporan',
      () => Store.voidSale(day, id).then(() => toast('Transaksi dibatalkan')).catch(e => toast('Gagal: ' + errMsg(e))), true);
  },
  'tx-print': (el, id, day) => {
    const t = allTx().find(x => x.id === id && x.day === day);
    if (t) printSaleReceipt(t);
  },
  'confirm-yes': () => { const fn = S.confirmFn; S.confirmFn = null; closeSheet(); fn && fn(); },
  'close-sheet': () => closeSheet(),
  'new-prod': () => { openSheet(() => prodForm(null)); updateMargin(); },
  'clear-tx': () => openSheet(clearTxSheet),
  notif: () => openSheet(notifSheet, true),
  'auth-mode': (el, id, v) => { S.authPage = ['register', 'registered'].includes(v) ? v : 'login'; S.authShown = null; render(); const i = document.querySelector('#auth input'); if (i) i.focus(); },
  'pw-eye': (el, id, v) => { const i = document.getElementById(v); if (!i) return; const show = i.type === 'password'; i.type = show ? 'text' : 'password'; el.innerHTML = show ? ICONS.eye : ICONS.eyeoff; el.setAttribute('aria-label', show ? 'Sembunyikan password' : 'Tampilkan password'); },
  google: () => toast('Masuk dengan Google belum tersedia di versi ini karena memerlukan server. Gunakan username dan password.'),
  forgot: () => openSheet(() => `<h3>Reset Password</h3><p class="muted">Masukkan username dan password baru Anda (minimal 12 karakter).</p>
    <form data-form="forgot" novalidate>
      <div class="field"><label for="fp-user">Username / Email / No. HP</label><input id="fp-user" name="username" autocomplete="username" placeholder="Masukkan username Anda" required></div>
      <div class="field"><label for="fp-pw">Password baru</label><div class="ain"><input id="fp-pw" name="password" type="password" autocomplete="new-password" placeholder="Minimal 12 karakter" minlength="12" required style="padding-left:12px"><button type="button" class="aeye" data-act="pw-eye" data-v="fp-pw" aria-label="Tampilkan password">${ICONS.eyeoff}</button></div></div>
      <div class="field"><label for="fp-pw2">Ulangi password baru</label><div class="ain"><input id="fp-pw2" name="password2" type="password" autocomplete="new-password" placeholder="Ulangi password baru" minlength="12" required style="padding-left:12px"><button type="button" class="aeye" data-act="pw-eye" data-v="fp-pw2" aria-label="Tampilkan password">${ICONS.eyeoff}</button></div></div>
      <p class="aerr" id="fp-err" hidden></p>
      <div class="two" style="margin-top:12px"><button type="button" class="btn ghost" data-act="close-sheet">Batal</button><button type="submit" class="btn primary">Simpan Password Baru</button></div>
    </form>`),
  'val-list': () => openSheet(valSheet, true),
  'pay-validate': (el, id) => {
    const o = S.orders[id]; if (!o) return;
    confirmSheet('Validasi pembayaran?', `Pastikan uang <b>${rp(orderTotal(o))}</b> dari <b>${esc(o.customer || 'pelanggan')}</b> sudah masuk ke ${payLabel(o.payMethod)} kantin. Setelah divalidasi, pesanan tercatat lunas dan langsung masuk ke laporan penjualan, laba rugi, neraca, dan arus kas.`, 'Ya, sudah masuk', async () => {
      try {
        const tx = await validateOrder(id);
        if (tx) toast(`Lunas · No. ${pad3(tx.no)} · ${payLabel(o.payMethod)} ${rp(tx.total)} masuk laporan${o.status === 'diantar' ? '. Pesanan selesai.' : '. Tandai diantar setelah diserahkan.'}`);
        render(); if (savedOrders().some(needsVal)) openSheet(valSheet, true);
      } catch (e) { toast('Gagal validasi: ' + errMsg(e)); }
    });
  },
  'pay-reject': (el, id) => {
    const o = S.orders[id]; if (!o) return;
    confirmSheet('Tolak pembayaran?', `Gunakan bila uang ${rp(orderTotal(o))} belum masuk ke ${payLabel(o.payMethod)}. Pelanggan akan melihat pesan bahwa pembayaran belum diterima dan bisa membayar ulang atau bayar di kasir.`, 'Tolak', async () => {
      try { await Store.saveOrder({...o, payClaim: null, payRejected: Date.now()}); render(); toast('Pembayaran ditolak. Pelanggan diminta membayar ulang.'); }
      catch (e) { toast('Gagal: ' + errMsg(e)); }
    }, true);
  },
  deliver: async (el, id) => {
    const o = S.orders[id]; if (!o) return;
    if (o.paid) { try { await Store.delOrder(id); render(); toast(`Antrian ${o.queue || ''} lunas & sudah diantar. Pesanan selesai.`); } catch (e) { toast('Gagal: ' + errMsg(e)); } return; }
    const patch = {status: 'diantar', deliveredAt: Date.now(), ...(o.queue ? {} : {queue: nextQueue(), printedAt: Date.now()})};
    try {
      await Store.saveOrder({...o, ...patch});
      if (S.meta.savedId === id) Object.assign(S.meta, patch);
      render(); toast(`Antrian ${o.queue || patch.queue} ditandai sudah diantar${o.payMethod && o.payMethod !== 'kasir' && o.payClaim ? '' : '. Jangan lupa terima pembayarannya'}.`);
    } catch (e) { toast('Gagal: ' + errMsg(e)); }
  },
  undeliver: async (el, id) => {
    const o = S.orders[id]; if (!o) return;
    try { await Store.saveOrder({...o, status: 'diproses', deliveredAt: 0}); if (S.meta.savedId === id) Object.assign(S.meta, {status: 'diproses', deliveredAt: 0}); render(); toast('Status dikembalikan ke diproses dapur'); }
    catch (e) { toast('Gagal: ' + errMsg(e)); }
  },
  'print-order': async (el, id) => {
    const o = S.orders[id]; if (!o) return;
    closeSheet();
    try { const p = await processOrder(o); render(); toast(`Antrian ${p.queue} dicetak. Pesanan bisa disiapkan; bayar belakangan.`); }
    catch (e) { toast('Gagal memproses pesanan: ' + errMsg(e)); }
  },
  'print-cart': async () => {
    const lines = cartLines(); if (!lines.length) return;
    const first = !S.meta.status;
    if (first) Object.assign(S.meta, {status: 'diproses', queue: nextQueue(), printedAt: Date.now()});
    const snapshot = {id: S.meta.savedId || '', customer: S.meta.customer.trim() || 'Pelanggan kasir', type: S.meta.type, queue: S.meta.queue, printedAt: S.meta.printedAt, cart: Object.fromEntries(lines.map(l => [l.p.id, l.q])), notes: notesFor(lines), ...(S.meta.gi || {})};
    if (!S.meta.customer.trim()) S.meta.customer = 'Pelanggan kasir';
    await park(true);
    printTicket(snapshot);
    toast(`Antrian ${snapshot.queue} dicetak dan disimpan. Bayar lewat ikon pesanan tersimpan.`);
  },
  'c-pay': (el, id, v) => { if (PAY_OPTS[v]) { S.meta.pay = v; render(); } },
  'c-paychoose': (el, id) => openSheet(() => payChooser(id, false), true),
  'c-choose': async (el, id, v) => {
    const o = (S.orders || {})[id]; if (!o || !payReady(v)) return;
    try {
      if (o.payMethod !== v) await Store.updateOrder(id, {payMethod: v});
      if (v === 'kasir') { closeSheet(); render(); toast('Baik, silakan bayar di kasir saat mengambil pesanan.'); }
      else { openSheet(() => payScreen(id), true); render(); }
    } catch (e) { toast('Gagal menyimpan pilihan: ' + errMsg(e)); }
  },
  'c-payopen': (el, id) => openSheet(() => payScreen(id), true),
  'c-paid': async (el, id) => {
    const o = (S.orders || {})[id]; if (!o) return; el.disabled = true;
    try { await Store.updateOrder(id, {payClaim: {at: Date.now()}}); render(); toast('Terima kasih! Kasir akan mengecek pembayaran Anda.'); }
    catch (e) { el.disabled = false; toast('Gagal: ' + errMsg(e)); }
  },
  'c-paykasir': async (el, id) => {
    try { await Store.updateOrder(id, {payMethod: 'kasir'}); closeSheet(); render(); toast('Baik, silakan bayar di kasir saat mengambil pesanan.'); }
    catch (e) { toast('Gagal: ' + errMsg(e)); }
  },
  'copy-text': (el, id, v) => { navigator.clipboard.writeText(v).then(() => toast('Disalin'), () => toast(v)); },
  'pay-img-clear': (el, id, v) => { const h = $('#pi-' + v), p = $('#pv-' + v); if (h) h.value = ''; if (p) p.innerHTML = '<span>Gambar dihapus. Tekan Simpan.</span>'; },
  'install-app': async () => {
    const ev = S.installEvt; if (!ev) return;
    S.installEvt = null; render();
    try { ev.prompt(); const r = await ev.userChoice; toast(r && r.outcome === 'accepted' ? 'Aplikasi Oneklik Biz sedang dipasang' : 'Pemasangan dibatalkan'); } catch (e) {}
  },
  'sound-toggle': () => { const on = !soundOn(); try { localStorage.setItem('kantin-uis-sound', on ? 'on' : 'off'); } catch (e) {} render(); if (on) { audioCtx(); setTimeout(() => playTone('status'), 60); } toast(on ? 'Notifikasi suara aktif' : 'Notifikasi suara dimatikan'); },
  'c-hist-del': (el, id) => confirmSheet('Hapus riwayat ini?', 'Riwayat pesanan ini dihapus dari HP ini saja. Data penjualan di kasir tidak berubah.', 'Hapus', () => { setGuestHistory(guestHistory().filter(h => h.id !== id)); render(); toast('Riwayat dihapus'); }, true),
  'c-hist-clear': () => confirmSheet('Hapus semua riwayat?', `Semua ${guestHistory().filter(h => !guestAllOrders().some(o => o.id === h.id)).length} riwayat pesanan di HP ini akan dihapus. Pesanan yang masih menunggu tidak ikut terhapus, dan data penjualan di kasir tidak berubah.`, 'Hapus semua', () => { setGuestHistory(guestHistory().filter(h => guestAllOrders().some(o => o.id === h.id))); render(); toast('Riwayat dihapus'); }, true),
  'pick-kantin': (el, id, v) => { if (!activeKantins().some(k => k.id === v)) return; S.guestKid = v; S.view = 'pesan'; render(); window.scrollTo(0, 0); },
  'kantin-open': (el, id, v) => { S.adminKid = v; try { localStorage.setItem('kantin-uis-kid', v); } catch (e) {} S.view = 'kasir'; render(); toast('Sekarang mengelola ' + kantinName(v)); },
  'kantin-edit': (el, id, v) => { const k = kantinsList().find(x => x.id === v); if (k) openSheet(() => kantinForm(k)); },
  'kantin-del': (el, id, v) => {
    const list = kantinsList(), k = list.find(x => x.id === v); if (!k) return;
    if (k.id === 'main' || list.length <= 1) return toast('Kantin utama tidak bisa dihapus.');
    const owners = users().filter(u => u.role === 'pemilik' && (u.kid || 'main') === v);
    const msg = owners.length
      ? `Kantin “${esc(k.name)}” akan dihapus dari daftar. ${owners.length} akun pemilik (${owners.map(u => esc(u.name)).join(', ')}) akan terlepas dari kantin ini.`
      : `Kantin “${esc(k.name)}” akan dihapus dari daftar kantin.`;
    confirmSheet('Hapus kantin?', msg, 'Hapus', async () => {
      const next = list.filter(x => x.id !== v);
      await Store.saveGlobal({kantins: next});
      if (S.kid === v) {
        const fallback = (next[0] && next[0].id) || 'main';
        S.adminKid = fallback;
        try { localStorage.setItem('kantin-uis-kid', fallback); } catch (e) {}
      }
      render(); toast('Kantin dihapus');
    }, true);
  },
  'guest-edit': () => { S.guest = {...S.guest, name: ''}; saveGuest(); S.cart = {}; S.authShown = null; closeDrawer(); closeSheet(); render(); },
  'qr-copy': (el, id) => { const t = tableOf(id), u = t && tableUrl(t); if (!u) return; navigator.clipboard.writeText(u).then(() => toast('Link disalin'), () => toast(u)); },
  'qr-png': (el, id) => { const t = tableOf(id); if (t) qrPng(t).catch(() => toast('Gagal membuat gambar QR.')); },
  'qr-print': () => { document.body.classList.add('print-qr'); const done = () => { document.body.classList.remove('print-qr'); window.removeEventListener('afterprint', done); }; window.addEventListener('afterprint', done); window.print(); },
  'table-edit': (el, id) => { const t = tableOf(id); if (t) openSheet(() => `<h3>Ubah nama meja</h3><form data-form="table-edit" data-id="${esc(t.id)}" novalidate><div class="field"><label for="te-name">Nama meja</label><input id="te-name" name="name" value="${esc(t.name)}" maxlength="30"></div><p class="hint">QR code yang sudah dicetak tetap berlaku.</p><p class="err" id="te-err" hidden></p><div class="two"><button type="button" class="btn ghost" data-act="close-sheet">Batal</button><button class="btn primary" type="submit">Simpan</button></div></form>`); },
  'table-del': (el, id) => { const t = tableOf(id); if (!t) return; confirmSheet('Hapus meja?', `“${esc(t.name)}” akan dihapus. QR code meja ini yang sudah dicetak tidak bisa dipakai lagi.`, 'Hapus', () => saveTables(tables().filter(x => x.id !== id)).then(() => toast('Meja dihapus')).catch(e => toast('Gagal: ' + errMsg(e))), true); },
  logout: () => {
    if (S.guestTable) { ACT['guest-edit'](); return; }
    if (Store.remote) Store.db.req('logout', {}).then(() => Store.db.refresh()).catch(() => {}); setSession(null); S.cart = {}; S.cash = 0; S.meta = newMeta(); S.authPage = 'login'; S.authShown = null; closeDrawer(); closeSheet(); render(); },
  'my-pw': () => { const u = me(); if (u) openSheet(() => pwForm(u, true)); },
  'master-tab': (el, id, v) => { S.masterTab = v; render(); },
  'reg-open': () => { closeSheet(); S.view = 'master'; S.masterTab = 'users'; render(); },
  'reg-ok': async (el, id) => {
    const u = S.users[id]; if (!u || !u.pending || role() !== 'admin') return;
    el.disabled = true;
    try {
      const list = kantinsList();
      let name = (u.bizName || u.name).trim(), n = 2; const base = name;
      while (list.some(k => k.id !== u.kid && k.name.toLowerCase() === name.toLowerCase())) name = `${base} ${n++}`;
      if (!list.some(k => k.id === u.kid)) { list.push({id: u.kid, name, active: true}); await Store.saveGlobal({kantins: list}); }
      const {pending, ...rest} = u;
      await Store.saveUser({...rest, active: true, pending: false, approvedAt: Date.now(), approvedBy: me().name});
      render(); toast(`${u.name} disetujui. Kantin “${name}” sudah dibuat.`);
    } catch (e) { el.disabled = false; toast('Gagal: ' + errMsg(e)); }
  },
  'reg-no': (el, id) => {
    const u = S.users[id]; if (!u || !u.pending) return;
    confirmSheet('Tolak pendaftaran?', `Pendaftaran “${esc(u.bizName || '')}” oleh ${esc(u.name)} (${esc(u.username)}) akan dihapus. Ia bisa mendaftar ulang bila perlu.`, 'Tolak', () => Store.delUser(id).then(() => toast('Pendaftaran ditolak')).catch(e => toast('Gagal: ' + errMsg(e))), true);
  },
  'u-toggle': (el, id) => {
    const u = S.users[id]; if (!u || id === S.session || role() !== 'admin') return;
    const on = u.active === false;
    if (!on && u.role === 'admin' && activeAdmins().length <= 1) { toast('Minimal harus ada satu admin aktif.'); return; }
    const k = u.role === 'pemilik' ? kantinsList().find(x => x.id === (u.kid || 'main')) : null;
    const go = async () => {
      try { await setUserActive(u, on); toast(on ? `${u.name} diaktifkan kembali` : `${u.name} dinonaktifkan`); } catch (e) { toast('Gagal: ' + errMsg(e)); }
    };
    if (on) return go();
    confirmSheet('Nonaktifkan akun?', `“${esc(u.name)}” (${esc(u.username)}) tidak bisa masuk lagi sampai diaktifkan kembali.${k ? ` Kantin “${esc(k.name)}” juga disembunyikan dari pelanggan bila tidak ada pemilik aktif lain.` : ''} Datanya tidak dihapus.`, 'Nonaktifkan', go, true);
  },
  'u-new': () => openSheet(() => userForm(null)),
  'u-edit': (el, id) => { const u = S.users[id]; if (u) openSheet(() => userForm(u)); },
  'u-pw': (el, id) => { const u = S.users[id]; if (u) openSheet(() => pwForm(u, id === S.session)); },
  'u-del': (el, id) => {
    const u = S.users[id]; if (!u || id === S.session) return;
    if (u.role === 'admin' && u.active !== false && activeAdmins().length <= 1) { toast('Minimal harus ada satu admin aktif.'); return; }
    confirmSheet('Hapus pengguna?', `Akun “${esc(u.name)}” (${esc(u.username)}) akan dihapus dan tidak bisa masuk lagi. Riwayat transaksinya tetap ada.`, 'Hapus', () => Store.delUser(id).then(() => toast('Pengguna dihapus')).catch(e => toast('Gagal: ' + errMsg(e))), true);
  },
  'cat-edit': (el, id, v) => openSheet(() => catForm(v)),
  'cat-del': (el, id, v) => {
    const n = productsSorted().filter(p => p.cat === v).length;
    if (n) { toast(`Kategori “${v}” masih dipakai ${n} produk. Pindahkan produknya dulu.`); return; }
    confirmSheet('Hapus kategori?', `Kategori “${esc(v)}” akan dihapus.`, 'Hapus', () => { const c = cfg(); Store.saveSettings({...(S.settings || {}), categories: c.categories.filter(x => x !== v)}).then(() => toast('Kategori dihapus')).catch(e => toast('Gagal: ' + errMsg(e))); }, true);
  },
  'c-send': async () => {
    const u = me(), lines = cartLines(); if (!u || !lines.length) return;
    const t = S.guestTable ? tableOf(S.guestTable) : null;
    if (S.guestTable && !t) { toast('QR meja tidak dikenali. Minta QR baru ke kasir.'); return; }
    const o = {id: uid('o'), uid: S.guestTable ? '' : u.id, customer: u.name, type: S.meta.type === 'take' ? 'take' : 'dine', method: 'tunai', disc: {type: 'pct', value: 0}, cart: Object.fromEntries(lines.map(l => [l.p.id, l.q])), notes: notesFor(lines), at: Date.now()};
    if (t) Object.assign(o, {guest: S.guest.gid, table: t.id, tableName: t.name, phone: S.guest.phone});
    o.kid = S.kid; o.kantinName = kantinName(S.kid);
    o.payMethod = payReady('kasir') ? 'kasir' : (['qris', 'shopeepay', 'gopay'].find(payReady) || 'kasir');
    const before = {...S.cart}, beforeNotes = {...(S.meta.notes || {})}; S.cart = {}; S.meta.notes = {}; closeSheet();
    try {
      await Store.saveOrder(o);
      if (t) addGuestHistory({id: o.id, at: o.at, tableName: t.name, kantin: kantinName(S.kid), total: cartTotal(lines), items: itemsText(o, false)});
      S.view = 'pesananku'; render();
      if (['kasir', 'qris', 'shopeepay', 'gopay'].filter(payReady).length > 1) openSheet(() => payChooser(o.id, true), true); else if (o.payMethod !== 'kasir') openSheet(() => payScreen(o.id), true); else toast('Pesanan terkirim ke kasir. Bayar di kasir saat pesanan diambil.');
    } catch (e) { S.cart = before; S.meta.notes = beforeNotes; render(); toast('Gagal mengirim pesanan: ' + errMsg(e)); }
  },
  'c-cancel': (el, id) => {
    const o = S.orders[id]; if (!o || !(S.guestTable ? o.guest === S.guest.gid : o.uid === S.session)) return;
    if (o.paid) { toast('Pesanan sudah lunas dan tidak bisa dibatalkan dari sini. Hubungi kasir.'); return; }
    if (o.status) { toast('Pesanan sudah diproses dapur dan tidak bisa dibatalkan dari sini. Hubungi kasir.'); return; }
    confirmSheet('Batalkan pesanan?', 'Pesanan ini akan dihapus dari antrean kasir.', 'Batalkan pesanan', () => Store.delOrder(id).then(() => { if (S.guestTable) { const h = guestHistory().map(x => x.id === id ? {...x, cancelled: true} : x); try { localStorage.setItem('kantin-uis-guest-orders', JSON.stringify(h)); } catch (e) {} render(); } toast('Pesanan dibatalkan'); }).catch(e => toast('Gagal: ' + errMsg(e))), true);
  },
  'hpp-tab': (el, id, v) => { S.hppTab = v; saveUI(); render(); },
  'hpp-reset': () => confirmSheet('Mulai dari kosong?', 'Semua data contoh di Kalkulator HPP (bahan, resep, menu, biaya, simulasi) akan dihapus. Data kasir dan laporan tidak terpengaruh.', 'Kosongkan', () => { S.hpp = {demo: false, target: 40, porsiBulan: 1500, bahan: [], olahan: [], menus: [], ops: [], sim: {}, opname: {}}; hppChanged(true); }, true),
  'hpp-apply': (el, id) => {
    const m = HP().menus.find(x => x.id === id), p = m && S.products[m.pid]; if (!p) return;
    const cost = Math.round(menuCalc(m).bahan);
    confirmSheet('Pakai HPP sebagai modal?', `Modal “${esc(p.name)}” di kasir diubah dari ${rp(p.cost)} menjadi ${rp(cost)} (HPP bahan ${esc(m.name)}). Transaksi lama tidak berubah.`, 'Ubah modal', () => Store.saveProduct({...p, cost, costSource: 'hpp', hppMenu: m.id, hppBasis: 'bahan'}).then(() => toast('Modal produk kini mengikuti Kalkulator HPP')).catch(e => toast('Gagal: ' + errMsg(e))));
  },
  'hb-new': () => { openSheet(() => hbForm(null)); hbHint(); },
  'hb-edit': (el, id) => { const b = HP().bahan.find(x => x.id === id); if (b) { openSheet(() => hbForm(b)); hbHint(); } },
  'hb-del': (el, id) => {
    const h = HP(), b = h.bahan.find(x => x.id === id); if (!b) return; const used = usedIn('b:' + id);
    if (used.length) { toast(`${b.name} masih dipakai di: ${used.join(', ')}. Hapus dari resep dulu.`); return; }
    confirmSheet('Hapus bahan baku?', `“${esc(b.name)}” akan dihapus dari kalkulator.`, 'Hapus', () => { h.bahan = h.bahan.filter(x => x.id !== id); hppChanged(true); }, true);
  },
  'ho-new': () => openRecipe('olahan', null),
  'ho-edit': (el, id) => { const o = HP().olahan.find(x => x.id === id); if (o) openRecipe('olahan', o); },
  'ho-del': (el, id) => {
    const h = HP(), o = h.olahan.find(x => x.id === id); if (!o) return; const used = usedIn('o:' + id);
    if (used.length) { toast(`${o.name} masih dipakai di: ${used.join(', ')}. Hapus dari resep menu dulu.`); return; }
    confirmSheet('Hapus bahan olahan?', `“${esc(o.name)}” beserta resep batch-nya akan dihapus.`, 'Hapus', () => { h.olahan = h.olahan.filter(x => x.id !== id); hppChanged(true); }, true);
  },
  'hm-new': () => openRecipe('menu', null),
  'hm-edit': (el, id) => { const m = HP().menus.find(x => x.id === id); if (m) openRecipe('menu', m); },
  'hm-del': (el, id) => {
    const h = HP(), m = h.menus.find(x => x.id === id); if (!m) return;
    confirmSheet('Hapus menu?', `“${esc(m.name)}” dan resepnya akan dihapus dari kalkulator. Produk di kasir tidak terhapus.`, 'Hapus', () => { h.menus = h.menus.filter(x => x.id !== id); delete h.sim[id]; hppChanged(true); }, true);
  },
  'r-add': () => { S.draft.items.push({ref: '', qty: 0}); redrawSheet(); },
  'r-del': (el, id, v) => { S.draft.items.splice(+v, 1); if (!S.draft.items.length) S.draft.items.push({ref: '', qty: 0}); redrawSheet(); },
  'r-save': () => saveRecipe(),
  'op-add': () => { HP().ops.push({name: '', amount: 0}); hppChanged(true); },
  'op-del': (el, id, v) => { HP().ops.splice(+v, 1); hppChanged(true); },
  'goto-exp': () => { closeSheet(); S.view = 'beli'; S.beliTab = 'exp'; saveUI(); render(); window.scrollTo(0, 0); },
  'beli-tab': (el, id, v) => { S.beliTab = v; saveUI(); render(); },
  'buy-new': () => openBuy(''),
  'buy-item': (el, id) => { closeSheet(); openBuy(id); },
  'buy-save': () => saveBuy(),
  'br-add': () => { S.draft.rows.push({iid: '', qty: 0, price: 0, exp: ''}); redrawSheet(); },
  'br-del': (el, id, v) => { S.draft.rows.splice(+v, 1); if (!S.draft.rows.length) S.draft.rows.push({iid: '', qty: 0, price: 0, exp: ''}); redrawSheet(); },
  'edit-buy': (el, id) => {
    const g = purchaseGroups().find(x => x.id === id); if (!g || g.legacy) return;
    S.draft = {kind: 'buy', editId: g.id, sid: g.sid || '', date: dayKey(g.at), note: g.note || '', rows: g.lines.map(m => ({iid: m.iid, qty: m.qty, price: m.price || 0, exp: m.exp || ''}))};
    openSheet(buySheet);
  },
  'del-buy': (el, id) => {
    const g = purchaseGroups().find(x => x.id === id); if (!g) return;
    confirmSheet('Hapus pembelian?', `Pembelian ${esc(g.sname || 'tanpa supplier')} senilai ${rp(g.total)} akan dihapus. Stok barang dikurangi kembali${g.kasId && S.kas[g.kasId] ? ' dan catatan di Kas & Biaya ikut dihapus' : ''}.`, 'Hapus', async () => {
      try {
        for (const m of g.lines) { if (m.stockId) await Store.delStock(m.stockId); if (g.legacy) await Store.delStock(m.id); else await Store.delItemMove(m.id); }
        if (g.kasId && S.kas[g.kasId]) await Store.delKas(g.kasId);
        toast('Pembelian dihapus');
      } catch (e) { toast('Gagal: ' + errMsg(e)); }
    }, true);
  },
  'item-new': () => openSheet(() => itemForm(null)),
  'item-edit': (el, id) => { const it = S.items[id]; if (it) openSheet(() => itemForm(it)); },
  'item-use': (el, id) => { const it = S.items[id]; if (it) openSheet(() => itemMoveForm(it, 'use')); },
  'item-fix': (el, id) => { const it = S.items[id]; if (it) { closeSheet(); openSheet(() => itemMoveForm(it, 'fix')); } },
  'item-del': (el, id) => {
    const it = S.items[id]; if (!it) return;
    if (itemMoves().some(m => m.iid === id)) { toast(`${it.name} sudah punya riwayat pembelian/pemakaian, jadi tidak bisa dihapus.`); return; }
    confirmSheet('Hapus barang?', `“${esc(it.name)}” akan dihapus dari daftar.`, 'Hapus', () => Store.delItem(id).then(() => toast('Barang dihapus')).catch(e => toast('Gagal: ' + errMsg(e))), true);
  },
  'del-imove': (el, id) => { const m = S.itemMoves[id]; if (!m) return; confirmSheet('Hapus catatan?', `Catatan ${m.type === 'pakai' ? 'pemakaian' : 'koreksi'} ${esc(moveName(m))} akan dihapus dan stok dihitung ulang.`, 'Hapus', () => Store.delItemMove(id).then(() => toast('Catatan dihapus')).catch(e => toast('Gagal: ' + errMsg(e))), true); },
  'stok-tab': (el, id, v) => { S.stokTab = v; saveUI(); render(); },
  method: (el, id, v) => { S.meta.method = METHODS[v] ? v : 'tunai'; if (S.meta.method !== 'tunai') S.cash = 0; render(); },
  'disc-type': (el, id, v) => { S.meta.disc = {type: v === 'rp' ? 'rp' : 'pct', value: 0}; S.cash = 0; render(); const i = $(S.sheet ? '#disc-s' : '#disc'); if (i) i.focus(); },
  'new-sup': () => openSheet(() => supForm(null)),
  'edit-sup': (el, id) => { const x = S.suppliers[id]; if (x) openSheet(() => supForm(x)); },
  'sup-detail': (el, id) => { const x = S.suppliers[id]; if (x) openSheet(() => supDetail(x), true); },
  'eval-sup': (el, id) => { const x = S.suppliers[id]; if (x) openSheet(() => evalForm(x)); },
  'del-eval': (el, id) => { Store.delEval(id).then(() => toast('Evaluasi dihapus')).catch(e => toast('Gagal: ' + errMsg(e))); },
  'del-sup': (el, id) => {
    const x = S.suppliers[id]; if (!x) return; const n = supStats(id).buys.length;
    confirmSheet('Hapus supplier?', `“${esc(x.name)}” akan dihapus dari daftar.${n ? ` Riwayat ${n} pembelian tetap tersimpan dengan nama supplier ini.` : ''} Evaluasinya ikut dihapus.`, 'Hapus', async () => {
      try { await Store.delSupplier(id); for (const e of Object.values(S.evals)) if (e.sid === id) await Store.delEval(e.id); toast('Supplier dihapus'); } catch (e) { toast('Gagal: ' + errMsg(e)); }
    }, true);
  },
  'stock-in': (el, id) => { const p = S.products[id]; if (p) { openSheet(() => stockForm(p, 'in')); } },
  'stock-fix': (el, id) => { const p = S.products[id]; if (p) openSheet(() => stockForm(p, 'fix')); },
  'del-stock': (el, id) => {
    const m = S.stock[id]; if (!m) return; const p = S.products[m.pid], k = m.kasId && S.kas[m.kasId];
    confirmSheet('Hapus catatan stok?', `Catatan ${m.qty > 0 ? '+' : '−'}${qu(Math.abs(m.qty), p ? unitOf(p) : '')} ${esc(p ? p.name : '')} akan dihapus dan sisa stok dihitung ulang.${k ? ` Catatan belanja ${rp(k.amount)} di Kas ikut dihapus.` : ''}`, 'Hapus', () => Store.delStock(id).then(() => k ? Store.delKas(m.kasId) : null).then(() => toast('Catatan stok dihapus')).catch(e => toast('Gagal: ' + errMsg(e))), true);
  },
  'del-prod': (el, id) => {
    const p = S.products[id]; if (!p) return;
    const used = productUsage(id);
    if (used.length) { openSheet(() => prodBlockedSheet(p, used)); return; }
    confirmSheet('Hapus produk?', `“${esc(p.name)}” akan dihapus permanen dari daftar produk. Produk ini belum pernah tercatat di laporan, jadi laporan tidak berubah.`, 'Hapus produk', async () => {
      try {
        await Store.delProduct(id);
        for (const m of stockMoves()) if (m.pid === id) await Store.delStock(m.id);
        delete S.cart[id];
        for (const o of savedOrders()) if (o.cart && o.cart[id]) { const c = {...o.cart}; delete c[id]; await Store.saveOrder({...o, cart: c}); }
        render(); toast('Produk dihapus');
      } catch (e) { toast('Gagal menghapus: ' + errMsg(e)); }
    }, true);
  },
  'hide-prod': (el, id) => {
    const p = S.products[id]; if (!p) return;
    Store.saveProduct({...p, active: false}).then(() => { closeSheet(); delete S.cart[id]; render(); toast('Produk disembunyikan dari kasir'); }).catch(e => toast('Gagal: ' + errMsg(e)));
  },
  'goto-tx': (el, id, day) => { closeSheet(); S.view = 'riwayat'; S.histDate = day; saveUI(); render(); window.scrollTo(0, 0); },
  'edit-prod': (el, id) => { const p = S.products[id]; if (p) { openSheet(() => prodForm(p)); setCostSrc(p.costSource); } },
  'cost-src': (el, id, v) => setCostSrc(v),
  'photo-clear': () => { const h = $('#pf-photo-data'); if (h) h.value = ''; const pv = $('#pf-prev'); if (pv) pv.innerHTML = ILL[catKind($('#pf-cat').value)]; },
  settings: () => openSheet(settingsForm),
  'new-kas': () => openSheet(kasForm),
  'del-kas': (el, id) => {
    const e = S.kas[id]; if (!e) return;
    if (e.pbId) { toast('Catatan ini berasal dari menu Pembelian. Hapus pembeliannya di menu Pembelian agar stok ikut terkoreksi.'); return; }
    confirmSheet('Hapus catatan kas?', `${esc(e.note || KAS_TYPES[e.type].label)} senilai ${rp(e.amount)} akan dihapus permanen dari laporan.`, 'Hapus', () => Store.delKas(id).then(() => toast('Catatan dihapus')).catch(er => toast('Gagal: ' + errMsg(er))), true);
  },
  csv: () => exportCsv()
};
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const a = el.dataset.act;
  if (!me() ? !AUTH_ACTS.has(a) : isCust() && !CUST_ACTS.has(a)) return;
  if (isCust() && el.dataset.id && Store.db && !(S.orders || {})[el.dataset.id]) { const o = guestAllOrders().find(x => x.id === el.dataset.id); if (o && o.kid !== S.kid) { S.guestKid = o.kid; Store.bindTenant(o.kid); } }
  const fn = ACT[a];
  if (fn) { e.preventDefault(); fn(el, el.dataset.id, el.dataset.v, e); }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { if (S.sheet) closeSheet(); else closeDrawer(); }
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('label[for="pf-photo"]')) { e.preventDefault(); $('#pf-photo').click(); }
  if (e.key === 'Enter' && e.target.matches('[data-cash]')) { e.preventDefault(); e.target.blur(); pay(); }
});
document.addEventListener('input', e => {
  const t = e.target;
  if (t.matches('[data-cash]')) {
    // Update the change while typing without redrawing the panel, so the field keeps focus.
    const n = digits(t.value); t.value = n ? n.toLocaleString('id-ID') : ''; S.cash = n;
    const total = payTotal();
    document.querySelectorAll('[data-cash]').forEach(i => { if (i !== t) i.value = t.value; });
    document.querySelectorAll('.change-slot').forEach(el => { el.innerHTML = changeHtml(total); });
    document.querySelectorAll('.cash .chip').forEach(b => b.classList.toggle('on', +b.dataset.v === n));
  }
  if (t.matches('#hb-qty, #hb-unit, #hb-price')) hbHint();
  if (t.matches('#pf-hmenu, #pf-hbasis')) fillHppCost();
  if (t.matches('[data-d]') && S.draft) {
    const k = t.dataset.d; S.draft[k] = k === 'price' ? digits(t.value) : k === 'yield' ? parseQty(t.value) : t.value;
    if (k === 'yunit') redrawSheet(); else { const c = $('#r-cost'); if (c) c.innerHTML = draftCost(); }
  }
  if (t.matches('[data-r]') && S.draft) {
    const row = S.draft.items[+t.dataset.r]; if (row) {
      if (t.dataset.rk === 'ref') { row.ref = t.value; redrawSheet(); }
      else { row.qty = parseQty(t.value); const c = $('#r-cost'); if (c) c.innerHTML = draftCost(); }
    }
  }
  if (t.id === 'hpp-target') { HP().target = Math.min(95, parseQty(t.value)); $('#hpp-sum').innerHTML = hSumTable(); hppChanged(); }
  if (t.id === 'hpp-porsi') { const n = digits(t.value); t.value = n ? n.toLocaleString('id-ID') : ''; HP().porsiBulan = n; $('#ops-out').innerHTML = opsOut(); hppChanged(); }
  if (t.matches('[data-op]')) {
    const x = HP().ops[+t.dataset.op]; if (x) {
      if (t.dataset.opk === 'amount') { const n = digits(t.value); t.value = n ? n.toLocaleString('id-ID') : ''; x.amount = n; } else x.name = t.value;
      $('#ops-out').innerHTML = opsOut(); hppChanged();
    }
  }
  if (t.matches('[data-sim]')) { const n = digits(t.value); t.value = n ? n.toLocaleString('id-ID') : ''; HP().sim[t.dataset.sim] = n; $('#sim-out').innerHTML = simOut(); hppChanged(); }
  if (t.matches('[data-opn]')) {
    const id = t.dataset.opn, b = HP().bahan.find(x => x.id === id); HP().opname[id] = String(t.value).trim() === '' ? '' : parseQty(t.value);
    const cell = document.getElementById('opd-' + id); if (cell && b) cell.innerHTML = opnDiff(b, usage()[id] || 0); hppChanged();
  }
  if (t.matches('[data-disc]')) {
    let n = digits(t.value); if (S.meta.disc.type !== 'rp') n = Math.min(n, 100);
    t.value = n ? n.toLocaleString('id-ID') : ''; S.meta.disc = {...S.meta.disc, value: n};
    const sub = cartTotal(cartLines());
    document.querySelectorAll('[data-disc]').forEach(i => { if (i !== t) i.value = t.value; });
    document.querySelectorAll('.totslot').forEach(el => { el.innerHTML = totalsHtml(sub); });
    document.querySelectorAll('.change-slot').forEach(el => { el.innerHTML = changeHtml(payTotal()); });
    document.querySelectorAll('.cb-sum b').forEach(el => { el.textContent = rp(payTotal()); });
  }
  if (t.matches('[data-bd]') && S.draft && S.draft.kind === 'buy') S.draft[t.dataset.bd] = t.value;
  if (t.matches('[data-br]') && S.draft && S.draft.kind === 'buy') {
    const r = S.draft.rows[+t.dataset.br]; if (r) {
      const k = t.dataset.bk;
      if (k === 'iid') { r.iid = t.value; const last = itemMoves().find(m => m.iid === t.value && m.price); if (last && !r.price) r.price = last.price; redrawSheet(); }
      else if (k === 'price') { const n = digits(t.value); t.value = n ? n.toLocaleString('id-ID') : ''; r.price = n; }
      else if (k === 'qty') r.qty = parseQty(t.value); else r.exp = t.value;
      const sb = document.getElementById('bsub-' + t.dataset.br); if (sb) sb.textContent = rp(lineAmt(r.price, r.qty));
      const tot = $('#bd-total'); if (tot) tot.innerHTML = `<span>Total pembelian</span><span class="num">${rp(S.draft.rows.reduce((a, x) => a + lineAmt(x.price, x.qty), 0))}</span>`;
    }
  }
  if (t.id === 'it-kind') $('#it-jadi').hidden = t.value !== 'jadi';
  if (t.matches('[data-payimg]') && t.files && t.files[0]) {
    const k = t.dataset.payimg; readQrImage(t.files[0]).then(d => { $('#pi-' + k).value = d; $('#pv-' + k).innerHTML = `<img src="${d}" alt="">`; }).catch(() => toast('Gambar tidak bisa dibaca. Coba file JPG/PNG lain.'));
  }
  if (t.matches('[data-paykasir]')) savePay({kasir: t.checked}).then(() => toast(t.checked ? 'Bayar di kasir diaktifkan' : 'Bayar di kasir dinonaktifkan')).catch(e => toast('Gagal: ' + errMsg(e)));
  if (t.matches('[data-note]')) { const pid = t.dataset.note; S.meta.notes = {...(S.meta.notes || {}), [pid]: t.value}; document.querySelectorAll('[data-note]').forEach(i => { if (i !== t && i.dataset.note === pid) i.value = t.value; }); }
  if (t.matches('[data-cust]')) { S.meta.customer = t.value; document.querySelectorAll('[data-cust]').forEach(i => { if (i !== t) i.value = t.value; }); }
  if (t.id === 'q') { S.q = t.value; $('#menus').innerHTML = vMenus(); }
  if (t.matches('[data-money]')) { const n = digits(t.value); t.value = n ? n.toLocaleString('id-ID') : ''; }
  if (t.id === 'pf-price' || t.id === 'pf-cost') updateMargin();
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.matches('[data-kid]')) { S.adminKid = t.value; try { localStorage.setItem('kantin-uis-kid', t.value); } catch (e) {} closeDrawer(); render(); }
  if (t.matches('[data-hd]') && S.histDel && t.value) { S.histDel = {...S.histDel, [t.dataset.hd]: t.value}; redrawSheet(); }
  if (t.id === 'hist-date') { S.histDate = t.value || dayKey(Date.now()); render(); }
  if (t.id === 'rf' || t.id === 'rt') { if (t.value) { S.range[t.id === 'rf' ? 'from' : 'to'] = t.value; render(); } }
  if (t.id === 'pf-cat') {
    $('#pf-newcat-f').hidden = t.value !== '__new'; if (t.value === '__new') $('#pf-newcat').focus();
    const row = t.form.querySelector('.photo-row'); row.className = 'photo-row ' + catKind(t.value);
    if (!$('#pf-photo-data').value) $('#pf-prev').innerHTML = ILL[catKind(t.value)];
  }
  if (t.matches('[data-qty]')) {
    const id = t.dataset.qty, n = r3(parseFloat(String(t.value).replace(/\./g, '').replace(',', '.')) || 0), p = S.products[id];
    if (p && n > 0) S.cart[id] = UNITS[unitOf(p)].dec ? n : Math.max(1, Math.round(n)); else delete S.cart[id];
    if (!cartLines().length) S.cash = 0;
    render();
  }
  if (t.id === 'pf-unit') $('#pf-unit-hint').textContent = unitHint(t.value);
  if (t.id === 'pf-photo' && t.files && t.files[0]) {
    readPhoto(t.files[0]).then(url => { $('#pf-photo-data').value = url; $('#pf-prev').innerHTML = `<img src="${url}" alt="">`; })
      .catch(() => toast('Foto tidak bisa dibaca. Coba file JPG atau PNG.'));
    t.value = '';
  }
  if (t.name === 'type' && t.closest('[data-form="kas"]')) { $('#kf-cat-f').hidden = t.value !== 'beban'; $('#kf-hint').textContent = KAS_TYPES[t.value].hint; }
});
document.addEventListener('submit', async e => {
  const f = e.target; e.preventDefault();
  const fd = new FormData(f), kind = f.dataset.form, btn = f.querySelector('[type=submit]');
  const fail = (sel, msg) => { const el = f.querySelector(sel); el.textContent = msg; el.hidden = false; };
  try {
    if (kind === 'item') {
      const name = String(fd.get('name') || '').trim(), k = fd.get('kind') === 'jadi' ? 'jadi' : 'bahan', unit = ITEM_UNITS.includes(fd.get('unit')) ? fd.get('unit') : 'pcs';
      if (!name) return fail('#it-err', 'Isi nama barang.');
      if (itemsList().some(x => x.id !== f.dataset.id && x.name.toLowerCase() === name.toLowerCase())) return fail('#it-err', 'Nama barang sudah ada.');
      const id = f.dataset.id || uid('it'), old = S.items[id] || {};
      if (old.unit && old.unit !== unit && itemMoves().some(m => m.iid === id)) return fail('#it-err', `Satuan tidak bisa diubah dari ${old.unit} karena sudah ada riwayat.`);
      btn.disabled = true;
      await Store.saveItem({...old, id, name, kind: k, unit, minStock: parseQty(fd.get('min')), pid: k === 'jadi' ? String(fd.get('pid') || '') : '', perUnit: k === 'jadi' ? (parseQty(fd.get('per')) || 1) : 1});
      closeSheet(); toast(f.dataset.id ? 'Barang diperbarui' : 'Barang ditambahkan'); return;
    }
    if (kind === 'itemmove') {
      const it = S.items[f.dataset.id]; if (!it) return;
      const raw = String(fd.get('qty') || '').trim(), n = parseQty(raw), fix = f.dataset.mode === 'fix';
      if (!raw || n < 0 || (!fix && n <= 0)) return fail('#im-err', 'Isi jumlah yang benar.');
      if (!itemDec(it.unit) && n !== Math.round(n)) return fail('#im-err', 'Satuan ' + it.unit + ' harus bilangan bulat.');
      const qty = fix ? r3(n - (itemStockMap()[it.id] || 0)) : -n;
      btn.disabled = true;
      if (qty !== 0) await Store.addItemMove({id: uid('im'), at: Date.now(), iid: it.id, iname: it.name, type: fix ? 'koreksi' : 'pakai', qty, unit: it.unit, note: String(fd.get('note') || '').trim()});
      closeSheet(); toast(fix ? (qty ? 'Stok dikoreksi' : 'Stok sudah sesuai') : 'Pemakaian dicatat'); return;
    }
    if (kind === 'payset') {
      const k = f.dataset.v, enabled = fd.get('enabled') === 'on', img = String(fd.get('img') || ''), name = String(fd.get('name') || '').trim(), number = normPhone(fd.get('number') || '');
      if (enabled && k === 'qris' && !img) return fail('#pe-' + k, 'Unggah gambar QRIS dulu sebelum mengaktifkan.');
      if (enabled && k !== 'qris' && !number) return fail('#pe-' + k, 'Isi nomor HP ${payLabel(k)} dulu sebelum mengaktifkan.'.replace('${payLabel(k)}', payLabel(k)));
      if (number && !validPhone(number)) return fail('#pe-' + k, 'Nomor belum benar. Contoh: 081234567890.');
      btn.disabled = true; await savePay({[k]: k === 'qris' ? {enabled, img, name} : {enabled, img: '', name, number}}); render(); toast(payLabel(k) + ' disimpan'); return;
    }
    if (kind === 'kantin-new' || kind === 'kantin-edit') {
      const list = kantinsList(), name = String(fd.get('name') || '').trim(), errSel = kind === 'kantin-new' ? '#kn-err' : '#ke-err';
      if (!name) return fail(errSel, 'Isi nama kantin.');
      if (list.some(k => k.id !== f.dataset.v && k.name.toLowerCase() === name.toLowerCase())) return fail(errSel, 'Nama kantin sudah ada.');
      btn.disabled = true;
      if (kind === 'kantin-new') { let id; do { id = Math.random().toString(36).slice(2, 8); } while (id === 'main' || list.some(k => k.id === id)); list.push({id, name, active: true}); }
      else { const k = list.find(x => x.id === f.dataset.v); if (k) Object.assign(k, {name, desc: String(fd.get('desc') || '').trim(), active: fd.get('active') === 'on'}); }
      await Store.saveGlobal({kantins: list});
      if (kind === 'kantin-edit') closeSheet();
      render(); toast(kind === 'kantin-new' ? 'Kantin ditambahkan' : 'Kantin diperbarui'); return;
    }
    if (kind === 'guest') {
      const name = String(fd.get('name') || '').trim(), phone = String(fd.get('phone') || '').trim();
      if (name.length < 2) return fail('#au-err', 'Isi nama Anda.');
      if (!validPhone(phone)) return fail('#au-err', 'Nomor HP belum benar. Contoh: 081234567890.');
      S.guest = {...S.guest, name, phone: normPhone(phone)}; saveGuest(); S.view = S.guestKid ? 'pesan' : 'pilih'; S.authShown = null; render();
      return;
    }
    if (kind === 'qrbase') {
      let b = String(fd.get('base') || '').trim();
      if (b && !/^https?:\/\/[^\s]+$/i.test(b)) return fail('#qb-err', 'Alamat harus diawali http:// atau https://');
      btn.disabled = true; await Store.saveGlobal({qrBase: b.replace(/#.*$/, '')});
      render(); toast('Alamat QR disimpan'); return;
    }
    if (kind === 'table-new') {
      const bulk = e.submitter && e.submitter.name === 'bulk', list = [...tables()], mkId = () => { let id; do { id = Math.random().toString(36).slice(2, 8); } while (list.some(t => t.id === id)); return id; };
      if (bulk) {
        const n = digits(fd.get('count')); if (!n || n > 100) return fail('#tb-err', 'Isi jumlah meja 1–100.');
        let k = list.length; for (let i = 0; i < n; i++) { let nm; do { nm = 'Meja ' + (++k); } while (list.some(t => t.name === nm)); list.push({id: mkId(), name: nm}); }
      } else {
        const name = String(fd.get('name') || '').trim(); if (!name) return fail('#tb-err', 'Isi nama meja.');
        if (list.some(t => t.name.toLowerCase() === name.toLowerCase())) return fail('#tb-err', 'Nama meja sudah ada.');
        list.push({id: mkId(), name});
      }
      btn.disabled = true; await saveTables(list); render(); toast('Meja ditambahkan'); return;
    }
    if (kind === 'table-edit') {
      const name = String(fd.get('name') || '').trim(), id = f.dataset.id; if (!name) return fail('#te-err', 'Isi nama meja.');
      if (tables().some(t => t.id !== id && t.name.toLowerCase() === name.toLowerCase())) return fail('#te-err', 'Nama meja sudah ada.');
      btn.disabled = true; await saveTables(tables().map(t => t.id === id ? {...t, name} : t)); closeSheet(); toast('Nama meja diubah'); return;
    }
    if (kind === 'login') {
      const now = Date.now();
      if (Store.remote) {
        btn.disabled = true;
        try { const r = await Store.db.req('login', {id: fd.get('id'), pw: fd.get('pw')}); setSession(r.id); await Store.db.refresh(); }
        catch (er) { btn.disabled = false; return fail('#au-err', er.message); }
        const ru = S.users[S.session];
        S.cart = {}; S.meta = newMeta(); S.view = homeView(); S.authShown = null; render();
        toast(`Selamat datang${ru ? ', ' + ru.name : ''}`);
        return;
      }
      if (S.lockUntil && now < S.lockUntil) return fail('#au-err', `Terlalu banyak percobaan. Coba lagi dalam ${Math.ceil((S.lockUntil - now) / 1000)} detik.`);
      const u = findLogin(fd.get('id')), pw = String(fd.get('pw') || '');
      if (!u || hashPw(pw, u.salt) !== u.hash) {
        S.fails = (S.fails || 0) + 1; if (S.fails >= 5) { S.lockUntil = now + 30000; S.fails = 0; }
        return fail('#au-err', 'Username/NIM/email atau password salah.');
      }
      if (u.pending) return fail('#au-err', 'Pendaftaran Anda masih menunggu persetujuan super admin. Coba masuk lagi setelah disetujui.');
      if (u.active === false) return fail('#au-err', 'Akun ini dinonaktifkan oleh super admin. Hubungi pengelola Oneklik Biz.');
      S.fails = 0; btn.disabled = true;
      setSession(u.id); if (fd.get('remember') !== 'on') { try { localStorage.removeItem('kantin-uis-session'); } catch (e) {} }
      S.cart = {}; S.meta = newMeta(); S.view = homeView(); S.authShown = null; render();
      if (!Store.remote) Store.saveUser({...u, lastLogin: now}).catch(() => {});
      toast(`Selamat datang, ${u.name}`);
      return;
    }
    if (kind === 'register') {
      const name = String(fd.get('name') || '').trim(), bizName = String(fd.get('bizName') || '').trim(), username = String(fd.get('username') || '').trim(), contact = String(fd.get('contact') || '').trim(), pw = String(fd.get('pw') || '');
      if (name.length < 2 || bizName.length < 2 || !contact) return fail('#au-err', 'Lengkapi nama, nama usaha, dan nomor HP / email.');
      if (!/^[A-Za-z0-9._-]{3,30}$/.test(username)) return fail('#au-err', 'Username 3–30 karakter: huruf, angka, titik, garis bawah, atau strip.');
      if (pw.length < 12) return fail('#au-err', 'Password minimal 12 karakter.');
      if (pw !== fd.get('pw2')) return fail('#au-err', 'Ulangi password belum sama.');
      btn.disabled = true;
      const data = {name, bizName, username, contact};
      if (Store.remote) {
        try { const r = await Store.db.req('register', {data: {...data, password: pw}}); setSession(r.id); await Store.db.refresh(); } catch (er) { btn.disabled = false; return fail('#au-err', er.message); }
      } else {
        if (takenBy('username', username) || takenBy('contact', contact)) { btn.disabled = false; return fail('#au-err', 'Username atau nomor HP / email sudah terdaftar.'); }
        const list = kantinsList();
        if (list.some(k => k.name.toLowerCase() === bizName.toLowerCase())) { btn.disabled = false; return fail('#au-err', 'Nama usaha ini sudah dipakai kantin lain. Pakai nama yang berbeda.'); }
        let kid; do { kid = Math.random().toString(36).slice(2, 8); } while (kid.length < 6 || list.some(k => k.id === kid) || users().some(u => u.kid === kid));
        list.push({id: kid, name: bizName, active: true}); await Store.saveGlobal({kantins: list});
        const salt = newSalt(), u = {...data, salt, hash: hashPw(pw, salt), id: uid('u'), role: 'pemilik', kid, active: true, selfRegistered: true, createdAt: Date.now(), lastLogin: Date.now()};
        await Store.saveUser(u); setSession(u.id);
      }
      S.authPage = 'login'; S.cart = {}; S.meta = newMeta(); S.view = homeView(); S.authShown = null; render();
      toast(`Selamat datang, ${name}! Kantin “${bizName}” siap dipakai.`); return;
    }
    if (kind === 'setup') {
      const name = String(fd.get('name') || '').trim(), username = String(fd.get('username') || '').trim(), contact = String(fd.get('contact') || '').trim(), pw = String(fd.get('pw') || '');
      if (Store.remote || users().length) { S.authShown = null; render(); return; }
      if (!name || !username) return fail('#au-err', 'Isi nama dan username.');
      if (!/^[A-Za-z0-9._-]{3,30}$/.test(username)) return fail('#au-err', 'Username 3–30 karakter: huruf, angka, titik, garis bawah, atau strip.');
      if (pw.length < 12) return fail('#au-err', 'Password minimal 12 karakter.');
      if (pw !== fd.get('pw2')) return fail('#au-err', 'Ulangi password belum sama.');
      btn.disabled = true;
      const salt = newSalt(), u = {id: uid('u'), name, username, contact, role: 'admin', active: true, salt, hash: hashPw(pw, salt), createdAt: Date.now(), lastLogin: Date.now()};
      await Store.saveUser(u); setSession(u.id);
      S.view = homeView(); S.authShown = null; render();
      toast('Akun super admin dibuat');
      return;
    }
    if (kind === 'forgot') {
      const username = String(fd.get('username') || '').trim();
      const pw = String(fd.get('password') || ''), pw2 = String(fd.get('password2') || '');
      if (!username) return fail('#fp-err', 'Username wajib diisi.');
      if (pw.length < 12) return fail('#fp-err', 'Password baru minimal 12 karakter.');
      if (pw !== pw2) return fail('#fp-err', 'Ulangi password belum sama.');
      btn.disabled = true;
      if (Store.remote) {
        try { await Store.db.req('reset_password', {username, password: pw}); }
        catch (er) { btn.disabled = false; return fail('#fp-err', er.message); }
      } else {
        const u = findLogin(username);
        if (!u) { btn.disabled = false; return fail('#fp-err', 'Username tidak ditemukan.'); }
        const salt = newSalt();
        await Store.saveUser({...u, salt, hash: hashPw(pw, salt), mustChange: false});
      }
      closeSheet();
      const idEl = $('#au-id'), pwEl = $('#au-pw');
      if (idEl) idEl.value = username;
      if (pwEl) pwEl.value = '';
      toast('Password berhasil diperbarui. Silakan masuk dengan password baru.');
      return;
    }
    if (kind === 'user') {
      if (role() !== 'admin') return;
      const id = f.dataset.id, old = S.users[id] || {}, name = String(fd.get('name') || '').trim(), username = String(fd.get('username') || '').trim(), contact = String(fd.get('contact') || '').trim();
      const r = fd.get('role') === 'admin' ? 'admin' : 'pemilik', active = fd.get('active') === 'on';
      if (!name || !username) return fail('#uf-err', 'Isi nama dan username.');
      if (!/^[A-Za-z0-9._-]{3,30}$/.test(username)) return fail('#uf-err', 'Username 3–30 karakter: huruf, angka, titik, garis bawah, atau strip.');
      if (takenBy('username', username, id) || (contact && takenBy('contact', contact, id))) return fail('#uf-err', 'Username atau NIM/email sudah dipakai akun lain.');
      if (id === S.session && (r !== 'admin' || !active)) return fail('#uf-err', 'Anda tidak bisa menurunkan role atau menonaktifkan akun sendiri.');
      if (old.role === 'admin' && old.active !== false && (r !== 'admin' || !active) && activeAdmins().length <= 1) return fail('#uf-err', 'Minimal harus ada satu admin aktif.');
      let extra = {};
      if (!id) {
        const pw = String(fd.get('pw') || '');
        if (pw.length < 12) return fail('#uf-err', 'Password awal minimal 12 karakter.');
        if (Store.remote) extra = {newPassword: pw, createdAt: Date.now(), mustChange: true, pwResetAt: Date.now(), pwResetBy: me().name};
        else { const salt = newSalt(); extra = {salt, hash: hashPw(pw, salt), createdAt: Date.now(), mustChange: true, pwResetAt: Date.now(), pwResetBy: me().name}; }
      }
      btn.disabled = true;
      const saved = {...old, ...extra, id: id || uid('u'), name, username, contact, role: r, active, kid: r === 'pemilik' ? String(fd.get('kid') || 'main') : ''};
      await Store.saveUser(saved);
      if (Store.remote) await Store.db.refresh();
      if (id && r === 'pemilik' && (old.active !== false) !== active) await syncKantinFor(saved.kid || 'main', active, saved.id);
      closeSheet(); toast(id ? 'Pengguna diperbarui' : 'Pengguna ditambahkan');
      return;
    }
    if (kind === 'pw') {
      const u = S.users[f.dataset.id], self = !!f.dataset.self; if (!u) return;
      if (!self && role() !== 'admin') return;
      if (self && !Store.remote && hashPw(String(fd.get('old') || ''), u.salt) !== u.hash) return fail('#pw-err', 'Password lama salah.');
      const pw = String(fd.get('pw') || '');
      if (pw.length < 12) return fail('#pw-err', 'Password baru minimal 12 karakter.');
      if (pw !== fd.get('pw2')) return fail('#pw-err', 'Ulangi password belum sama.');
      btn.disabled = true;
      if (Store.remote) {
        await Store.saveUser(self ? {...u, currentPassword: String(fd.get('old') || ''), newPassword: pw} : {...u, newPassword: pw});
        await Store.db.refresh();
      } else {
        const salt = newSalt();
        await Store.saveUser(self ? {...u, salt, hash: hashPw(pw, salt), mustChange: false} : {...u, salt, hash: hashPw(pw, salt), mustChange: true, pwResetAt: Date.now(), pwResetBy: me().name});
      }
      closeSheet(); toast(self ? 'Password diubah' : `Password sementara ${u.name} disimpan. ${u.name} wajib menggantinya saat masuk.`);
      if (self) { S.view = homeView(); render(); }
      return;
    }
    if (kind === 'cat-new' || kind === 'cat-edit') {
      const name = String(fd.get('name') || '').trim(), c = cfg(), errSel = kind === 'cat-new' ? '#cn-err' : '#cf-err', oldName = f.dataset.v;
      if (!name) return fail(errSel, 'Isi nama kategori.');
      if (allCats().some(x => x.toLowerCase() === name.toLowerCase() && x !== oldName)) return fail(errSel, 'Kategori ini sudah ada.');
      btn.disabled = true;
      if (kind === 'cat-new') await Store.saveSettings({...(S.settings || {}), categories: [...c.categories, name]});
      else {
        await Store.saveSettings({...(S.settings || {}), categories: c.categories.map(x => x === oldName ? name : x).concat(c.categories.includes(oldName) ? [] : [name])});
        for (const p of Object.values(S.products)) if (p.cat === oldName) await Store.saveProduct({...p, cat: name});
        closeSheet();
      }
      if (S.catFilter === oldName) S.catFilter = 'Semua';
      render(); toast(kind === 'cat-new' ? 'Kategori ditambahkan' : 'Kategori diubah');
      return;
    }
    if (kind === 'prod') {
      const name = String(fd.get('name') || '').trim(); let cat = fd.get('cat');
      const price = digits(fd.get('pf-price')), cost = digits(fd.get('pf-cost')), unit = UNITS[fd.get('unit')] ? fd.get('unit') : 'porsi';
      if (!name) return fail('#pf-err', 'Isi nama produk.');
      if (cat === '__new') { cat = String(fd.get('newcat') || '').trim(); if (!cat) return fail('#pf-err', 'Isi nama kategori baru.'); }
      if (!price) return fail('#pf-err', 'Isi harga jual lebih dari Rp0.');
      const costSource = fd.get('costSource') === 'hpp' ? 'hpp' : 'manual', hppMenu = String(fd.get('hppMenu') || ''), hppBasis = fd.get('hppBasis') === 'total' ? 'total' : 'bahan';
      if (costSource === 'hpp' && hppCostFor(hppMenu, hppBasis) == null) return fail('#pf-err', 'Pilih menu di Kalkulator HPP, atau ubah ke “Isi manual”.');
      const costFinal = costSource === 'hpp' ? hppCostFor(hppMenu, hppBasis) : cost;
      const id = f.dataset.id || uid('p'), old = S.products[id] || {};
      btn.disabled = true;
      const c = cfg();
      if (!c.categories.includes(cat)) await Store.saveSettings({...(S.settings || c), categories: [...c.categories, cat]});
      await Store.saveProduct({...old, id, name, desc: String(fd.get('desc') || '').trim().slice(0, 140), cat, unit, price, cost: costFinal, costSource, hppMenu: costSource === 'hpp' ? hppMenu : '', hppBasis, photo: String(fd.get('photo') || ''), active: fd.get('active') === 'on', trackStock: fd.get('trackStock') === 'on', trackFrom: fd.get('trackStock') === 'on' ? (old.trackStock ? old.trackFrom : Date.now()) : 0, order: old.order ?? Object.keys(S.products).length});
      if (costSource === 'hpp') { const m = HP().menus.find(x => x.id === hppMenu); if (m && m.pid !== id) { m.pid = id; hppChanged(); } }
      closeSheet(); toast(f.dataset.id ? 'Produk diperbarui' : 'Produk ditambahkan');
    } else if (kind === 'stock') {
      const p = S.products[f.dataset.id]; if (!p) return;
      const raw = String(fd.get('qty') || '').trim(), n = parseQty(raw), dec = UNITS[unitOf(p)].dec;
      if (!raw || n < 0 || (f.dataset.mode !== 'fix' && n <= 0)) return fail('#st-err', 'Isi jumlah yang benar.');
      if (!dec && n !== Math.round(n)) return fail('#st-err', 'Satuan ' + unitOf(p) + ' harus bilangan bulat.');
      const qty = f.dataset.mode === 'fix' ? r3(n - stockOf(p.id)) : n;
      btn.disabled = true;
      const note = String(fd.get('note') || '').trim(), mv = {id: uid('s'), at: Date.now(), pid: p.id, pname: p.name, type: f.dataset.mode === 'fix' ? 'koreksi' : 'masuk', qty, note};
      if (f.dataset.mode !== 'fix') {
        const sid = String(fd.get('sid') || ''), sp = S.suppliers[sid];
        mv.price = digits(fd.get('st-price')); mv.exp = String(fd.get('exp') || ''); if (sp) { mv.sid = sid; mv.sname = sp.name; }
        if (fd.get('kas') === 'on' && mv.price) {
          mv.kasId = uid('k');
          await Store.addKas({id: mv.kasId, at: mv.at, date: dayKey(mv.at), type: 'pembelian', cat: '', amount: lineAmt(mv.price, qty), note: `Beli ${qu(qty, unitOf(p))} ${p.name}${sp ? ' dari ' + sp.name : ''}`});
        }
      }
      if (qty !== 0) await Store.addStock(mv);
      const min = fd.get('min') != null ? parseQty(fd.get('min')) : p.minStock;
      if (!p.trackStock || min !== p.minStock) await Store.saveProduct({...p, trackStock: true, trackFrom: p.trackStock ? p.trackFrom : Date.now() - 1000, minStock: min || 0});
      closeSheet(); toast(f.dataset.mode === 'fix' ? (qty ? 'Stok dikoreksi' : 'Stok sudah sesuai') : 'Stok masuk dicatat');
    } else if (kind === 'hist-del') {
      const d = S.histDel || {}, a = d.from <= d.to ? d.from : d.to, b = d.from <= d.to ? d.to : d.from;
      const byDay = {}; for (const t of allTx()) if (t.day >= a && t.day <= b) (byDay[t.day] = byDay[t.day] || []).push(t.id);
      if (!Object.keys(byDay).length) return fail('#hd-err', 'Tidak ada transaksi pada rentang ini.');
      if (String(fd.get('confirm') || '').trim().toUpperCase() !== 'HAPUS') return fail('#hd-err', 'Ketik HAPUS untuk mengonfirmasi.');
      btn.disabled = true; btn.textContent = 'Menghapus…';
      let n = 0; for (const [day, ids] of Object.entries(byDay)) { await Store.delTx(day, ids); n += ids.length; }
      S.histDel = null; closeSheet(); render(); toast(`${n} transaksi dihapus dari riwayat`);
    } else if (kind === 'clear-tx') {
      const opt = {sales: fd.get('sales') === 'on', kas: fd.get('kas') === 'on', stock: fd.get('stock') === 'on', orders: fd.get('orders') === 'on'};
      if (!opt.sales && !opt.kas && !opt.stock && !opt.orders) return fail('#ct-err', 'Pilih minimal satu jenis data.');
      if (String(fd.get('confirm') || '').trim().toUpperCase() !== 'HAPUS') return fail('#ct-err', 'Ketik HAPUS untuk mengonfirmasi.');
      btn.disabled = true; btn.textContent = 'Menghapus…';
      await Store.clearTx(opt);
      S.cart = {}; S.cash = 0; S.meta = newMeta();
      closeSheet(); render(); toast('Data transaksi dihapus');
    } else if (kind === 'hb') {
      const name = String(fd.get('name') || '').trim(), qty = parseQty(fd.get('qty')), unit = HU[fd.get('unit')] ? fd.get('unit') : 'kg', price = digits(fd.get('hb-price'));
      if (!name) return fail('#hb-err', 'Isi nama bahan.');
      if (!(qty > 0) || !price) return fail('#hb-err', 'Isi jumlah beli dan harga beli.');
      const h = HP(), id = f.dataset.id || uid('b'), b = {id, name, qty, unit, price, pids: fd.getAll('pids').map(String).filter(x => S.products[x]), oids: fd.getAll('oids').map(String).filter(x => HP().olahan.some(o => o.id === x))}, i = h.bahan.findIndex(x => x.id === id);
      if (i >= 0 && bBase(h.bahan[i]) !== bBase(b) && usedIn('b:' + id).length) return fail('#hb-err', `Satuan dasar tidak boleh berubah dari ${bBase(h.bahan[i])} ke ${bBase(b)} karena takaran resep memakai ${bBase(h.bahan[i])}.`);
      if (i >= 0) h.bahan[i] = b; else h.bahan.push(b);
      closeSheet(); hppChanged(true); toast('Bahan baku disimpan');
    } else if (kind === 'supplier') {
      const name = String(fd.get('name') || '').trim(); if (!name) return fail('#sp-err', 'Isi nama supplier.');
      btn.disabled = true;
      const id = f.dataset.id || uid('sp'), old = S.suppliers[id] || {at: Date.now()};
      await Store.saveSupplier({...old, id, name, phone: String(fd.get('phone') || '').trim(), items: String(fd.get('items') || '').trim(), address: String(fd.get('address') || '').trim(), note: String(fd.get('note') || '').trim()});
      closeSheet(); toast(f.dataset.id ? 'Supplier diperbarui' : 'Supplier ditambahkan');
    } else if (kind === 'eval') {
      btn.disabled = true;
      const x = {id: uid('ev'), sid: f.dataset.id, at: Date.now(), note: String(fd.get('note') || '').trim()};
      for (const k in CRIT) x[k] = Math.min(5, Math.max(1, +fd.get(k) || 3));
      await Store.addEval(x);
      closeSheet(); toast('Evaluasi disimpan');
    } else if (kind === 'settings') {
      btn.disabled = true;
      const c = cfg();
      await Store.saveSettings({...(S.settings || {}), categories: c.categories, shopName: String(fd.get('shopName') || '').trim() || c.shopName, ownerName: String(fd.get('ownerName') || '').trim(),
        openingDate: fd.get('openingDate') || c.openingDate, openingCash: digits(fd.get('sf-cash')), openingInventory: digits(fd.get('sf-inv')), equipment: digits(fd.get('sf-eq'))});
      closeSheet(); toast('Saldo awal disimpan');
    } else if (kind === 'kas') {
      const type = fd.get('type'), amount = digits(fd.get('kf-amount')), date = fd.get('date') || dayKey(Date.now());
      if (!amount) return fail('#kf-err', 'Isi jumlah uang lebih dari Rp0.');
      const d = parseKey(date), now = new Date();
      if (date === dayKey(now)) d.setHours(now.getHours(), now.getMinutes(), now.getSeconds()); else d.setHours(12, 0, 0);
      btn.disabled = true;
      await Store.addKas({id: uid('k'), at: d.getTime(), date, type, cat: type === 'beban' ? fd.get('cat') : '', amount, note: String(fd.get('note') || '').trim()});
      closeSheet(); toast('Catatan kas disimpan');
    }
  } catch (err) { if (btn) btn.disabled = false; toast('Gagal menyimpan: ' + errMsg(err)); }
});

async function exportCsv() {
  const R = periodRange(), tx = allTx().filter(t => !t.void && t.at >= R.start && t.at <= R.end);
  const q = s => '"' + String(s).replace(/"/g, '""') + '"';
  const rows = [['Tanggal', 'Jam', 'No', 'Pelanggan', 'Jenis', 'Metode bayar', 'Diskon transaksi', 'Produk', 'Kategori', 'Harga', 'Qty', 'Satuan', 'Jumlah', 'Modal per satuan', 'HPP', 'Laba kotor'].map(q).join(',')];
  for (const t of tx) for (const it of t.items) rows.push([dayKey(t.at), fmtT(t.at), pad3(t.no || 0), t.customer || '', t.orderType === 'take' ? 'Bungkus' : 'Makan di tempat', METHODS[methodOf(t)], it === t.items[0] && t.discount ? t.discount.amount : 0, it.name, it.cat, it.price, String(it.qty).replace('.', ','), itUnit(it), lineAmt(it.price, it.qty), it.cost, lineAmt(it.cost, it.qty), lineAmt(it.price, it.qty) - lineAmt(it.cost, it.qty)].map(q).join(','));
  const csv = '﻿' + rows.join('\r\n'), name = `penjualan-kantin-uis_${dayKey(R.start)}_${dayKey(R.end)}.csv`;
  let dl = null;
  try { dl = window.claude && window.claude.use ? await window.claude.use('downloads') : null; } catch (e) {}
  if (dl) {
    try { await dl.save({filename: name, data: csv}); toast('File CSV disimpan'); return; }
    catch (e) { if (e && e.code === 'declined') return; }
  }
  openSheet(() => `<h3>Data CSV</h3><p class="muted" style="margin-top:-4px">Unduhan tidak tersedia di tampilan ini. Salin teks berikut lalu tempel ke Excel atau Google Sheets.</p>
    <textarea id="csv-text" rows="10" readonly style="font-family:ui-monospace,Consolas,monospace;font-size:12px">${esc(csv.slice(1))}</textarea>
    <div class="two" style="margin-top:12px"><button class="btn ghost" data-act="close-sheet">Tutup</button><button class="btn primary" id="csv-copy">Salin</button></div>`);
  $('#csv-copy').onclick = () => { const ta = $('#csv-text'); navigator.clipboard.writeText(ta.value).then(() => toast('Tersalin'), () => { ta.focus(); ta.select(); }); };
}

/* ---------- render ---------- */
const VIEWS = {gantipw: vGantiPw, pilih: vPilih, beli: vBeliPage, kasir: vKasir, pesan: vKasir, pesananku: vPesananku, master: vMaster, riwayat: vRiwayat, laporan: vLaporan, hpp: vHpp, stok: vStok, kas: vKas, produk: vProduk};
function render() { renderMain(); try { soundWatch(); } catch (e) {} }
function renderMain() {
  const u = me();
  document.body.dataset.auth = u ? 'in' : 'out';
  if (!u) {
    const mode = authMode(), box = $('#auth');
    if (S.authShown !== mode) { S.authShown = mode; box.innerHTML = vAuth(mode); }
    box.hidden = false; return;
  }
  $('#auth').hidden = true; S.authShown = null;
  if (S.guestTable && !S.guestKid && activeKantins().length === 1) S.guestKid = activeKantins()[0].id;
  const wantKid = S.guestTable ? S.guestKid : staffKid();
  if (wantKid && Store.db && S.kid !== wantKid) Store.bindTenant(wantKid);
  if (S.guestTable && Store.db && kantinsList().some(k => !(Store.gsubs || {})[k.id])) queueMicrotask(() => Store.watchGuest());
  if (S.guestTable && !S.guestKid && S.view !== 'pesananku') S.view = 'pilih';
  const mustPw = !isCust() && !!u.mustChange;
  if (mustPw) S.view = 'gantipw'; else if (S.view === 'gantipw') S.view = homeView();
  if (!mustPw && (!VIEWS[S.view] || !canView(S.view))) S.view = homeView();
  if (!S.alertShown && !isCust() && S.mode !== 'loading' && !isLoading()) { S.alertShown = true; const pr = pendingRegs().length; if (pr) setTimeout(() => toast(`${pr} pendaftaran pemilik usaha menunggu persetujuan`, {label: 'Tinjau', fn: () => ACT['reg-open']()}), 600); const n = stockAlertCount(); if (n && !pr) setTimeout(() => toast(`${n} notifikasi stok/kedaluwarsa perlu dicek`, {label: 'Lihat', fn: () => openSheet(notifSheet, true)}), 1200); }
  const kv = S.view === 'kasir' || S.view === 'pesan';
  document.body.dataset.view = kv ? 'kasir' : S.view;
  $('#side').innerHTML = vSide();
  $('#top').innerHTML = vHeader();
  $('#banner').innerHTML = vBanner();
  const hasProducts = activeProducts().length > 0;
  // The kasir screen keeps its search box and customer field; only the changing parts are redrawn.
  if (kv && $('#menus') && !isLoading() && hasProducts && S.kvRole === role()) {
    const wrap = $('#obody .olines-wrap'), top = wrap ? wrap.scrollTop : 0;
    $('#kb').innerHTML = vBanner();
    $('#greet').innerHTML = vGreet();
    $('#kicons').innerHTML = vKicons();
    $('#hero').innerHTML = vHero();
    $('#chips').innerHTML = vChips();
    $('#menus').innerHTML = vMenus();
    $('#filterbtn').innerHTML = ICONS.filter + (S.sort !== 'default' ? '<i></i>' : '');
    $('#ocount').textContent = '(' + cartCount() + ')';
    $('#obody').innerHTML = orderBody(false);
    const w2 = $('#obody .olines-wrap'); if (w2) w2.scrollTop = top;
  } else {
    $('#view').innerHTML = VIEWS[S.view]();
    S.kvRole = role();
  }
  $('#nav').innerHTML = vNav();
  const cb = $('#cartbar');
  cb.hidden = !kv || !hasProducts;
  if (!cb.hidden) cb.innerHTML = vCartBar();
  if (S.sheet && S.sheet.live) {
    const sb = $('#sheet-body'), focusId = document.activeElement && sb.contains(document.activeElement) ? document.activeElement.id : null;
    sb.innerHTML = S.sheet.render();
    if (focusId === 'cust-s' || focusId === 'cash-s') { const i = $('#' + focusId); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }
  }
  if (!$('#drawer').hidden) $('#drawer-body').innerHTML = vSide();
}
render();
Store.init();
/*PWA*/ if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) { try { navigator.serviceWorker.register('sw.js').catch(() => {}); } catch (e) {} window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); S.installEvt = e; render(); }); window.addEventListener('appinstalled', () => { S.installEvt = null; render(); toast('Oneklik Biz terpasang. Buka dari layar utama perangkat.'); }); }
