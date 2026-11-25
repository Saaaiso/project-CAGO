import L from 'leaflet';
import { useMemo, useState } from 'react';
import { runImagery } from '../api/imagery';
import { getNdviSeries } from '../api/services';
import FieldMap, { ImageOverlay, MapLegend } from '../components/FieldMap';
import { useToast } from '../components/Toast';
import { Badge, Card, ErrorBox, HBars, LineChart, Loading, PageHead, Segmented, StatCard } from '../components/Ui';
import { useAsync } from '../hooks/useAsync';
import { fmtDateTime, t, td } from '../i18n';
import { useFarm } from '../state/FarmContext';

type Range = '14' | '30' | '60';
const stateOf = (n: number) => (n >= 0.75 ? t('Healthy') : n >= 0.65 ? t('Watch') : t('Stressed'));
const kindOf = (n: number) => (n >= 0.75 ? undefined : n >= 0.65 ? 'warn' : 'bad');

export default function CropMonitoring() {
  const { fields, selected, select, loading, error, reload } = useFarm();
  const [range, setRange] = useState<Range>('30');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [images, setImages] = useState<Record<string, { url: string; at: string }>>({});
  const [reqErr, setReqErr] = useState('');
  const toast = useToast();
  const f = selected;

  const ndvi = useAsync(() => (f ? getNdviSeries(f, +range) : Promise.resolve([])), [f?.id, range]);

  const cropMix = useMemo(() => {
    const m = new Map<string, number>();
    fields.forEach(x => m.set(x.crop, (m.get(x.crop) ?? 0) + x.areaHa));
    return [...m].map(([name, value]) => ({ name: td(name), value })).sort((a, b) => b.value - a.value);
  }, [fields]);

  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  if (!f) return <ErrorBox message={t('No fields. Add a field in Fields.')} />;

  const ha = t('ha');
  const img = images[f.id];
  const overlay: ImageOverlay | null = img ? {
    url: img.url,
    bounds: (() => { const b = L.latLngBounds(f.polygon); return [[b.getSouth(), b.getWest()], [b.getNorth(), b.getEast()]] as [[number, number], [number, number]]; })(),
  } : null;
  const c = L.latLngBounds(f.polygon).getCenter();

  async function requestImage() {
    if (!f) return;
    setBusy(true); setReqErr(''); setStatus('sent');
    try {
      const today = new Date().toISOString().slice(0, 10);
      const from = new Date(Date.now() - 14 * 864e5).toISOString().slice(0, 10);
      const r = await runImagery(
        { fieldName: f.name, lat: +c.lat.toFixed(5), lon: +c.lng.toFixed(5), dateFrom: from, dateTo: today, source: 'sentinel-2', index: 'ndvi' },
        setStatus,
      );
      setImages(p => ({ ...p, [f.id]: { url: r.imageUrl, at: fmtDateTime(new Date()) } }));
      toast(t('Image received'));
    } catch (e) {
      setReqErr((e as Error).message);
    } finally {
      setBusy(false); setStatus('');
    }
  }

  const trend = ndvi.data ?? [];
  const delta = trend.length ? +(trend[trend.length - 1].value - trend[0].value).toFixed(2) : 0;
  const stressedHa = fields.filter(x => x.ndvi < 0.65).reduce((s, x) => s + x.areaHa, 0);

  return (
    <>
      <PageHead title={t('Crop Monitoring')} sub={t('Satellite vegetation health, field by field.')}
        action={
          <button className="btn primary" disabled={busy} onClick={requestImage}>
            {busy ? t('Image: {s}', { s: status || '…' }) : t('Get NDVI image')}
          </button>
        } />

      {reqErr && <div className="alert err" role="alert" style={{ marginBottom: 14 }}><b>{t('Could not get the image')}</b>{reqErr}</div>}

      <div className="toolbar" style={{ marginBottom: 14 }}>
        <select className="field-input" style={{ width: 'auto' }} aria-label={t('Field')} value={f.id} onChange={e => select(e.target.value)}>
          {fields.map(x => <option key={x.id} value={x.id}>{td(x.name)} · {td(x.crop)}</option>)}
        </select>
        <Badge kind={kindOf(f.ndvi)}>{stateOf(f.ndvi)}</Badge>
      </div>

      <div className="grid stats" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <StatCard label={t('Field NDVI')} value={f.ndvi} note={stateOf(f.ndvi)} tone={f.ndvi < 0.65 ? 'bad' : f.ndvi < 0.75 ? 'warn' : undefined} />
        <StatCard label={t('Growth stage')} value={td(f.stage)} note={td(f.crop)} />
        <StatCard label={t('Change, {n} d', { n: range })} value={`${delta >= 0 ? '+' : ''}${delta}`} note={t('NDVI trend')} tone={delta < 0 ? 'warn' : undefined} />
        <StatCard label={t('Stressed area')} value={stressedHa} unit={ha} note={t('Whole farm')} tone={stressedHa ? 'bad' : undefined} />
      </div>

      <div className="grid cols-2-1">
        <Card title={t('Satellite imagery')} sub={img ? t('Sentinel-2 NDVI · received {at}', { at: img.at }) : t('Press "Get NDVI image" to request a fresh image')}>
          <FieldMap fields={fields} selectedId={f.id} onSelect={select} layer="ndvi" satellite zoomToSelected overlay={overlay} height={360} />
          <MapLegend layer="ndvi" />
          {busy && <div className="alert ok" style={{ marginTop: 10 }}><b>{t('Processing')}</b>{t('Task status: {s}. The worker is downloading Sentinel-2 and computing NDVI.', { s: status || 'sent' })}</div>}
        </Card>

        <div className="grid" style={{ alignContent: 'start' }}>
          <Card title={t('Vegetation trend')} sub={`${td(f.name)} · ${t('mean NDVI')}`}
            action={<Segmented<Range> value={range} onChange={setRange} options={[{ value: '14', label: t('14d') }, { value: '30', label: t('30d') }, { value: '60', label: t('60d') }]} />}>
            {ndvi.loading ? <Loading /> : <LineChart data={trend} height={170} decimals={2} target={0.75} />}
          </Card>
          <Card title={t('Crop mix')} sub={t('Area by crop, ha')}><HBars rows={cropMix} unit={` ${ha}`} /></Card>
        </div>
      </div>

      <Card title={t('Field-by-field comparison')} sub={t('Latest satellite pass')} className="mt">
        <div className="table-wrap">
          <table className="t">
            <thead><tr><th>{t('Field / crop')}</th><th>{t('Stage')}</th><th>NDVI</th><th>{t('State')}</th><th>{t('Area')}</th></tr></thead>
            <tbody>
              {fields.map(x => (
                <tr key={x.id} className="click" onClick={() => select(x.id)}>
                  <td>{td(x.name)} · {td(x.crop)}</td><td>{td(x.stage)}</td><td>{x.ndvi}</td>
                  <td><Badge kind={kindOf(x.ndvi)}>{stateOf(x.ndvi)}</Badge></td><td>{x.areaHa} {ha}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
