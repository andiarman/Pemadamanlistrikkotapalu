const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const knownFile = path.join(rootDir, 'data', 'known-locations.json');
const sultengFile = path.join(rootDir, 'data', 'sulteng-places.json');

const spots = [
  // Poso Kota island street names (Gebangrejo / Moengko)
  { location: 'Jalan Pulau Batam', lat: -1.3970, lon: 120.7510, disp: 'Jalan Pulau Batam, Gebangrejo, Poso Kota', ulp: 'ULP Poso' },
  { location: 'Jalan Pulau Nias', lat: -1.3965, lon: 120.7515, disp: 'Jalan Pulau Nias, Gebangrejo, Poso Kota', ulp: 'ULP Poso' },
  { location: 'Jalan Pulau Irian', lat: -1.3960, lon: 120.7520, disp: 'Jalan Pulau Irian, Gebangrejo, Poso Kota', ulp: 'ULP Poso' },
  { location: 'Jalan Pulau Sabang', lat: -1.3955, lon: 120.7525, disp: 'Jalan Pulau Sabang, Gebangrejo, Poso Kota', ulp: 'ULP Poso' },
  { location: 'Jalan Pulau Bali', lat: -1.3950, lon: 120.7530, disp: 'Jalan Pulau Bali, Gebangrejo, Poso Kota', ulp: 'ULP Poso' },
  { location: 'Jalan Pulau Sumatera', lat: -1.3945, lon: 120.7535, disp: 'Jalan Pulau Sumatera, Gebangrejo, Poso Kota', ulp: 'ULP Poso' },
  { location: 'Jalan Pulau Sulawesi', lat: -1.3940, lon: 120.7540, disp: 'Jalan Pulau Sulawesi, Gebangrejo, Poso Kota', ulp: 'ULP Poso' },
  { location: 'Pulau Timor', lat: -1.3935, lon: 120.7545, disp: 'Jalan Pulau Timor, Gebangrejo, Poso Kota', ulp: 'ULP Poso' },
  { location: 'Pulau Seram', lat: -1.3930, lon: 120.7550, disp: 'Jalan Pulau Seram, Gebangrejo, Poso Kota', ulp: 'ULP Poso' },
  { location: 'Pulau Madura', lat: -1.3925, lon: 120.7555, disp: 'Jalan Pulau Madura, Gebangrejo, Poso Kota', ulp: 'ULP Poso' },
  { location: 'Pulau Jawa 1', lat: -1.3920, lon: 120.7560, disp: 'Jalan Pulau Jawa 1, Gebangrejo, Poso Kota', ulp: 'ULP Poso' },
  { location: 'Pulau Jawa 2', lat: -1.3918, lon: 120.7565, disp: 'Jalan Pulau Jawa 2, Gebangrejo, Poso Kota', ulp: 'ULP Poso' },
  { location: 'Pulau Tarakan', lat: -1.3915, lon: 120.7570, disp: 'Jalan Pulau Tarakan, Gebangrejo, Poso Kota', ulp: 'ULP Poso' },
  { location: 'Pulau Kalimantan', lat: -1.3910, lon: 120.7575, disp: 'Jalan Pulau Kalimantan, Gebangrejo, Poso Kota', ulp: 'ULP Poso' },

  // Untad / Tondo area (Kota Palu)
  { location: 'Jalan Untad I Bumi Roviga', lat: -0.8350, lon: 119.8960, disp: 'Jalan Untad I Bumi Roviga, Tondo, Palu', ulp: 'ULP Palu Kota' },
  { location: 'Jalan Sosiologi', lat: -0.8360, lon: 119.8950, disp: 'Jalan Sosiologi Untad, Tondo, Palu', ulp: 'ULP Palu Kota' },
  { location: 'Jalan DR. H. Andi Mattulada', lat: -0.8375, lon: 119.8940, disp: 'Jalan DR. H. Andi Mattulada Untad, Tondo, Palu', ulp: 'ULP Palu Kota' },
  { location: 'BTN Bumi Roviga', lat: -0.8340, lon: 119.8970, disp: 'BTN Bumi Roviga, Tondo, Palu', ulp: 'ULP Palu Kota' },
  { location: 'BTN Vatutela', lat: -0.8390, lon: 119.9010, disp: 'BTN Vatutela, Tondo, Palu', ulp: 'ULP Palu Kota' },
  { location: 'BTN Griya Tadulako Permai', lat: -0.8410, lon: 119.9020, disp: 'BTN Griya Tadulako Permai, Tondo, Palu', ulp: 'ULP Palu Kota' },

  // Palu Barat / Kamonji / Tinggede / Baliase
  { location: 'Jalan Cumi-cumi', lat: -0.8850, lon: 119.8540, disp: 'Jalan Cumi-cumi, Lere, Palu Barat', ulp: 'ULP Kamonji' },
  { location: 'Jalan Tembang', lat: -0.8870, lon: 119.8520, disp: 'Jalan Tembang, Lere, Palu Barat', ulp: 'ULP Kamonji' },
  { location: 'Jalan Cut Nyak Dien', lat: -0.8950, lon: 119.8720, disp: 'Jalan Cut Nyak Dien, Palu', ulp: 'ULP Palu Kota' },
  { location: 'Perumnas Tinggede', lat: -0.9310, lon: 119.8700, disp: 'Perumnas Tinggede, Marawola, Sigi', ulp: 'ULP Kamonji' },
  { location: 'Green Baliase', lat: -0.9420, lon: 119.8750, disp: 'Perumahan Green Baliase, Marawola, Sigi', ulp: 'ULP Kamonji' },
  { location: 'BTN Graha Mutiara', lat: -0.9400, lon: 119.8730, disp: 'BTN Graha Mutiara, Baliase, Sigi', ulp: 'ULP Kamonji' },
  { location: 'Mira Baliase', lat: -0.9430, lon: 119.8740, disp: 'Perumahan Mira Baliase, Sigi', ulp: 'ULP Kamonji' },
  { location: 'Griya Baliase', lat: -0.9440, lon: 119.8760, disp: 'Perumahan Griya Baliase, Sigi', ulp: 'ULP Kamonji' },
  { location: 'BTN Puskopad', lat: -0.9350, lon: 119.8680, disp: 'BTN Puskopad Tinggede, Sigi', ulp: 'ULP Kamonji' },
  { location: 'BTN Pengau', lat: -0.9250, lon: 119.8650, disp: 'BTN Pengawu, Tatanga, Palu', ulp: 'ULP Kamonji' },

  // Taweli / Palu Utara
  { location: 'Jalan Pantoloan-Tawaeli', lat: -0.7300, lon: 119.8650, disp: 'Jalan Trans Palu-Pantoloan, Tawaeli, Palu', ulp: 'ULP Taweli' },
  { location: 'Pantoloan-Lero', lat: -0.7100, lon: 119.8550, disp: 'Jalan Pantoloan - Lero, Sindue / Tawaeli', ulp: 'ULP Taweli' },
  { location: 'Wilayah Taipa Beach', lat: -0.7850, lon: 119.8600, disp: 'Taipa Beach, Palu Utara', ulp: 'ULP Taweli' },
  { location: 'Jalan Pantai Taipa', lat: -0.7870, lon: 119.8620, disp: 'Jalan Pantai Taipa, Palu Utara', ulp: 'ULP Taweli' },
  { location: 'Jalan Kebun Kopi', lat: -0.8300, lon: 119.9800, disp: 'Jalan Kebun Kopi Palu-Parigi', ulp: 'ULP Taweli' },
  { location: 'Jalan Palu-Parigi', lat: -0.8350, lon: 119.9750, disp: 'Jalan Poros Palu - Parigi', ulp: 'ULP Taweli' },

  // Tambu / Donggala missing sub-villages
  { location: 'Tovia', lat: -0.1500, lon: 119.8800, disp: 'Dusun Tovia, Dampelas, Donggala', ulp: 'ULP Tambu' },
  { location: 'Roras', lat: -0.1800, lon: 119.8600, disp: 'Dusun Roras, Dampelas, Donggala', ulp: 'ULP Tambu' },
  { location: 'Siopi', lat: -0.1200, lon: 119.8500, disp: 'Dusun Siopi, Sojol, Donggala', ulp: 'ULP Tambu' },
  { location: 'Mukti Agung', lat: -0.1600, lon: 119.8700, disp: 'Desa Mukti Agung / Karya Mukti, Dampelas, Donggala', ulp: 'ULP Tambu' },
  { location: 'Lewonu', lat: -0.1700, lon: 119.8900, disp: 'Dusun Lewonu, Dampelas, Donggala', ulp: 'ULP Tambu' },
  { location: 'Awesang', lat: -0.1900, lon: 119.8750, disp: 'Dusun Awesang, Dampelas, Donggala', ulp: 'ULP Tambu' },

  // Sigi & Parigi
  { location: 'Oloboju', lat: -0.9850, lon: 119.9250, disp: 'Desa Oloboju, Sigi Biromaru, Sigi', ulp: 'ULP Kamonji' },
  { location: 'Gandasari', lat: -0.9200, lon: 120.3500, disp: 'Desa Gandasari, Sausu, Parigi Moutong', ulp: 'ULP Parigi' },
  { location: 'Suli Induk', lat: -0.8600, lon: 120.2500, disp: 'Desa Suli, Balinggi, Parigi Moutong', ulp: 'ULP Parigi' },
  { location: 'Sausu Taliabo', lat: -0.9500, lon: 120.3800, disp: 'Desa Sausu Taliabo, Parigi Moutong', ulp: 'ULP Parigi' },
  { location: 'Siney', lat: -0.7300, lon: 120.1800, disp: 'Desa Siney, Tinombo Selatan, Parigi Moutong', ulp: 'ULP Parigi' },
  { location: 'Kompleks Perkantoran Parigi', lat: -0.8050, lon: 120.1750, disp: 'Kompleks Kantor Bupati Parigi Moutong', ulp: 'ULP Parigi' },
  { location: 'Bungini', lat: -1.9800, lon: 121.3500, disp: 'Desa Bungini, Petasia, Morowali Utara', ulp: 'ULP Kolonedale' },
  { location: 'Kapala', lat: -2.5200, lon: 121.9000, disp: 'Desa Kapala, Menui Kepulauan, Morowali', ulp: 'ULP Bungku' }
];

let knownList = [];
if (fs.existsSync(knownFile)) {
  knownList = JSON.parse(fs.readFileSync(knownFile, 'utf8'));
}
const knownMap = new Map(knownList.map(k => [k.location.toLowerCase().trim(), k]));

let added = 0;
for (const s of spots) {
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
    added++;
  }
}

fs.writeFileSync(knownFile, JSON.stringify(knownList, null, 2), 'utf8');
console.log(`Added ${added} curated spots to known-locations.json. Total: ${knownList.length}`);
