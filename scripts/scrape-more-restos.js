/**
 * Script Scraping Maksimal Khusus Restoran & Kuliner Kota Palu
 * Menggunakan Google Maps Places API (New) SearchNearby beresolusi tinggi
 * di 35 Sektor & Kelurahan Kota Palu.
 * 
 * Aturan:
 * - Melewati (skip) semua tempat yang sudah tercatat di database
 * - Menolak duplikasi berdasarkan ID, nama yang sama, atau koordinat yang berdekatan
 * - Mengambil jam operasional lengkap (opening hours & status 24 jam)
 * - Menyimpan data dalam format A-Z tanpa bias rating
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
  'places.googleMapsUri'
].join(',');

// 35 Sektor Grid Koordinat Meliputi Seluruh Lembah & Koridor Kota Palu
const SECTOR_CENTERS = [
  { name: 'Besusu Barat / Sam Ratulangi', lat: -0.891, lng: 119.868, radius: 1500 },
  { name: 'Besusu Timur / Juanda', lat: -0.896, lng: 119.882, radius: 1500 },
  { name: 'Besusu Tengah / Hasanuddin', lat: -0.895, lng: 119.874, radius: 1500 },
  { name: 'Lolu Utara / Monginsidi', lat: -0.901, lng: 119.875, radius: 1500 },
  { name: 'Lolu Selatan / Kartini', lat: -0.908, lng: 119.877, radius: 1500 },
  { name: 'Tatura Utara / Emmy Saelan', lat: -0.912, lng: 119.882, radius: 1600 },
  { name: 'Tatura Selatan / I Gusti Ngurah Rai', lat: -0.920, lng: 119.886, radius: 1600 },
  { name: 'Birobuli Utara / Basuki Rahmat', lat: -0.915, lng: 119.896, radius: 1600 },
  { name: 'Birobuli Selatan / Bandara Mutiara', lat: -0.924, lng: 119.907, radius: 1800 },
  { name: 'Petobo', lat: -0.938, lng: 119.908, radius: 2000 },
  { name: 'Kawatuna', lat: -0.925, lng: 119.930, radius: 2200 },
  { name: 'Lasoani', lat: -0.905, lng: 119.925, radius: 2200 },
  { name: 'Talise / Pantai Talise', lat: -0.878, lng: 119.878, radius: 1800 },
  { name: 'Talise Valangguni', lat: -0.885, lng: 119.895, radius: 1800 },
  { name: 'Tondo / Kampus Untad', lat: -0.852, lng: 119.896, radius: 2200 },
  { name: 'Layana Indah', lat: -0.825, lng: 119.875, radius: 2500 },
  { name: 'Mamboro', lat: -0.795, lng: 119.865, radius: 2800 },
  { name: 'Taipa', lat: -0.772, lng: 119.865, radius: 2800 },
  { name: 'Kayumalue Pajeko / Ngapa', lat: -0.755, lng: 119.868, radius: 3000 },
  { name: 'Pantoloan / Pelabuhan', lat: -0.718, lng: 119.875, radius: 3200 },
  { name: 'Tawaeli / Baiya', lat: -0.705, lng: 119.880, radius: 3200 },
  { name: 'Siranindi / Imam Bonjol', lat: -0.898, lng: 119.858, radius: 1500 },
  { name: 'Kamonji / Sis Aljufri', lat: -0.904, lng: 119.855, radius: 1500 },
  { name: 'Ujuna / Agus Salim', lat: -0.892, lng: 119.853, radius: 1500 },
  { name: 'Lere / Palu Grand Mall / Teluk', lat: -0.887, lng: 119.848, radius: 1600 },
  { name: 'Balaroa', lat: -0.902, lng: 119.840, radius: 1800 },
  { name: 'Duyu', lat: -0.912, lng: 119.838, radius: 1800 },
  { name: 'Donggala Kodi', lat: -0.895, lng: 119.832, radius: 1800 },
  { name: 'Kabonena', lat: -0.885, lng: 119.832, radius: 1800 },
  { name: 'Silae', lat: -0.875, lng: 119.830, radius: 2000 },
  { name: 'Tipo', lat: -0.855, lng: 119.822, radius: 2200 },
  { name: 'Tatanga / Palupi', lat: -0.918, lng: 119.855, radius: 1800 },
  { name: 'Tavanjuka', lat: -0.915, lng: 119.862, radius: 1600 },
  { name: 'Boyaoge', lat: -0.910, lng: 119.865, radius: 1500 },
  { name: 'Pengawu / Nunu', lat: -0.925, lng: 119.858, radius: 1800 }
];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function cleanName(n) {
  return (n || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // meters
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
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
    throw new Error(`HTTP ${res.status}: ${errText}`);
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
      openTime: is24hNamed ? null : '10:00',
      closeTime: is24hNamed ? null : '22:00',
      hoursText: is24hNamed ? 'Buka 24 Jam' : '10:00 - 22:00',
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
    hoursText = isOpen24Hours ? 'Buka 24 Jam' : '10:00 - 22:00';
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

function extractRestoFeatures(name, types, is24h) {
  const n = (name || '').toLowerCase();
  const f = [];

  if (n.includes('kaledo')) f.push('Kaledo Khas Palu');
  else if (n.includes('seafood') || n.includes('ikan bakar') || n.includes('bakar')) f.push('Seafood & Ikan Bakar');
  else if (n.includes('coto') || n.includes('konro') || n.includes('sop')) f.push('Coto & Sup Daging');
  else if (n.includes('mie') || n.includes('bakso') || n.includes('pangsit')) f.push('Mie & Bakso');
  else if (n.includes('ayam') || n.includes('bebek')) f.push('Ayam & Bebek');
  else if (n.includes('padang') || n.includes('minang')) f.push('Masakan Minang');
  else if (n.includes('sate')) f.push('Sate Khas');
  else if (n.includes('sushi') || n.includes('ramen') || n.includes('jepang')) f.push('Japanese Food');
  else if (n.includes('pizza') || n.includes('burger')) f.push('Western & Fast Food');
  else f.push('Aneka Kuliner');

  f.push('Dine-in & Takeaway');

  if (is24h) f.push('24 Jam');
  else if (n.includes('wifi') || (types && types.includes('cafe'))) f.push('WiFi');

  return f;
}

async function main() {
  console.log('================================================================');
  console.log('   🍽️ SCRAPING MAKSIMAL RESTORAN, RUMAH MAKAN & KULINER PALU  ');
  console.log('   Mode: DEDUP KETAT - Melewati semua data yang sudah ada      ');
  console.log('================================================================\n');

  // 1. Muat database yang sudah ada
  let existingPlaces = [];
  if (fs.existsSync(DB_PATH)) {
    existingPlaces = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  }
  console.log(`📁 Database saat ini: ${existingPlaces.length} tempat`);
  const initialCafes = existingPlaces.filter(p => p.category === 'cafe').length;
  const initialRestos = existingPlaces.filter(p => p.category === 'resto').length;
  console.log(`   - Cafe saat ini : ${initialCafes}`);
  console.log(`   - Resto saat ini: ${initialRestos}\n`);

  const existingIds = new Set(existingPlaces.map(p => p.id));
  const existingNameSet = new Set(existingPlaces.map(p => cleanName(p.name)));

  const newPlacesMap = new Map();

  // 2. Pemindaian Sektor Sesi 1: Restaurant Umum, Indonesia & Fast Food
  console.log(`📍 [Sesi 1/2] Grid Search 35 Sektor (Restoran & Rumah Makan)...`);
  for (let i = 0; i < SECTOR_CENTERS.length; i++) {
    const s = SECTOR_CENTERS[i];
    process.stdout.write(`  [${i + 1}/${SECTOR_CENTERS.length}] ${s.name}... `);

    try {
      const places = await searchNearby(s, [
        'restaurant',
        'indonesian_restaurant',
        'fast_food_restaurant'
      ]);

      let added = 0;
      for (const p of places) {
        const id = p.id;
        const name = p.displayName?.text || '';
        const cName = cleanName(name);

        // Deduplikasi ketat
        if (existingIds.has(id) || newPlacesMap.has(id)) continue;
        if (cName && existingNameSet.has(cName)) continue;

        // Cek kedekatan koordinat dengan tempat bernama serupa
        const lat = p.location?.latitude;
        const lon = p.location?.longitude;
        if (!lat || !lon) continue;

        let isTooClose = false;
        for (const ep of existingPlaces) {
          if (cleanName(ep.name) === cName || haversineDistance(lat, lon, ep.lat, ep.lon) < 15) {
            isTooClose = true;
            break;
          }
        }
        if (isTooClose) continue;

        newPlacesMap.set(id, p);
        existingNameSet.add(cName);
        added++;
      }

      console.log(`Ditemukan: ${places.length} (+${added} baru)`);
    } catch (err) {
      console.log(`\x1b[33mError: ${err.message}\x1b[0m`);
    }

    await sleep(200);
  }

  // 3. Pemindaian Sektor Sesi 2: Seafood & Rumah Makan Tradisional Khusus
  console.log(`\n📍 [Sesi 2/2] Grid Search Sektor Khusus (Seafood & Kuliner Tradisional)...`);
  for (let i = 0; i < SECTOR_CENTERS.length; i++) {
    const s = SECTOR_CENTERS[i];
    process.stdout.write(`  [${i + 1}/${SECTOR_CENTERS.length}] Seafood/Khas ${s.name}... `);

    try {
      const places = await searchNearby(s, ['seafood_restaurant']);
      let added = 0;

      for (const p of places) {
        const id = p.id;
        const name = p.displayName?.text || '';
        const cName = cleanName(name);

        if (existingIds.has(id) || newPlacesMap.has(id)) continue;
        if (cName && existingNameSet.has(cName)) continue;

        const lat = p.location?.latitude;
        const lon = p.location?.longitude;
        if (!lat || !lon) continue;

        let isTooClose = false;
        for (const ep of existingPlaces) {
          if (cleanName(ep.name) === cName || haversineDistance(lat, lon, ep.lat, ep.lon) < 15) {
            isTooClose = true;
            break;
          }
        }
        if (isTooClose) continue;

        newPlacesMap.set(id, p);
        existingNameSet.add(cName);
        added++;
      }

      console.log(`Ditemukan: ${places.length} (+${added} baru)`);
    } catch (err) {
      console.log(`\x1b[33mError: ${err.message}\x1b[0m`);
    }

    await sleep(200);
  }

  console.log(`\n================================================================`);
  console.log(`🎉 SELESAI! Ditemukan ${newPlacesMap.size} restoran BARU yang belum ada sebelumnya.`);
  console.log(`================================================================\n`);

  if (newPlacesMap.size === 0) {
    console.log('Semua restoran di wilayah Palu sudah tercatat lengkap.');
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
    if (!lat || !lon || lat < -1.15 || lat > -0.65 || lon < 119.70 || lon > 120.05) {
      continue;
    }

    const kecamatan = extractKecamatan(address);
    const rating = p.rating ? Number(p.rating.toFixed(1)) : 4.5;
    const reviewCount = p.userRatingCount ? `${p.userRatingCount.toLocaleString()} ulasan` : 'Ulasan Google Maps';
    const priceRange = formatPriceLevel(p.priceLevel);
    const rawHours = p.regularOpeningHours || p.currentOpeningHours;
    const operatingHours = parseOperatingHours(rawHours, name);
    const features = extractRestoFeatures(name, p.types, operatingHours.isOpen24Hours);
    const gmapsUrl = p.googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + address)}`;

    newFormattedPlaces.push({
      id: id,
      name: name,
      category: 'resto',
      categoryLabel: 'Restoran & Rumah Makan',
      lat: lat,
      lon: lon,
      address: address,
      kecamatan: kecamatan,
      rating: rating,
      reviewsCount: reviewCount,
      priceRange: priceRange,
      features: features,
      description: `Restoran & Kuliner yang tercatat di Google Maps di ${kecamatan}, Kota Palu.`,
      googleMapsUrl: gmapsUrl,
      operatingHours: operatingHours,
      franchise: null
    });
  }

  console.log(`✅ Sebanyak ${newFormattedPlaces.length} restoran baru tervalidasi dan siap digabungkan.`);

  // Gabungkan ke database
  const combinedPlaces = [...existingPlaces, ...newFormattedPlaces];

  // Urutkan A-Z tanpa bias rating
  combinedPlaces.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'id'));

  fs.writeFileSync(DB_PATH, JSON.stringify(combinedPlaces, null, 2), 'utf8');
  console.log(`💾 Database berhasil disimpan di: ${DB_PATH}`);

  const totalCafes = combinedPlaces.filter(p => p.category === 'cafe').length;
  const totalRestos = combinedPlaces.filter(p => p.category === 'resto').length;
  console.log(`\n📊 Statistik Akhir Database:`);
  console.log(`   - Total Seluruh Titik Kuliner : ${combinedPlaces.length} (+${newFormattedPlaces.length} baru)`);
  console.log(`   - Total Coffeeshop & Cafe    : ${totalCafes}`);
  console.log(`   - Total Restoran & Rumah Makan: ${totalRestos} (+${newFormattedPlaces.length} baru)\n`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
