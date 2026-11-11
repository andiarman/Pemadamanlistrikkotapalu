# Peta Jadwal Pemadaman Sulawesi Tengah — versi GitHub Pages

Situs statis (HTML + Leaflet) untuk peta jadwal pemadaman listrik PLN Sulawesi Tengah. Seluruh proses — impor JSON hasil AI, validasi, geocoding, dan penyimpanan — berjalan di browser; tidak ada backend.

**Repo ini sekaligus menjadi database bersama.** Jadwal yang diimpor tersimpan sebagai file `data/YYYY-MM-DD.json` (tanggal jadwal, zona WITA) melalui GitHub Contents API, sehingga satu kali impor per hari tampil untuk semua pengunjung. Keesokan harinya peta otomatis reset: file tanggal baru belum ada berarti peta kosong, dan arsip yang lebih tua dari kemarin dihapus otomatis saat impor berikutnya. Pemadaman yang berlanjut lewat tengah malam tetap tampil karena file kemarin hanya dimuat untuk event yang belum selesai.

## Alur data

1. Pemilik membuka situs, menekan **Impor hasil AI**, menempel JSON hasil verifikasi AI, dan (sekali saja) menempel token akses GitHub.
2. Jadwal tervalidasi digabung, langsung dikirim ke `data/{tanggal}.json` di repo ini → workflow menerbitkan ulang situs (± 1 menit).
3. Titik jalan dicari satu per satu lewat Nominatim (jeda 1,2 detik, hasil di-cache); setiap titik yang ditemukan langsung tampil dan dikirim ulang ke GitHub setelah selesai.
4. Semua pengunjung memuat `data/{hari ini}.json` dari situs tanpa token dan memeriksanya ulang tiap 30 detik.

## Menyiapkan token akses (sekali saja)

1. Buka <https://github.com/settings/personal-access-tokens/new> (token *fine-grained*).
2. **Repository access**: *Only select repositories* → `andiarman/Pemadamanlistrikkotapalu`.
3. **Permissions** → **Repository permissions** → **Contents: Read and write**. Permission lain biarkan *No access*.
4. Buat token, lalu tempel di kolom **Token akses GitHub** pada dialog impor.

Token hanya tersimpan di `localStorage` browser pemilik dan hanya dikirim ke `api.github.com`. Pengunjung biasa tidak membutuhkan token apa pun. Jika lupa mengisi, kolom boleh dibiarkan kosong selama token masih tersimpan di browser tersebut. Jika kirim ke GitHub gagal (mis. jaringan terputus), ulangi impor — jadwal sama akan digabung dan titik yang sudah ditemukan tidak dicari ulang.

## Fitur

- Impor JSON hasil AI dari flyer pemadaman (prompt verifikasi tersedia di dalam aplikasi).
- Titik jalan berwarna gradasi: kuning → merah mendekati waktu padam, merah → hijau mendekati waktu menyala kembali, hijau pudar setelah selesai.
- Tooltip saat titik disentuh dan popup saat diklik menampilkan hitung mundur menuju padam/menyala, diperbarui tiap detik.
- Tombol **Kosongkan peta** menghapus semua file jadwal dari GitHub sehingga peta kosong untuk semua pengunjung.

## Pengembangan lokal

Jalankan server statis lokal dari folder ini, misalnya `npx serve`, lalu buka alamat yang muncul. Tanpa token, impor hanya akan menolak dengan pesan; pembacaan data tetap berjalan normal.

## Catatan

- Repo, pemilik, dan nama folder data tertanam di `index.html` (`githubRepo`, `githubDataDir`); ubah bila repo dipindahkan.
- Pencarian jalan memanggil Nominatim (OpenStreetMap) langsung dari browser — satu per satu dengan jeda minimal 1,2 detik dan hasil di-cache — sesuai [kebijakan penggunaan Nominatim](https://operations.osmfoundation.org/policies/nominatim/).
- Titik merupakan lokasi representatif hasil geocoder, bukan ruas listrik yang terkonfirmasi padam. Garis/area yang menghubungkan titik adalah perkiraan, bukan batas resmi PLN. Jalan yang tidak cocok dengan hasil OpenStreetMap tidak diberi koordinat rekaan.
