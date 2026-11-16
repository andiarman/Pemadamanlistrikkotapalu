const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const knownFile = path.join(rootDir, 'data', 'known-locations.json');
const sultengFile = path.join(rootDir, 'data', 'sulteng-places.json');

const newSpots = [
  // ULP Palu Kota
  { location: 'Jalan Pieretendean', lat: -0.8893, lon: 119.8743, disp: 'Jalan Pierre Tendean, Palu', ulp: 'ULP Palu Kota' },
  { location: 'Jalan Pierre Tendean', lat: -0.8893, lon: 119.8743, disp: 'Jalan Pierre Tendean, Palu', ulp: 'ULP Palu Kota' },
  { location: 'Jalan Mulawarman', lat: -0.8920, lon: 119.8640, disp: 'Jalan Mulawarman, Palu', ulp: 'ULP Palu Kota' },
  { location: 'Jalan Sempati Air', lat: -0.9230, lon: 119.9050, disp: 'Jalan Sempati Air, Birobuli, Palu Selatan', ulp: 'ULP Palu Kota' },
  { location: 'Jalan Batavia', lat: -0.9240, lon: 119.9060, disp: 'Jalan Batavia, Birobuli, Palu Selatan', ulp: 'ULP Palu Kota' },
  { location: 'Pincara', lat: -0.8875, lon: 119.8580, disp: 'Penyeberangan Pincara Sungai Palu, Palu', ulp: 'ULP Palu Kota' },
  { location: 'Jalan Dae Matalu', lat: -0.8420, lon: 119.8970, disp: 'Jalan Dae Matalu, Tondo, Palu', ulp: 'ULP Palu Kota' },
  { location: 'Jalan Sigma', lat: -0.8385, lon: 119.8965, disp: 'Jalan Sigma Untad, Tondo, Palu', ulp: 'ULP Palu Kota' },

  // ULP Palu Kota & ULP Kamonji
  { location: 'Jalan Monginsidi', lat: -0.9085, lon: 119.8785, disp: 'Jalan Wolter Monginsidi, Palu Selatan', ulp: 'ULP Palu Kota dan ULP Kamonji' },
  { location: 'Jalan Wolter Monginsidi', lat: -0.9085, lon: 119.8785, disp: 'Jalan Wolter Monginsidi, Palu Selatan', ulp: 'ULP Palu Kota dan ULP Kamonji' },
  { location: 'Jalan Darusalam', lat: -0.8935, lon: 119.8528, disp: 'Jalan Darussalam / Kompleks Masjid Agung, Palu Barat', ulp: 'ULP Palu Kota dan ULP Kamonji' },
  { location: 'Jalan Darussalam', lat: -0.8935, lon: 119.8528, disp: 'Jalan Darussalam, Palu Barat', ulp: 'ULP Palu Kota dan ULP Kamonji' },
  { location: 'Loru Biromaru', lat: -0.9439, lon: 120.0061, disp: 'Desa Loru, Sigi Biromaru, Sigi', ulp: 'ULP Palu Kota dan ULP Kamonji' },
  { location: 'Jalan Pramuka Sigi', lat: -0.9550, lon: 119.8900, disp: 'Jalan Pramuka Sigi, Mpanau, Sigi Biromaru', ulp: 'ULP Palu Kota dan ULP Kamonji' },
  { location: 'Jalan Touwa', lat: -0.9150, lon: 119.8920, disp: 'Jalan Touwa, Palu Selatan', ulp: 'ULP Palu Kota dan ULP Kamonji' },

  // ULP Kamonji
  { location: 'Jalan Cokro Aminoto', lat: -0.8925, lon: 119.8580, disp: 'Jalan H.O.S Cokroaminoto, Palu Barat', ulp: 'ULP Kamonji' },
  { location: 'Jalan Cokroaminoto', lat: -0.8925, lon: 119.8580, disp: 'Jalan Cokroaminoto, Palu Barat', ulp: 'ULP Kamonji' },
  { location: 'Jalan S. Mili', lat: -0.8960, lon: 119.8510, disp: 'Jalan Sungai Mili, Palu Barat', ulp: 'ULP Kamonji' },
  { location: 'Jalan Sungai Mili', lat: -0.8960, lon: 119.8510, disp: 'Jalan Sungai Mili, Palu Barat', ulp: 'ULP Kamonji' },
  { location: 'Jalan S. Kinore', lat: -0.8970, lon: 119.8520, disp: 'Jalan Sungai Kinore, Palu Barat', ulp: 'ULP Kamonji' },
  { location: 'Jalan Sungai Kinore', lat: -0.8970, lon: 119.8520, disp: 'Jalan Sungai Kinore, Palu Barat', ulp: 'ULP Kamonji' },
  { location: 'Jalan Semanggi', lat: -0.8940, lon: 119.8530, disp: 'Jalan Semanggi, Kamonji, Palu Barat', ulp: 'ULP Kamonji' },
  { location: 'Jalan Kramat Jati', lat: -0.8950, lon: 119.8540, disp: 'Jalan Kramat Jati, Kamonji, Palu Barat', ulp: 'ULP Kamonji' },
  { location: 'Jalan Ogomojolo', lat: -0.9020, lon: 119.8600, disp: 'Jalan Ogomojolo, Palu Barat', ulp: 'ULP Kamonji' },
  { location: 'Jalan Sungai Tanamea', lat: -0.8980, lon: 119.8530, disp: 'Jalan Sungai Tanamea, Palu Barat', ulp: 'ULP Kamonji' },
  { location: 'Jalan Bungi Indah', lat: -0.8990, lon: 119.8450, disp: 'Jalan Bungi Indah, Duyu, Palu Barat', ulp: 'ULP Kamonji' },
  { location: 'Jalan Palola', lat: -0.8930, lon: 119.8560, disp: 'Jalan Palola, Kamonji, Palu Barat', ulp: 'ULP Kamonji' },
  { location: 'Jalan Tamaco', lat: -0.8945, lon: 119.8570, disp: 'Jalan Tamaco / Tamako, Kamonji, Palu Barat', ulp: 'ULP Kamonji' },
  { location: 'Jalan Timbarante', lat: -0.8955, lon: 119.8550, disp: 'Jalan Timbarante, Kamonji, Palu Barat', ulp: 'ULP Kamonji' },
  { location: 'Jalan Angsana Raya', lat: -0.9320, lon: 119.8690, disp: 'Jalan Angsana Raya, Tinggede / Marawola', ulp: 'ULP Kamonji' },
  { location: 'Jalan Kinta Baru', lat: -0.8965, lon: 119.8560, disp: 'Jalan Kinta Baru, Kamonji, Palu Barat', ulp: 'ULP Kamonji' },
  { location: 'Kawole', lat: -0.9580, lon: 119.8820, disp: 'Dusun Kawole, Kalukubula, Sigi', ulp: 'ULP Kamonji' },
  { location: 'Jalan Poros Palu - Donggala', lat: -0.8750, lon: 119.8350, disp: 'Jalan Poros Palu - Donggala, Buluri', ulp: 'ULP Kamonji' },
  { location: 'Jalan Datu Adam', lat: -0.8910, lon: 119.8480, disp: 'Jalan Datu Adam, Donggala Kodi, Palu Barat', ulp: 'ULP Kamonji' },

  // ULP Kota (Palu Selatan)
  { location: 'Jalan Hamengkubuwono', lat: -0.9120, lon: 119.8850, disp: 'Jalan Hamengkubuwono, Palu Selatan', ulp: 'ULP Kota' },
  { location: 'Jalan Peladuk', lat: -0.9220, lon: 119.8960, disp: 'Jalan Peladuk, Birobuli Selatan, Palu Selatan', ulp: 'ULP Kota' },
  { location: 'Jalan Mawasm', lat: -0.9210, lon: 119.8950, disp: 'Jalan Mawas, Birobuli Selatan, Palu Selatan', ulp: 'ULP Kota' },
  { location: 'Jalan Mawas', lat: -0.9210, lon: 119.8950, disp: 'Jalan Mawas, Birobuli Selatan, Palu Selatan', ulp: 'ULP Kota' },
  { location: 'Jalan Pintu Air', lat: -0.9180, lon: 119.8800, disp: 'Jalan Pintu Air, Tatura Selatan, Palu Selatan', ulp: 'ULP Kota' },
  { location: 'Jalan Purnabakti', lat: -0.9380, lon: 119.8920, disp: 'Jalan Purnabakti, Palu Selatan', ulp: 'ULP Kota' },
  { location: 'Perumahan Griya Permai', lat: -0.9350, lon: 119.8860, disp: 'Perumahan Griya Permai, Palu Selatan', ulp: 'ULP Kota' },

  // ULP Taweli & Pantoloan (Pabrik, Industri, & Jalan)
  { location: 'PT Duco Food Indonesia', lat: -0.7180, lon: 119.8620, disp: 'PT Duco Food Indonesia, KIP Pantoloan, Palu', ulp: 'ULP Taweli' },
  { location: 'PT Maleo Paksi Ayu', lat: -0.7190, lon: 119.8630, disp: 'PT Maleo Paksi Ayu, KIP Pantoloan, Palu', ulp: 'ULP Taweli' },
  { location: 'PT Artakindo Multi Perkasa', lat: -0.7200, lon: 119.8640, disp: 'PT Artakindo Multi Perkasa, KIP Pantoloan, Palu', ulp: 'ULP Taweli' },
  { location: 'PT Agro Manunggal Cocos', lat: -0.7210, lon: 119.8650, disp: 'PT Agro Manunggal Cocos, KIP Pantoloan, Palu', ulp: 'ULP Taweli' },
  { location: 'PT Haycarb', lat: -0.7220, lon: 119.8660, disp: 'PT Haycarb, KIP Pantoloan, Palu', ulp: 'ULP Taweli' },
  { location: 'PT Japfa', lat: -0.7230, lon: 119.8670, disp: 'PT Japfa, KIP Pantoloan, Palu', ulp: 'ULP Taweli' },
  { location: 'PT SPO Agro Resources', lat: -0.7240, lon: 119.8680, disp: 'PT SPO Agro Resources, KIP Pantoloan, Palu', ulp: 'ULP Taweli' },
  { location: 'PT Prima Gelora (Big Land)', lat: -0.7250, lon: 119.8690, disp: 'PT Prima Gelora (Big Land), KIP Pantoloan, Palu', ulp: 'ULP Taweli' },
  { location: 'CV Mitra Bangun Nusantara', lat: -0.7260, lon: 119.8700, disp: 'CV Mitra Bangun Nusantara, KIP Pantoloan, Palu', ulp: 'ULP Taweli' },
  { location: 'PT Cipta Agro Nusantara', lat: -0.7270, lon: 119.8710, disp: 'PT Cipta Agro Nusantara, KIP Pantoloan, Palu', ulp: 'ULP Taweli' },
  { location: 'PT Megah Batu Abadi', lat: -0.7280, lon: 119.8720, disp: 'PT Megah Batu Abadi, KIP Pantoloan, Palu', ulp: 'ULP Taweli' },
  { location: 'PT Putra Labuan Mandiri', lat: -0.6850, lon: 119.8450, disp: 'PT Putra Labuan Mandiri, Labuan, Palu Utara', ulp: 'ULP Taweli' },
  { location: 'PT Sentra Labuan Tegar', lat: -0.6860, lon: 119.8460, disp: 'PT Sentra Labuan Tegar, Labuan, Palu Utara', ulp: 'ULP Taweli' },
  { location: 'Jalan Marjuni', lat: -0.7150, lon: 119.8680, disp: 'Jalan Marjuni, Pantoloan, Tawaeli', ulp: 'ULP Taweli' },
  { location: 'Jalan Andudana', lat: -0.7160, lon: 119.8690, disp: 'Jalan Andudana, Pantoloan, Tawaeli', ulp: 'ULP Taweli' },
  { location: 'Jalan Vatamoento', lat: -0.7170, lon: 119.8700, disp: 'Jalan Vatamoento, Pantoloan, Tawaeli', ulp: 'ULP Taweli' },
  { location: 'Jalan Tanah Nolo', lat: -0.7180, lon: 119.8710, disp: 'Jalan Tanah Nolo, Pantoloan, Tawaeli', ulp: 'ULP Taweli' },
  { location: 'Jalan Moh Nasir', lat: -0.7190, lon: 119.8720, disp: 'Jalan Moh Nasir, Pantoloan, Tawaeli', ulp: 'ULP Taweli' },
  { location: 'Jalan Logo', lat: -0.7140, lon: 119.8670, disp: 'Jalan Logo, Pantoloan, Tawaeli', ulp: 'ULP Taweli' },
  { location: 'Jalan Vinase', lat: -0.7130, lon: 119.8660, disp: 'Jalan Vinase, Pantoloan, Tawaeli', ulp: 'ULP Taweli' },
  { location: 'Jalan Uevuku', lat: -0.7120, lon: 119.8650, disp: 'Jalan Uevuku, Pantoloan, Tawaeli', ulp: 'ULP Taweli' },
  { location: 'Jalan Ino Toa', lat: -0.7820, lon: 119.8610, disp: 'Jalan Ino Toa, Taipa, Palu Utara', ulp: 'ULP Taweli' },
  { location: 'Jalan Kayu Rampe', lat: -0.7830, lon: 119.8620, disp: 'Jalan Kayu Rampe, Taipa, Palu Utara', ulp: 'ULP Taweli' },
  { location: 'Jalan Kekentina', lat: -0.7840, lon: 119.8630, disp: 'Jalan Kekentina, Taipa, Palu Utara', ulp: 'ULP Taweli' },
  { location: 'Jalan Lamarani', lat: -0.7850, lon: 119.8640, disp: 'Jalan Lamarani, Taipa, Palu Utara', ulp: 'ULP Taweli' },
  { location: 'Jalan Pagaru Lemba', lat: -0.7860, lon: 119.8650, disp: 'Jalan Pagaru Lemba, Taipa, Palu Utara', ulp: 'ULP Taweli' },
  { location: 'Jalan Rata Lemba', lat: -0.7870, lon: 119.8660, disp: 'Jalan Rata Lemba, Taipa, Palu Utara', ulp: 'ULP Taweli' },
  { location: 'Jalan Rende Lele', lat: -0.7880, lon: 119.8670, disp: 'Jalan Rende Lele, Taipa, Palu Utara', ulp: 'ULP Taweli' },
  { location: 'Jalan H. Sabange', lat: -0.7200, lon: 119.8730, disp: 'Jalan H. Sabange, Tawaeli', ulp: 'ULP Taweli' },
  { location: 'Jalan Pengga Lembah', lat: -0.7210, lon: 119.8740, disp: 'Jalan Pengga Lembah, Tawaeli', ulp: 'ULP Taweli' },
  { location: 'Jalan H. Patilla', lat: -0.7220, lon: 119.8750, disp: 'Jalan H. Patilla, Tawaeli', ulp: 'ULP Taweli' },
  { location: 'Jalan Kayu Riya', lat: -0.7230, lon: 119.8760, disp: 'Jalan Kayu Riya, Tawaeli', ulp: 'ULP Taweli' },
  { location: 'Jalan Makagili', lat: -0.7240, lon: 119.8770, disp: 'Jalan Makagili, Tawaeli', ulp: 'ULP Taweli' },
  { location: 'Jalan Pueboya', lat: -0.7250, lon: 119.8780, disp: 'Jalan Pueboya, Pantoloan Boya, Tawaeli', ulp: 'ULP Taweli' },
  { location: 'Sisere', lat: -0.7100, lon: 119.8800, disp: 'Dusun Sisere, Tawaeli, Palu Utara', ulp: 'ULP Taweli' },

  // ULP Donggala (Sigi & Donggala)
  { location: 'Saluki', lat: -1.2840, lon: 119.9850, disp: 'Desa Saluki, Gumbasa, Sigi', ulp: 'ULP Donggala' },
  { location: 'Pangana', lat: -1.2950, lon: 119.9920, disp: 'Dusun Pangana, Gumbasa, Sigi', ulp: 'ULP Donggala' },
  { location: 'Lili', lat: -1.3100, lon: 120.0150, disp: 'Desa Bulili / Lili, Nokilalaki, Sigi', ulp: 'ULP Donggala' },
  { location: 'Pobia', lat: -1.3250, lon: 120.0250, disp: 'Dusun Pobia, Nokilalaki, Sigi', ulp: 'ULP Donggala' },
  { location: 'Makuhi', lat: -1.4500, lon: 119.9500, disp: 'Desa Poleroa Makuhi, Kulawi, Sigi', ulp: 'ULP Donggala' },
  { location: 'Lembatangoa', lat: -1.1776, lon: 120.2665, disp: 'Desa Lembantongoa, Palolo, Sigi', ulp: 'ULP Donggala' },
  { location: 'Paloloan', lat: -1.1214, lon: 120.1583, disp: 'Kecamatan Palolo, Sigi', ulp: 'ULP Donggala' },
  { location: 'Sigimpum Sintuwu', lat: -1.1350, lon: 120.1700, disp: 'Desa Sigimpu & Sintuwu, Palolo, Sigi', ulp: 'ULP Donggala' },
  { location: 'Bilili', lat: -1.3300, lon: 120.0300, disp: 'Dusun Bilili, Nokilalaki, Sigi', ulp: 'ULP Donggala' },
  { location: 'Napu', lat: -1.3650, lon: 120.2850, disp: 'Dataran Napu, Lore Utara', ulp: 'ULP Donggala' },
  { location: 'Dusun Rumah Tujuh', lat: -0.6800, lon: 119.7400, disp: 'Dusun Rumah Tujuh, Banawa, Donggala', ulp: 'ULP Donggala' },
  { location: 'Dusun Pangga', lat: -0.9200, lon: 119.7200, disp: 'Dusun Taipanggabe / Pangga, Marawola Barat', ulp: 'ULP Donggala' },
  { location: 'Lapaloang', lat: -1.2500, lon: 119.5500, disp: 'Dusun Lapaloang, Rio Pakava, Donggala', ulp: 'ULP Donggala' },
  { location: 'Kulolu', lat: -1.2600, lon: 119.5600, disp: 'Dusun Kulolu, Rio Pakava, Donggala', ulp: 'ULP Donggala' },

  // ULP Poso
  { location: 'Petiro Bajo', lat: -1.8200, lon: 120.7300, disp: 'Desa Petiro / Petiro Bajo, Pamona Timur, Poso', ulp: 'ULP Poso' },
  { location: 'Ratolene', lat: -1.4150, lon: 120.6500, disp: 'Desa Ratolene, Poso Pesisir, Poso', ulp: 'ULP Poso' },
  { location: 'Gantinadi', lat: -1.4250, lon: 120.6600, disp: 'Dusun Gantinadi, Poso Pesisir, Poso', ulp: 'ULP Poso' },
  { location: 'Ratuombu', lat: -1.4350, lon: 120.6700, disp: 'Dusun Ratuombu, Poso Pesisir, Poso', ulp: 'ULP Poso' },

  // ULP Parigi
  { location: 'Auma', lat: -0.8450, lon: 120.1350, disp: 'Desa Auma, Parigi Tengah, Parigi Moutong', ulp: 'ULP Parigi' },
  { location: 'Sidole Induk', lat: -0.6300, lon: 120.0500, disp: 'Desa Sidole Induk, Ampibabo, Parigi Moutong', ulp: 'ULP Parigi' }
];

let knownList = [];
if (fs.existsSync(knownFile)) {
  knownList = JSON.parse(fs.readFileSync(knownFile, 'utf8'));
}
const knownMap = new Map(knownList.map(k => [k.location.toLowerCase().trim(), k]));

let addedKnown = 0;
for (const s of newSpots) {
  const key = s.location.toLowerCase().trim();
  if (!knownMap.has(key)) {
    const entry = {
      location: s.location,
      latitude: s.lat,
      longitude: s.lon,
      displayName: s.disp,
      ulpName: s.ulp
    };
    knownMap.set(key, entry);
    knownList.push(entry);
    addedKnown++;
  }
}
fs.writeFileSync(knownFile, JSON.stringify(knownList, null, 2), 'utf8');
console.log(`Added ${addedKnown} to known-locations.json. Total: ${knownList.length}`);

// Add to sulteng-places.json
let sultengObj = { places: [] };
if (fs.existsSync(sultengFile)) {
  sultengObj = JSON.parse(fs.readFileSync(sultengFile, 'utf8'));
}
const existingSet = new Set(sultengObj.places.map(p => `${p[0].toLowerCase()}|${p[1].toFixed(4)}|${p[2].toFixed(4)}`));
let addedPlaces = 0;

for (const s of newSpots) {
  const key = `${s.location.toLowerCase()}|${s.lat.toFixed(4)}|${s.lon.toFixed(4)}`;
  if (!existingSet.has(key)) {
    existingSet.add(key);
    sultengObj.places.push([s.location, s.lat, s.lon, 'jalan', s.disp]);
    addedPlaces++;
  }
}
sultengObj.total = sultengObj.places.length;
sultengObj.updatedAt = new Date().toISOString();
fs.writeFileSync(sultengFile, JSON.stringify(sultengObj, null, 2), 'utf8');
console.log(`Added ${addedPlaces} to sulteng-places.json. Total: ${sultengObj.total}`);
