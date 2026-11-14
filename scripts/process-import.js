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
  "jalan", "raya", "atas", "bawah", "sebagian", "baru", "lama", "dalam",
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

async function main() {
  const rootDir = path.resolve(__dirname, '..');
  const pendingFile = path.join(rootDir, 'data', 'pending-import.json');
  const statusFile = path.join(rootDir, 'data', 'import-status.json');
  const knownLocationsFile = path.join(rootDir, 'data', 'known-locations.json');
  const paluIndexFile = path.join(rootDir, 'data', 'osm-index-palu.json');

  if (!fs.existsSync(pendingFile)) {
    console.log('[Info] No data/pending-import.json found. Nothing to process.');
    return;
  }

  const rawPending = fs.readFileSync(pendingFile, 'utf8');
  let pendingData;
  try {
    pendingData = JSON.parse(rawPending);
  } catch (err) {
    console.error('[Error] Invalid pending-import.json:', err.message);
    process.exit(1);
  }

  const dateKey = pendingData.date;
  const events = pendingData.events || [];
  if (!dateKey || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey) || !events.length) {
    console.error('[Error] Pending import missing valid date (YYYY-MM-DD) or events.');
    process.exit(1);
  }

  console.log(`[Start] Processing import for date: ${dateKey} with ${events.length} events...`);

  // Load known locations
  let knownEntries = [];
  if (fs.existsSync(knownLocationsFile)) {
    try {
      knownEntries = JSON.parse(fs.readFileSync(knownLocationsFile, 'utf8'));
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
