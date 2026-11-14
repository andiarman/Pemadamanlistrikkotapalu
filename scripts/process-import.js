const fs = require('fs');
const path = require('path');

const streetAliases = {
  tg: "tanjung", tj: "tanjung", tlk: "teluk", gn: "gunung", g: "gunung",
  s: "sungai", l: "lorong", gg: "gang", mesjid: "masjid", jendral: "jenderal",
  ar: "abdul rahman",
  moh: "muhammad", muh: "muhammad", mohamad: "muhammad", m: "muhammad",
  a: "ahmad", dr: "dokter", prof: "profesor",
  i: "1", ii: "2", iii: "3", iv: "4", v: "5", vi: "6"
};

const streetHonorifics = new Set([
  "dr", "dokter", "prof", "profesor", "hj", "haji", "h", "ir", "drs",
  "jendral", "jenderal", "sultan"
]);

const streetIgnoredTokens = new Set([
  "jalan", "raya", "sebagian", "dalam",
  "gang", "lorong", "dokter", "profesor", "haji", "jenderal", "sultan",
  "dr", "prof", "hj", "h", "ir", "drs"
]);

function normalizeStreetName(value) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/^(?:jl\.?|jalan)\s*/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function isStreetLeadingNoise(token) {
  return streetHonorifics.has(token) || /^[a-z]$/.test(token);
}

function streetNameForms(value) {
  const raw = normalizeStreetName(value).split(" ").filter(Boolean);
  const forms = [raw];
  let trimmed = [...raw];
  while (trimmed.length > 1 && isStreetLeadingNoise(trimmed[0])) trimmed = trimmed.slice(1);
  if (trimmed.length !== raw.length) forms.push(trimmed);
  return forms;
}

function streetNameVariants(value) {
  const variants = new Set();
  const add = (list) => {
    if (!list.length) return;
    variants.add(list.join(" "));
    variants.add(list.join(""));
  };
  for (const form of streetNameForms(value)) {
    const expanded = form.map((token) => streetAliases[token] || token)
      .flatMap((token) => token.split(" "))
      .filter(Boolean);
    const bases = [expanded, form];
    for (const base of bases) {
      const lists = [base];
      const withoutNoise = base.filter((token) => !streetIgnoredTokens.has(token));
      if (withoutNoise.length && withoutNoise.length !== base.length) lists.push(withoutNoise);
      const withoutInitials = base.filter((token) => !/^[a-z]$/.test(token));
      if (withoutInitials.length && withoutInitials.length !== base.length) lists.push(withoutInitials);
      for (const list of [...lists]) {
        if (list.length > 1 && /^\d$/.test(list[list.length - 1])) lists.push(list.slice(0, -1));
      }
      for (const list of lists) add(list);
    }
  }
  return [...variants];
}

function streetDistance(left, right) {
  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let row = 1; row <= left.length; row++) {
    const current = [row];
    for (let column = 1; column <= right.length; column++) {
      current[column] = Math.min(
        previous[column] + 1,
        current[column - 1] + 1,
        previous[column - 1] + (left[row - 1] === right[column - 1] ? 0 : 1)
      );
    }
    previous = current;
  }
  return previous[right.length];
}

function buildStreetIndex(entries) {
  const points = new Map();
  const squashed = new Map();
  const keep = (map, key, point) => {
    const current = map.get(key);
    if (!current || point.kind < current.kind) map.set(key, point);
  };
  for (const entry of entries) {
    let name, latitude, longitude, kind;
    if (Array.isArray(entry)) {
      [name, latitude, longitude, kind] = entry;
    } else if (entry && typeof entry === 'object') {
      name = entry.location || entry.name;
      latitude = entry.latitude;
      longitude = entry.longitude;
      kind = entry.kind || 0;
    }
    if (typeof name !== "string" || typeof latitude !== "number" || typeof longitude !== "number") continue;
    const point = { name, latitude, longitude, kind: typeof kind === "number" ? kind : 2 };
    for (const variant of streetNameVariants(name)) {
      if (!variant) continue;
      if (variant.includes(" ")) keep(points, variant, point);
      else keep(squashed, variant, point);
    }
  }
  return {
    points,
    spacedKeys: [...points.keys()],
    squashed,
    squashedKeys: [...squashed.keys()]
  };
}

function findIndexedStreet(index, locationName) {
  if (!index) return null;
  const variants = streetNameVariants(locationName);
  for (const variant of variants) {
    const point = variant.includes(" ") ? index.points.get(variant) : index.squashed.get(variant);
    if (point) return point;
  }
  for (const variant of variants) {
    if (variant.includes(" ") || variant.length < 6) continue;
    let best = null;
    for (const key of index.squashedKeys) {
      if (key.length <= variant.length || key.length - variant.length > 12) continue;
      if (!key.startsWith(variant)) continue;
      const point = index.squashed.get(key);
      if (!best || point.kind < best.kind) best = point;
    }
    if (best) return best;
  }
  let best = null;
  let bestScore = 0;
  const consider = (key, target, point) => {
    if (Math.abs(key.length - target.length) > 4) return;
    const score = 1 - streetDistance(key, target) / Math.max(key.length, target.length);
    if (score > bestScore) {
      bestScore = score;
      best = point;
    }
  };
  for (const variant of variants) {
    if (variant.includes(" ") || variant.length < 6) continue;
    for (const key of index.squashedKeys) consider(key, variant, index.squashed.get(key));
  }
  for (const variant of variants) {
    if (!variant.includes(" ") || variant.replace(/ /g, "").length < 6) continue;
    for (const key of index.spacedKeys) consider(key, variant, index.points.get(key));
  }
  return bestScore >= 0.86 ? best : null;
}

async function notifyWorkerStatus(statusData) {
  const workerUrl = process.env.WORKER_URL || "https://outage-map-app.vaultman.workers.dev";
  const workerSecret = process.env.WORKER_SECRET || "";
  try {
    const res = await fetch(`${workerUrl}/api/import-status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(workerSecret ? { "X-Worker-Secret": workerSecret } : {})
      },
      body: JSON.stringify(statusData),
      signal: AbortSignal.timeout(1500)
    });
    if (res.ok) {
      console.log(`[Worker] Status notified: ${statusData.status} (${statusData.progressPercent || 0}%)`);
    }
  } catch (err) {
    // Non-fatal, just log and continue
  }
}

function getUlpContext(ulpName) {
  const value = (ulpName || "").toLowerCase();
  if (value.includes("palu") || value.includes("kamonji")) return "Kota Palu, Sulawesi Tengah";
  if (value.includes("taweli")) return "Tawaeli, Kota Palu, Sulawesi Tengah";
  if (value.includes("tamb") || value.includes("donggala")) return "Kabupaten Donggala, Sulawesi Tengah";
  if (value.includes("parigi")) return "Kabupaten Parigi Moutong, Sulawesi Tengah";
  if (value.includes("poso") || value.includes("tentena")) return "Kabupaten Poso, Sulawesi Tengah";
  if (value.includes("kolonedale")) return "Kabupaten Morowali Utara, Sulawesi Tengah";
  if (value.includes("bungku")) return "Kabupaten Morowali, Sulawesi Tengah";
  return "Sulawesi Tengah, Indonesia";
}

async function resolveWithGoogleMaps(locationName, ulpName, apiKey) {
  if (!apiKey || !locationName) return null;
  const context = getUlpContext(ulpName);
  const cleanName = locationName.trim();
  const query = `${cleanName}, ${context}`;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status === "OK" && Array.isArray(data.results) && data.results.length > 0) {
      const top = data.results[0];
      const lat = top.geometry?.location?.lat;
      const lon = top.geometry?.location?.lng;
      if (typeof lat === "number" && typeof lon === "number" &&
          lat >= -4.5 && lat <= 2.0 && lon >= 117.0 && lon <= 125.5) {
        return {
          latitude: lat,
          longitude: lon,
          displayName: top.formatted_address || `${cleanName}, ${context}`
        };
      }
    }
  } catch (err) {
    console.warn(`[Google Maps Warning] "${cleanName}": ${err.message}`);
  }
  return null;
}

async function main() {
  const rootDir = path.resolve(__dirname, '..');
  const pendingFile = path.join(rootDir, 'data', 'pending-import.json');
  const statusFile = path.join(rootDir, 'data', 'import-status.json');
  const knownLocationsFile = path.join(rootDir, 'data', 'known-locations.json');
  const sultengPlacesFile = path.join(rootDir, 'data', 'sulteng-places.json');
  const paluIndexFile = path.join(rootDir, 'data', 'osm-index-palu.json');

  let dateKey, events = [], pendingData = {};

  if (fs.existsSync(pendingFile)) {
    try {
      pendingData = JSON.parse(fs.readFileSync(pendingFile, 'utf8'));
      dateKey = pendingData.date;
      events = pendingData.events || [];
    } catch (err) {
      console.error('[Error] Invalid pending-import.json:', err.message);
      process.exit(1);
    }
  } else {
    // Mode pengkayaan (enrichment) bila ada file jadwal aktif di data/
    const dataDir = path.join(rootDir, 'data');
    const scheduleFiles = fs.readdirSync(dataDir).filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f));
    if (scheduleFiles.length > 0) {
      const activeFile = path.join(dataDir, scheduleFiles[0]);
      try {
        const activeData = JSON.parse(fs.readFileSync(activeFile, 'utf8'));
        dateKey = activeData.date;
        events = activeData.events || [];
        console.log(`[Info] Memproses pengkayaan untuk jadwal aktif: ${scheduleFiles[0]}`);
      } catch {}
    }
  }

  if (!dateKey || !events.length) {
    console.log('[Info] Tidak ada data/pending-import.json atau jadwal aktif. Selesai.');
    return;
  }

  console.log(`[Start] Processing import for date: ${dateKey} with ${events.length} events...`);

  // Load known locations
  let knownEntries = [];
  if (fs.existsSync(knownLocationsFile)) {
    try {
      knownEntries = JSON.parse(fs.readFileSync(knownLocationsFile, 'utf8'));
    } catch {}
  }
  if (fs.existsSync(sultengPlacesFile)) {
    try {
      const sultengObj = JSON.parse(fs.readFileSync(sultengPlacesFile, 'utf8'));
      const places = Array.isArray(sultengObj) ? sultengObj : (sultengObj && sultengObj.places) || [];
      for (const item of places) {
        if (Array.isArray(item)) {
          const [name, lat, lon] = item;
          if (name && typeof lat === 'number' && typeof lon === 'number') {
            knownEntries.push({ location: name, latitude: lat, longitude: lon, displayName: name });
          }
        }
      }
    } catch {}
  }
  if (fs.existsSync(paluIndexFile)) {
    try {
      const paluOsm = JSON.parse(fs.readFileSync(paluIndexFile, 'utf8'));
      if (Array.isArray(paluOsm.entries)) {
        for (const [name, lat, lon] of paluOsm.entries) {
          knownEntries.push({ location: name, latitude: lat, longitude: lon, displayName: name });
        }
      }
    } catch {}
  }

  console.log(`[Index] Building street index with ${knownEntries.length} known reference points...`);
  const streetIndex = buildStreetIndex(knownEntries);

  // Count total streets
  let totalStreets = 0;
  for (const ev of events) {
    for (const area of (ev.affectedAreas || [])) {
      totalStreets += (area.locations || []).length;
    }
  }

  console.log(`[Total] Streets to process: ${totalStreets}`);

  // Initial status notification
  const initialStatus = {
    status: "processing",
    date: dateKey,
    totalStreets,
    mappedStreets: 0,
    progressPercent: 5,
    startedAt: pendingData.startedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    message: `Server memproses ${totalStreets} lokasi jalan...`
  };
  fs.writeFileSync(statusFile, JSON.stringify(initialStatus, null, 2));
  await notifyWorkerStatus(initialStatus);

  let mappedCount = 0;
  let processedCount = 0;
  let lastReportedTime = Date.now();
  const googleApiKey = process.env.GOOGLE_MAPS_API_KEY || '';
  const newlyLearnedPlaces = [];

  if (googleApiKey) {
    console.log('[Google Maps] GOOGLE_MAPS_API_KEY terdeteksi. Fitur auto-learn lokasi aktif!');
  } else {
    console.log('[Google Maps] GOOGLE_MAPS_API_KEY tidak disetel. Menggunakan indeks lokal & OSM saja.');
  }

  for (const ev of events) {
    for (const area of (ev.affectedAreas || [])) {
      if (!Array.isArray(area.points)) area.points = [];
      const existingPoints = new Map(area.points.map((p) => [p.location, p]));

      for (const loc of (area.locations || [])) {
        processedCount++;
        let point = existingPoints.get(loc);

        if (!point) {
          const match = findIndexedStreet(streetIndex, loc);
          if (match) {
            point = {
              location: loc,
              latitude: match.latitude,
              longitude: match.longitude,
              displayName: match.name
            };
            area.points.push(point);
            existingPoints.set(loc, point);
          } else if (googleApiKey) {
            const gMatch = await resolveWithGoogleMaps(loc, area.ulpName, googleApiKey);
            if (gMatch) {
              point = {
                location: loc,
                latitude: gMatch.latitude,
                longitude: gMatch.longitude,
                displayName: gMatch.displayName
              };
              area.points.push(point);
              existingPoints.set(loc, point);
              newlyLearnedPlaces.push({
                location: loc,
                latitude: gMatch.latitude,
                longitude: gMatch.longitude,
                displayName: gMatch.displayName,
                ulpName: area.ulpName
              });
              streetIndex.points.set(loc.toLowerCase().trim(), {
                name: loc,
                latitude: gMatch.latitude,
                longitude: gMatch.longitude,
                kind: 1
              });
              console.log(`[Google Maps Auto-Learn] "${loc}" (${area.ulpName}) -> ${gMatch.latitude.toFixed(4)}, ${gMatch.longitude.toFixed(4)}`);
              await new Promise((r) => setTimeout(r, 60));
            }
          }
        }

        if (point) {
          mappedCount++;
        }

        // Report progress every 3 seconds or 50 streets
        const now = Date.now();
        if (now - lastReportedTime > 3000 || processedCount === totalStreets) {
          lastReportedTime = now;
          const pct = Math.min(95, Math.round((processedCount / totalStreets) * 90) + 5);
          const liveStatus = {
            status: "processing",
            date: dateKey,
            totalStreets,
            mappedStreets: mappedCount,
            progressPercent: pct,
            startedAt: initialStatus.startedAt,
            updatedAt: new Date().toISOString(),
            message: `Memetakan jalan: ${mappedCount} dari ${totalStreets} lokasi cocok (${pct}%)...`
          };
          fs.writeFileSync(statusFile, JSON.stringify(liveStatus, null, 2));
          await notifyWorkerStatus(liveStatus);
        }
      }
    }
  }

  // Simpan lokasi baru hasil auto-learn Google Maps ke database repo
  if (newlyLearnedPlaces.length > 0) {
    try {
      if (fs.existsSync(knownLocationsFile)) {
        const knownList = JSON.parse(fs.readFileSync(knownLocationsFile, 'utf8'));
        const knownSet = new Set(knownList.map((k) => (k.location || '').toLowerCase().trim()));
        let addedToKnown = 0;
        for (const item of newlyLearnedPlaces) {
          const key = item.location.toLowerCase().trim();
          if (!knownSet.has(key)) {
            knownList.push({
              location: item.location,
              latitude: item.latitude,
              longitude: item.longitude,
              displayName: item.displayName,
              ulpName: item.ulpName,
              source: "google-maps-auto-learn",
              addedAt: new Date().toISOString()
            });
            knownSet.add(key);
            addedToKnown++;
          }
        }
        fs.writeFileSync(knownLocationsFile, JSON.stringify(knownList, null, 2), 'utf8');
        console.log(`[Auto-Learn] Menambahkan ${addedToKnown} lokasi baru ke data/known-locations.json.`);
      }

      if (fs.existsSync(sultengPlacesFile)) {
        const sultengObj = JSON.parse(fs.readFileSync(sultengPlacesFile, 'utf8'));
        if (Array.isArray(sultengObj.places)) {
          const sultengSet = new Set(sultengObj.places.map((p) => (p[0] || '').toLowerCase().trim()));
          let addedToSulteng = 0;
          for (const item of newlyLearnedPlaces) {
            const key = item.location.toLowerCase().trim();
            if (!sultengSet.has(key)) {
              sultengObj.places.push([item.location, item.latitude, item.longitude, "terverifikasi", item.displayName]);
              sultengSet.add(key);
              addedToSulteng++;
            }
          }
          sultengObj.total = sultengObj.places.length;
          sultengObj.updatedAt = new Date().toISOString();
          fs.writeFileSync(sultengPlacesFile, JSON.stringify(sultengObj, null, 2), 'utf8');
          console.log(`[Auto-Learn] Menambahkan ${addedToSulteng} tempat baru ke data/sulteng-places.json. Total tempat: ${sultengObj.total}`);
        }
      }
    } catch (saveErr) {
      console.warn('[Warning] Gagal menyimpan data auto-learn:', saveErr.message);
    }
  }

  console.log(`[Finished] Mapped ${mappedCount} of ${totalStreets} streets (${Math.round((mappedCount / totalStreets) * 100)}%).`);

  // Write finalized schedule file
  const scheduleData = {
    schema_version: 1,
    date: dateKey,
    generated_at: new Date().toISOString(),
    events: events
  };
  const targetScheduleFile = path.join(rootDir, 'data', `${dateKey}.json`);
  fs.writeFileSync(targetScheduleFile, JSON.stringify(scheduleData, null, 2));
  console.log(`[Saved] Wrote ${targetScheduleFile}`);

  // Generate unmatched locations report automatically
  try {
    const unmatchedList = [];
    for (const ev of events) {
      const timeSlot = `${ev.startTime} s/d ${ev.endTime}`;
      for (const area of (ev.affectedAreas || [])) {
        const pointNames = new Set((area.points || []).map(p => (p.location || '').toLowerCase().trim()));
        for (const loc of (area.locations || [])) {
          if (!pointNames.has(loc.toLowerCase().trim())) {
            unmatchedList.push({
              location: loc,
              ulpName: area.ulpName,
              timeSlot: timeSlot,
              reason: 'Belum terdata di OpenStreetMap / Nominatim'
            });
          }
        }
      }
    }
    const unmatchedFile = path.join(rootDir, 'data', 'unmatched-locations.json');
    fs.writeFileSync(unmatchedFile, JSON.stringify({
      date: dateKey,
      generatedAt: new Date().toISOString(),
      summary: {
        totalLocations: totalStreets,
        totalMatched: mappedCount,
        totalUnmatched: unmatchedList.length,
        matchRatePercent: Math.round((mappedCount / totalStreets) * 100)
      },
      unmatchedLocations: unmatchedList
    }, null, 2));
    console.log(`[Report] Saved data/unmatched-locations.json with ${unmatchedList.length} unmatched locations.`);
  } catch (err) {
    console.warn('[Warning] Could not write unmatched report:', err.message);
  }

  // Hapus jadwal lama di folder data agar jadwal baru menggantikan jadwal sebelumnya secara bersih
  try {
    const dataDir = path.join(rootDir, 'data');
    for (const fileName of fs.readdirSync(dataDir)) {
      if (/^\d{4}-\d{2}-\d{2}\.json$/.test(fileName) && fileName !== `${dateKey}.json`) {
        fs.unlinkSync(path.join(dataDir, fileName));
        console.log(`[Replaced] Menghapus jadwal lama: ${fileName}`);
      }
    }
  } catch (cleanErr) {
    console.warn('[Warning] Gagal membersihkan arsip lama:', cleanErr.message);
  }

  // Final status: done
  const finalStatus = {
    status: "done",
    date: dateKey,
    totalStreets,
    mappedStreets: mappedCount,
    progressPercent: 100,
    startedAt: initialStatus.startedAt,
    completedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    message: `Pemetaan selesai! ${mappedCount} dari ${totalStreets} lokasi berhasil dipetakan di server.`
  };
  fs.writeFileSync(statusFile, JSON.stringify(finalStatus, null, 2));
  await notifyWorkerStatus(finalStatus);

  // Clean up pending import
  try {
    fs.unlinkSync(pendingFile);
    console.log('[Cleanup] Removed data/pending-import.json');
  } catch (err) {
    console.warn('[Warning] Could not remove pending file:', err.message);
  }

  console.log('[Done] Server import process completed successfully.');
}

main().catch((err) => {
  console.error('[Fatal Error]', err);
  process.exit(1);
});
