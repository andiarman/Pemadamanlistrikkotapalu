/**
 * Script Penggabung Usulan Titik Mingguan (Weekly Merge Submissions)
 * Membaca data/places/pending-submissions.json, memvalidasi usulan titik baru dari pengguna,
 * melakukan deduplikasi terhadap database utama, lalu menggabungkannya secara alfabetis A-Z.
 * 
 * Penggunaan:
 *   node scripts/merge-submissions.js
 */

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'places', 'palu-coffeeshop-resto.json');
const PENDING_PATH = path.join(__dirname, '..', 'data', 'places', 'pending-submissions.json');

function cleanName(n) {
  return (n || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function run() {
  console.log('===============================================================');
  console.log('   📦 KURASI & PENGGABUNGAN TITIK MINGGUAN COFFEESHOP & RESTO  ');
  console.log('===============================================================\n');

  if (!fs.existsSync(PENDING_PATH)) {
    console.log('Tidak ada file pending-submissions.json ditemukan.');
    return;
  }

  const rawPending = fs.readFileSync(PENDING_PATH, 'utf8').trim();
  const pending = rawPending ? JSON.parse(rawPending) : [];

  if (!Array.isArray(pending) || pending.length === 0) {
    console.log('Belum ada usulan titik baru di antrean mingguan.');
    return;
  }

  const currentPlaces = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  const existingIds = new Set(currentPlaces.map(p => p.id));
  const existingNames = new Set(currentPlaces.map(p => cleanName(p.name)));

  let added = 0;
  let skipped = 0;

  for (const item of pending) {
    const name = (item.name || '').trim();
    const cName = cleanName(name);

    if (!name || !item.lat || !item.lon) {
      console.log(`⚠️ Melewati data tidak lengkap: "${name}"`);
      skipped++;
      continue;
    }

    if (existingIds.has(item.id) || existingNames.has(cName)) {
      console.log(`ℹ️ Sudah ada di database (duplikat): "${name}"`);
      skipped++;
      continue;
    }

    // Pastikan tidak ada rating bintang atau kontak pemilik
    delete item.rating;
    delete item.userRatingCount;
    delete item.contact;

    currentPlaces.push(item);
    existingIds.add(item.id);
    existingNames.add(cName);
    added++;
    console.log(`✅ Berhasil menambahkan titik: "${name}" (${item.categoryLabel || item.category})`);
  }

  // Urutkan secara adil dan netral menurut alfabet A-Z
  currentPlaces.sort((a, b) => (a.name || '').localeCompare((b.name || ''), 'id', { sensitivity: 'base' }));

  fs.writeFileSync(DB_PATH, JSON.stringify(currentPlaces, null, 2), 'utf8');

  // Bersihkan antrean usulan yang sudah terintegrasi
  fs.writeFileSync(PENDING_PATH, '[]\n', 'utf8');

  console.log(`\n🎉 Selesai! Sebanyak ${added} titik baru berhasil diunggah.`);
  console.log(`Total titik kuliner di Kota Palu sekarang: ${currentPlaces.length} titik.`);
}

run();
