// Сервисный слой. Каждая функция: mock → данные из src/mocks, иначе → реальный запрос.
// Когда придут контракты, правим только REAL-ветки (пути и маппинг ответа).
import { http, USE_MOCK } from './client';
import * as M from '../mocks/data';
import type {
  Alert, Device, Farm, Field, Measurement, Recommendation, SavedReport, SeriesPoint, Weather,
} from '../types';

const delay = <T,>(v: T, ms = 250) => new Promise<T>(r => setTimeout(() => r(structuredClone(v)), ms));

const PATHS = {
  farm: '/api/farm',
  fields: '/api/fields',
  weather: '/api/weather',
  alerts: '/api/alerts',
  recommendations: '/api/recommendations',
  devices: '/api/devices',
  reports: '/api/reports',
  moisture: (id: string, days: number) => `/api/fields/${id}/moisture?days=${days}`,
  ndvi: (id: string, days: number) => `/api/fields/${id}/ndvi?days=${days}`,
  measurements: (id: string) => `/api/fields/${id}/measurements`,
};

let fieldsStore: Field[] = [...M.FIELDS];

export const getFarm = (): Promise<Farm> => (USE_MOCK ? delay(M.FARM) : http('GET', PATHS.farm));
export const getFields = (): Promise<Field[]> => (USE_MOCK ? delay(fieldsStore) : http('GET', PATHS.fields));
export const getWeather = (): Promise<Weather> => (USE_MOCK ? delay(M.WEATHER) : http('GET', PATHS.weather));
export const getAlerts = (): Promise<Alert[]> => (USE_MOCK ? delay(M.ALERTS) : http('GET', PATHS.alerts));
export const getRecommendations = (): Promise<Recommendation[]> => (USE_MOCK ? delay(M.RECOMMENDATIONS) : http('GET', PATHS.recommendations));
export const getDevices = (): Promise<Device[]> => (USE_MOCK ? delay(M.DEVICES) : http('GET', PATHS.devices));
export const getSavedReports = (): Promise<SavedReport[]> => (USE_MOCK ? delay(M.SAVED_REPORTS) : http('GET', PATHS.reports));

export async function createField(input: Pick<Field, 'name' | 'crop' | 'polygon' | 'areaHa'>): Promise<Field> {
  if (!USE_MOCK) return http('POST', PATHS.fields, input);
  const n = fieldsStore.length + 1;
  const f: Field = {
    id: `field-${Date.now()}`, code: `F-${String(n).padStart(2, '0')}`, stage: 'Planned', ...input,
    moisture: 30, ph: 6.4, ndvi: 0.5, soilTemp: 20, ec: 0.35, organicMatter: 3.5, nitrogen: 80, phosphorus: 30, potassium: 190,
    note: 'No sensor yet', sensorId: '—',
  };
  fieldsStore = [...fieldsStore, f];
  return delay(f, 300);
}

export const getMoistureSeries = (f: Field, days: number): Promise<SeriesPoint[]> =>
  USE_MOCK ? delay(M.moistureSeries(f, days)) : http('GET', PATHS.moisture(f.id, days));
export const getNdviSeries = (f: Field, days: number): Promise<SeriesPoint[]> =>
  USE_MOCK ? delay(M.ndviSeries(f, days)) : http('GET', PATHS.ndvi(f.id, days));
export const getMeasurements = (f: Field): Promise<Measurement[]> =>
  USE_MOCK ? delay(M.measurementHistory(f)) : http('GET', PATHS.measurements(f.id));

export const getRainfall = (): Promise<SeriesPoint[]> => delay(M.rainfall7d());
export const getIrrigationByField = () => delay(M.IRRIGATION_BY_FIELD);
