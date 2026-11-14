const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const knownLocationsFile = path.join(rootDir, 'data', 'known-locations.json');
const sultengPlacesFile = path.join(rootDir, 'data', 'sulteng-places.json');

const curatedPlaces = [
  { name: 'Palu Grand Mall', lat: -0.8872, lon: 119.8519, cat: 'belanja', addr: 'Jl. Diponegoro No.1, Lere', ulp: 'ULP Kamonji' },
  { name: 'Ramayana Palu', lat: -0.9064, lon: 119.8821, cat: 'belanja', addr: 'Jl. Wolter Monginsidi, Lolu Selatan', ulp: 'ULP Palu Kota' },
  { name: 'Ramayana', lat: -0.9064, lon: 119.8821, cat: 'belanja', addr: 'Jl. Wolter Monginsidi, Lolu Selatan', ulp: 'ULP Palu Kota' },
  { name: 'Palu Plaza', lat: -0.8932, lon: 119.8576, cat: 'belanja', addr: 'Jl. Danau Poso / Sis Al Jufri, Siranindi', ulp: 'ULP Kamonji' },
  { name: 'Kompleks Palu Plaza', lat: -0.8932, lon: 119.8576, cat: 'belanja', addr: 'Jl. Danau Poso / Sis Al Jufri, Siranindi', ulp: 'ULP Kamonji' },
  { name: 'Palu Square', lat: -0.9042, lon: 119.8775, cat: 'belanja', addr: 'Jl. Monginsidi / Hasanuddin', ulp: 'ULP Palu Kota' },
  { name: 'Kompleks Pasar Bambaru', lat: -0.8902, lon: 119.8588, cat: 'belanja', addr: 'Jl. Teuku Umar / Bambaru, Palu', ulp: 'ULP Kamonji' },
  { name: 'Kompleks Pergudangan', lat: -0.8540, lon: 119.8950, cat: 'komersial', addr: 'Jl. Soekarno Hatta, Tondo', ulp: 'ULP Palu Kota' },
  { name: 'Kompleks Gudang Wings', lat: -0.8715, lon: 119.8220, cat: 'komersial', addr: 'Jl. Malonda, Tipo', ulp: 'ULP Kamonji' },
  { name: 'Hotel Santika Palu', lat: -0.8974, lon: 119.8768, cat: 'hotel', addr: 'Jl. Moh. Hatta No.18, Lolu Utara', ulp: 'ULP Palu Kota' },
  { name: 'Hotel Santika', lat: -0.8974, lon: 119.8768, cat: 'hotel', addr: 'Jl. Moh. Hatta No.18, Lolu Utara', ulp: 'ULP Palu Kota' },
  { name: 'Villa Sutan Raja', lat: -0.9168, lon: 119.8975, cat: 'hotel', addr: 'Jl. Dr. Abdurrahman Saleh No.45, Birobuli Utara', ulp: 'ULP Palu Kota' },
  { name: 'Sutan Raja Hotel', lat: -0.9168, lon: 119.8975, cat: 'hotel', addr: 'Jl. Dr. Abdurrahman Saleh No.45, Birobuli Utara', ulp: 'ULP Palu Kota' },
  { name: 'Sriti Ballroom', lat: -0.8953, lon: 119.8529, cat: 'fasilitas', addr: 'Jl. Durian No.88, Kamonji', ulp: 'ULP Kamonji' },
  { name: 'Vila Doda', lat: -0.9167, lon: 119.8315, cat: 'hotel', addr: 'Doda, Kinovaro', ulp: 'ULP Kamonji' },
  { name: 'Villa Doda', lat: -0.9167, lon: 119.8315, cat: 'hotel', addr: 'Doda, Kinovaro', ulp: 'ULP Kamonji' },
  { name: 'Hotel Grand Duta', lat: -0.8928, lon: 119.8795, cat: 'hotel', addr: 'Jl. Dr. Sutomo No.77, Besusu Tengah', ulp: 'ULP Palu Kota' },
  { name: 'RSUD Anutapura', lat: -0.9038, lon: 119.8492, cat: 'kesehatan', addr: 'Jl. Kangkung No.1, Donggala Kodi', ulp: 'ULP Kamonji' },
  { name: 'RSUD Anutapura Palu', lat: -0.9038, lon: 119.8492, cat: 'kesehatan', addr: 'Jl. Kangkung No.1, Donggala Kodi', ulp: 'ULP Kamonji' },
  { name: 'RS Islam', lat: -0.9171, lon: 119.8876, cat: 'kesehatan', addr: 'Jl. Banteng No.1, Birobuli Selatan', ulp: 'ULP Palu Kota' },
  { name: 'RS Islam Siti Maryam', lat: -0.9171, lon: 119.8876, cat: 'kesehatan', addr: 'Jl. Banteng No.1, Birobuli Selatan', ulp: 'ULP Palu Kota' },
  { name: 'RS Torabelo', lat: -0.9858, lon: 119.9231, cat: 'kesehatan', addr: 'Jl. Trans Palu - Kulawi, Desa Sidera, Sigi', ulp: 'ULP Palu Kota' },
  { name: 'RSUD Torabelo Sigi', lat: -0.9858, lon: 119.9231, cat: 'kesehatan', addr: 'Jl. Trans Palu - Kulawi, Desa Sidera, Sigi', ulp: 'ULP Palu Kota' },
  { name: 'Asrama Korem', lat: -0.8877, lon: 119.8552, cat: 'pemerintahan', addr: 'Jl. WR Supratman, Lere', ulp: 'ULP Kamonji' },
  { name: 'Kompleks TNI AL', lat: -0.8755, lon: 119.8402, cat: 'pemerintahan', addr: 'Watusampu / Lere', ulp: 'ULP Kamonji' },
  { name: 'Kantor Lurah Kabonena', lat: -0.8876, lon: 119.8368, cat: 'pemerintahan', addr: 'Kabonena, Ulujadi', ulp: 'ULP Kamonji' },
  { name: 'Kantor Lurah Balaroa', lat: -0.8955, lon: 119.8451, cat: 'pemerintahan', addr: 'Balaroa, Palu Barat', ulp: 'ULP Kamonji' },
  { name: 'Kantor Lurah Donggala Kodi', lat: -0.9012, lon: 119.8521, cat: 'pemerintahan', addr: 'Donggala Kodi, Palu Barat', ulp: 'ULP Kamonji' },
  { name: 'Kantor Desa Tinggede', lat: -0.9288, lon: 119.8662, cat: 'pemerintahan', addr: 'Tinggede, Marawola, Sigi', ulp: 'ULP Kamonji' },
  { name: 'Kantor Polres Parigi', lat: -0.8062, lon: 120.1912, cat: 'pemerintahan', addr: 'Jl. Trans Sulawesi, Parigi', ulp: 'ULP Parigi' },
  { name: 'SPN Labuan', lat: -0.6628, lon: 119.8698, cat: 'pendidikan', addr: 'Labuan Panimba, Kec. Labuan, Donggala', ulp: 'ULP Taweli' },
  { name: 'Terminal Tipo', lat: -0.8653, lon: 119.8188, cat: 'transportasi', addr: 'Kelurahan Tipo, Ulujadi', ulp: 'ULP Kamonji' },
  { name: 'UIN Datokarama Palu - Kampus I Palu', lat: -0.8883, lon: 119.8550, cat: 'pendidikan', addr: 'Jl. Diponegoro No.23, Lere', ulp: 'ULP Kamonji' },
  { name: 'Universitas IAIN', lat: -0.8883, lon: 119.8550, cat: 'pendidikan', addr: 'Jl. Diponegoro No.23, Lere', ulp: 'ULP Kamonji' },
  { name: 'Untad', lat: -0.8358, lon: 119.8942, cat: 'pendidikan', addr: 'Kampus Bumi Tadulako Tondo', ulp: 'ULP Palu Kota' },
  { name: 'Universitas Tadulako', lat: -0.8358, lon: 119.8942, cat: 'pendidikan', addr: 'Kampus Bumi Tadulako Tondo', ulp: 'ULP Palu Kota' },
  { name: 'Perumdos Untad', lat: -0.8392, lon: 119.8978, cat: 'perumahan', addr: 'Tondo, Kec. Mantikulore', ulp: 'ULP Palu Kota' },
  { name: 'Stadion Gawalise', lat: -0.9126, lon: 119.8435, cat: 'olahraga', addr: 'Kelurahan Duyu, Tatanga', ulp: 'ULP Kamonji' },
  { name: 'Bundaran STQ', lat: -0.8527, lon: 119.8903, cat: 'landmark', addr: 'Jl. Soekarno-Hatta, Tondo', ulp: 'ULP Palu Kota' },
  { name: 'Taman Bundaran Hasanudin', lat: -0.9030, lon: 119.8770, cat: 'taman', addr: 'Bundaran Hasanuddin, Palu', ulp: 'ULP Palu Kota' },
  { name: 'Kuburan Cina', lat: -0.8712, lon: 119.8925, cat: 'fasilitas', addr: 'Talise / Poboya, Mantikulore', ulp: 'ULP Palu Kota' },
  { name: 'Huntap Balaroa', lat: -0.8986, lon: 119.8395, cat: 'perumahan', addr: 'Kelurahan Balaroa, Palu Barat', ulp: 'ULP Kamonji' },
  { name: 'Huntap Duyu', lat: -0.9185, lon: 119.8412, cat: 'perumahan', addr: 'Kelurahan Duyu, Tatanga', ulp: 'ULP Kamonji' },
  { name: 'Huntap Pombowe', lat: -0.9842, lon: 119.9535, cat: 'perumahan', addr: 'Desa Pombowe, Sigi Biromaru', ulp: 'ULP Palu Kota' },
  { name: 'Perum Silae Hills', lat: -0.8752, lon: 119.8285, cat: 'perumahan', addr: 'Kelurahan Silae, Ulujadi', ulp: 'ULP Kamonji' },
  { name: 'BTN Silae Permai', lat: -0.8785, lon: 119.8320, cat: 'perumahan', addr: 'Kelurahan Silae, Ulujadi', ulp: 'ULP Kamonji' },
  { name: 'Perum Taman Ria Estate', lat: -0.8805, lon: 119.8355, cat: 'perumahan', addr: 'Silae / Kabonena', ulp: 'ULP Kamonji' },
  { name: 'Perum Bukit Nirwana', lat: -0.9140, lon: 119.8390, cat: 'perumahan', addr: 'Duyu / Balaroa', ulp: 'ULP Kamonji' },
  { name: 'PT Pelabuhan Indonesia Pantoloan', lat: -0.7061, lon: 119.8556, cat: 'industri', addr: 'Pelabuhan Pantoloan, Tawaeli', ulp: 'ULP Taweli' },
  { name: 'PT CONCH', lat: -0.6925, lon: 119.8672, cat: 'industri', addr: 'Baiya, Tawaeli', ulp: 'ULP Taweli' },
  { name: 'PT Semen Tonasa', lat: -0.7015, lon: 119.8580, cat: 'industri', addr: 'Pantoloan, Tawaeli', ulp: 'ULP Taweli' },
  { name: 'Pangsarop Bea Cukai', lat: -0.7095, lon: 119.8542, cat: 'pemerintahan', addr: 'Pantoloan, Tawaeli', ulp: 'ULP Taweli' },
  { name: 'Jalan Basuki Rahmat Bawah', lat: -0.9085, lon: 119.8850, cat: 'jalan', addr: 'Birobuli Utara / Lolu Selatan', ulp: 'ULP Palu Kota' },
  { name: 'Jalan Basuki Rahmat Atas', lat: -0.9120, lon: 119.8780, cat: 'jalan', addr: 'Tatura Selatan / Palu Selatan', ulp: 'ULP Palu Kota' },
  { name: 'Jalan M. Thamrin Bawah', lat: -0.8905, lon: 119.8745, cat: 'jalan', addr: 'Besusu Tengah / Besusu Barat', ulp: 'ULP Palu Kota' },
  { name: 'Jalan M. Thamrin Atas', lat: -0.8980, lon: 119.8765, cat: 'jalan', addr: 'Lolu Utara', ulp: 'ULP Palu Kota' },
  { name: 'Jalan MH. Thamrin Bawah', lat: -0.8905, lon: 119.8745, cat: 'jalan', addr: 'Besusu Tengah / Besusu Barat', ulp: 'ULP Palu Kota' },
  { name: 'Jalan Veteran Bawah', lat: -0.9002, lon: 119.8805, cat: 'jalan', addr: 'Lolu Utara / Lolu Selatan', ulp: 'ULP Palu Kota' },
  { name: 'Jalan Veteran Atas', lat: -0.9075, lon: 119.8835, cat: 'jalan', addr: 'Lolu Selatan / Tatura', ulp: 'ULP Palu Kota' },
  { name: 'Jalan Tangkasi Atas', lat: -0.9185, lon: 119.8920, cat: 'jalan', addr: 'Birobuli Selatan', ulp: 'ULP Palu Kota' },
  { name: 'Jalan Asam I', lat: -0.8985, lon: 119.8480, cat: 'jalan', addr: 'Donggala Kodi, Palu Barat', ulp: 'ULP Kamonji' },
  { name: 'Jalan Asam II', lat: -0.8995, lon: 119.8495, cat: 'jalan', addr: 'Donggala Kodi, Palu Barat', ulp: 'ULP Kamonji' },
  { name: 'Jalan Poros Palu - Palolo', lat: -0.9750, lon: 119.9250, cat: 'jalan', addr: 'Sigi Biromaru', ulp: 'ULP Palu Kota' },
  { name: 'Jalur Gaza', lat: -0.9015, lon: 119.8420, cat: 'jalan', addr: 'Donggala Kodi / Balaroa', ulp: 'ULP Kamonji' },
  { name: 'Lorong Bakso', lat: -0.8965, lon: 119.8710, cat: 'jalan', addr: 'Palu Barat', ulp: 'ULP Palu Kota' },
  { name: 'Lorong Saleko', lat: -0.9142, lon: 119.8655, cat: 'jalan', addr: 'Palu Selatan', ulp: 'ULP Palu Kota' },
  { name: 'Lorong Perjuangan', lat: -0.9150, lon: 119.8680, cat: 'jalan', addr: 'Palu Selatan', ulp: 'ULP Palu Kota' },
  { name: 'Lorong Permata Hijau', lat: -0.9125, lon: 119.8720, cat: 'jalan', addr: 'Palu Selatan', ulp: 'ULP Palu Kota' },
  { name: 'Lorong Sintuvu', lat: -0.9110, lon: 119.8740, cat: 'jalan', addr: 'Palu Selatan', ulp: 'ULP Palu Kota' }
];

// 1. Update known-locations.json
let known = [];
if (fs.existsSync(knownLocationsFile)) {
  known = JSON.parse(fs.readFileSync(knownLocationsFile, 'utf8'));
}
const knownSet = new Set(known.map(k => (k.location || '').toLowerCase().trim()));
let knownAdded = 0;

for (const p of curatedPlaces) {
  const key = p.name.toLowerCase().trim();
  if (!knownSet.has(key)) {
    known.push({
      location: p.name,
      latitude: p.lat,
      longitude: p.lon,
      displayName: `${p.name}, ${p.addr}`,
      ulpName: p.ulp
    });
    knownSet.add(key);
    knownAdded++;
  }
}
fs.writeFileSync(knownLocationsFile, JSON.stringify(known, null, 2), 'utf8');
console.log(`[Known] Added ${knownAdded} new locations. Total: ${known.length}`);

// 2. Update sulteng-places.json
let sultengData = { version: '1.0.0', region: 'Sulawesi Tengah', updatedAt: new Date().toISOString(), total: 0, places: [] };
if (fs.existsSync(sultengPlacesFile)) {
  sultengData = JSON.parse(fs.readFileSync(sultengPlacesFile, 'utf8'));
}
const sultengSet = new Set((sultengData.places || []).map(p => (p[0] || '').toLowerCase().trim()));
let sultengAdded = 0;

for (const p of curatedPlaces) {
  const key = p.name.toLowerCase().trim();
  if (!sultengSet.has(key)) {
    sultengData.places.push([p.name, p.lat, p.lon, p.cat, p.addr]);
    sultengSet.add(key);
    sultengAdded++;
  }
}
sultengData.total = sultengData.places.length;
sultengData.updatedAt = new Date().toISOString();
fs.writeFileSync(sultengPlacesFile, JSON.stringify(sultengData, null, 2), 'utf8');
console.log(`[Sulteng] Added ${sultengAdded} new places. Total: ${sultengData.total}`);
