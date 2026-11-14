const https = require('https');
const fs = require('fs');
const path = require('path');

// Bounding box for Greater Palu (Kota Palu, Sigi, Donggala coast, Pasangkayu border to Parigi)
// minLat, minLon, maxLat, maxLon
const BBOXES = [
  // Palu City core & valley
  { name: 'Palu Core', bbox: '-1.02,119.80,-0.80,119.98' },
  // Sigi & Southern Palu
  { name: 'Sigi & Palu Selatan', bbox: '-1.25,119.82,-1.02,120.02' },
  // Donggala & Palu Barat / Utara
  { name: 'Donggala & Palu Utara', bbox: '-0.80,119.65,-0.55,119.92' },
  // Parigi Moutong
  { name: 'Parigi Moutong', bbox: '-0.95,120.00,-0.75,120.35' }
];

function fetchOverpassBbox(bboxStr) {
  const query = `[out:json][timeout:60];
(
  nwr["highway"~"^(primary|secondary|tertiary|residential|unclassified|living_street|service)$"]["name"](${bboxStr});
  nwr["amenity"~"^(cafe|restaurant|fast_food|bank|atm|hospital|clinic|pharmacy|fuel|school|university|marketplace|police|townhall)$"]["name"](${bboxStr});
  nwr["shop"~"^(supermarket|convenience|bakery|coffee)$"]["name"](${bboxStr});
  nwr["tourism"~"^(hotel|guest_house)$"]["name"](${bboxStr});
  nwr["office"]["name"](${bboxStr});
);
out center tags;`;

  return new Promise((resolve, reject) => {
    const postData = 'data=' + encodeURIComponent(query);
    const req = https.request('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'PaluOutageMapBuilder/1.0'
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          return reject(new Error(`Overpass HTTP ${res.statusCode}: ${body.slice(0, 150)}`));
        }
        try {
          const json = JSON.parse(body);
          resolve(json.elements || []);
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function classifyElement(tags) {
  if (tags.amenity === 'cafe' || tags.shop === 'coffee') return 'cafe';
  if (tags.amenity === 'restaurant' || tags.amenity === 'fast_food') return 'kuliner';
  if (tags.amenity === 'hospital' || tags.amenity === 'clinic' || tags.amenity === 'pharmacy') return 'kesehatan';
  if (tags.amenity === 'bank' || tags.amenity === 'atm') return 'keuangan';
  if (tags.amenity === 'school' || tags.amenity === 'university') return 'pendidikan';
  if (tags.amenity === 'fuel') return 'spbu';
  if (tags.amenity === 'marketplace' || tags.shop) return 'belanja';
  if (tags.tourism) return 'penginapan';
  if (tags.office || tags.amenity === 'townhall' || tags.amenity === 'police') return 'kantor';
  if (tags.highway) return 'jalan';
  return 'tempat';
}

async function run() {
  console.log('Starting fetch for Sulawesi Tengah (Palu, Sigi, Donggala, Parimo)...');
  const allElements = [];

  for (const item of BBOXES) {
    console.log(`Fetching area: ${item.name} (${item.bbox})...`);
    try {
      const elements = await fetchOverpassBbox(item.bbox);
      console.log(`  -> Found ${elements.length} elements in ${item.name}`);
      allElements.push(...elements);
    } catch (err) {
      console.warn(`  -> Failed fetching ${item.name}: ${err.message}`);
    }
    // Respect rate limits with a small pause
    await new Promise(r => setTimeout(r, 1200));
  }

  console.log(`Total raw elements collected: ${allElements.length}`);

  // Deduplicate and process into compact format: [name, lat, lon, category, area]
  const placesMap = new Map();

  for (const el of allElements) {
    const tags = el.tags || {};
    const name = (tags.name || '').trim();
    if (!name || name.length < 2) continue;

    // Get lat, lon
    let lat = el.lat;
    let lon = el.lon;
    if ((lat === undefined || lon === undefined) && el.center) {
      lat = el.center.lat;
      lon = el.center.lon;
    }
    if (lat === undefined || lon === undefined) continue;

    lat = Math.round(lat * 1000000) / 1000000;
    lon = Math.round(lon * 1000000) / 1000000;

    const category = classifyElement(tags);
    const key = `${name.toLowerCase()}::${category}::${lat.toFixed(3)},${lon.toFixed(3)}`;

    if (!placesMap.has(key)) {
      placesMap.set(key, {
        name,
        lat,
        lon,
        category,
        sub: tags['addr:street'] || tags['addr:subdistrict'] || tags['is_in:city'] || ''
      });
    }
  }

  // Also merge existing known-locations.json if present
  const knownLocPath = path.join(__dirname, '..', 'data', 'known-locations.json');
  if (fs.existsSync(knownLocPath)) {
    try {
      const known = JSON.parse(fs.readFileSync(knownLocPath, 'utf8'));
      if (Array.isArray(known)) {
        for (const loc of known) {
          const name = (loc.location || loc.displayName || '').trim();
          if (!name || !loc.latitude || !loc.longitude) continue;
          const lat = Math.round(loc.latitude * 1000000) / 1000000;
          const lon = Math.round(loc.longitude * 1000000) / 1000000;
          const key = `${name.toLowerCase()}::jalan::${lat.toFixed(3)},${lon.toFixed(3)}`;
          if (!placesMap.has(key)) {
            placesMap.set(key, {
              name,
              lat,
              lon,
              category: 'jalan',
              sub: loc.ulpName || 'PLN'
            });
          }
        }
      }
    } catch (e) {
      console.warn('Could not read known-locations:', e.message);
    }
  }

  // Convert to compact array: [name, lat, lon, category, sub]
  const entries = [...placesMap.values()].map(p => [
    p.name,
    p.lat,
    p.lon,
    p.category,
    p.sub
  ]);

  // Sort alphabetically
  entries.sort((a, b) => a[0].localeCompare(b[0]));

  const outputObj = {
    version: 1,
    region: 'Sulawesi Tengah (Palu, Sigi, Donggala, Parimo)',
    updatedAt: new Date().toISOString(),
    total: entries.length,
    places: entries
  };

  const outPath = path.join(__dirname, '..', 'data', 'sulteng-places.json');
  fs.writeFileSync(outPath, JSON.stringify(outputObj), 'utf8');
  const stat = fs.statSync(outPath);

  console.log(`SUCCESS! Saved ${entries.length} unique places & streets to ${outPath}`);
  console.log(`File size: ${(stat.size / 1024).toFixed(1)} KB`);

  // Count by category
  const counts = {};
  for (const e of entries) {
    counts[e[3]] = (counts[e[3]] || 0) + 1;
  }
  console.log('Categories count:', counts);
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
