const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'places', 'palu-coffeeshop-resto.json');
const places = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

const BRANDS = [
  {
    id: 'sin-coffee',
    name: 'Sin Coffee',
    shortName: 'Sin',
    badgeColor: '#1e3a8a',
    borderColor: '#3b82f6',
    textColor: '#93c5fd',
    test: p => /sin\s*coffee/i.test(p.name),
    logoSvg: '<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="11" fill="#1E3A8A"/><text x="12" y="15" text-anchor="middle" font-size="7.5" font-weight="900" fill="#FBBF24" font-family="sans-serif">SIN</text></svg>'
  },
  {
    id: 'kopi-arobi',
    name: 'Kopi Arobi',
    shortName: 'Arobi',
    badgeColor: '#78350f',
    borderColor: '#f59e0b',
    textColor: '#fde68a',
    test: p => /arobi/i.test(p.name),
    logoSvg: '<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="11" fill="#78350F"/><circle cx="12" cy="12" r="8.5" fill="none" stroke="#F59E0B" stroke-width="1.2"/><text x="12" y="14.5" text-anchor="middle" font-size="6.5" font-weight="900" fill="#FDE68A" font-family="sans-serif">AROBI</text></svg>'
  },
  {
    id: 'brkh',
    name: 'BRKH / Sepertiga',
    shortName: 'BRKH',
    badgeColor: '#0f172a',
    borderColor: '#eab308',
    textColor: '#fef08a',
    test: p => /\b(brkh|sepertiga\s*by)\b/i.test(p.name),
    logoSvg: '<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="11" fill="#0F172A"/><text x="12" y="14.5" text-anchor="middle" font-size="6.2" font-weight="900" fill="#F59E0B" font-family="sans-serif">BRKH</text></svg>'
  },
  {
    id: 'koriru',
    name: 'Koriru Coffee',
    shortName: 'Koriru',
    badgeColor: '#3e2723',
    borderColor: '#a1887f',
    textColor: '#d7ccc8',
    test: p => /koriru/i.test(p.name),
    logoSvg: '<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="11" fill="#3E2723"/><text x="12" y="16" text-anchor="middle" font-size="11" font-weight="900" fill="#FFF" font-family="sans-serif">k.</text></svg>'
  },
  {
    id: 'ribelv',
    name: 'Ribelv Coffee',
    shortName: 'Ribelv',
    badgeColor: '#0f766e',
    borderColor: '#14b8a6',
    textColor: '#99f6e4',
    test: p => /ribelv/i.test(p.name),
    logoSvg: '<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="11" fill="#0F766E"/><text x="12" y="16" text-anchor="middle" font-size="10" font-weight="900" fill="#FFF" font-family="sans-serif">R</text></svg>'
  },
  {
    id: 'warkop-harapan',
    name: 'Warkop Harapan',
    shortName: 'Harapan',
    badgeColor: '#b45309',
    borderColor: '#fbbf24',
    textColor: '#fef3c7',
    test: p => /warkop\s*harapan/i.test(p.name),
    logoSvg: '<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="11" fill="#B45309"/><path d="M8 8h8v7a3 3 0 0 1-3 3h-2a3 3 0 0 1-3-3V8z" fill="#FFF"/><text x="12" y="14" text-anchor="middle" font-size="6" font-weight="900" fill="#B45309" font-family="sans-serif">H</text></svg>'
  },
  {
    id: 'kaledo-stereo',
    name: 'Kaledo Stereo',
    shortName: 'Stereo',
    badgeColor: '#c2410c',
    borderColor: '#fb923c',
    textColor: '#ffedd5',
    test: p => /kaledo\s*stereo/i.test(p.name),
    logoSvg: '<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="11" fill="#C2410C"/><path d="M6 13a6 6 0 0 0 12 0H6z" fill="#FFF"/><path d="M9 7c1-1 1-2 1-2m4 2c1-1 1-2 1-2" stroke="#FFF" stroke-width="1.2"/><circle cx="15.5" cy="8.5" r="1" fill="#FDE047"/><path d="M16.5 8.5V6h2" stroke="#FDE047" stroke-width="1"/></svg>'
  },
  {
    id: 'kopi-kenangan',
    name: 'Kopi Kenangan',
    shortName: 'Kenangan',
    badgeColor: '#8b0000',
    borderColor: '#f87171',
    textColor: '#fee2e2',
    test: p => /kopi\s*kenangan|kedaikopikenangan/i.test(p.name),
    logoSvg: '<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="11" fill="#8B0000"/><path d="M12 7.5c-1.2-1.5-3.2-1.2-4 0-.8 1.2-.4 2.8 1.2 4.2L12 14.5l2.8-2.8c1.6-1.4 2-3 1.2-4.2-.8-1.2-2.8-1.5-4 0z" fill="#FFF"/><path d="M8 15h8v1a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-1z" fill="#FFF"/></svg>'
  },
  {
    id: 'point-coffee',
    name: 'Point Coffee',
    shortName: 'Point',
    badgeColor: '#059669',
    borderColor: '#34d399',
    textColor: '#d1fae5',
    test: p => /point\s*coffee/i.test(p.name),
    logoSvg: '<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="11" fill="#059669"/><path d="M12 4a5 5 0 0 0-5 5c0 3.8 5 11 5 11s5-7.2 5-11a5 5 0 0 0-5-5zm0 7.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" fill="#FFF"/><circle cx="12" cy="9" r="1.3" fill="#059669"/></svg>'
  },
  {
    id: 'mie-gacoan',
    name: 'Mie Gacoan',
    shortName: 'Gacoan',
    badgeColor: '#db2777',
    borderColor: '#f472b6',
    textColor: '#fce7f3',
    test: p => /gacoan/i.test(p.name),
    logoSvg: '<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="11" fill="#DB2777"/><path d="M6 12a6 6 0 0 0 12 0H6z" fill="#FFF"/><path d="M8 8c1-1 1-2 1-2m3 2c1-1 1-2 1-2m3 2c1-1 1-2 1-2" stroke="#FFF" stroke-width="1.5" stroke-linecap="round"/><line x1="5" y1="9" x2="19" y2="11" stroke="#FDE047" stroke-width="1.8" stroke-linecap="round"/></svg>'
  },
  {
    id: 'fore',
    name: 'Fore Coffee',
    shortName: 'Fore',
    badgeColor: '#064e3b',
    borderColor: '#10b981',
    textColor: '#d1fae5',
    test: p => /fore\s*coffee/i.test(p.name),
    logoSvg: '<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="11" fill="#064E3B"/><path d="M12 5C8 5 6 9 6 13c0 3 2 6 6 6s6-3 6-6c0-4-2-8-6-8zm-1 12c-2.5 0-3.8-1.8-3.8-4 0-2.5 1.5-5 3.8-6.5v10.5z" fill="#FFF"/></svg>'
  },
  {
    id: 'tomoro',
    name: 'Tomoro Coffee',
    shortName: 'Tomoro',
    badgeColor: '#ea580c',
    borderColor: '#fb923c',
    textColor: '#ffedd5',
    test: p => /tomoro/i.test(p.name),
    logoSvg: '<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="11" fill="#EA580C"/><path d="M7 8h10v2h-4v8h-2v-8H7V8z" fill="#FFF"/><circle cx="17" cy="7" r="1.5" fill="#FFF"/></svg>'
  },
  {
    id: 'kfc',
    name: 'KFC',
    shortName: 'KFC',
    badgeColor: '#dc2626',
    borderColor: '#ef4444',
    textColor: '#fee2e2',
    test: p => /\bkfc\b/i.test(p.name),
    logoSvg: '<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="11" fill="#DC2626"/><text x="12" y="15" text-anchor="middle" font-size="7.5" font-weight="900" fill="#FFF" font-family="sans-serif">KFC</text></svg>'
  },
  {
    id: 'mcdonalds',
    name: 'McDonald\'s',
    shortName: 'McD',
    badgeColor: '#dc2626',
    borderColor: '#facc15',
    textColor: '#fef08a',
    test: p => /mcdonald/i.test(p.name),
    logoSvg: '<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="11" fill="#DC2626"/><path d="M7 16V9.5a2.5 2.5 0 0 1 5 0V16m0-6.5a2.5 2.5 0 0 1 5 0V16" stroke="#FACC15" stroke-width="2.2" stroke-linecap="round" fill="none"/></svg>'
  },
  {
    id: 'pizza-hut',
    name: 'Pizza Hut',
    shortName: 'PizzaHut',
    badgeColor: '#b91c1c',
    borderColor: '#ef4444',
    textColor: '#fee2e2',
    test: p => /pizza\s*hut/i.test(p.name),
    logoSvg: '<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="11" fill="#B91C1C"/><path d="M5 14h14l-2.5-3.5h-9z" fill="#FACC15"/><path d="M12 7l-5 4h10z" fill="#FFF"/><line x1="4" y1="15.5" x2="20" y2="15.5" stroke="#FFF" stroke-width="1.5"/></svg>'
  },
  {
    id: 'richeese',
    name: 'Richeese Factory',
    shortName: 'Richeese',
    badgeColor: '#e11d48',
    borderColor: '#fb7185',
    textColor: '#ffe4e6',
    test: p => /richeese/i.test(p.name),
    logoSvg: '<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="11" fill="#E11D48"/><path d="M6 15l12-3v3H6z" fill="#FACC15"/><circle cx="13" cy="13.5" r="1" fill="#E11D48"/><circle cx="9" cy="14" r="0.8" fill="#E11D48"/></svg>'
  },
  {
    id: 'mixue',
    name: 'Mixue',
    shortName: 'Mixue',
    badgeColor: '#e11d48',
    borderColor: '#fb7185',
    textColor: '#ffe4e6',
    test: p => /mixue/i.test(p.name),
    logoSvg: '<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="11" fill="#E11D48"/><circle cx="12" cy="14" r="4" fill="#FFF"/><circle cx="12" cy="8.5" r="3" fill="#FFF"/><path d="M10 6l2-2 2 2z" fill="#FACC15"/></svg>'
  },
  {
    id: 'kulo',
    name: 'Kedai Kopi Kulo',
    shortName: 'Kulo',
    badgeColor: '#5d4037',
    borderColor: '#8d6e63',
    textColor: '#efebe9',
    test: p => /kopi\s*kulo/i.test(p.name),
    logoSvg: '<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="11" fill="#5D4037"/><text x="12" y="14.5" text-anchor="middle" font-size="6.2" font-weight="900" fill="#FFF" font-family="sans-serif">KULO</text></svg>'
  },
  {
    id: 'yaku',
    name: 'Yaku Signature',
    shortName: 'Yaku',
    badgeColor: '#312e81',
    borderColor: '#6366f1',
    textColor: '#e0e7ff',
    test: p => /yaku\s*signature/i.test(p.name),
    logoSvg: '<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="11" fill="#312E81"/><text x="12" y="14.5" text-anchor="middle" font-size="6.5" font-weight="900" fill="#FDE047" font-family="sans-serif">YAKU</text></svg>'
  },
  {
    id: 'malam-pagi',
    name: 'Malam Pagi',
    shortName: 'MalamPagi',
    badgeColor: '#4c1d95',
    borderColor: '#a855f7',
    textColor: '#f3e8ff',
    test: p => /malam\s*pagi/i.test(p.name),
    logoSvg: '<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="11" fill="#4C1D95"/><path d="M12 6a6 6 0 0 0 0 12V6z" fill="#F59E0B"/><path d="M12 6a6 6 0 1 1 0 12V6z" fill="#FFF"/></svg>'
  }
];

let enrichedCount = 0;
places.forEach(p => {
  let matched = null;
  for (const b of BRANDS) {
    if (b.test(p)) {
      matched = {
        id: b.id,
        name: b.name,
        shortName: b.shortName,
        badgeColor: b.badgeColor,
        borderColor: b.borderColor,
        textColor: b.textColor,
        logoSvg: b.logoSvg
      };
      break;
    }
  }
  p.franchise = matched;
  if (matched) enrichedCount++;
});

fs.writeFileSync(DB_PATH, JSON.stringify(places, null, 2), 'utf8');
console.log(`Enriched ${enrichedCount} places with franchise branding metadata!`);
