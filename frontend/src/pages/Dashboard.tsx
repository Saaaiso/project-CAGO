import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getRecommendations, getWeather } from '../api/services';
import FieldMap, { MapLegend } from '../components/FieldMap';
import Icon from '../components/Icon';
import { useToast } from '../components/Toast';
import { Badge, Card, ErrorBox, Loading, PageHead, Segmented, StatCard } from '../components/Ui';
import { useAsync } from '../hooks/useAsync';
import { t, td } from '../i18n';
import { useFarm } from '../state/FarmContext';
import type { Layer } from '../types';
import { downloadCsv, fieldStatus, layerValue } from '../utils';

export default function Dashboard() {
  const { farm, fields, alerts, selected, select, loading, error, reload } = useFarm();
  const weather = useAsync(getWeather, []);
  const recs = useAsync(getRecommendations, []);
  const [layer, setLayer] = useState<Layer>('moisture');
  const nav = useNavigate();
  const toast = useToast();

  const k = useMemo(() => {
    const area = fields.reduce((s, f) => s + f.areaHa, 0);
    const w = (pick: (f: (typeof fields)[number]) => number) => fields.reduce((s, f) => s + pick(f) * f.areaHa, 0) / (area || 1);
    const healthy = fields.filter(f => f.ndvi >= 0.75).reduce((s, f) => s + f.areaHa, 0);
    const stressed = fields.filter(f => f.ndvi < 0.65).reduce((s, f) => s + f.areaHa, 0);
    return {
      area, crops: new Set(fields.map(f => f.crop)).size,
      moisture: Math.round(w(f => f.moisture)), ph: +w(f => f.ph).toFixed(1), nitrogen: Math.round(w(f => f.nitrogen)),
      ndvi: +w(f => f.ndvi).toFixed(2),
      attention: fields.filter(f => fieldStatus(f) === 'low' || f.nitrogen < 60).length,
      healthy, stressed, watch: area - healthy - stressed,
    };
  }, [fields]);

  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const ha = t('ha');
  const pct = (v: number) => `${Math.round((v / (k.area || 1)) * 100)}%`;
  const topRecs = (recs.data ?? []).filter(r => r.priority !== 'Scheduled').slice(0, 2);
  const exportOverview = () => {
    downloadCsv('farm-overview.csv', [
      [t('Field'), t('Crop'), `${t('Area')}, ${ha}`, `${t('Moisture')}, %`, 'pH', 'NDVI', `${t('Nitrogen')}, ${t('mg/kg')}`],
      ...fields.map(f => [td(f.name), td(f.crop), f.areaHa, f.moisture, f.ph, f.ndvi, f.nitrogen]),
    ]);
    toast(t('Overview exported to CSV'));
  };

  return (
    <>
      <PageHead title={t('Good morning')} sub={t("Here's what's happening across your farm today.")}
        action={<button className="btn" onClick={exportOverview}><Icon name="download" size={15} />{t('Export overview')}</button>} />

      <div className="grid stats">
        <StatCard label={t('Farm area')} value={k.area} unit={ha} note={t('All cultivated land')} />
        <StatCard label={t('Active fields')} value={fields.length} note={t('{n} crop types', { n: k.crops })} />
        <StatCard label={t('Avg. moisture')} value={k.moisture} unit="%" note={t('Optimal 28–35%')} tone={k.moisture < 28 ? 'warn' : undefined} />
        <StatCard label={t('Average pH')} value={k.ph} note={t('Optimal 6.0–7.0')} />
        <StatCard label={t('Nitrogen')} value={k.nitrogen} unit={t('mg/kg')} note={t('Field-level: see Soil')} />
        <StatCard label={t('Needs attention')} value={k.attention} unit={t('fields')} note={t('Tap to review')} tone={k.attention ? 'warn' : undefined} onClick={() => nav('/fields')} />
      </div>

      <div className="grid cols-2-1">
        <Card title={t('Your farm at a glance')} sub={t('{farm} · {n} fields · {area} ha', { farm: farm ? td(farm.name) : '', n: fields.length, area: k.area })}
          action={<Link className="link" to="/fields">{t('Open Fields')} ↗</Link>}>
          <div style={{ marginBottom: 8 }}>
            <Segmented<Layer> value={layer} onChange={setLayer}
              options={[{ value: 'moisture', label: t('Moisture') }, { value: 'health', label: t('Crop health') }]} />
          </div>
          <FieldMap fields={fields} selectedId={selected?.id} onSelect={select} layer={layer} height={320} />
          <MapLegend layer={layer} />
          {selected && (
            <div className="row-between" style={{ marginTop: 10 }}>
              <div><b>{td(selected.name)}</b><div className="card-sub">{selected.code} · {td(selected.crop)} · {selected.areaHa} {ha}</div></div>
              <Badge kind={fieldStatus(selected) === 'low' ? 'warn' : undefined}>{layerValue(selected, layer)} · {fieldStatus(selected) === 'low' ? t('Low') : t('OK')}</Badge>
            </div>
          )}
        </Card>

        <div className="grid" style={{ alignContent: 'start' }}>
          <Card title={t('Crop health')} sub={t('Area-weighted satellite assessment')}
            action={<Link className="link" to="/crops">{t('View monitoring')} ↗</Link>}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div className="ring" style={{ ['--p' as string]: k.ndvi * 100 }}><div>{k.ndvi}</div></div>
              <div style={{ fontSize: 12.5, display: 'grid', gap: 4 }}>
                <span><i className="dot online" />{t('Healthy')} <b>{Math.round(k.healthy)} {ha} · {pct(k.healthy)}</b></span>
                <span><i className="dot low" />{t('Watch')} <b>{Math.round(k.watch)} {ha} · {pct(k.watch)}</b></span>
                <span><i className="dot offline" />{t('Stressed')} <b>{Math.round(k.stressed)} {ha} · {pct(k.stressed)}</b></span>
              </div>
            </div>
          </Card>

          <Card title={t('Weather outlook')} action={<Link className="link" to="/weather">{t('Forecast')} ↗</Link>}>
            {weather.loading || !weather.data ? <Loading /> : (
              <>
                <div className="row-between" style={{ alignItems: 'baseline' }}>
                  <span style={{ fontSize: 26, fontWeight: 600 }}>{weather.data.tempNow}°C</span>
                  <span className="card-sub">{td(weather.data.summary)} · {t('wind {n} km/h', { n: weather.data.wind })}</span>
                </div>
                <div className="weather">
                  {weather.data.days.slice(0, 5).map((d, i) => (
                    <div key={d.d} className={i === 0 ? 'today' : ''}>
                      <small>{t(d.d)}</small><Icon name={d.icon} size={16} /><b style={{ display: 'block' }}>{d.hi}°</b>
                      <small>{d.lo}°</small><small>{d.rain} {t('mm')}</small>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </div>
      </div>

      <div className="grid cols-1-1 mt">
        <Card title={t('Farm alerts')} sub={t('Stay ahead of changing conditions')} action={<span className="card-sub">{t('{n} new', { n: alerts.length })}</span>}>
          <div className="stack">
            {alerts.length === 0 && <div className="empty">{t('No new alerts')}</div>}
            {alerts.map(a => (
              <div className="alert" key={a.id}><b>{td(a.title)}</b>{td(a.text)}</div>
            ))}
          </div>
        </Card>

        <Card title={t('Recommended actions')} sub={t('Your next best steps, ranked by field data')}
          action={<Link className="link" to="/recommendations">{t('View all')} ↗</Link>}>
          {recs.loading ? <Loading /> : (
            <div className="stack">
              {topRecs.map(r => (
                <Link className="list-item" key={r.id} to="/recommendations" state={{ id: r.id }}>
                  <b>{td(r.title)}</b><span>{td(r.summary)}</span>
                  <div style={{ marginTop: 6 }}><Badge kind={r.priority === 'High priority' ? 'bad' : 'warn'}>{t(r.priority)}</Badge></div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
