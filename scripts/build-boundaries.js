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
  { code: '72.01', name: 'Kabupaten Banggai', slug: 'banggai' },
  { code: '72.02', name: 'Kabupaten Poso', slug: 'poso' },
  { code: '72.03', name: 'Kabupaten Donggala', slug: 'donggala' },
  { code: '72.04', name: 'Kabupaten Tolitoli', slug: 'tolitoli' },
  { code: '72.05', name: 'Kabupaten Buol', slug: 'buol' },
  { code: '72.06', name: 'Kabupaten Morowali', slug: 'morowali' },
  { code: '72.07', name: 'Kabupaten Banggai Kepulauan', slug: 'banggai-kepulauan' },
  { code: '72.08', name: 'Kabupaten Parigi Moutong', slug: 'parigi-moutong' },
  { code: '72.09', name: 'Kabupaten Tojo Una-Una', slug: 'tojo-una-una' },
  { code: '72.10', name: 'Kabupaten Sigi', slug: 'sigi' },
  { code: '72.11', name: 'Kabupaten Banggai Laut', slug: 'banggai-laut' },
  { code: '72.12', name: 'Kabupaten Morowali Utara', slug: 'morowali-utara' },
  { code: '72.71', name: 'Kota Palu', slug: 'kota-palu' }
];

function convertCoords(node) {
  if (Array.isArray(node) && typeof node[0] === 'number' && typeof node[1] === 'number') {
    const lat = Math.round(node[0] * 100000) / 100000;
    const lng = Math.round(node[1] * 100000) / 100000;
    return [lng, lat]; // GeoJSON standard: [longitude, latitude]
  }
  return node.map(convertCoords);
}

function detectGeometryType(coords) {
  // If coords[0][0][0] is array, it's MultiPolygon
  if (Array.isArray(coords) && Array.isArray(coords[0]) && Array.isArray(coords[0][0]) && Array.isArray(coords[0][0][0])) {
    return 'MultiPolygon';
  }
  return 'Polygon';
}

async function main() {
  console.log('[1/3] Mengunduh database nama kecamatan...');
  const wilayahSql = await fetchUrl('https://raw.githubusercontent.com/cahyadsn/wilayah/master/db/wilayah.sql');
  const kecMap = new Map();
  for (const line of wilayahSql.split('\n')) {
    const match = line.match(/\('(72\.\d{2}\.\d{2})',\s*'([^']+)'\)/);
    if (match) {
      kecMap.set(match[1], match[2].trim());
    }
  }
  console.log(`-> Ditemukan ${kecMap.size} nama kecamatan di Sulawesi Tengah.`);

  const outDir = path.resolve(__dirname, '..', 'data', 'boundaries');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const manifest = [];
  let totalVillagesAcrossSulteng = 0;

  console.log('[2/3] Mengunduh dan mengonversi batas poligon untuk 13 Kabupaten/Kota...');
  for (const reg of regencies) {
    const url = `https://raw.githubusercontent.com/cahyadsn/wilayah_boundaries/master/db/kel/72/wilayah_boundaries_kel_${reg.code}.sql`;
    try {
      const sql = await fetchUrl(url);
      const matches = [...sql.matchAll(/\('([^']+)',\s*'([^']+)',\s*(-?\d+\.\d+),\s*(-?\d+\.\d+),\s*'(\[\[.+?\]\])'\)/gs)];
      
      const features = [];
      let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;

      for (const m of matches) {
        const kelCode = m[1];
        const kelName = m[2].trim();
        const lat = parseFloat(m[3]);
        const lon = parseFloat(m[4]);
        const rawCoords = JSON.parse(m[5]);
        const geoCoords = convertCoords(rawCoords);
        const geomType = detectGeometryType(geoCoords);

        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
        if (lon < minLng) minLng = lon;
        if (lon > maxLng) maxLng = lon;

        const kecCode = kelCode.substring(0, 8);
        const kecName = kecMap.get(kecCode) || `Kecamatan ${kecCode}`;

        features.push({
          type: 'Feature',
          id: kelCode,
          properties: {
            code: kelCode,
            name: kelName,
            kecamatan: kecName,
            regency: reg.name,
            regCode: reg.code,
            lat: Math.round(lat * 100000) / 100000,
            lon: Math.round(lon * 100000) / 100000
          },
          geometry: {
            type: geomType,
            coordinates: geoCoords
          }
        });
      }

      const geojson = {
        type: 'FeatureCollection',
        name: `Batas Kelurahan/Desa ${reg.name}`,
        crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } },
        features
      };

      const filename = `${reg.code}-${reg.slug}.geojson`;
      const filePath = path.join(outDir, filename);
      fs.writeFileSync(filePath, JSON.stringify(geojson), 'utf8');

      const stats = fs.statSync(filePath);
      const fileSizeKb = (stats.size / 1024).toFixed(1);

      console.log(`   ✓ ${reg.name}: ${features.length} desa/kelurahan -> ${filename} (${fileSizeKb} KB)`);
      totalVillagesAcrossSulteng += features.length;

      manifest.push({
        code: reg.code,
        name: reg.name,
        slug: reg.slug,
        file: `data/boundaries/${filename}`,
        villagesCount: features.length,
        center: [
          Math.round(((minLat + maxLat) / 2) * 10000) / 10000,
          Math.round(((minLng + maxLng) / 2) * 10000) / 10000
        ],
        bbox: [
          Math.round(minLng * 10000) / 10000,
          Math.round(minLat * 10000) / 10000,
          Math.round(maxLng * 10000) / 10000,
          Math.round(maxLat * 10000) / 10000
        ]
      });
    } catch (e) {
      console.error(`   ✗ Gagal mengonversi ${reg.name}:`, e.message);
    }
  }

  console.log('[3/3] Menulis manifest data/boundaries/manifest.json...');
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

  console.log(`\n[SELESAI] Berhasil mengekstrak ${totalVillagesAcrossSulteng} poligon kelurahan/desa untuk 13 Kabupaten/Kota Sulawesi Tengah!`);
}

main().catch(console.error);
