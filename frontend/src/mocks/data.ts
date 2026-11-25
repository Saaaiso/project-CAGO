import { fmtDay } from '../i18n';
import type {
  Alert, Device, Farm, Field, LatLng, Measurement, Recommendation, SavedReport, SeriesPoint, Weather,
} from '../types';

// Квадрат вокруг центра: wKm × hKm, небольшой перекос для реалистичности
function quad(lat: number, lng: number, wKm: number, hKm: number, skew = 0.0006): LatLng[] {
  const dLat = hKm / 2 / 111;
  const dLng = wKm / 2 / (111 * Math.cos((lat * Math.PI) / 180));
  return [
    [lat + dLat, lng - dLng + skew],
    [lat + dLat - skew, lng + dLng],
    [lat - dLat, lng + dLng - skew],
    [lat - dLat + skew, lng - dLng],
  ];
}

const C: LatLng = [43.4, 76.65];

export const FARM: Farm = {
  id: 'farm-1', name: 'Green Valley Farm', type: 'Mixed farm', location: 'Almaty region, Kazakhstan', center: C, areaHa: 486,
};

export const FIELDS: Field[] = [
  { id: 'north-ridge', code: 'F-01', name: 'North Ridge', crop: 'Corn', stage: 'V8', areaHa: 112, polygon: quad(C[0] + 0.013, C[1] - 0.004, 1.2, 0.95),
    moisture: 18, ph: 6.2, ndvi: 0.62, soilTemp: 21.4, ec: 0.38, organicMatter: 3.2, nitrogen: 58, phosphorus: 28, potassium: 172, note: 'Needs water', sensorId: 'NR-01' },
  { id: 'east-meadow', code: 'F-02', name: 'East Meadow', crop: 'Soybeans', stage: 'Vegetative', areaHa: 86, polygon: quad(C[0] + 0.004, C[1] + 0.024, 0.95, 0.9),
    moisture: 32, ph: 6.3, ndvi: 0.78, soilTemp: 20.8, ec: 0.41, organicMatter: 3.5, nitrogen: 48, phosphorus: 31, potassium: 190, note: 'Low nitrogen', sensorId: 'EM-01' },
  { id: 'river-bend', code: 'F-03', name: 'River Bend', crop: 'Corn', stage: 'V6', areaHa: 94, polygon: quad(C[0] + 0.012, C[1] + 0.03, 1.0, 0.95),
    moisture: 29, ph: 6.4, ndvi: 0.81, soilTemp: 20.2, ec: 0.36, organicMatter: 3.8, nitrogen: 84, phosphorus: 33, potassium: 205, note: 'Healthy', sensorId: 'RB-01' },
  { id: 'south-flats', code: 'F-04', name: 'South Flats', crop: 'Winter wheat', stage: 'Grain filling', areaHa: 78, polygon: quad(C[0] - 0.012, C[1] - 0.002, 1.0, 0.8),
    moisture: 34, ph: 6.7, ndvi: 0.88, soilTemp: 19.6, ec: 0.33, organicMatter: 3.4, nitrogen: 96, phosphorus: 36, potassium: 220, note: 'Healthy', sensorId: 'SF-01' },
  { id: 'west-pasture', code: 'F-05', name: 'West Pasture', crop: 'Alfalfa', stage: 'Regrowth', areaHa: 64, polygon: quad(C[0] - 0.002, C[1] - 0.026, 0.85, 0.85),
    moisture: 31, ph: 6.4, ndvi: 0.81, soilTemp: 20.5, ec: 0.35, organicMatter: 3.9, nitrogen: 92, phosphorus: 30, potassium: 198, note: 'Healthy', sensorId: 'WP-01' },
  { id: 'orchard-block', code: 'F-06', name: 'Orchard Block', crop: 'Apples', stage: 'Fruit development', areaHa: 52, polygon: quad(C[0] - 0.015, C[1] + 0.024, 0.8, 0.8),
    moisture: 35, ph: 6.3, ndvi: 0.74, soilTemp: 19.9, ec: 0.34, organicMatter: 4.1, nitrogen: 88, phosphorus: 34, potassium: 232, note: 'Healthy', sensorId: 'OB-01' },
];

export const ALERTS: Alert[] = [
  { id: 'a1', fieldId: 'north-ridge', title: 'Low soil moisture · North Ridge', text: 'Moisture fell to 18% in the 0–30 cm layer, below the 28% threshold for 36 hours.' },
  { id: 'a2', title: 'Frost watch · Thursday', text: 'Forecast low of 4°C. Cold pockets near River Bend may affect young seedlings.', fieldId: 'river-bend' },
];

export const WEATHER: Weather = {
  tempNow: 22, summary: 'Clear skies', wind: 12, humidity: 64, precipToday: 0, evapotranspiration: 4.2,
  days: [
    { d: 'Today', icon: 'sun', hi: 22, lo: 8, rain: 0, wind: 12 },
    { d: 'Tomorrow', icon: 'sun', hi: 24, lo: 9, rain: 0, wind: 10 },
    { d: 'Thu', icon: 'cloud', hi: 23, lo: 4, rain: 2, wind: 14 },
    { d: 'Fri', icon: 'rain', hi: 20, lo: 4, rain: 11, wind: 18 },
    { d: 'Sat', icon: 'rain', hi: 21, lo: 6, rain: 3, wind: 11 },
    { d: 'Sun', icon: 'cloud', hi: 22, lo: 7, rain: 0, wind: 9 },
    { d: 'Mon', icon: 'sun', hi: 25, lo: 9, rain: 0, wind: 8 },
  ],
  windows: [
    { task: 'Irrigation', when: 'Today, 06:00–10:00', verdict: 'Recommended' },
    { task: 'Spraying', when: 'Tomorrow, 07:00–11:00', verdict: 'Good option' },
    { task: 'Field access', when: 'Wednesday', verdict: 'Acceptable' },
  ],
  watch: [
    { title: 'Frost risk', text: 'Monitor low-lying zones on Thursday night; consider delaying planting in River Bend.' },
    { title: 'Rain not sufficient', text: 'Friday rainfall of 11 mm will not cover North Ridge water deficit. Irrigate today.' },
  ],
};

export const RECOMMENDATIONS: Recommendation[] = [
  { id: 'r1', title: 'Irrigate North Ridge', fieldId: 'north-ridge', priority: 'High priority', category: 'Irrigation', status: 'To do', due: 'Today, 10:00',
    summary: 'Soil moisture is 18%, below the 28–35% target. NDVI is falling.', action: 'Apply 15 mm; recheck sensor in 24 hours.',
    reasons: [{ label: 'Current moisture', value: '18%' }, { label: '7-day change', value: '−8 pp' }, { label: 'Vegetation index', value: '0.62' }, { label: 'Rain next 48h', value: '0 mm' }] },
  { id: 'r2', title: 'Review nitrogen in East Meadow', fieldId: 'east-meadow', priority: 'Medium', category: 'Nutrients', status: 'To do', due: 'This week',
    summary: 'Last lab sample shows nitrogen at 48 mg/kg, below 60–120 mg/kg target.', action: 'Schedule a side-dress application and resample in 10 days.',
    reasons: [{ label: 'Nitrogen', value: '48 mg/kg' }, { label: 'Target', value: '60–120' }, { label: 'Stage', value: 'Vegetative' }] },
  { id: 'r3', title: 'Check frost-sensitive zones', fieldId: 'river-bend', priority: 'Medium', category: 'Weather', status: 'In progress', due: 'Wed evening',
    summary: 'Forecast low of 4°C on Thursday night.', action: 'Review valley sensor readings and cover seedlings if needed.',
    reasons: [{ label: 'Forecast low', value: '4°C' }, { label: 'Stage', value: 'V6' }] },
  { id: 'r4', title: 'Reconnect soil sensor WP-01', fieldId: 'west-pasture', priority: 'Low', category: 'Maintenance', status: 'To do', due: 'Jun 20',
    summary: 'No readings received since last Thursday.', action: 'Check solar panel, battery and LoRaWAN signal.',
    reasons: [{ label: 'Last seen', value: '5 days ago' }, { label: 'Battery', value: '—' }] },
  { id: 'r5', title: 'Plan post-harvest cover crop', fieldId: 'south-flats', priority: 'Scheduled', category: 'Planning', status: 'To do', due: 'Jul 30',
    summary: 'Organic matter is 3.4%; a cover crop can raise it and reduce erosion.', action: 'Discuss mix options with your agronomist.',
    reasons: [{ label: 'Organic matter', value: '3.4%' }] },
];

export const DEVICES: Device[] = [
  { id: 'NR-01', name: 'NR-01 · Soil sensor', type: 'Soil sensor', location: 'North Ridge', status: 'Online', battery: 84, lastSeen: '09:42 today', reading: '18% · 21.4°C' },
  { id: 'EM-01', name: 'EM-01 · Soil sensor', type: 'Soil sensor', location: 'East Meadow', status: 'Online', battery: 81, lastSeen: '09:41 today', reading: '32% · 20.8°C' },
  { id: 'RB-01', name: 'RB-01 · Soil sensor', type: 'Soil sensor', location: 'River Bend', status: 'Online', battery: 76, lastSeen: '09:40 today', reading: '29% · 20.2°C' },
  { id: 'SF-01', name: 'SF-01 · Soil sensor', type: 'Soil sensor', location: 'South Flats', status: 'Online', battery: 69, lastSeen: '09:42 today', reading: '34% · 19.6°C' },
  { id: 'WP-01', name: 'WP-01 · Soil sensor', type: 'Soil sensor', location: 'West Pasture', status: 'Offline', battery: 0, lastSeen: 'Jun 11, 18:30', reading: '—' },
  { id: 'OB-01', name: 'OB-01 · Soil sensor', type: 'Soil sensor', location: 'Orchard Block', status: 'Low battery', battery: 14, lastSeen: '09:39 today', reading: '35% · 19.9°C' },
  { id: 'WS-01', name: 'WS-01 · Weather station', type: 'Weather station', location: 'Farm centre', status: 'Online', battery: null, lastSeen: 'Live', reading: '22°C · 64% RH' },
  { id: 'GW-01', name: 'GW-01 · LoRaWAN gateway', type: 'Gateway', location: 'Barn roof', status: 'Online', battery: null, lastSeen: 'Live', reading: '23 devices linked' },
];

export const SAVED_REPORTS: SavedReport[] = [
  { id: 'sr1', name: 'Monthly field overview', period: 'May 1 – May 31', author: 'James Miller', generated: 'Jun 1, 2026', format: 'PDF' },
  { id: 'sr2', name: 'Spring soil baseline', period: 'Mar 1 – Apr 30', author: 'Dr. Sarah Chen', generated: 'May 3, 2026', format: 'PDF' },
  { id: 'sr3', name: 'Water efficiency review', period: 'Apr 15 – Jun 15', author: 'James Miller', generated: 'Jun 16, 2026', format: 'CSV' },
];

export const TEAM = [
  { id: 't1', name: 'James Miller', email: 'james@greenvalley.example', role: 'Owner' },
  { id: 't2', name: 'Dr. Sarah Chen', email: 'sarah@greenvalley.example', role: 'Agronomist' },
  { id: 't3', name: 'Emma Torres', email: 'emma@greenvalley.example', role: 'Operator' },
];

// ---------- генерация рядов ----------
const DAYS = (n: number) => {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 864e5);
    out.push(fmtDay(d));
  }
  return out;
};

function seeded(seed: number) {
  let s = seed;
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
}

export function moistureSeries(f: Field, days: number): SeriesPoint[] {
  const rnd = seeded(f.id.length * 97 + days);
  const labels = DAYS(days);
  const start = f.moisture + (f.moisture < 22 ? 12 : 1);
  return labels.map((label, i) => ({
    label,
    value: +(start + (f.moisture - start) * (i / (days - 1)) + (rnd() - 0.5) * 1.6).toFixed(1),
  }));
}

export function ndviSeries(f: Field, days: number): SeriesPoint[] {
  const rnd = seeded(f.code.length * 31 + days);
  return DAYS(days).map((label, i) => ({
    label,
    value: +(Math.max(0.2, f.ndvi - 0.18 + (0.18 * i) / (days - 1) + (rnd() - 0.5) * 0.04)).toFixed(2),
  }));
}

export function measurementHistory(f: Field): Measurement[] {
  const rnd = seeded(f.code.length * 13);
  return Array.from({ length: 8 }, (_, i) => {
    const d = new Date(Date.now() - i * 864e5);
    return {
      when: fmtDay(d) + ' · 08:42',
      moisture: Math.round(f.moisture + i * (f.moisture < 22 ? 1.2 : 0.2) + (rnd() - 0.5) * 2),
      temp: +(f.soilTemp - i * 0.15 + (rnd() - 0.5) * 0.5).toFixed(1),
      ec: +(f.ec + (rnd() - 0.5) * 0.04).toFixed(2),
      ph: +(f.ph + (rnd() - 0.5) * 0.1).toFixed(1),
      source: f.sensorId,
    };
  });
}

export const rainfall7d = () => DAYS(7).map((label, i) => ({ label, value: [0, 0, 2, 11, 3, 0, 0][i] }));

export const IRRIGATION_BY_FIELD = [
  { name: 'North Ridge', m3: 6400 }, { name: 'East Meadow', m3: 4800 }, { name: 'River Bend', m3: 5600 },
  { name: 'South Flats', m3: 3300 }, { name: 'Orchard Block', m3: 2800 }, { name: 'West Pasture', m3: 1400 },
];
