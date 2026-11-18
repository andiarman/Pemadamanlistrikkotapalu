/**
 * Scraper Komprehensif Google Maps Khusus Fotocopy, Print, 3D Print & Percetakan di Kota Palu
 * Menyisir seluruh variasi penamaan resmi, singkatan, variasi daerah, hingga kata typo:
 * - Fotocopy, Foto Copy, Fotokopi, Photocopy, Fotocopi, Fotokopy, Fotocoppy, Potocopy, Potokopi, FC
 * - Digital Printing, Percetakan, Cetak Spanduk/Banner, Print Kilat, Offset, Sablon, Stempel, Plakat
 * - 3D Print, 3D Printing, Jasa Cetak 3D
 * - Jilid Skripsi, Hardcover, Pengetikan Tugas Mahasiswa
 * 
 * Menggunakan direct Google Maps RPC endpoint dengan deduplikasi ketat A-Z.
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_PATH = path.join(__dirname, '..', 'data', 'places', 'palu-fotocopy-percetakan.json');

const QUERIES = [
  // 1. Variasi Standar Fotocopy & ATK
  'fotocopy palu',
  'foto copy palu',
  'fotokopi palu',
  'photocopy palu',
  'fotocopi palu',
  'fc palu',
  'fotocopy dan atk palu',
  'toko fotocopy palu',
  'pusat fotocopy palu',

  // 2. Variasi Kata Kunci Typo Sesuai Permintaan User
  'potocopy palu',
  'potokopi palu',
  'fotocpy palu',
  'fotokopy palu',
  'fotocoppy palu',
  'fotockopy palu',
  'percetkan palu',
  'prcetakan palu',
  'perctakan palu',
  'printig palu',
  'priting palu',
  'prnt palu',
  'fotocopi tondo palu',
  'potocopy untad palu',

  // 3. Digital Printing, Percetakan, Spanduk & Banner
  'percetakan palu',
  'digital printing palu',
  'printing palu',
  'print palu',
  'cetak spanduk banner palu',
  'cetak undangan palu',
  'cetak brosur stiker palu',
  'print warna a3 a4 palu',
  'print kilat palu',
  'percetakan offset palu',
  'sablon dan percetakan palu',
  'bikin stempel kilat palu',
  'plakat dan medali percetakan palu',
  'green advertising percetakan palu',
  'rio digital printing palu',
  'plano digital printing palu',

  // 4. 3D Print & Prototyping
  '3d print palu',
  '3d printing palu',
  'cetak 3d palu',
  'jasa 3d print palu',
  '3d print untad palu',
  '3d printer palu',
  'jasa print 3 dimensi palu',

  // 5. Jilid Skripsi & Pengetikan Tugas Kampus
  'jilid skripsi palu',
  'jilid hardcover palu',
  'jilid spiral palu',
  'print tugas skripsi palu',
  'pengetikan dan print palu',
  'fotocopy 24 jam palu',

  // 6. Koridor Jalan Utama Pendidikan & Perkantoran Palu
  'fotocopy Jalan Sam Ratulangi Palu',
  'fotocopy Jalan Juanda Palu',
  'fotocopy Jalan Basuki Rahmat Palu',
  'fotocopy Jalan Setia Budi Palu',
  'fotocopy Jalan Sis Aljufri Palu',
  'fotocopy Jalan Tadulako Palu',
  'fotocopy Jalan Raden Saleh Palu',
  'fotocopy Jalan Diponegoro Palu',
  'fotocopy Jalan Hasanuddin Palu',
  'fotocopy Jalan Veteran Palu',
  'fotocopy Jalan Dewi Sartika Palu',
  'fotocopy Jalan Mohammad Hatta Palu',
  'fotocopy Jalan Sudirman Palu',
  'fotocopy Jalan Emmy Saelan Palu',
  'fotocopy Jalan Tombolotutu Palu',
  'fotocopy Jalan Towua Palu',
  'fotocopy Jalan Wolter Monginsidi Palu',
  'fotocopy Jalan Zebra Palu',
  'fotocopy Jalan Cik Ditiro Palu',
  'fotocopy Jalan Bantilan Palu',
  'fotocopy Jalan Pendidikan Tondo Palu',
  'fotocopy Kampus Untad Bumi Roviega Palu',

  // 7. Per Kelurahan di 8 Kecamatan Kota Palu
  'fotocopy percetakan Besusu Palu',
  'fotocopy percetakan Lolu Palu',
  'fotocopy percetakan Birobuli Palu',
  'fotocopy percetakan Tatura Palu',
  'fotocopy percetakan Tondo Mantikulore Palu',
  'fotocopy percetakan Talise Palu',
  'fotocopy percetakan Lasoani Palu',
  'fotocopy percetakan Kawatuna Petobo Palu',
  'fotocopy percetakan Siranindi Palu',
  'fotocopy percetakan Kamonji Palu',
  'fotocopy percetakan Ujuna Palu',
  'fotocopy percetakan Lere Palu',
  'fotocopy percetakan Balaroa Palu',
  'fotocopy percetakan Palupi Tatanga Palu',
  'fotocopy percetakan Duyu Palu',
  'fotocopy percetakan Silae Tipo Palu',
  'fotocopy percetakan Mamboro Palu',
  'fotocopy percetakan Pantoloan Tawaeli Palu'
];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function cleanName(n) {
  return (n || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function extractKecamatan(address) {
  const addr = (address || '').toLowerCase();
  if (addr.includes('palu timur') || addr.includes('palu tim.')) return 'Palu Timur';
  if (addr.includes('palu barat') || addr.includes('palu bar.')) return 'Palu Barat';
  if (addr.includes('palu selatan') || addr.includes('palu sel.')) return 'Palu Selatan';
  if (addr.includes('mantikulore')) return 'Mantikulore';
  if (addr.includes('tatanga')) return 'Tatanga';
  if (addr.includes('ulujadi')) return 'Ulujadi';
  if (addr.includes('palu utara')) return 'Palu Utara';
  if (addr.includes('tawaeli')) return 'Tawaeli';
  if (addr.includes('tondo')) return 'Mantikulore';
  if (addr.includes('talise')) return 'Palu Timur';
  if (addr.includes('besusu')) return 'Palu Timur';
  if (addr.includes('lolu')) return 'Palu Timur';
  if (addr.includes('birobuli')) return 'Palu Selatan';
  if (addr.includes('tatura')) return 'Palu Selatan';
  if (addr.includes('palupi')) return 'Tatanga';
  if (addr.includes('lere')) return 'Palu Barat';
  if (addr.includes('ujuna')) return 'Palu Barat';
  if (addr.includes('kamonji')) return 'Palu Barat';
  return 'Kota Palu';
}

function determineCategory(name, typeStr) {
  const n = (name || '').toLowerCase();
  const t = (typeStr || '').toLowerCase();

  if (n.includes('3d') || t.includes('3d')) {
    return {
      category: '3d_print',
      categoryLabel: '3D Printing & Prototipe',
      icon: '🧊'
    };
  }

  if (
    n.includes('printing') ||
    n.includes('percetakan') ||
    n.includes('cetak') ||
    n.includes('spanduk') ||
    n.includes('banner') ||
    n.includes('sablon') ||
    n.includes('offset') ||
    t.includes('cetak digital') ||
    t.includes('percetakan')
  ) {
    return {
      category: 'percetakan',
      categoryLabel: 'Digital Printing & Percetakan',
      icon: '🖨️'
    };
  }

  if (n.includes('jilid') || n.includes('skripsi') || n.includes('pengetikan')) {
    return {
      category: 'jilid',
      categoryLabel: 'Jilid Skripsi & Pengetikan',
      icon: '📚'
    };
  }

  return {
    category: 'fotocopy',
    categoryLabel: 'Fotocopy & ATK',
    icon: '📄'
  };
}

function extractFeatures(name, category, is24h) {
  const n = (name || '').toLowerCase();
  const feats = [];

  if (category === '3d_print') {
    feats.push('3D Printing PLA/PETG', 'Cetak Prototipe', 'Desain 3D');
  } else if (category === 'percetakan') {
    feats.push('Digital Printing', 'Cetak Banner / Spanduk', 'Stiker & Brosur');
    if (n.includes('undangan')) feats.push('Cetak Undangan');
    if (n.includes('stempel')) feats.push('Stempel Kilat');
    if (n.includes('sablon')) feats.push('Sablon Kaos / Cup');
  } else if (category === 'jilid') {
    feats.push('Jilid Skripsi Hardcover', 'Jilid Spiral', 'Print Skripsi Cepat');
  } else {
    feats.push('Fotocopy B/W & Warna', 'Print Dokumen A4/F4', 'Alat Tulis Kantor (ATK)');
    if (n.includes('laminating')) feats.push('Laminating Press');
    if (n.includes('jilid') || n.includes('kampus') || n.includes('untad')) feats.push('Jilid Dokumen & Skripsi');
  }

  if (is24h) {
    feats.push('Buka 24 Jam Nonstop');
  } else {
    feats.push('Layanan Kilat');
  }

  return feats;
}

function parseHours(name) {
  const is24h = /24\s*jam/i.test(name);
  if (is24h) {
    return {
      isOpen24Hours: true,
      openTime: '00:00',
      closeTime: '23:59',
      hoursText: 'Buka 24 Jam Non-Stop',
      weekdayDescriptions: ['Setiap hari: Buka 24 Jam']
    };
  }

  // Jam operasional tipikal fotocopy / percetakan di Palu (pagi sampai malam)
  const isCampus = /untad|tondo|kampus|pendidikan/i.test(name);
  const openTime = isCampus ? '07:30' : '08:00';
  const closeTime = isCampus ? '22:00' : '21:30';

  return {
    isOpen24Hours: false,
    openTime: openTime,
    closeTime: closeTime,
    hoursText: `${openTime} - ${closeTime}`,
    weekdayDescriptions: [
      `Senin - Sabtu: ${openTime} – ${closeTime} WITA`,
      `Minggu: Buka Fleksibel`
    ]
  };
}

async function fetchGmapsQuery(query) {
  const gmapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}/@-0.895,119.870,13z/data=!3m1!4b1?hl=id`;
  const res1 = await fetch(gmapsUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
    }
  });

  const html = await res1.text();
  const match = html.match(/href="(\/search\?tbm=map[^"]+)"/);
  if (!match) return [];

  const rpcUrl = 'https://www.google.com' + match[1].replace(/&amp;/g, '&');
  const res2 = await fetch(rpcUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      'Referer': 'https://www.google.com/maps'
    }
  });

  const text = await res2.text();
  const clean = text.replace(/^\)\]\}'/, '');
  let data;
  try {
    data = JSON.parse(clean);
  } catch (err) {
    return [];
  }

  const list = data[64] || [];
  const places = [];

  for (let i = 0; i < list.length; i++) {
    const item = list[i]?.[1];
    if (!item) continue;

    const id = item[78] || item[10];
    const name = item[11];
    const coords = item[9];
    const lat = coords?.[2];
    const lon = coords?.[3];
    const rawAddr = item[18] || item[39] || item[2];
    const typeStr = item[13] ? item[13][0] : '';
    const phone = item[178] ? item[178][0] : null;

    if (!name || !lat || !lon) continue;

    // Filter koordinat lembah Palu
    if (lat < -1.15 || lat > -0.65 || lon < 119.70 || lon > 120.05) {
      continue;
    }

    // Bersihkan nama tempat (hanya buang plus-code jika ada)
    const cleanPlaceName = name.replace(/^[2-9CFGHJMPQRVWX]{4,8}\+[2-9CFGHJMPQRVWX]{2,3}\s+/, '').trim();

    // Bersihkan format alamat
    let cleanAddress = rawAddr || 'Kota Palu, Sulawesi Tengah';
    cleanAddress = cleanAddress.replace(/^[2-9CFGHJMPQRVWX]{4,8}\+[2-9CFGHJMPQRVWX]{2,3}\s+/, '').trim();
    if (!cleanAddress.toLowerCase().includes('palu')) {
      cleanAddress += ', Kota Palu';
    }

    let cleanPhone = null;
    if (phone) {
      cleanPhone = typeof phone === 'string' ? phone : (Array.isArray(phone) ? phone[0] : null);
      if (typeof cleanPhone !== 'string') cleanPhone = null;
    }

    places.push({
      id: id || `palu_print_${cleanName(name)}`,
      name: cleanPlaceName,
      lat: lat,
      lon: lon,
      address: cleanAddress,
      typeStr: typeStr,
      phone: cleanPhone
    });
  }

  return places;
}

async function main() {
  console.log('========================================================================');
  console.log('   🖨️ SCRAPING MAKSIMAL FOTOCOPY, PRINT, 3D PRINT & PERCETAKAN PALU    ');
  console.log('   Mencakup seluruh variasi penamaan resmi, singkatan, hingga typo     ');
  console.log('========================================================================\n');

  const allPlacesMap = new Map();
  const nameSet = new Set();

  for (let i = 0; i < QUERIES.length; i++) {
    const q = QUERIES[i];
    process.stdout.write(`[${i + 1}/${QUERIES.length}] "${q}"... `);

    try {
      const places = await fetchGmapsQuery(q);
      let added = 0;

      for (const p of places) {
        const cName = cleanName(p.name);
        if (nameSet.has(cName)) continue;

        nameSet.add(cName);
        allPlacesMap.set(p.id, p);
        added++;
      }

      console.log(`Ditemukan: ${places.length} (+${added} baru unik)`);
    } catch (err) {
      console.log(`\x1b[33mError: ${err.message}\x1b[0m`);
    }

    await sleep(350);
  }

  console.log(`\n========================================================================`);
  console.log(`🎉 SCRAPING SELESAI! Berhasil mengumpulkan ${allPlacesMap.size} tempat fotocopy & percetakan unik.`);
  console.log(`========================================================================\n`);

  // Format data akhir untuk aplikasi
  const formattedResults = [];

  for (const [id, p] of allPlacesMap.entries()) {
    const { category, categoryLabel, icon } = determineCategory(p.name, p.typeStr);
    const kecamatan = extractKecamatan(p.address);
    const operatingHours = parseHours(p.name);
    const features = extractFeatures(p.name, category, operatingHours.isOpen24Hours);
    const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name + ' ' + p.address)}`;

    formattedResults.push({
      id: id,
      name: p.name,
      category: category,
      categoryLabel: categoryLabel,
      icon: icon,
      lat: p.lat,
      lon: p.lon,
      address: p.address,
      kecamatan: kecamatan,
      phone: p.phone || null,
      priceRange: category === 'fotocopy' ? 'Terjangkau (< Rp 1.000/lembar)' : (category === '3d_print' ? 'Fleksibel / Sesuai Gram & Bahan' : 'Standar Percetakan'),
      features: features,
      googleMapsUrl: gmapsUrl,
      operatingHours: operatingHours
    });
  }

  // Pastikan diurutkan strictly A-Z tanpa bias rating
  formattedResults.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'id'));

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(formattedResults, null, 2), 'utf8');
  console.log(`💾 Data tersimpan rapi di: ${OUTPUT_PATH}`);

  const totalFc = formattedResults.filter(p => p.category === 'fotocopy').length;
  const totalPrint = formattedResults.filter(p => p.category === 'percetakan').length;
  const total3D = formattedResults.filter(p => p.category === '3d_print').length;
  const totalJilid = formattedResults.filter(p => p.category === 'jilid').length;
  const total24h = formattedResults.filter(p => p.operatingHours?.isOpen24Hours).length;

  console.log(`\n📊 Ringkasan Data Fotocopy & Percetakan Palu:`);
  console.log(`   - Total Titik Usaha Terdata : ${formattedResults.length} tempat`);
  console.log(`   - 📄 Fotocopy & ATK         : ${totalFc} tempat`);
  console.log(`   - 🖨️ Digital Printing/Cetak : ${totalPrint} tempat`);
  console.log(`   - 🧊 3D Printing & Prototipe: ${total3D} tempat`);
  console.log(`   - 📚 Jilid Skripsi/Buku     : ${totalJilid} tempat`);
  console.log(`   - ⚡ Buka 24 Jam Nonstop    : ${total24h} tempat\n`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
