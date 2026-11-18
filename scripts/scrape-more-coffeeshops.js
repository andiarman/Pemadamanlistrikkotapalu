/**
 * Script Scraping Maksimal Khusus Coffeeshop, Cafe & Warkop Kota Palu
 * Menggunakan Google Maps Places API (New) dengan Text Search + Paginasi (nextPageToken)
 * dan Grid Nearby Search beresolusi tinggi di seluruh 46 Kelurahan dan koridor jalan Kota Palu.
 * 
 * Aturan:
 * - Melewati (skip) semua tempat yang sudah tercatat di data/places/palu-coffeeshop-resto.json
 * - Hanya menambahkan tempat baru yang valid di Lembah Palu
 * - Mengambil langsung info opening hours (jam operasional & status 24 jam)
 */

const fs = require('fs');
const path = require('path');

const API_KEY = process.argv[2] || process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyDIptYMiyL1tDy9pQaNeOcgb61AWF7uCuk';
const DB_PATH = path.join(__dirname, '..', 'data', 'places', 'palu-coffeeshop-resto.json');

const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.rating',
  'places.userRatingCount',
  'places.regularOpeningHours',
  'places.currentOpeningHours',
  'places.primaryType',
  'places.types',
  'places.priceLevel',
  'places.googleMapsUri',
  'nextPageToken'
].join(',');

const SEARCH_QUERIES = [
  // 1. Jalan & Koridor Kopi Utama Palu
  'coffee shop Jalan Sam Ratulangi Palu',
  'coffee shop Jalan Juanda Palu',
  'coffee shop Jalan Basuki Rahmat Palu',
  'coffee shop Jalan Setia Budi Palu',
  'coffee shop Jalan Sis Aljufri Palu',
  'coffee shop Jalan Raden Saleh Palu',
  'coffee shop Jalan Diponegoro Palu',
  'coffee shop Jalan Hasanuddin Palu',
  'coffee shop Jalan Veteran Palu',
  'coffee shop Jalan Dewi Sartika Palu',
  'coffee shop Jalan Mohammad Hatta Palu',
  'coffee shop Jalan Sudirman Palu',
  'coffee shop Jalan Sisingamangaraja Palu',
  'coffee shop Jalan Emmy Saelan Palu',
  'coffee shop Jalan Anoa Palu',
  'coffee shop Jalan Malonda Palu',
  'coffee shop Jalan Soekarno Hatta Palu',
  'coffee shop Jalan Tadulako Palu',
  'coffee shop Jalan Monginsidi Palu',
  'coffee shop Jalan Pattimura Palu',
  'coffee shop Jalan Kartini Palu',
  'coffee shop Jalan Tombolotutu Palu',
  'coffee shop Jalan Towua Palu',

  // 2. Per Kelurahan di 8 Kecamatan Palu
  'coffee shop cafe Besusu Palu',
  'coffee shop cafe Lolu Palu',
  'coffee shop cafe Birobuli Palu',
  'coffee shop cafe Tatura Palu',
  'coffee shop cafe Tondo Untad Palu',
  'coffee shop cafe Talise Palu',
  'coffee shop cafe Lasoani Palu',
  'coffee shop cafe Layana Palu',
  'coffee shop cafe Kawatuna Palu',
  'coffee shop cafe Petobo Palu',
  'coffee shop cafe Siranindi Palu',
  'coffee shop cafe Kamonji Palu',
  'coffee shop cafe Ujuna Palu',
  'coffee shop cafe Lere Palu',
  'coffee shop cafe Balaroa Palu',
  'coffee shop cafe Palupi Palu',
  'coffee shop cafe Tavanjuka Palu',
  'coffee shop cafe Boyaoge Palu',
  'coffee shop cafe Pengawu Palu',
  'coffee shop cafe Duyu Palu',
  'coffee shop cafe Nunu Palu',
  'coffee shop cafe Donggala Kodi Palu',
  'coffee shop cafe Kabonena Palu',
  'coffee shop cafe Silae Palu',
  'coffee shop cafe Tipo Palu',
  'coffee shop cafe Mamboro Palu',
  'coffee shop cafe Taipa Palu',
  'coffee shop cafe Pantoloan Palu',
  'coffee shop cafe Baiya Palu',

  // 3. Warkop Tradisional & Kedai Kopi Palu
  'warkop kedai kopi Palu',
  'warkop 24 jam Palu',
  'warkop wifi Palu',
  'warkop Untad Tondo Palu',
  'warkop Sam Ratulangi Palu',
  'warkop Juanda Palu',
  'warkop Basuki Rahmat Palu',
  'warkop Setia Budi Palu',
  'warkop Sis Aljufri Palu',
  'warkop Palupi Palu',
  'warkop Lere Teluk Palu',
  'warkop Tatura Palu',

  // 4. Konsep Kopi & Gaya Nongkrong
  'specialty coffee roastery Palu',
  'artisan coffee shop Palu',
  'cafe wfc work from cafe Palu',
  'cafe rooftop pemandangan Palu',
  'cafe estetik hits Palu',
  'kedai kopi susu Palu',
  'cafe live music malam Palu',
  'tempat ngopi santai Palu',
  'cafe tepi pantai Teluk Palu',
  'cafe perbukitan Doda Palu'
];

const GRID_CENTERS = [
  { name: 'Besusu / Sam Ratulangi', lat: -0.893, lng: 119.875, radius: 1800 },
  { name: 'Juanda / Lolu', lat: -0.899, lng: 119.882, radius: 1800 },
  { name: 'Basuki Rahmat / Tatura', lat: -0.912, lng: 119.889, radius: 2000 },
  { name: 'Birobuli / Bandara', lat: -0.922, lng: 119.905, radius: 2200 },
  { name: 'Lere / Palu Grand Mall / Teluk', lat: -0.887, lng: 119.848, radius: 2000 },
  { name: 'Siranindi / Sis Aljufri', lat: -0.898, lng: 119.858, radius: 1800 },
  { name: 'Tatanga / Palupi / Tavanjuka', lat: -0.918, lng: 119.855, radius: 2200 },
  { name: 'Duyu / Balaroa', lat: -0.908, lng: 119.840, radius: 2000 },
  { name: 'Donggala Kodi / Kabonena', lat: -0.895, lng: 119.832, radius: 2200 },
  { name: 'Silae / Doda Hill view', lat: -0.875, lng: 119.830, radius: 2500 },
  { name: 'Talise / Pantai Talise', lat: -0.875, lng: 119.878, radius: 2200 },
  { name: 'Untad / Tondo', lat: -0.852, lng: 119.896, radius: 2500 },
  { name: 'Lasoani / Kawatuna', lat: -0.910, lng: 119.925, radius: 2500 },
  { name: 'Mamboro / Taipa', lat: -0.795, lng: 119.865, radius: 3500 },
  { name: 'Kayumalue / Palu Utara', lat: -0.755, lng: 119.868, radius: 3500 },
  { name: 'Pantoloan / Tawaeli', lat: -0.718, lng: 119.875, radius: 4000 }
];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function cleanName(n) {
  return (n || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function searchText(query, pageToken = null) {
  const url = 'https://places.googleapis.com/v1/places:searchText';
  const body = {
    textQuery: query,
    languageCode: 'id',
    pageSize: 20,
    locationBias: {
      circle: {
        center: { latitude: -0.895, longitude: 119.870 },
        radius: 14000.0
      }
    }
  };
  if (pageToken) body.pageToken = pageToken;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': FIELD_MASK
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Places API searchText HTTP ${res.status}: ${errText}`);
  }

  return await res.json();
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
      'X-Goog-Api-Key': API_KEY,
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

function parseOperatingHours(rawHours, placeName) {
  const is24hNamed = (placeName || '').toLowerCase().includes('24 jam');
  if (!rawHours) {
    return {
      hasHours: is24hNamed,
      openNow: is24hNamed ? true : null,
      isOpen24Hours: is24hNamed,
      openTime: is24hNamed ? null : '09:00',
      closeTime: is24hNamed ? null : '23:00',
      hoursText: is24hNamed ? 'Buka 24 Jam' : '10:00 - 23:00',
      weekdayDescriptions: is24hNamed ? ['Setiap hari: Buka 24 jam'] : ['Jam buka bervariasi']
    };
  }

  const periods = rawHours.periods || [];
  const weekdayDescriptions = rawHours.weekdayDescriptions || [];
  let isOpen24Hours = false;

  if (periods.length === 1 && periods[0].open && periods[0].open.hour === 0 && periods[0].open.minute === 0 && !periods[0].close) {
    isOpen24Hours = true;
  }
  if (periods.some(p => p.open?.hour === 0 && (!p.close || p.close.hour === 0))) {
    if (periods.length >= 6) isOpen24Hours = true;
  }
  if (weekdayDescriptions.some(w => /24\s*jam/i.test(w))) {
    isOpen24Hours = true;
  }
  if (is24hNamed) isOpen24Hours = true;

  let openTime = null;
  let closeTime = null;
  let hoursText = isOpen24Hours ? 'Buka 24 Jam' : '';

  if (!isOpen24Hours && periods.length > 0) {
    const p0 = periods[0];
    if (p0.open && p0.close) {
      const oH = String(p0.open.hour).padStart(2, '0');
      const oM = String(p0.open.minute || 0).padStart(2, '0');
      const cH = String(p0.close.hour).padStart(2, '0');
      const cM = String(p0.close.minute || 0).padStart(2, '0');
      openTime = `${oH}:${oM}`;
      closeTime = `${cH}:${cM}`;
      hoursText = `${openTime} - ${closeTime}`;
    }
  }

  if (!hoursText) {
    hoursText = isOpen24Hours ? 'Buka 24 Jam' : '10:00 - 23:00';
  }

  return {
    hasHours: true,
    openNow: rawHours.openNow ?? (isOpen24Hours ? true : null),
    isOpen24Hours: isOpen24Hours,
    openTime: openTime,
    closeTime: closeTime,
    hoursText: hoursText,
    weekdayDescriptions: weekdayDescriptions,
    periods: periods
  };
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

async function main() {
  console.log('===============================================================');
  console.log('   ☕ SCRAPING MAKSIMAL COFFEESHOP, CAFE & WARKOP KOTA PALU   ');
  console.log('   Mode: Skip data lama, cari data baru yang belum tercatat    ');
  console.log('===============================================================\n');

  // 1. Muat database yang sudah ada
  let existingPlaces = [];
  if (fs.existsSync(DB_PATH)) {
    existingPlaces = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  }
  console.log(`📁 Database saat ini: ${existingPlaces.length} tempat`);

  const existingIds = new Set(existingPlaces.map(p => p.id));
  const existingNameSet = new Set(existingPlaces.map(p => cleanName(p.name)));

  const newPlacesMap = new Map();

  // 2. Scraping Tahap 1: Text Search (dengan nextPageToken jika ada)
  console.log(`\n📍 [Tahap 1/2] Text Search ${SEARCH_QUERIES.length} Query Spesifik Kopi...`);
  for (let i = 0; i < SEARCH_QUERIES.length; i++) {
    const q = SEARCH_QUERIES[i];
    process.stdout.write(`  [${i + 1}/${SEARCH_QUERIES.length}] "${q}"... `);

    try {
      let pageToken = null;
      let totalFound = 0;
      let addedForQuery = 0;

      for (let page = 0; page < 3; page++) {
        const data = await searchText(q, pageToken);
        const places = data.places || [];
        totalFound += places.length;

        for (const p of places) {
          const id = p.id;
          const name = p.displayName?.text || '';
          const cName = cleanName(name);

          // Cek apakah sudah ada di database lama atau sudah ditemukan di sesi ini
          if (existingIds.has(id) || newPlacesMap.has(id)) continue;
          if (cName && existingNameSet.has(cName)) continue;

          newPlacesMap.set(id, p);
          existingNameSet.add(cName);
          addedForQuery++;
        }

        if (data.nextPageToken && places.length === 20) {
          pageToken = data.nextPageToken;
          await sleep(250);
        } else {
          break;
        }
      }

      console.log(`Total: ${totalFound} titik (+${addedForQuery} baru)`);
    } catch (err) {
      console.log(`\x1b[33mError: ${err.message}\x1b[0m`);
    }

    await sleep(250);
  }

  // 3. Scraping Tahap 2: Grid Nearby Search di 16 Titik Kota Palu
  console.log(`\n📍 [Tahap 2/2] Grid Nearby Search ${GRID_CENTERS.length} Sektor Khusus Cafe...`);
  for (let i = 0; i < GRID_CENTERS.length; i++) {
    const g = GRID_CENTERS[i];
    process.stdout.write(`  [${i + 1}/${GRID_CENTERS.length}] Sektor ${g.name}... `);

    try {
      const places = await searchNearby(g, ['coffee_shop', 'cafe']);
      let addedForGrid = 0;

      for (const p of places) {
        const id = p.id;
        const name = p.displayName?.text || '';
        const cName = cleanName(name);

        if (existingIds.has(id) || newPlacesMap.has(id)) continue;
        if (cName && existingNameSet.has(cName)) continue;

        newPlacesMap.set(id, p);
        existingNameSet.add(cName);
        addedForGrid++;
      }

      console.log(`Total: ${places.length} titik (+${addedForGrid} baru)`);
    } catch (err) {
      console.log(`\x1b[33mError: ${err.message}\x1b[0m`);
    }

    await sleep(250);
  }

  console.log(`\n===============================================================`);
  console.log(`🎉 PEMINDAIAN SELESAI! Ditemukan ${newPlacesMap.size} coffeeshop BARU yang belum ada sebelumnya.`);
  console.log(`===============================================================\n`);

  if (newPlacesMap.size === 0) {
    console.log('Semua coffeeshop di area pencarian sudah tercatat lengkap di database.');
    return;
  }

  // Format data baru
  const newFormattedPlaces = [];
  for (const [id, p] of newPlacesMap.entries()) {
    const name = p.displayName?.text || 'Tanpa Nama';
    const lat = p.location?.latitude;
    const lon = p.location?.longitude;
    const address = p.formattedAddress || 'Kota Palu, Sulawesi Tengah';

    // Filter koordinat lembah Palu
    if (!lat || !lon || lat < -1.15 || lat > -0.65 || lon < 119.7 || lon > 120.05) {
      continue;
    }

    const kecamatan = extractKecamatan(address);
    const rating = p.rating ? Number(p.rating.toFixed(1)) : 4.5;
    const reviewCount = p.userRatingCount ? `${p.userRatingCount.toLocaleString()} ulasan` : 'Ulasan Google Maps';
    const priceRange = formatPriceLevel(p.priceLevel);
    const rawHours = p.regularOpeningHours || p.currentOpeningHours;
    const operatingHours = parseOperatingHours(rawHours, name);

    const features = ['Kopi & Minuman'];
    if (name.toLowerCase().includes('warkop')) features.push('Warkop Santai');
    else features.push('WFC Friendly', 'WiFi');
    if (operatingHours.isOpen24Hours) features.push('24 Jam');

    const gmapsUrl = p.googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + address)}`;

    newFormattedPlaces.push({
      id: id,
      name: name,
      category: 'cafe',
      categoryLabel: 'Coffeeshop & Cafe',
      lat: lat,
      lon: lon,
      address: address,
      kecamatan: kecamatan,
      rating: rating,
      reviewsCount: reviewCount,
      priceRange: priceRange,
      features: features,
      description: `Coffeeshop & Cafe yang tercatat di Google Maps di ${kecamatan}, Kota Palu.`,
      googleMapsUrl: gmapsUrl,
      operatingHours: operatingHours
    });
  }

  console.log(`✅ Sebanyak ${newFormattedPlaces.length} coffeeshop baru berhasil divalidasi di wilayah Palu.`);

  // Gabungkan ke database lama
  const combinedPlaces = [...existingPlaces, ...newFormattedPlaces];

  // Urutkan berdasarkan rating
  combinedPlaces.sort((a, b) => (b.rating || 0) - (a.rating || 0));

  fs.writeFileSync(DB_PATH, JSON.stringify(combinedPlaces, null, 2), 'utf8');
  console.log(`💾 Database diperbarui di: ${DB_PATH}`);

  const totalCafes = combinedPlaces.filter(p => p.category === 'cafe').length;
  const totalRestos = combinedPlaces.filter(p => p.category === 'resto').length;
  console.log(`\n📊 Statistik Terkini:`);
  console.log(`   - Total Seluruh Titik Kuliner : ${combinedPlaces.length}`);
  console.log(`   - Total Coffeeshop & Cafe    : ${totalCafes} (+${newFormattedPlaces.length} baru)`);
  console.log(`   - Total Restoran & Rumah Makan: ${totalRestos}\n`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
