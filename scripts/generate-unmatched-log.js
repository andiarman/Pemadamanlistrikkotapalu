const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const scheduleFile = path.join(rootDir, 'data', '2026-11-14.json');
const outputFile = path.join(rootDir, 'data', 'unmatched-locations.json');

if (!fs.existsSync(scheduleFile)) {
  console.error('File data/2026-11-14.json not found!');
  process.exit(1);
}

const schedule = JSON.parse(fs.readFileSync(scheduleFile, 'utf8'));

function categorizeLocation(name, ulp) {
  const ulpLower = (ulp || '').toLowerCase();
  const nameLower = (name || '').toLowerCase();

  let region = 'Sulawesi Tengah';
  if (ulpLower.includes('palu') || ulpLower.includes('kamonji')) region = 'Kota Palu';
  else if (ulpLower.includes('donggala') || ulpLower.includes('tambu')) region = 'Kab. Donggala';
  else if (ulpLower.includes('taweli')) region = 'Kota Palu (Tawaeli)';
  else if (ulpLower.includes('poso') || ulpLower.includes('tentena')) region = 'Kab. Poso';
  else if (ulpLower.includes('parigi')) region = 'Kab. Parigi Moutong';
  else if (ulpLower.includes('kolonedale')) region = 'Kab. Morowali Utara';
  else if (ulpLower.includes('bungku')) region = 'Kab. Morowali';

  let reason = 'Belum terdata di OpenStreetMap / Nominatim dunia';
  let type = 'desa/wilayah';

  if (nameLower.startsWith('jalan ') || nameLower.startsWith('jl.') || nameLower.startsWith('lrg') || nameLower.startsWith('lorong')) {
    reason = 'Jalan/lorong lokal belum memiliki geometri garis di OSM';
    type = 'jalan/lorong';
  } else if (nameLower.startsWith('btn') || nameLower.startsWith('perum') || nameLower.startsWith('kompleks')) {
    reason = 'Kompleks perumahan/komersial baru belum ada tag POI di OSM';
    type = 'perumahan';
  } else if (nameLower.startsWith('pt ') || nameLower.startsWith('cv ')) {
    reason = 'Fasilitas industri/perusahaan swasta belum tercatat di OSM';
    type = 'industri';
  } else if (region !== 'Kota Palu') {
    reason = 'Desa/dusun di pedalaman belum memiliki node permukiman di OSM';
    type = 'desa/pedalaman';
  }

  return { region, type, reason };
}

const unmatchedList = [];
let totalLocations = 0;
let totalMatched = 0;

for (const ev of (schedule.events || [])) {
  const timeSlot = `${ev.startTime} s/d ${ev.endTime}`;
  for (const area of (ev.affectedAreas || [])) {
    const pointNames = new Set((area.points || []).map(p => (p.location || '').toLowerCase().trim()));
    for (const loc of (area.locations || [])) {
      totalLocations++;
      const key = loc.toLowerCase().trim();
      if (pointNames.has(key)) {
        totalMatched++;
      } else {
        const meta = categorizeLocation(loc, area.ulpName);
        unmatchedList.push({
          location: loc,
          ulpName: area.ulpName,
          region: meta.region,
          type: meta.type,
          reason: meta.reason,
          timeSlot: timeSlot
        });
      }
    }
  }
}

// Group by ULP
const byUlp = {};
for (const item of unmatchedList) {
  if (!byUlp[item.ulpName]) byUlp[item.ulpName] = [];
  byUlp[item.ulpName].push(item);
}

const report = {
  date: schedule.date || '2026-11-14',
  generatedAt: new Date().toISOString(),
  summary: {
    totalLocations,
    totalMatched,
    totalUnmatched: unmatchedList.length,
    matchRatePercent: Math.round((totalMatched / totalLocations) * 100),
    unmatchedByUlp: Object.fromEntries(Object.entries(byUlp).map(([ulp, items]) => [ulp, items.length]))
  },
  unmatchedLocations: unmatchedList
};

fs.writeFileSync(outputFile, JSON.stringify(report, null, 2), 'utf8');
console.log(`[Report Generated] ${outputFile}`);
console.log(`Summary: ${totalMatched} matched, ${unmatchedList.length} unmatched out of ${totalLocations} total (${report.summary.matchRatePercent}% matched)`);
