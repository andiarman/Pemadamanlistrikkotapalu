const fs = require('fs');
const path = require('path');

const apiKey = process.argv[2] || process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyDIptYMiyL1tDy9pQaNeOcgb61AWF7uCuk';
const dataPath = path.join(__dirname, '..', 'data', 'places', 'palu-coffeeshop-resto.json');
const places = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log(`Starting opening hours enrichment for ${places.length} places in Palu...`);

async function fetchPlaceHours(id) {
  try {
    const url = `https://places.googleapis.com/v1/places/${id}?languageCode=id`;
    const res = await fetch(url, {
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'id,regularOpeningHours,currentOpeningHours'
      }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

function parseHours(pData) {
  const reg = pData?.regularOpeningHours || pData?.currentOpeningHours;
  if (!reg) {
    return {
      hasHours: false,
      isOpen24Hours: false,
      hoursText: 'Jam buka belum tersedia',
      openTime: null,
      closeTime: null,
      periods: []
    };
  }

  const periods = reg.periods || [];
  const weekdays = reg.weekdayDescriptions || [];
  const text0 = (weekdays[0] || '').toLowerCase();
  const isOpen24 = text0.includes('24 jam') || text0.includes('24 hours') ||
    periods.some(p => p.open && !p.close) ||
    periods.some(p => p.open?.hour === 0 && p.open?.minute === 0 && p.close?.hour === 0 && p.close?.minute === 0);

  let openTime = null;
  let closeTime = null;
  let hoursText = isOpen24 ? 'Buka 24 Jam' : 'Jam buka bervariasi';

  if (!isOpen24 && periods.length > 0) {
    const p0 = periods[0];
    if (p0.open) {
      const oh = String(p0.open.hour || 0).padStart(2, '0');
      const om = String(p0.open.minute || 0).padStart(2, '0');
      openTime = `${oh}:${om}`;
    }
    if (p0.close) {
      const ch = String(p0.close.hour || 0).padStart(2, '0');
      const cm = String(p0.close.minute || 0).padStart(2, '0');
      closeTime = `${ch}:${cm}`;
    }
    if (openTime && closeTime) {
      hoursText = `${openTime} - ${closeTime}`;
    }
  }

  return {
    hasHours: true,
    openNow: Boolean(reg.openNow),
    isOpen24Hours: isOpen24,
    openTime: openTime,
    closeTime: closeTime,
    hoursText: hoursText,
    weekdayDescriptions: weekdays,
    periods: periods
  };
}

async function run() {
  const BATCH_SIZE = 15;
  let enrichedCount = 0;
  let count24h = 0;

  for (let i = 0; i < places.length; i += BATCH_SIZE) {
    const chunk = places.slice(i, i + BATCH_SIZE);
    process.stdout.write(`Processing [${i + 1}-${Math.min(i + BATCH_SIZE, places.length)}/${places.length}]... `);

    const results = await Promise.all(chunk.map(p => fetchPlaceHours(p.id)));

    for (let j = 0; j < chunk.length; j++) {
      const p = chunk[j];
      const hData = results[j];
      const hoursInfo = parseHours(hData);

      p.operatingHours = hoursInfo;

      // Tagging features
      p.features = p.features || [];
      if (hoursInfo.isOpen24Hours) {
        count24h++;
        if (!p.features.includes('Buka 24 Jam')) p.features.unshift('Buka 24 Jam');
      } else if (hoursInfo.openTime) {
        const hOpen = parseInt(hoursInfo.openTime.split(':')[0], 10);
        if (hOpen <= 8 && !p.features.includes('Buka Pagi')) {
          p.features.push('Buka Pagi');
        }
      }

      if (hoursInfo.hasHours) enrichedCount++;
    }

    console.log(`OK`);
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\nEnrichment finished!`);
  console.log(`- Places with official hours: ${enrichedCount}/${places.length}`);
  console.log(`- Places open 24 Hours: ${count24h}`);

  fs.writeFileSync(dataPath, JSON.stringify(places, null, 2), 'utf8');
  console.log(`Saved enriched data to ${dataPath}`);
}

run().catch(console.error);
