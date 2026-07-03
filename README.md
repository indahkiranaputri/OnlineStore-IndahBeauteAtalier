# 🛍️ INDAH'S BEAUTÉ ATELIER

### 👤 IDENTITAS MAHASISWA
* **Nama:** Indah Kirana Putri
* **NIM:** 209250134
* **Mata Kuliah:** Komputer Aplikasi IT-II (KAIT II)
* **Program Studi:** Administrasi Bisnis (ABI 6)
* **Semester:** Genap 2025/2026

---

## 🔗 LINK AKSES UTAMA

* **Link Live Website (Customer):** Untuk mengakses halaman utama toko, silakan [klik disini](https://indahkiranaputri.github.io/OnlineStore-IndahBeauteAtalier/index.html)
* **Link Halaman Admin:** Untuk masuk ke sistem manajemen toko (admin login), silakan [klik disini](https://indahkiranaputri.github.io/OnlineStore-IndahBeauteAtalier/admin_login.html)
* **Link Repository GitHub:** Untuk melihat baris kode proyek ini, silakan [klik disini](https://github.com/indahkiranaputri/OnlineStore-IndahBeauteAtalier)

---

## 📝 DESKRIPSI & STRATEGI BISNIS MODERN

### 1. Judul Proyek
“Membangun Website E-Commerce Fungsional dengan Integrasi Strategi Bisnis Modern”

### 2. Business Overview
* **Nama & Deskripsi Bisnis:** **Indah's Beauté Atelier** adalah platform e-commerce produk kosmetik, skincare, haircare, bodycare, perfume lokal yang bermutu tinggi, aman, dan teruji.
* **Value Proposition:** Menyediakan produk kecantikan premium *cruelty-free* dengan transparansi harga dan pengalaman belanja yang personal.
* **Target Market:** Perempuan usia 18–35 tahun (mahasiswi & pekerja) yang peduli pada kesehatan kulit jangka panjang.
* **Analisis Pasar & Kompetitor:** Mengambil ceruk pasar (*niche*) dengan mengandalkan tampilan visual web yang minimalis, personal, estetis, dan ramah pengguna dibanding platform kosmetik massal yang terlalu ramai.
* **Model Bisnis & Revenue Stream:** B2C (Business-to-Consumer) Online Retailer dengan sumber pendapatan utama dari penjualan langsung ke konsumen akhir.
* **Strategi Harga & Promosi:** Penerapan *value-based pricing*, sistem kupon diskon *event*, serta paket *bundling* produk untuk meningkatkan nilai transaksi.
* **Proses Checkout & Payment:** Simulasi alur pengisian form pengiriman hingga proses pembayaran menggunakan sistem dummy terintegrasi (seperti Midtrans/Xendit/PayPal).
* **Rencana SEO & Analytics:** Optimasi metadata tag untuk performa mesin pencari Google, serta pemantauan metrik *Conversion Rate*, *Bounce Rate*, dan *Cart Abandonment Rate*.

---

## 🛠️ FITUR TEKNIS & DOKUMENTASI

### 1. Fitur Utama Website (Pure Vanilla HTML, CSS, JS)
* **Responsive Design:** Tampilan fleksibel (CSS Flexbox/Grid) yang optimal saat diakses lewat Desktop, Tablet, maupun HP (Mobile).
* **Struktur Halaman Lengkap:** Navbar, Hero Banner, Katalog Produk (8–10 produk), Modal Detail Produk, Keranjang Belanja otomatis dengan perhitungan total, Form Checkout, serta Footer.
* **Fitur Interaktif:** Fungsi pencarian (Search) & filter produk, manajemen penyimpanan keranjang menggunakan `localStorage`, serta animasi mikro yang halus.
* **Integrasi Analytics:** Menyertakan script pelacakan Google Analytics (dummy) untuk kebutuhan analisis data bisnis.

### 2. Struktur Folder Proyek
```text
IndahBeauteAtalier-OnlineStore/
│
├── index.html                  # Halaman Utama (Customer Store)
├── checkout.html               # Halaman Form Pembayaran
├── admin_login.html            # Halaman Login Admin
├── admin_dashboard.html        # Panel Monitoring Admin
├── admin_tambah_produk.html    # Form Input Produk Baru
│
├── css/
│   └── style.css               # Desain Responsif (Flexbox/Grid)
│
├── js/
│   ├── main.js                 # Logika Keranjang Belanja & Search
│   └── admin_script.js         # Pengelolaan Database Local Storage Admin
│
└── image/                      # Aset Foto & Visual Produk
    ├── ampoule baru.jpeg
    ├── blushon.jpg.jpeg
    ├── body wash.jpg.jpeg
    └── claymask baru.jpeg
