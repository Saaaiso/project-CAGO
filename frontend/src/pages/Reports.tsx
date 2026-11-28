import { useMemo, useState } from 'react';
import { getIrrigationByField, getSavedReports } from '../api/services';
import { useToast } from '../components/Toast';
import { Badge, Card, ErrorBox, HBars, LineChart, Loading, PageHead, Segmented, StatCard } from '../components/Ui';
import { useAsync } from '../hooks/useAsync';
import { locale, t, td } from '../i18n';
import { ndviSeries } from '../mocks/data';
import { useFarm } from '../state/FarmContext';
import { downloadCsv } from '../utils';

type Period = '30' | '60' | '90';

export default function Reports() {
  const { fields, loading, error, reload } = useFarm();
  const saved = useAsync(getSavedReports, []);
  const irr = useAsync(getIrrigationByField, []);
  const [period, setPeriod] = useState<Period>('30');
  const toast = useToast();

  const trend = useMemo(() => {
    if (!fields.length) return [];
    const n = +period;
    const all = fields.map(f => ndviSeries(f, n));
    return all[0].map((p, i) => ({ label: p.label, value: +(all.reduce((s, a) => s + a[i].value, 0) / all.length).toFixed(2) }));
  }, [fields, period]);

  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const ha = t('ha');
  const m3 = t('m³');
  const totalM3 = (irr.data ?? []).reduce((s, r) => s + r.m3, 0);
  const avg = (k: 'moisture' | 'ndvi') => +(fields.reduce((s, f) => s + f[k], 0) / (fields.length || 1)).toFixed(k === 'ndvi' ? 2 : 0);
  const exportCsv = () => {
    downloadCsv('field-performance.csv', [
      [t('Field'), t('Crop'), `${t('Area')}, ${ha}`, `${t('Moisture')}, %`, 'pH', 'NDVI', 'N', 'P', 'K'],
      ...fields.map(f => [td(f.name), td(f.crop), f.areaHa, f.moisture, f.ph, f.ndvi, f.nitrogen, f.phosphorus, f.potassium]),
    ]);
    toast(t('CSV saved'));
  };

  return (
    <>
      <PageHead title={t('Reports')} sub={t('A clearer picture of the farm, season after season.')}
        action={<>
          <button className="btn" onClick={exportCsv}>{t('Export CSV')}</button>
          <button className="btn primary" onClick={() => window.print()}>{t('Export PDF')}</button>
        </>} />

      <div className="toolbar" style={{ marginBottom: 14 }}>
        <Segmented<Period> value={period} onChange={setPeriod} options={[{ value: '30', label: t('30 days') }, { value: '60', label: t('60 days') }, { value: '90', label: t('90 days') }]} />
      </div>

      <div className="grid stats" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <StatCard label={t('Average moisture')} value={avg('moisture')} unit="%" note={t('Across all fields')} />
        <StatCard label={t('Average NDVI')} value={avg('ndvi')} note={t('Vegetation vigor')} />
        <StatCard label={t('Water applied')} value={totalM3.toLocaleString(locale())} unit={m3} note={t('Last {n} days', { n: period })} />
        <StatCard label={t('Alerts resolved')} value={12} note={t('vs 9 previous period')} />
      </div>

      <div className="grid cols-1-1">
        <Card title={t('Vegetation performance')} sub={t('Farm-wide mean NDVI · {n} days', { n: period })}>
          <LineChart data={trend} decimals={2} height={190} />
        </Card>
        <Card title={t('Irrigation by field')} sub={t('Water applied, m³')}>
          {irr.loading ? <Loading /> : <HBars rows={(irr.data ?? []).map(r => ({ name: td(r.name), value: r.m3 }))} unit={` ${m3}`} />}
        </Card>
      </div>

      <Card title={t('Field performance summary')} sub={t('Current season snapshot')} className="mt">
        <div className="table-wrap">
          <table className="t">
            <thead><tr><th>{t('Field / crop')}</th><th>{t('Area')}</th><th>{t('Moisture')}</th><th>pH</th><th>NDVI</th><th>N</th><th>{t('Verdict')}</th></tr></thead>
            <tbody>
              {fields.map(f => (
                <tr key={f.id}>
                  <td>{td(f.name)} · {td(f.crop)}</td><td>{f.areaHa} {ha}</td><td className={f.moisture < 22 ? 'warn' : ''}>{f.moisture}%</td>
                  <td>{f.ph}</td><td>{f.ndvi}</td><td className={f.nitrogen < 60 ? 'warn' : ''}>{f.nitrogen}</td>
                  <td><Badge kind={f.moisture < 22 ? 'warn' : f.nitrogen < 60 ? 'info' : undefined}>{f.moisture < 22 ? t('Needs water') : f.nitrogen < 60 ? t('Low nitrogen') : t('Healthy')}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title={t('Saved reports')} sub={t('Reports your team has generated')} className="mt" action={<button className="link" onClick={() => toast(t('Report generation will appear once the backend contracts are in'))}>{t('Create report')} +</button>}>
        {saved.loading ? <Loading /> : (
          <div className="table-wrap">
            <table className="t">
              <thead><tr><th>{t('Report')}</th><th>{t('Period')}</th><th>{t('Created by')}</th><th>{t('Generated')}</th><th>{t('Format')}</th></tr></thead>
              <tbody>
                {(saved.data ?? []).map(r => (
                  <tr key={r.id}><td>{td(r.name)}</td><td>{td(r.period)}</td><td>{td(r.author)}</td><td>{td(r.generated)}</td><td><Badge kind="mute">{r.format}</Badge></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
