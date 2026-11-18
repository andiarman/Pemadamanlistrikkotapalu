/**
 * Script Scanner Google Places API (New) untuk Kota Palu
 * Memindai seluruh coffeeshop, cafe, restoran, dan kuliner di 8 Kecamatan Kota Palu.
 * 
 * Penggunaan:
 *   node scripts/fetch-palu-places-gmaps.js <API_KEY>
 * atau:
 *   GOOGLE_MAPS_API_KEY=YOUR_KEY node scripts/fetch-palu-places-gmaps.js
 */

const fs = require('fs');
const path = require('path');

const apiKey = process.argv[2] || process.env.GOOGLE_MAPS_API_KEY;

if (!apiKey) {
  console.error('\x1b[31m[ERROR]\x1b[0m API Key belum disertakan!');
  console.log('\nCara menjalankan:');
  console.log('  node scripts/fetch-palu-places-gmaps.js <API_KEY>');
  console.log('  atau set environment variable GOOGLE_MAPS_API_KEY\n');
  process.exit(1);
}

// 8 Kecamatan resmi Kota Palu & kata kunci strategis
const SEARCH_QUERIES = [
  // 1. Kopi & Cafe per Kecamatan
  'coffee shop cafe Palu Timur',
  'coffee shop cafe Palu Barat',
  'coffee shop cafe Palu Selatan',
  'coffee shop cafe Mantikulore Palu',
  'coffee shop cafe Tatanga Palu',
  'coffee shop cafe Ulujadi Palu',
  'coffee shop cafe Palu Utara',
  'coffee shop cafe Tawaeli Palu',
  'warkop kedai kopi legendaris Palu',
  'specialty coffee roastery Palu',

  // 2. Restoran & Kuliner per Kecamatan
  'restoran rumah makan Palu Timur',
  'restoran rumah makan Palu Barat',
  'restoran rumah makan Palu Selatan',
  'restoran rumah makan Mantikulore Palu',
  'restoran rumah makan Tatanga Palu',
  'restoran rumah makan Ulujadi Palu',
  'restoran seafood ikan bakar Teluk Palu',
  'kaledo khas Palu',
  'coto konro Makassar di Palu',
  'kuliner malam street food Palu'
];

// Titik pusat koordinat (Grid Centers) untuk Nearby Search
const GRID_CENTERS = [
  { name: 'Palu Timur (Besusu / Juanda / Lolu)', lat: -0.893, lng: 119.875, radius: 2500 },
  { name: 'Palu Barat (Lere / Grand Mall / Siranindi)', lat: -0.887, lng: 119.848, radius: 2500 },
  { name: 'Palu Selatan (Birobuli / Basuki Rahmat / Bandara)', lat: -0.916, lng: 119.892, radius: 3000 },
  { name: 'Mantikulore (Talise / Kampus UNTAD / Tondo)', lat: -0.852, lng: 119.896, radius: 3500 },
  { name: 'Tatanga (Boyaoge / Pue Bongo)', lat: -0.915, lng: 119.855, radius: 2500 },
  { name: 'Ulujadi (Doda / Donggala Kodi)', lat: -0.905, lng: 119.832, radius: 3000 },
  { name: 'Palu Utara (Taipa / Mamboro)', lat: -0.785, lng: 119.865, radius: 4500 },
  { name: 'Tawaeli (Pantoloan / Baiya)', lat: -0.718, lng: 119.875, radius: 5000 }
];

const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.rating',
  'places.userRatingCount',
  'places.primaryType',
  'places.types',
  'places.priceLevel',
  'places.googleMapsUri'
].join(',');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function searchText(query) {
  const url = 'https://places.googleapis.com/v1/places:searchText';
  const body = {
    textQuery: query,
    languageCode: 'id',
    locationBias: {
      circle: {
        center: { latitude: -0.895, longitude: 119.870 },
        radius: 12000.0
      }
    }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': FIELD_MASK
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Places API searchText HTTP ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.places || [];
}

async function searchNearby(center, types) {
  const url = 'https://places.googleapis.com/v1/places:searchNearby';
  const body = {
    includedTypes: types,
    maxResultCount: 20,
    languageCode: 'id',
    locationRestriction: {
      circle: {
        center: { latitude: center.lat, longitude: center.lng },
        radius: center.radius
      }
    }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': FIELD_MASK
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Places API searchNearby HTTP ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.places || [];
}

function determineCategory(p) {
  const name = (p.displayName?.text || '').toLowerCase();
  const types = p.types || [];
  const primaryType = (p.primaryType || '').toLowerCase();

  const cafeKeywords = ['coffee', 'kopi', 'cafe', 'kafe', 'warkop', 'kedai kopi', 'pastry', 'bakery', 'tea', 'gelato', 'roastery'];
  const isCafeName = cafeKeywords.some(k => name.includes(k));
  const isCafeType = types.some(t => ['coffee_shop', 'cafe', 'bakery', 'tea_store'].includes(t)) || primaryType.includes('coffee') || primaryType.includes('cafe');

  if (isCafeName || isCafeType) {
    return 'cafe';
  }
  return 'resto';
}

function extractKecamatan(address) {
  const addr = (address || '').toLowerCase();
  if (addr.includes('palu timur')) return 'Palu Timur';
  if (addr.includes('palu barat')) return 'Palu Barat';
  if (addr.includes('palu selatan')) return 'Palu Selatan';
  if (addr.includes('mantikulore')) return 'Mantikulore';
  if (addr.includes('tatanga')) return 'Tatanga';
  if (addr.includes('ulujadi')) return 'Ulujadi';
  if (addr.includes('palu utara')) return 'Palu Utara';
  if (addr.includes('tawaeli')) return 'Tawaeli';
  return 'Kota Palu';
}

function formatPriceLevel(priceLevel) {
  switch (priceLevel) {
    case 'PRICE_LEVEL_INEXPENSIVE': return 'Rp 10.000 - Rp 30.000';
    case 'PRICE_LEVEL_MODERATE': return 'Rp 30.000 - Rp 75.000';
    case 'PRICE_LEVEL_EXPENSIVE': return 'Rp 75.000 - Rp 150.000';
    case 'PRICE_LEVEL_VERY_EXPENSIVE': return '> Rp 150.000';
    default: return 'Terjangkau';
  }
}

async function run() {
  console.log('\n============================================================');
  console.log('   🚀 MEMULAI PEMINDAIAN LENGKAP KULINER & COFFEE DI PALU   ');
  console.log('   Sumber: Google Maps Places API (New)                      ');
  console.log('============================================================\n');

  const allPlacesMap = new Map();

  // 1. Jalankan Text Search Queries
  console.log('📍 [Tahap 1/2] Menjalankan Text Search untuk 8 Kecamatan...');
  for (let i = 0; i < SEARCH_QUERIES.length; i++) {
    const q = SEARCH_QUERIES[i];
    process.stdout.write(`  [${i + 1}/${SEARCH_QUERIES.length}] Mencari: "${q}"... `);
    try {
      const places = await searchText(q);
      let newCount = 0;
      for (const p of places) {
        if (!allPlacesMap.has(p.id)) {
          allPlacesMap.set(p.id, p);
          newCount++;
        }
      }
      console.log(`Ditemukan ${places.length} titik (+${newCount} baru)`);
    } catch (e) {
      console.log(`\x1b[33mError: ${e.message}\x1b[0m`);
    }
    await sleep(250); // Jeda sopan antar query
  }

  // 2. Jalankan Spatial Grid Nearby Search
  console.log('\n📍 [Tahap 2/2] Menjalankan Grid Nearby Search per Sektor Wilayah...');
  for (let i = 0; i < GRID_CENTERS.length; i++) {
    const g = GRID_CENTERS[i];
    process.stdout.write(`  [${i + 1}/${GRID_CENTERS.length}] Sektor: ${g.name}... `);
    try {
      // Nearby Cafe
      const cafes = await searchNearby(g, ['coffee_shop', 'cafe']);
      // Nearby Resto
      const restos = await searchNearby(g, ['restaurant', 'indonesian_restaurant']);
      const combined = [...cafes, ...restos];
      let newCount = 0;
      for (const p of combined) {
        if (!allPlacesMap.has(p.id)) {
          allPlacesMap.set(p.id, p);
          newCount++;
        }
      }
      console.log(`Ditemukan ${combined.length} titik (+${newCount} baru)`);
    } catch (e) {
      console.log(`\x1b[33mError: ${e.message}\x1b[0m`);
    }
    await sleep(250);
  }

  console.log(`\n✅ Pemindaian selesai! Total titik unik berhasil dikumpulkan: ${allPlacesMap.size} tempat`);

  // Format data
  const formattedResults = [];
  for (const [id, p] of allPlacesMap.entries()) {
    const name = p.displayName?.text || 'Tanpa Nama';
    const lat = p.location?.latitude;
    const lon = p.location?.longitude;
    const address = p.formattedAddress || 'Kota Palu, Sulawesi Tengah';

    // Filter koordinat agar hanya berada di sekitar Lembah Palu (-0.6 s/d -1.1 lat, 119.7 s/d 120.0 lon)
    if (!lat || !lon || lat < -1.1 || lat > -0.6 || lon < 119.7 || lon > 120.05) {
      continue;
    }

    const category = determineCategory(p);
    const categoryLabel = category === 'cafe' ? 'Coffeeshop & Cafe' : 'Restoran & Rumah Makan';
    const kecamatan = extractKecamatan(address);
    const rating = p.rating ? Number(p.rating.toFixed(1)) : 4.5;
    const reviewCount = p.userRatingCount ? `${p.userRatingCount.toLocaleString()} ulasan` : 'Ulasan Google Maps';
    const priceRange = formatPriceLevel(p.priceLevel);

    // Kumpulkan badge fitur umum
    const features = [];
    if (category === 'cafe') {
      features.push('Kopi & Minuman');
      if (name.toLowerCase().includes('warkop')) features.push('Warkop Santai');
      else features.push('WFC Friendly', 'WiFi');
    } else {
      features.push('Kuliner');
      if (name.toLowerCase().includes('kaledo')) features.push('Kaledo Khas Palu');
      if (name.toLowerCase().includes('seafood') || name.toLowerCase().includes('ikan')) features.push('Seafood Segar');
    }

    const gmapsUrl = p.googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + address)}`;

    formattedResults.push({
      id: id,
      name: name,
      category: category,
      categoryLabel: categoryLabel,
      lat: lat,
      lon: lon,
      address: address,
      kecamatan: kecamatan,
      rating: rating,
      reviewsCount: reviewCount,
      priceRange: priceRange,
      features: features,
      description: `${categoryLabel} yang tercatat resmi di Google Maps di ${kecamatan}, Kota Palu.`,
      googleMapsUrl: gmapsUrl
    });
  }

  // Urutkan berdasarkan rating tertinggi dan kelengkapan
  formattedResults.sort((a, b) => (b.rating || 0) - (a.rating || 0));

  const totalCafes = formattedResults.filter(f => f.category === 'cafe').length;
  const totalRestos = formattedResults.filter(f => f.category === 'resto').length;

  console.log(`📊 Statistik Data Akhir:`);
  console.log(`   - Total Tempat Kuliner Valid: ${formattedResults.length}`);
  console.log(`   - Coffeeshop & Cafe         : ${totalCafes}`);
  console.log(`   - Restoran & Rumah Makan    : ${totalRestos}`);

  // Simpan ke file data
  const outPath = path.join(__dirname, '..', 'data', 'places', 'palu-coffeeshop-resto.json');
  fs.writeFileSync(outPath, JSON.stringify(formattedResults, null, 2), 'utf8');
  console.log(`\n💾 Berhasil disimpan ke: ${outPath}`);
  console.log('🎉 Peta web Anda sekarang otomatis memiliki database kuliner lengkap Kota Palu!\n');
}

run().catch(err => {
  console.error('\n❌ Terjadi kesalahan fatal:', err);
  process.exit(1);
});
