import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import { t, td } from '../i18n';
import type { Field, LatLng, Layer } from '../types';
import { layerColor, layerLegend, layerValue } from '../utils';

const OSM = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const SAT = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

export interface ImageOverlay { url: string; bounds: [LatLng, LatLng]; opacity?: number }

interface Props {
  fields: Field[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  layer?: Layer;
  satellite?: boolean;
  height?: number | string;
  zoomToSelected?: boolean;
  // режим рисования нового поля
  drawing?: boolean;
  draft?: LatLng[];
  onDraftChange?: (p: LatLng[]) => void;
  overlay?: ImageOverlay | null;
  className?: string;
}

export default function FieldMap({
  fields, selectedId, onSelect, layer = 'moisture', satellite = false, height = 340, zoomToSelected = false,
  drawing = false, draft = [], onDraftChange, overlay, className,
}: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const tiles = useRef<L.TileLayer | null>(null);
  const polys = useRef<L.LayerGroup>(L.layerGroup());
  const draftLayer = useRef<L.LayerGroup>(L.layerGroup());
  const overlayLayer = useRef<L.ImageOverlay | null>(null);
  const fittedFor = useRef('');
  // актуальные callbacks без пересоздания карты
  const cb = useRef({ onSelect, onDraftChange, drawing, draft });
  cb.current = { onSelect, onDraftChange, drawing, draft };

  // init
  useEffect(() => {
    if (!el.current) return;
    const m = L.map(el.current, { zoomControl: true, attributionControl: true, scrollWheelZoom: false, zoomSnap: 0.25 }).setView([43.4, 76.65], 12);
    map.current = m;
    polys.current.addTo(m);
    draftLayer.current.addTo(m);
    m.on('click', (e: L.LeafletMouseEvent) => {
      if (cb.current.drawing) cb.current.onDraftChange?.([...cb.current.draft, [e.latlng.lat, e.latlng.lng]]);
    });
    const ro = new ResizeObserver(() => m.invalidateSize());
    ro.observe(el.current);
    return () => { ro.disconnect(); m.remove(); map.current = null; tiles.current = null; };
  }, []);

  // tiles
  useEffect(() => {
    const m = map.current; if (!m) return;
    tiles.current?.remove();
    tiles.current = L.tileLayer(satellite ? SAT : OSM, {
      maxZoom: 19, attribution: satellite ? 'Imagery © Esri' : '© OpenStreetMap',
    }).addTo(m);
    tiles.current.bringToBack();
  }, [satellite]);

  // polygons
  useEffect(() => {
    const m = map.current; if (!m) return;
    polys.current.clearLayers();
    fields.forEach(f => {
      const sel = f.id === selectedId;
      const p = L.polygon(f.polygon, {
        color: sel ? '#111' : '#2f5d3c', weight: sel ? 3 : 1.2, fillColor: layerColor(f, layer), fillOpacity: satellite ? 0.45 : 0.7,
      });
      p.bindTooltip(`<b>${td(f.name)}</b><br>${td(f.crop)} · ${layerValue(f, layer)}`, { sticky: true });
      p.on('click', () => { if (!cb.current.drawing) cb.current.onSelect?.(f.id); });
      polys.current.addLayer(p);
    });
    // первичный fit / при изменении состава полей
    const key = fields.map(f => f.id).join(',');
    if (key && fittedFor.current !== key && fields.length) {
      fittedFor.current = key;
      m.invalidateSize();
      m.fitBounds(L.latLngBounds(fields.flatMap(f => f.polygon)), { padding: [16, 16] });
    }
  }, [fields, selectedId, layer, satellite]);

  // zoom to selected
  useEffect(() => {
    const m = map.current; if (!m || !zoomToSelected) return;
    const f = fields.find(x => x.id === selectedId);
    if (f) m.flyToBounds(L.latLngBounds(f.polygon), { padding: [30, 30], maxZoom: 15, duration: 0.5 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, zoomToSelected]);

  // draft polygon
  useEffect(() => {
    const g = draftLayer.current; g.clearLayers();
    if (draft.length >= 3) L.polygon(draft, { color: '#1d4632', weight: 2, dashArray: '6 4', fillColor: '#2f7d52', fillOpacity: 0.25 }).addTo(g);
    else if (draft.length === 2) L.polyline(draft, { color: '#1d4632', weight: 2, dashArray: '6 4' }).addTo(g);
    draft.forEach(p => L.circleMarker(p, { radius: 5, color: '#1d4632', fillColor: '#fff', fillOpacity: 1, weight: 2 }).addTo(g));
  }, [draft]);

  // cursor + overlay
  useEffect(() => { if (el.current) el.current.style.cursor = drawing ? 'crosshair' : ''; }, [drawing]);
  useEffect(() => {
    const m = map.current; if (!m) return;
    overlayLayer.current?.remove(); overlayLayer.current = null;
    if (overlay) {
      overlayLayer.current = L.imageOverlay(overlay.url, overlay.bounds, { opacity: overlay.opacity ?? 0.85 }).addTo(m);
    }
  }, [overlay]);

  return <div ref={el} className={`map ${className ?? ''}`} style={{ height }} role="application" aria-label={t('Field map')} />;
}

export function MapLegend({ layer = 'moisture' }: { layer?: Layer }) {
  return (
    <div className="legend">
      {layerLegend(layer).map(l => (
        <span key={l.label}><i style={{ background: l.color }} />{l.label}</span>
      ))}
    </div>
  );
}
