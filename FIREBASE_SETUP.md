# 🔥 FIREBASE SETUP GUIDE — Indah's Beauté Atelier

## 📋 Overview
Proyek ini sudah siap menggunakan **Firebase Firestore** sebagai database terpusat (Single Source of Truth). Semua produk, keranjang, dan pesanan akan tersimpan di Firebase dan sinkron secara real-time di semua device.

---

## 🚀 LANGKAH-LANGKAH SETUP

### 1️⃣ BUAT PROJECT FIREBASE
1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Klik **"Add Project"**
3. Masukkan nama project (contoh: `indahs-beaute-atelier`)
4. Jangan centang "Enable Google Analytics" (opsional)
5. Klik **"Create Project"** dan tunggu selesai

### 2️⃣ SETUP AUTHENTICATION
1. Di Firebase Console, pilih project Anda
2. Buka menu **"Authentication"** (sebelah kiri)
3. Klik tab **"Sign-in method"**
4. Klik **"Email/Password"**
5. Enable **"Email/Password"** dan **"Anonymous"** (untuk testing)
6. Klik **"Save"**

### 3️⃣ SETUP FIRESTORE DATABASE
1. Buka menu **"Firestore Database"** (sebelah kiri)
2. Klik **"Create Database"**
3. Pilih region: **`asia-southeast1`** (Jakarta, terdekat Indonesia)
4. Pilih mode: **"Start in production mode"**
5. Klik **"Create"** dan tunggu

### 4️⃣ KONFIGURASI FIRESTORE RULES
Setelah Firestore dibuat, buka tab **"Rules"** dan replace dengan:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Products (read-only untuk semua, write hanya admin di frontend)
    match /products/{productId} {
      allow read: if true;
      allow write: if false;  // Admin hanya bisa edit via dashboard frontend logic
    }

    // Carts (hanya pemilik yang bisa akses)
    match /carts/{uid} {
      allow read, write: if request.auth.uid == uid;
    }

    // Orders (hanya pemilik + admin yang bisa akses)
    match /orders/{orderId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    // Reviews (siapa saja bisa baca, auth user bisa tulis)
    match /products/{productId}/reviews/{reviewId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.uid;
    }
  }
}
```

Klik **"Publish"**.

### 5️⃣ DAPATKAN FIREBASE CONFIG
1. Di Firebase Console, klik ikon **⚙️ Settings** (atas)
2. Pilih **"Project settings"**
3. Scroll ke bawah, cari **"Your apps"**
4. Klik ikon **`</>`** (Web)
5. Copy seluruh object `firebaseConfig` yang terlihat

### 6️⃣ UPDATE FILE `firebase-config.js`
1. Buka file [firebase-config.js](./firebase-config.js) di project Anda
2. Ganti `ISI_API_KEY_DI_SINI` dan field lainnya dengan nilai yang Anda copy dari Firebase
3. Contoh:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyD6...xxxx",
  authDomain: "indahs-beaute-atelier.firebaseapp.com",
  projectId: "indahs-beaute-atelier",
  storageBucket: "indahs-beaute-atelier.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

---

## ✅ TEST SETUP

### 1. Buka website di browser
```
http://localhost:8000/index.html
```
(atau buka langsung file `.html` di browser)

### 2. Produk otomatis masuk ke Firestore
Saat pertama kali halaman dimuat, sistem akan:
- ✅ Mengecek apakah Firestore sudah ada data produk
- ✅ Jika kosong, otomatis seed data dummy dari `default_products.js`
- ✅ Jika sudah ada, gunakan data dari Firestore (tidak seed ulang)

Cek di Firebase Console → Firestore Database → `products` collection

### 3. Test login & cart (single device)
1. Buka [login.html](./login.html)
2. Daftar akun baru (email/password)
3. Tambah produk ke keranjang
4. Lihat keranjang di Firestore → `carts/{uid}`

### 4. Test sinkronisasi (2 device / tab browser)
1. **Tab 1**: Buka index.html, login dengan akun A, tambah produk X ke keranjang
2. **Tab 2**: Buka index.html di tab/browser berbeda, login dengan akun A yang sama
3. **Hasilnya**: Keranjang di Tab 2 langsung update (tanpa refresh) ✓

---

## 🎯 DATA STRUCTURE DI FIRESTORE

### Collection: `products`
```javascript
{
  id: 1,
  nama_produk: "Luminous Silk Velvet Liptint",
  kategori: "makeup",
  harga: 490000,
  foto_produk: "./image/liptint.jpg.jpeg",
  deskripsi: "...",
  stok: 42,
  emoji: "💄",
  hot: true,
  createdAt: "2024-01-01T10:00:00Z",
  updatedAt: "2024-01-01T10:00:00Z"
  
  // Sub-collection: reviews
  reviews/{reviewId} {
    uid: "user123",
    nama_user: "Amanda",
    teks_review: "Sangat bagus!",
    rating: 5,
    createdAt: "2024-01-02T15:30:00Z"
  }
}
```

### Collection: `carts`
```javascript
{
  uid: "user123",
  items: [
    {
      productId: "1",
      nama_produk: "Luminous Silk Velvet Liptint",
      harga: 490000,
      qty: 2,
      addedAt: "2024-01-03T12:00:00Z"
    }
  ],
  updatedAt: "2024-01-03T12:05:00Z"
}
```

### Collection: `orders`
```javascript
{
  uid: "user123",
  orderNum: "ORD-1704286800000",
  customerName: "Amanda Putri",
  customerPhone: "081234567890",
  customerAddress: "Jl. Merdeka No. 123, Jakarta",
  items: [
    {
      productId: "1",
      nama_produk: "Luminous Silk Velvet Liptint",
      harga: 490000,
      qty: 2
    }
  ],
  total: 980000,
  status: "pending",
  paymentMethod: "qris",
  createdAt: "2024-01-03T15:00:00Z",
  updatedAt: "2024-01-03T15:00:00Z"
}
```

---

## 🔐 ADMIN DASHBOARD

### Login Admin
- **Password**: `admin123` (ubah di `firebase-config.js` nanti)
- Akses: [admin_login.html](./admin_login.html)

### Fitur Admin
- ✅ Lihat semua produk
- ✅ Tambah/Edit/Hapus produk
- ✅ Manage stok
- ✅ Lihat semua pesanan
- ✅ Update status pesanan
- ✅ Lihat statistik (total produk, pesanan, revenue)

---

## 🌐 DEPLOYMENT KE GITHUB PAGES

### 1. Upload ke GitHub
```bash
git init
git add .
git commit -m "Initial commit - Firebase Firestore integration"
git remote add origin https://github.com/your-username/indahs-beaute-atelier.git
git push -u origin main
```

### 2. Enable GitHub Pages
1. Buka GitHub repo settings
2. Scroll ke **"Pages"**
3. Source: **"Deploy from a branch"**
4. Branch: **"main"** + **"/ (root)"**
5. Klik **"Save"**

### 3. Firebase Console: Tambahkan Domain Authorized
1. Firebase Console → Authentication → Settings
2. Scroll ke **"Authorized domains"**
3. Tambahkan domain GitHub Pages: `your-username.github.io`

**Selesai!** Website Anda sekarang bisa diakses di:
```
https://your-username.github.io/
```

---

## ⚠️ CATATAN PENTING

### Data Dummy
- Data dummy akan otomatis di-seed ke Firestore saat pertama kali
- Jika ingin reset, **delete koleksi `products` di Firebase Console** → akan di-seed ulang saat page reload

### Foto Produk
- Sistem menggunakan **path lokal** (`./image/...`) sebagai fallback
- Jika ingin upload foto ke Firebase Storage (premium), update `firebase-service.js`
- Untuk GitHub Pages, gunakan path relatif agar foto tetap accessible

### Offline Mode
- Firestore SDK sudah punya **offline persistence**
- Data akan tersimpan di cache lokal saat offline
- Saat online lagi, otomatis sinkron dengan server

### Security
- Admin password saat ini hardcoded: `admin123`
- **JANGAN COMMIT `firebase-config.js` ke repository publik!** (expose API key)
- Gunakan `.gitignore`:
  ```
  firebase-config.js
  ```

---

## 🆘 TROUBLESHOOTING

### "Firebase not initialized"
→ Pastikan `firebase-config.js` sudah dikonfigurasi dengan config yang benar

### Produk tidak muncul
→ Cek di Firebase Console → Firestore → apakah collection `products` ada?
→ Jika tidak, reload halaman (system akan seed otomatis)

### Keranjang tidak sinkron antar device
→ Pastikan sudah login dengan akun yang sama di kedua device
→ Cek di Firebase → Firestore → `carts` → apakah ada sub-document dengan UID yang sama?

### Admin tidak bisa login
→ Cek di `admin_script.js` → `ADMIN_PASSWORD` harus match dengan password yang diinput

---

## 📚 REFERENSI

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Realtime Updates](https://firebase.google.com/docs/firestore/query-data/listen)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/start)
- [GitHub Pages Setup](https://pages.github.com/)

---

**Selamat! Setup Firebase Anda sudah siap. Nikmati Single Source of Truth! 🎉**
