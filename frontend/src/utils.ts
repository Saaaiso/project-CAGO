import { fmtDay, t } from './i18n';
import type { Field, Layer, LatLng, Status } from './types';

export const MOISTURE_TARGET = { min: 28, max: 35 };

export const statusOf = (moisture: number): Status =>
  moisture < 22 ? 'low' : moisture > 35 ? 'high' : 'optimal';

export const fieldStatus = (f: Field) => statusOf(f.moisture);

// Цвет полигона для слоя карты
export function layerColor(f: Field, layer: Layer): string {
  switch (layer) {
    case 'moisture': return f.moisture < 22 ? '#d99a3a' : f.moisture > 35 ? '#5b9bb8' : '#7fb069';
    case 'ph': return f.ph < 6 ? '#d99a3a' : f.ph > 7 ? '#8e7cc3' : '#7fb069';
    case 'ndvi':
    case 'health': return f.ndvi < 0.65 ? '#d99a3a' : f.ndvi < 0.75 ? '#b5c75a' : '#3f9a55';
  }
}

export function layerLegend(layer: Layer): { color: string; label: string }[] {
  switch (layer) {
    case 'moisture': return [{ color: '#d99a3a', label: t('Low <22%') }, { color: '#7fb069', label: t('Optimal 28–35%') }, { color: '#5b9bb8', label: t('High >35%') }];
    case 'ph': return [{ color: '#d99a3a', label: t('Acidic <6.0') }, { color: '#7fb069', label: t('Optimal 6.0–7.0') }, { color: '#8e7cc3', label: t('Alkaline >7.0') }];
    default: return [{ color: '#d99a3a', label: t('Stressed <0.65') }, { color: '#b5c75a', label: t('Watch 0.65–0.75') }, { color: '#3f9a55', label: t('Healthy >0.75') }];
  }
}

export function layerValue(f: Field, layer: Layer): string {
  return layer === 'moisture' ? `${f.moisture}%` : layer === 'ph' ? `${f.ph}` : `${f.ndvi}`;
}

// Площадь полигона в гектарах (равнопромежуточная аппроксимация)
export function polygonAreaHa(poly: LatLng[]): number {
  if (poly.length < 3) return 0;
  const lat0 = poly.reduce((s, p) => s + p[0], 0) / poly.length;
  const kx = 111320 * Math.cos((lat0 * Math.PI) / 180);
  const ky = 110540;
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const [y1, x1] = poly[i];
    const [y2, x2] = poly[(i + 1) % poly.length];
    a += x1 * kx * (y2 * ky) - x2 * kx * (y1 * ky);
  }
  return Math.abs(a / 2) / 10000;
}

export const fmtDate = (d = new Date()) => fmtDay(d, { weekday: true, year: true });

export function downloadCsv(name: string, rows: (string | number)[][]) {
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}
