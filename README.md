# Peta Jadwal Pemadaman Sulawesi Tengah — versi GitHub Pages

Situs statis (HTML + Leaflet) untuk peta jadwal pemadaman listrik PLN Sulawesi Tengah. Seluruh antarmuka — impor JSON hasil AI, validasi, geocoding, dan peta — berjalan di browser.

**Repo ini sekaligus menjadi database bersama.** Jadwal yang diimpor tersimpan sebagai file `data/YYYY-MM-DD.json` (tanggal jadwal, zona WITA), sehingga satu kali impor per hari tampil untuk semua pengunjung. Keesokan harinya peta otomatis reset: file tanggal baru belum ada berarti peta kosong, dan arsip yang lebih tua dari kemarin dihapus otomatis saat impor berikutnya. Pemadaman yang berlanjut lewat tengah malam tetap tampil karena file kemarin hanya dimuat untuk event yang belum selesai.

## Alur data

1. Siapa pun membuka situs, menekan **Impor hasil AI**, dan menempel JSON hasil verifikasi AI — **tanpa akun atau token**.
2. Browser mengirim jadwal tervalidasi ke Worker Cloudflare (`outage-map-app`) di `https://outage-map-app.vaultman.workers.dev/api/schedule`. Worker memegang token GitHub sebagai *secret* dan menulis `data/{tanggal}.json` ke repo ini → workflow menerbitkan ulang situs (± 1 menit).
3. Titik jalan dicari satu per satu lewat Nominatim (jeda 1,2 detik, hasil di-cache); setiap titik yang ditemukan langsung tampil dan dikirim ulang ke Worker setelah selesai.
4. Semua pengunjung memuat `data/{hari ini}.json` dari situs tanpa token dan memeriksanya ulang tiap 30 detik.

Token GitHub **tidak pernah** ada di browser. Yang melindungi penyimpanan adalah validasi di sisi Worker: tanggal harus format `YYYY-MM-DD` dalam rentang kemarin s.d. 14 hari ke depan, 1–10 event, ukuran ≤ 512 KB, dan pembatasan 6 penulisan per 10 menit per alamat IP.

## Fitur

- Impor JSON hasil AI dari flyer pemadaman (prompt verifikasi tersedia di dalam aplikasi), terbuka untuk semua pengunjung.
- Titik jalan berwarna gradasi: kuning → merah mendekati waktu padam, merah → hijau mendekati waktu menyala kembali, hijau pudar setelah selesai.
- Tooltip saat titik disentuh dan popup saat diklik menampilkan hitung mundur menuju padam/menyala, diperbarui tiap detik.
- Tombol **Kosongkan peta** menghapus semua file jadwal lewat Worker sehingga peta kosong untuk semua pengunjung.

## Pengembangan lokal

Jalankan server statis lokal dari folder ini, misalnya `npx serve`, lalu buka alamat yang muncul. Pembacaan data dan impor tetap berjalan karena keduanya memakai Worker yang sudah online; tidak perlu konfigurasi tambahan.

## Perawatan sisi server

Worker berada di repo terpisah (`D:\outage-map-app`, `src/index.ts`) dan memakai binding `ASSETS` serta secret `GITHUB_TOKEN`.

- **Rotasi token**: buat fine-grained PAT baru (akses hanya ke `andiarman/Pemadamanlistrikkotapalu`, izin **Contents: Read and write**), lalu dari folder `outage-map-app` jalankan `npm.cmd exec wrangler secret put GITHUB_TOKEN` dan tempel token baru. Deploy ulang dengan `npm.cmd run deploy` bila kode Worker berubah.
- **Mengubah repo tujuan**: konstanta `githubRepo` / `githubDataDir` ada di `src/index.ts` (Worker) — versi browser tidak lagi menyimpan alamat repo.

## Catatan

- Alamat Worker tertanam di `index.html` sebagai `scheduleApiBase`; ubah bila Worker dipindahkan.
- Pencarian jalan memanggil Nominatim (OpenStreetMap) langsung dari browser — satu per satu dengan jeda minimal 1,2 detik dan hasil di-cache — sesuai [kebijakan penggunaan Nominatim](https://operations.osmfoundation.org/policies/nominatim/).
- Titik merupakan lokasi representatif hasil geocoder, bukan ruas listrik yang terkonfirmasi padam. Garis/area yang menghubungkan titik adalah perkiraan, bukan batas resmi PLN. Jalan yang tidak cocok dengan hasil OpenStreetMap tidak diberi koordinat rekaan.
