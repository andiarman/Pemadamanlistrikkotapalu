# Peta Jadwal Pemadaman Palu

Aplikasi peta jadwal pemadaman Sulawesi Tengah. Jadwal diimpor di browser tanpa token, disimpan ke GitHub melalui Worker, lalu tampil untuk semua pengunjung. Worker menyimpan kredensial GitHub di sisi server, menyajikan aset, menjadi proxy geocoding terbatas, dan membangun indeks nama OpenStreetMap.

## Alur penggunaan

1. Tekan **Impor hasil AI** dan salin prompt. Di layar ponsel, tombol impor dan log aktivitas disembunyikan agar peta tetap lapang; impor dilakukan dari desktop.
2. Unggah flyer ke Gemini atau AI pilihan, lalu tempel JSON hasilnya ke halaman peta.
3. Jadwal divalidasi di browser, lalu dikirim ke Worker untuk disimpan sebagai `data/YYYY-MM-DD.json` di repo GitHub. Tanggal memakai hari WITA dari event paling awal.
4. File hari ini langsung tampil untuk semua pengunjung. File kemarin hanya dipakai untuk event yang belum selesai; file lebih lama dari kemarin dihapus otomatis saat penyimpanan berikutnya. Jika file hari ini belum ada, peta kosong.
5. Status titik dihitung ulang menurut waktu WITA dan dibedakan dengan bentuk sekaligus warna, tanpa gradasi: **oktagon merah dengan tanda ✕ = sedang padam**, **segitiga kuning dengan ikon jam = akan padam**, **lingkaran hijau dengan tanda ✓ = sudah menyala** (ditampilkan semi-transparan agar titik yang masih padam lebih menonjol; menjadi lebih jelas saat disorot dan tetap bisa diklik). Legenda di kiri bawah juga berfungsi sebagai filter **Semua / Padam / Akan padam / Menyala** dengan jumlah titik masing-masing. Di ponsel dan perangkat sentuh, denyut serta bayangan marker dimatikan otomatis agar geser/zoom lebih lancar; filter status menyembunyikan marker tanpa memuat ulang peta dan area sentuh marker diperbesar. Tooltip saat titik disentuh dan popup saat diklik menampilkan hitung mundur menuju padam/menyala. Ikon Threads di panel legenda membuka akun **@andiarman___** di tab baru. Tekan **Kosongkan peta** untuk menghapus semua file jadwal dari GitHub. Di ponsel, header dan panel filter tampil sebagai kartu mengambang bergradasi: judul, jam WITA, dan jumlah titik diringkas di atas peta, filter tersusun dua kolom dengan tombol 44 px, catatan legenda disembunyikan, dan atribusi OpenStreetMap/Leaflet diperkecil di bawah panel.

Titik merupakan lokasi representatif hasil geocoder, bukan ruas listrik yang terkonfirmasi padam. Garis/area yang menghubungkan titik adalah perkiraan, bukan batas resmi PLN. Jalan yang tidak cocok dengan hasil OpenStreetMap tidak diberi koordinat rekaan.

## Development

Situs statis tidak butuh build: ubah `index.html`, lalu push. Untuk mengerjakan Worker, gunakan proyek `outage-map-app`:

```powershell
npm install
npm run typecheck
npm run dev
```

Leaflet dibundel di `vendor/leaflet`. Worker menyediakan:

- `POST /api/schedule` dan `DELETE /api/schedule` — simpan/hapus jadwal harian (token GitHub hanya di server).
- `GET /api/osm-index?region=palu|tawaeli` — indeks nama OpenStreetMap untuk pencocokan lokal. Indeks dibuat dari Overpass API, disimpan di cache Worker selama 12 jam, dan di-cache browser selama 12 jam.
- `GET /api/geocode` — proxy Nominatim (dipakai bila tersedia).

## Impor dan geocoding

Format impor memakai `schema_version: 1` dan array `events`. Setiap event memuat `title`, `start_time`/`end_time` ISO 8601 dengan zona WITA `+08:00`, `locations` kabupaten/kota, dan `areas` berisi `ulp_name` serta daftar nama jalan/lokasi. Kelompok ULP tanpa nama lokasi valid dan jadwal tanpa kelompok lokasi dilewati; jadwal valid lain tetap diproses. Maksimal 10 event, 50 kelompok ULP, 500 nama lokasi per event, dan ukuran JSON 512 KB.

Setelah validasi berhasil, dialog impor menutup dan pencarian berjalan di halaman peta dengan progress bar. Setiap titik yang cocok langsung muncul; nama lokasi tampil saat marker disentuh/di-hover agar label tidak menumpuk.

Selama impor, panel **Log aktivitas** menampilkan langkah yang sedang berjalan beserta stempel waktu: ukuran JSON, validasi, unduhan indeks per wilayah, jumlah nama yang cocok dari indeks, setiap pencarian Nominatim, penyimpanan ke GitHub, dan kesalahan jaringan. Tombol **Log aktivitas** di header membuka kembali panel tersebut kapan saja. Jika indeks gagal atau melewati batas 110 detik, log menyatakannya dan pencarian otomatis memakai Nominatim seperti cara sebelumnya; pencarian Nominatim dibatasi 30 detik per nama agar tidak menggantung.

Pencocokan berjalan dua tahap:

1. **Indeks OpenStreetMap (lokal).** Nama dinormalisasi lebih dulu: awalan `Jl./Jalan`, gelar (`Dr.`, `H.`, `Sultan`), angka Romawi, singkatan (`Tg.` → Tanjung, `Tlk` → Teluk, `GN` → Gunung, `S` → Sungai, `M` → Muhammad), ejaan gabung/pecah (`Ki Maja` ↔ `Kimaja`), dan salah ejaan ringan. Hasilnya dicocokkan tanpa jaringan.
2. **Nominatim (sisa nama).** Nama yang belum cocok dicari satu per satu dengan jeda minimal 1,2 detik, dibatasi ke Sulawesi Tengah. Kandidat harus mirip minimal 0,86 terhadap nama asli agar tidak salah jalan.

Impor pertama memerlukan 40–80 detik untuk membangun indeks (di-cache pada impor berikutnya), lalu sisa nama biasanya selesai dalam hitungan detik sampai satu menit. Biarkan halaman terbuka sampai progress selesai. Penggunaan Nominatim harus mengikuti [kebijakannya](https://operations.osmfoundation.org/policies/nominatim/).

## Deploy

Worker (proyek `outage-map-app`):

```powershell
npx wrangler secret put GITHUB_TOKEN
npm run deploy
```

Halaman statis dideploy otomatis oleh GitHub Actions setiap ada push ke repo ini. `schema.sql` dan resource D1/KV lama dipertahankan, tetapi tidak dipakai oleh aplikasi.
