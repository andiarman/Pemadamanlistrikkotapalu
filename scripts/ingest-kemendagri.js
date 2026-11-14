const fs = require('fs');
const path = require('path');
const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(body));
    }).on('error', reject);
  });
}

const regencies = [
  { code: '72.01', name: 'Kabupaten Banggai', defaultUlp: 'ULP Luwuk' },
  { code: '72.02', name: 'Kabupaten Poso', defaultUlp: 'ULP Poso' },
  { code: '72.03', name: 'Kabupaten Donggala', defaultUlp: 'ULP Donggala' },
  { code: '72.04', name: 'Kabupaten Tolitoli', defaultUlp: 'ULP Tolitoli' },
  { code: '72.05', name: 'Kabupaten Buol', defaultUlp: 'ULP Buol' },
  { code: '72.06', name: 'Kabupaten Morowali', defaultUlp: 'ULP Bungku' },
  { code: '72.07', name: 'Kabupaten Banggai Kepulauan', defaultUlp: 'ULP Banggai' },
  { code: '72.08', name: 'Kabupaten Parigi Moutong', defaultUlp: 'ULP Parigi' },
  { code: '72.09', name: 'Kabupaten Tojo Una-Una', defaultUlp: 'ULP Ampana' },
  { code: '72.10', name: 'Kabupaten Sigi', defaultUlp: 'ULP Kamonji' },
  { code: '72.11', name: 'Kabupaten Banggai Laut', defaultUlp: 'ULP Banggai' },
  { code: '72.12', name: 'Kabupaten Morowali Utara', defaultUlp: 'ULP Kolonedale' },
  { code: '72.71', name: 'Kota Palu', defaultUlp: 'ULP Palu Kota' }
];

// Refined ULP assignment based on kecamatan names
function resolveUlp(regCode, kecName) {
  const normKec = (kecName || '').toLowerCase();
  if (regCode === '72.03') {
    // Northern Donggala is served by ULP Tambu
    const tambuKecamatans = ['dampelas', 'sojol', 'sojol utara', 'balaesang', 'balaesang tanjung', 'sirenja', 'sindue', 'sindue tobatata', 'sindue tobata', 'sindue tombosabora'];
    if (tambuKecamatans.some(k => normKec.includes(k))) return 'ULP Tambu';
    return 'ULP Donggala';
  }
  if (regCode === '72.71') {
    if (normKec.includes('tawaeli') || normKec.includes('palu utara')) return 'ULP Taweli';
    if (normKec.includes('palu barat') || normKec.includes('ulujadi') || normKec.includes('tatanga')) return 'ULP Kamonji';
    return 'ULP Palu Kota';
  }
  if (regCode === '72.02') {
    if (normKec.includes('pamona') || normKec.includes('tentena')) return 'ULP Tentena';
    return 'ULP Poso';
  }
  const reg = regencies.find(r => r.code === regCode);
  return reg ? reg.defaultUlp : 'PLN UP3 Palu';
}

async function ingest() {
  console.log('[1/4] Mengunduh database nama kecamatan wilayah.sql...');
  const wilayahSql = await fetchUrl('https://raw.githubusercontent.com/cahyadsn/wilayah/master/db/wilayah.sql');
  const kecMap = new Map();
  for (const line of wilayahSql.split('\n')) {
    const match = line.match(/\('(72\.\d{2}\.\d{2})',\s*'([^']+)'\)/);
    if (match) {
      kecMap.set(match[1], match[2].trim());
    }
  }
  console.log(`-> Ditemukan ${kecMap.size} nama kecamatan di Sulawesi Tengah.`);

  console.log('[2/4] Mengunduh batas koordinat desa untuk 13 Kabupaten/Kota...');
  const allVillages = [];
  const kecClusters = new Map();

  for (const reg of regencies) {
    const url = `https://raw.githubusercontent.com/cahyadsn/wilayah_boundaries/master/db/kel/72/wilayah_boundaries_kel_${reg.code}.sql`;
    try {
      const sql = await fetchUrl(url);
      const matches = [...sql.matchAll(/\('([^']+)',\s*'([^']+)',\s*(-?\d+\.\d+),\s*(-?\d+\.\d+)/g)];
      console.log(`   - ${reg.name} (${reg.code}): ${matches.length} desa/kelurahan`);
      
      for (const m of matches) {
        const kelCode = m[1];
        const kelName = m[2].trim();
        const lat = parseFloat(m[3]);
        const lon = parseFloat(m[4]);
        const kecCode = kelCode.substring(0, 8);
        const kecName = kecMap.get(kecCode) || `Kecamatan ${kecCode}`;
        const ulp = resolveUlp(reg.code, kecName);

        allVillages.push({
          code: kelCode,
          name: kelName,
          lat,
          lon,
          kecamatan: kecName,
          regency: reg.name,
          ulp
        });

        if (!kecClusters.has(kecCode)) {
          kecClusters.set(kecCode, { code: kecCode, name: kecName, regCode: reg.code, regName: reg.name, lats: [], lons: [] });
        }
        kecClusters.get(kecCode).lats.push(lat);
        kecClusters.get(kecCode).lons.push(lon);
      }
    } catch (e) {
      console.error(`Gagal mengunduh ${reg.code}:`, e.message);
    }
  }

  console.log(`-> Total desa/kelurahan berhasil dimuat: ${allVillages.length}`);

  // Calculate Kecamatan centroids
  const allKecamatans = [];
  for (const [code, item] of kecClusters.entries()) {
    const avgLat = item.lats.reduce((a, b) => a + b, 0) / item.lats.length;
    const avgLon = item.lons.reduce((a, b) => a + b, 0) / item.lons.length;
    const ulp = resolveUlp(item.regCode, item.name);
    allKecamatans.push({
      code,
      name: item.name,
      lat: avgLat,
      lon: avgLon,
      regency: item.regName,
      ulp
    });
  }
  console.log(`-> Dihitung centroid untuk ${allKecamatans.length} kecamatan.`);

  console.log('[3/4] Menggabungkan data ke data/sulteng-places.json...');
  const rootDir = path.resolve(__dirname, '..');
  const sultengFile = path.join(rootDir, 'data', 'sulteng-places.json');
  let sultengObj = { version: 1, region: 'Sulawesi Tengah', updatedAt: new Date().toISOString(), places: [] };
  if (fs.existsSync(sultengFile)) {
    try {
      sultengObj = JSON.parse(fs.readFileSync(sultengFile, 'utf8'));
      if (!Array.isArray(sultengObj.places)) sultengObj.places = [];
    } catch {}
  }

  // Set of existing names in sulteng-places
  const existingPlaceKeys = new Set(sultengObj.places.map(p => `${p[0].toLowerCase()}|${p[1].toFixed(4)}|${p[2].toFixed(4)}`));
  let addedSultengCount = 0;

  function addPlace(name, lat, lon, cat, addr) {
    const key = `${name.toLowerCase()}|${lat.toFixed(4)}|${lon.toFixed(4)}`;
    if (!existingPlaceKeys.has(key)) {
      existingPlaceKeys.add(key);
      sultengObj.places.push([name, lat, lon, cat, addr]);
      addedSultengCount++;
    }
  }

  // Add all villages
  for (const v of allVillages) {
    const addr = `Kecamatan ${v.kecamatan}, ${v.regency}, Sulawesi Tengah`;
    // Add plain village name
    addPlace(v.name, v.lat, v.lon, 'desa', addr);
    // Add with "Desa " prefix if not starting with Kelurahan/Desa
    if (!/^desa\b/i.test(v.name) && !/^kelurahan\b/i.test(v.name)) {
      addPlace(`Desa ${v.name}`, v.lat, v.lon, 'desa', addr);
    }
  }

  // Add all kecamatans
  for (const k of allKecamatans) {
    const addr = `${k.regency}, Sulawesi Tengah`;
    addPlace(k.name, k.lat, k.lon, 'kecamatan', addr);
    if (!/^kecamatan\b/i.test(k.name)) {
      addPlace(`Kecamatan ${k.name}`, k.lat, k.lon, 'kecamatan', addr);
    }
  }

  sultengObj.total = sultengObj.places.length;
  sultengObj.updatedAt = new Date().toISOString();
  fs.writeFileSync(sultengFile, JSON.stringify(sultengObj, null, 2), 'utf8');
  console.log(`-> Berhasil menambahkan ${addedSultengCount} entri baru ke data/sulteng-places.json. Total sekarang: ${sultengObj.total}`);

  console.log('[4/4] Menggabungkan data ke data/known-locations.json...');
  const knownFile = path.join(rootDir, 'data', 'known-locations.json');
  let knownList = [];
  if (fs.existsSync(knownFile)) {
    try {
      knownList = JSON.parse(fs.readFileSync(knownFile, 'utf8'));
      if (!Array.isArray(knownList)) knownList = [];
    } catch {}
  }

  const existingKnownMap = new Map();
  for (const item of knownList) {
    if (item && item.location) {
      existingKnownMap.set(item.location.toLowerCase().trim(), item);
    }
  }

  let addedKnownCount = 0;
  function addKnown(location, lat, lon, displayName, ulp) {
    const locLower = location.toLowerCase().trim();
    if (!existingKnownMap.has(locLower)) {
      const entry = {
        location,
        latitude: lat,
        longitude: lon,
        displayName,
        ulpName: ulp
      };
      existingKnownMap.set(locLower, entry);
      knownList.push(entry);
      addedKnownCount++;
    }
  }

  for (const v of allVillages) {
    const disp = `Desa ${v.name}, Kec. ${v.kecamatan}, ${v.regency}`;
    addKnown(v.name, v.lat, v.lon, disp, v.ulp);
    if (!/^desa\b/i.test(v.name) && !/^kelurahan\b/i.test(v.name)) {
      addKnown(`Desa ${v.name}`, v.lat, v.lon, disp, v.ulp);
    }
  }

  for (const k of allKecamatans) {
    const disp = `Kecamatan ${k.name}, ${k.regency}`;
    addKnown(k.name, k.lat, k.lon, disp, k.ulp);
    if (!/^kecamatan\b/i.test(k.name)) {
      addKnown(`Kecamatan ${k.name}`, k.lat, k.lon, disp, k.ulp);
    }
  }

  fs.writeFileSync(knownFile, JSON.stringify(knownList, null, 2), 'utf8');
  console.log(`-> Berhasil menambahkan ${addedKnownCount} entri baru ke data/known-locations.json. Total sekarang: ${knownList.length}`);
  console.log('\n[SELESAI] Ingesti data wilayah & desa Kemendagri Sulawesi Tengah tuntas 100%!');
}

ingest().catch(console.error);
