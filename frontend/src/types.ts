export type LatLng = [number, number]; // [lat, lng]
export type Status = 'low' | 'optimal' | 'high';

export interface Farm {
  id: string;
  name: string;
  type: string;
  location: string;
  center: LatLng;
  areaHa: number;
}

export interface Field {
  id: string;
  code: string;
  name: string;
  crop: string;
  stage: string;
  areaHa: number;
  polygon: LatLng[];
  moisture: number;   // %
  ph: number;
  ndvi: number;
  soilTemp: number;   // °C
  ec: number;         // mS/cm
  organicMatter: number; // %
  nitrogen: number;   // mg/kg
  phosphorus: number;
  potassium: number;
  note: string;
  sensorId: string;
}

export type Layer = 'moisture' | 'ph' | 'ndvi' | 'health';

export interface DayForecast { d: string; icon: 'sun' | 'cloud' | 'rain'; hi: number; lo: number; rain: number; wind: number }
export interface Weather {
  tempNow: number; summary: string; wind: number; humidity: number; precipToday: number; evapotranspiration: number;
  days: DayForecast[];
  windows: { task: string; when: string; verdict: 'Recommended' | 'Good option' | 'Acceptable' | 'Avoid' }[];
  watch: { title: string; text: string }[];
}

export interface Alert { id: string; title: string; text: string; fieldId?: string }

export type Priority = 'High priority' | 'Medium' | 'Low' | 'Scheduled';
export interface Recommendation {
  id: string; title: string; fieldId: string; priority: Priority; category: string;
  summary: string; action: string; due: string; status: 'To do' | 'In progress' | 'Done';
  reasons: { label: string; value: string }[];
}

export interface Device {
  id: string; name: string; type: 'Soil sensor' | 'Weather station' | 'Gateway'; location: string;
  status: 'Online' | 'Offline' | 'Low battery'; battery: number | null; lastSeen: string; reading: string;
}

export interface SavedReport { id: string; name: string; period: string; author: string; generated: string; format: 'PDF' | 'CSV' }

export interface Measurement { when: string; moisture: number; temp: number; ec: number; ph: number; source: string }
export interface SeriesPoint { label: string; value: number }
