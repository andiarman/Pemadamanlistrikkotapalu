# ⚡ Peta Jadwal Pemadaman Listrik Palu

<p align="center">
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/Lisensi-MIT-blue.svg?style=for-the-badge" alt="Lisensi MIT" />
  </a>
  <a href="https://andiarman.github.io/Pemadamanlistrikkotapalu/">
    <img src="https://img.shields.io/badge/🌐_BUKA_PETA_PEMADAMAN-KLIK_DI_SINI-e11d48?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Buka Website Peta" />
  </a>
  <a href="https://andiarman.github.io/Pemadamanlistrikkotapalu/">
    <img src="https://img.shields.io/badge/Status-Live_GitHub_Pages-22c55e?style=for-the-badge&logo=githubpages&logoColor=white" alt="Status GitHub Pages" />
  </a>
  <a href="https://www.threads.net/@andiarman___">
    <img src="https://img.shields.io/badge/Threads-@andiarman___-000000?style=for-the-badge&logo=threads&logoColor=white" alt="Threads Profile" />
  </a>
  <a href="https://andiarman.github.io/Pemadamanlistrikkotapalu/">
    <img src="https://img.shields.io/badge/Waktu-WITA_(UTC%2B8)-facc15?style=for-the-badge&logo=clock&logoColor=black" alt="Zona Waktu WITA" />
  </a>
</p>

<p align="center">
  <b>Aplikasi peta interaktif jadwal pemadaman listrik di Sulawesi Tengah (Kota Palu dan sekitarnya).</b><br>
  Memetakan ribuan titik jalan dan fasilitas umum terdampak pemadaman berdasarkan flyer resmi PLN secara real-time.
</p>

---

## 🎯 Tombol Cepat & Tautan Utama

| Tombol Navigasi | Deskripsi |
| :--- | :--- |
| 👉 [**Buka Website Peta Langsung**](https://andiarman.github.io/Pemadamanlistrikkotapalu/) | Akses visual peta real-time, filter sesi, dan hitung mundur status |
| 📁 [**Lihat Data Jadwal Hari Ini**](./data/) | File JSON jadwal resmi harian (`data/YYYY-MM-DD.json`) |
| 💬 [**Hubungi via Threads**](https://www.threads.net/@andiarman___) | Saran, masukan, dan pembaruan seputar peta |

---

## 📍 Panduan Kategori & Simbol Peta

Status setiap titik lokasi dihitung otomatis menurut waktu lokal **WITA** dan dibedakan dengan bentuk visual serta warna kontras tinggi:

| Simbol | Kategori Status | Arti & Ciri Khas Visual |
| :---: | :--- | :--- |
| 🛑 | **Sedang Padam** | **Oktagon merah** dengan tanda **✕** (disertai efek denyut cahaya pada desktop). |
| ⚠️ | **Akan Padam** | **Segitiga kuning** dengan ikon **jam 🕒** + **Badge Jam Mulai (misal: 13.00)** di sisi kanan sesuai waktu jadwal pemadaman. |
| ✅ | **Sudah Menyala** | **Lingkaran hijau** dengan tanda **✓** (tampil semi-transparan agar titik yang masih padam lebih menonjol). |

> [!NOTE]
> Titik pada peta merupakan representasi lokasi hasil geocoding nama jalan/tempat dari OpenStreetMap, bukan jaringan kabel fisik PLN. Garis area putus-putus merupakan perkiraan kluster terdekat.

---

## ✨ Fitur Interaktif

<details open>
<summary><b>🔍 1. Filter Instan Multi-Dimensi (Status & Sesi)</b></summary>
<br>

- **Filter Status**: Klik tombol **Semua**, **Padam**, **Akan Padam**, atau **Menyala** di panel legenda untuk menyaring tampilan seketika tanpa memuat ulang peta.
- **Filter Sesi (I – X)**: Jika jadwal memiliki lebih dari 1 sesi, panel filter sesi otomatis muncul (misal: Sesi I `09.00`, Sesi II `13.00`, dst.). Anda dapat mengisolasi satu sesi atau menggabungkannya dengan filter status.
- **Performa 0ms**: Filter dijalankan melalui atribut dataset CSS murni, sehingga pergantian tampilan ratusan titik berlangsung instan bahkan di perangkat ponsel hemat daya.
</details>

<details open>
<summary><b>⏱️ 2. Tooltip & Hitung Mundur Real-Time</b></summary>
<br>

- **Hover / Sentuh Titik**: Menampilkan kartu ringkas berisi nama jalan dan sisa waktu menuju padam/menyala.
- **Klik Marker**: Membuka popup lengkap yang memuat nama ULP, rentang jam WITA, alamat spesifik, serta status hitung mundur detik demi detik.
</details>

<details>
<summary><b>📱 3. Antarmuka Responsif (Desktop & Mobile)</b></summary>
<br>

- **Layar Ponsel**: Header dan panel filter tersusun sebagai kartu mengambang ramping. Efek bayangan berat dan animasi denyut dimatikan otomatis pada layar sentuh demi kehalusan *pan* dan *zoom*.
- **Layar Desktop**: Panel kontrol 4 kolom yang lapang, tombol akses log aktivitas, dan dialog impor AI.
</details>

<details>
<summary><b>🤖 4. Alur Impor Flyer dengan AI</b></summary>
<br>

1. Tekan tombol **+ Impor hasil AI** pada header peta (mode desktop).
2. Salin *prompt* sistem yang disediakan, lalu unggah foto flyer pemadaman PLN ke Gemini atau AI pilihan Anda.
3. Tempel hasil JSON ke kotak dialog impor.
4. Sistem memvalidasi skema data (`schema_version: 1`), lalu mengirimkannya ke Cloudflare Worker untuk disimpan ke GitHub repo (`data/YYYY-MM-DD.json`).
5. Geocoder melakukan pencocokan bertingkat:
   - **Indeks Lokal OpenStreetMap**: Normalisasi nama jalan, singkatan (`Tg.`, `Jl.`, `M.`, `GN`), dan variasi ejaan secara offline.
   - **Nominatim Terbatas**: Pencarian cadangan berjarak untuk nama yang belum terindeks.
</details>

---

## 🛠️ Pengembangan & Deployment

<details>
<summary><b>💻 Menjalankan Secara Lokal</b></summary>
<br>

Repositori ini adalah situs statis GitHub Pages murni (tanpa build step):

```powershell
# Cukup buka index.html di browser atau gunakan server statis lokal
npx serve .
```

Leaflet dan dependensi telah dibundel secara lokal di `vendor/leaflet/`.

Untuk repositori backend Worker (`outage-map-app`):
```powershell
npm install
npm run typecheck
npm run dev
```
</details>

<details>
<summary><b>🚀 Otomatisasi GitHub Actions</b></summary>
<br>

Setiap `git push` ke cabang `main` akan memicu workflow [.github/workflows/deploy.yml](.github/workflows/deploy.yml) yang secara otomatis memublikasikan versi terbaru ke GitHub Pages.
</details>

---

<p align="center">
  <a href="https://andiarman.github.io/Pemadamanlistrikkotapalu/">
    <img src="https://img.shields.io/badge/⚡_Buka_Peta_Sekarang-Klik_Tautan_Ini-0284c7?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Buka Peta Sekarang" />
  </a>
</p>
<p align="center">
  Dikelola oleh <a href="https://github.com/andiarman"><b>@andiarman</b></a> · Lisensi <a href="LICENSE">MIT</a> · Menggunakan data terbuka <a href="https://www.openstreetmap.org">OpenStreetMap</a>
</p>
