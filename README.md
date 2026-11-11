# Peta Jadwal Pemadaman Sulawesi Tengah — versi GitHub Pages

Situs statis (HTML + Leaflet) untuk peta jadwal pemadaman listrik PLN Sulawesi Tengah. Seluruh proses — impor JSON hasil AI, validasi, penyimpanan jadwal, dan geocoding — berjalan di browser; tidak ada backend. Jadwal tersimpan di `localStorage` browser/perangkat masing-masing.

Repo ini adalah versi statis dari aplikasi Cloudflare Workers `outage-map-app`. Perbedaannya: GitHub Pages tidak menyediakan proxy `/api/geocode`, sehingga pencarian nama jalan memanggil Nominatim (OpenStreetMap) langsung dari browser — satu per satu dengan jeda minimal 1,2 detik dan hasil di-cache — sesuai [kebijakan penggunaan Nominatim](https://operations.osmfoundation.org/policies/nominatim/).

## Fitur

- Impor JSON hasil AI dari flyer pemadaman (prompt verifikasi tersedia di dalam aplikasi).
- Titik jalan berwarna gradasi: kuning → merah mendekati waktu padam, merah → hijau mendekati waktu menyala kembali, hijau pudar setelah selesai.
- Tooltip saat titik disentuh dan popup saat diklik menampilkan hitung mundur menuju padam/menyala, diperbarui tiap detik.
- Data hanya tersimpan di browser tempat impor; tombol **Kosongkan peta** menghapusnya dari browser tersebut.

## Deploy ke GitHub Pages

Repo ini diterbitkan ke repositori GitHub `andiarman/Pemadamanlistrikkotapalu`.

1. Pastikan remote menunjuk ke repo yang benar:

   ```powershell
   git remote set-url origin https://github.com/andiarman/Pemadamanlistrikkotapalu.git
   ```

2. Dorong perubahan:

   ```powershell
   git push origin main
   ```

3. Di GitHub, buka **Settings → Pages → Build and deployment** dan pilih **Source: GitHub Actions**.
4. Workflow `.github/workflows/deploy.yml` otomatis menerbitkan situs setiap push ke `main`. Situs akan tayang di `https://andiarman.github.io/Pemadamanlistrikkotapalu/`.

## Pengembangan lokal

Jalankan server statis lokal dari folder ini, misalnya `npx serve`, lalu buka alamat yang muncul.

## Catatan

Titik merupakan lokasi representatif hasil geocoder, bukan ruas listrik yang terkonfirmasi padam. Garis/area yang menghubungkan titik adalah perkiraan, bukan batas resmi PLN. Jalan yang tidak cocok dengan hasil OpenStreetMap tidak diberi koordinat rekaan.
