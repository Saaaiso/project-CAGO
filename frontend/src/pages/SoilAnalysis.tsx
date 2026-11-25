import { useState } from 'react';
import { getMeasurements, getMoistureSeries } from '../api/services';
import FieldMap, { MapLegend } from '../components/FieldMap';
import { useToast } from '../components/Toast';
import { Card, ErrorBox, LineChart, Loading, PageHead, Segmented, StatCard } from '../components/Ui';
import { useAsync } from '../hooks/useAsync';
import { t, td } from '../i18n';
import { useFarm } from '../state/FarmContext';
import type { Layer } from '../types';
import { downloadCsv, fieldStatus } from '../utils';

type Depth = '0-30' | '30-60' | '60-90';
type Range = '7' | '30' | '90';

export default function SoilAnalysis() {
  const { fields, selected, select, loading, error, reload } = useFarm();
  const [depth, setDepth] = useState<Depth>('0-30');
  const [range, setRange] = useState<Range>('30');
  const [layer, setLayer] = useState<Layer>('moisture');
  const toast = useToast();

  const f = selected;
  // глубина пока влияет на моки смещением значений
  const shift = depth === '0-30' ? 0 : depth === '30-60' ? 4 : 7;
  const series = useAsync(() => (f ? getMoistureSeries(f, +range) : Promise.resolve([])), [f?.id, range]);
  const hist = useAsync(() => (f ? getMeasurements(f) : Promise.resolve([])), [f?.id]);

  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  if (!f) return <ErrorBox message={t('No fields. Add a field in Fields.')} />;

  const moisture = f.moisture + shift;
  const trend = series.data ?? [];
  const delta = trend.length ? +(trend[trend.length - 1].value - trend[0].value).toFixed(1) : 0;
  const mgkg = t('mg/kg');
  const csvHead = [t('Date'), `${t('Moisture')} %`, `${t('Temp')} °C`, `EC ${t('mS/cm')}`, 'pH', t('Sensor')];
  const csvRows = () => (hist.data ?? []).map(m => [m.when, m.moisture, m.temp, m.ec, m.ph, m.source]);
  const nutrients = [
    { key: t('N · Nitrogen'), v: f.nitrogen, min: 60, max: 120 },
    { key: t('P · Phosphorus'), v: f.phosphorus, min: 25, max: 45 },
    { key: t('K · Potassium'), v: f.potassium, min: 150, max: 250 },
  ];

  return (
    <>
      <PageHead title={t('Soil Analysis')} sub={t("Understand what's happening beneath the surface.")}
        action={<button className="btn" onClick={() => { downloadCsv(`soil-${f.code}.csv`, [csvHead, ...csvRows()]); toast(t('Soil data exported')); }}>{t('Export soil data')}</button>} />

      <div className="toolbar" style={{ marginBottom: 14 }}>
        <select className="field-input" style={{ width: 'auto' }} aria-label={t('Field')} value={f.id} onChange={e => select(e.target.value)}>
          {fields.map(x => <option key={x.id} value={x.id}>{td(x.name)} · {x.code}</option>)}
        </select>
        <Segmented<Depth> value={depth} onChange={setDepth}
          options={[{ value: '0-30', label: `0–30 ${t('cm')}` }, { value: '30-60', label: `30–60 ${t('cm')}` }, { value: '60-90', label: `60–90 ${t('cm')}` }]} />
        <span className={`badge ${f.sensorId === '—' ? 'mute' : ''}`}>{f.sensorId === '—' ? t('No sensor') : t('Sensor connected')}</span>
      </div>

      <div className="grid stats">
        <StatCard label={t('Soil moisture')} value={moisture} unit="%" note={fieldStatus(f) === 'low' ? t('Low · target 28–35%') : t('Within target')} tone={fieldStatus(f) === 'low' ? 'warn' : undefined} />
        <StatCard label={t('Soil pH')} value={f.ph} note={t('Optimal 6.0–7.0')} tone={f.ph < 6 || f.ph > 7 ? 'warn' : undefined} />
        <StatCard label={t('Temperature')} value={f.soilTemp} unit="°C" note={t('At 10 cm · Optimal')} />
        <StatCard label={t('Conductivity')} value={f.ec.toFixed(2)} unit={t('mS/cm')} note={t('Low salinity · <1.0')} />
        <StatCard label={t('Organic matter')} value={f.organicMatter} unit="%" note={t('Lab sample')} />
        <StatCard label={t('Nitrogen')} value={f.nitrogen} unit={mgkg} note={f.nitrogen < 60 ? t('Low · target 60–120') : t('Within target')} tone={f.nitrogen < 60 ? 'warn' : undefined} />
      </div>

      <div className="grid cols-1-1">
        <Card title={t('Moisture distribution')} sub={t('{name} selected · sensor interpolation', { name: td(f.name) })}>
          <div className="toolbar">
            <Segmented<Layer> value={layer} onChange={setLayer}
              options={[{ value: 'moisture', label: t('Moisture') }, { value: 'ph', label: 'pH' }, { value: 'ndvi', label: 'NDVI' }]} />
          </div>
          <FieldMap fields={fields} selectedId={f.id} onSelect={select} layer={layer} height={300} />
          <MapLegend layer={layer} />
        </Card>

        <Card title={t('Moisture trend')} sub={`${td(f.name)} · ${t('volumetric water content (%)')}`}
          action={<Segmented<Range> value={range} onChange={setRange} options={[{ value: '7', label: t('7d') }, { value: '30', label: t('30d') }, { value: '90', label: t('90d') }]} />}>
          <div style={{ fontSize: 26, fontWeight: 600 }}>
            {moisture}% <small style={{ fontSize: 12, color: delta < 0 ? 'var(--amber-ink)' : 'var(--ok-ink)' }}>{delta < 0 ? '▼' : '▲'} {t('{n} pp in {d} days', { n: Math.abs(delta), d: range })}</small>
          </div>
          {series.loading ? <Loading /> : <LineChart data={trend.map(p => ({ ...p, value: +(p.value + shift).toFixed(1) }))} target={28} unit="%" height={190} />}
          {fieldStatus(f) === 'low' && (
            <div className="alert" style={{ marginTop: 10 }}>
              <b>{t('Below the optimal range')}</b>
              {t('Moisture has remained below 28%. Irrigate 15 mm and recheck in 24 hours.')}
            </div>
          )}
        </Card>
      </div>

      <div className="grid cols-1-1 mt">
        <Card title={t('Nutrient balance')} sub={t('Latest lab sample')}>
          <div className="stack" style={{ gap: 14 }}>
            {nutrients.map(n => {
              const low = n.v < n.min;
              const pct = Math.min(100, (n.v / (n.max * 1.2)) * 100);
              return (
                <div key={n.key}>
                  <div className="row-between" style={{ fontSize: 13 }}><span>{n.key}</span><b>{n.v} {mgkg}</b></div>
                  <div className={`bar ${low ? 'warn' : ''}`}><i style={{ width: `${pct}%` }} /></div>
                  <div className="card-sub">{t('Target')} {n.min}–{n.max} {mgkg}{low ? ` · ${t('below target')}` : ''}</div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title={t('pH & soil composition')} sub={`${td(f.name)} · ${t('latest lab sample')}`}>
          <div style={{ fontSize: 26, fontWeight: 600 }}>{f.ph} <small style={{ fontSize: 12, color: 'var(--muted)' }}>{t('Silt loam')}</small></div>
          <div className="alert ok" style={{ marginTop: 10 }}>
            <b>{f.ph >= 6 && f.ph <= 7 ? t('pH in range') : t('pH out of range')}</b>
            {f.ph >= 6 && f.ph <= 7 ? t('No liming needed.') : t('Consider liming or acidifying amendments.')}{' '}
            {t('Organic matter is {n}%; maintain residues and cover crops to support water retention.', { n: f.organicMatter })}
          </div>
        </Card>
      </div>

      <Card title={t('Measurement history')} sub={`${t('Sensor')} ${f.sensorId} · ${depth} ${t('cm')} · ${f.code}`} className="mt"
        action={<button className="link" onClick={() => downloadCsv(`measurements-${f.code}.csv`, [csvHead, ...csvRows()])}>{t('Download CSV')}</button>}>
        {hist.loading ? <Loading /> : (
          <div className="table-wrap">
            <table className="t">
              <thead><tr><th>{t('Date / time')}</th><th>{t('Moisture')}</th><th>{t('Temp')}</th><th>EC</th><th>pH</th><th>{t('Source')}</th></tr></thead>
              <tbody>
                {(hist.data ?? []).map(m => (
                  <tr key={m.when}><td>{m.when}</td><td className={m.moisture < 22 ? 'warn' : ''}>{m.moisture}%</td><td>{m.temp}°C</td><td>{m.ec.toFixed(2)} {t('mS/cm')}</td><td>{m.ph}</td><td>{m.source}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
