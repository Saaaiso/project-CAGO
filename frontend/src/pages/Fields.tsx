import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AddFieldModal from '../components/AddFieldModal';
import FieldMap, { MapLegend } from '../components/FieldMap';
import Icon from '../components/Icon';
import { useToast } from '../components/Toast';
import { Badge, Card, Empty, ErrorBox, Loading, PageHead, Segmented } from '../components/Ui';
import { t, td } from '../i18n';
import { useFarm } from '../state/FarmContext';
import type { Layer } from '../types';
import { downloadCsv, fieldStatus } from '../utils';

export default function Fields() {
  const { fields, selected, select, loading, error, reload } = useFarm();
  const [layer, setLayer] = useState<Layer>('moisture');
  const [sat, setSat] = useState(false);
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState(false);
  const toast = useToast();

  const list = useMemo(
    () => fields.filter(f => `${td(f.name)} ${td(f.crop)} ${f.code}`.toLowerCase().includes(q.trim().toLowerCase())),
    [fields, q],
  );

  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const ha = t('ha');
  const exportCsv = () => {
    downloadCsv('fields.csv', [
      [t('Code'), t('Field'), t('Crop'), `${t('Area')}, ${ha}`, `${t('Moisture')}, %`, 'pH', 'NDVI', t('Status')],
      ...fields.map(f => [f.code, td(f.name), td(f.crop), f.areaHa, f.moisture, f.ph, f.ndvi, td(f.note)]),
    ]);
    toast(t('CSV saved'));
  };

  return (
    <>
      <PageHead title={t('Fields')} sub={t('Every field. One clear view of your farm.')}
        action={<button className="btn primary" onClick={() => setAdding(true)}><Icon name="plus" size={15} />{t('Add field')}</button>} />

      <div className="grid cols-fields">
        <Card title={t('Your fields')} action={<span className="card-sub">{t('{n} fields', { n: fields.length })}</span>}>
          <input className="field-input" style={{ marginBottom: 10 }} placeholder={t('Search {n} fields', { n: fields.length })} aria-label={t('Search fields')}
            value={q} onChange={e => setQ(e.target.value)} />
          <div className="list">
            {list.length === 0 && <Empty>{t('Nothing found')}</Empty>}
            {list.map(f => (
              <button key={f.id} className={`list-item ${f.id === selected?.id ? 'sel' : ''}`} onClick={() => select(f.id)}>
                <b>{td(f.name)}</b>
                <span>{f.code} · {td(f.crop)} · {f.areaHa} {ha}</span>
                <span className={fieldStatus(f) === 'low' ? 'bad' : ''} style={{ display: 'block' }}>{f.moisture}% {t('moisture')} · {td(f.note)}</span>
              </button>
            ))}
          </div>
        </Card>

        <div className="grid">
          <Card title={t('Field boundaries')} sub={t('Color by selected layer · click a field to select')}
            action={<span className="card-sub">{t('{n} fields', { n: fields.length })}</span>}>
            <div className="toolbar">
              <Segmented<Layer> value={layer} onChange={setLayer}
                options={[{ value: 'moisture', label: t('Moisture') }, { value: 'ph', label: 'pH' }, { value: 'ndvi', label: 'NDVI' }, { value: 'health', label: t('Crop health') }]} />
              <button className={`btn ${sat ? 'on' : ''}`} style={{ padding: '4px 10px' }} onClick={() => setSat(s => !s)}>
                <Icon name="satellite" size={14} />{t('Satellite')}
              </button>
            </div>
            <FieldMap fields={fields} selectedId={selected?.id} onSelect={select} layer={layer} satellite={sat} zoomToSelected height={380} />
            <MapLegend layer={layer} />
          </Card>

          {selected && (
            <Card title={td(selected.name)} sub={`${selected.code} · ${td(selected.crop)} · ${selected.areaHa} ${ha} · ${td(selected.stage)}`}>
              {fieldStatus(selected) === 'low' && (
                <div className="alert" style={{ marginBottom: 12 }}>
                  <b>{t('Irrigation recommended')}</b>
                  {t('Moisture is {n}%, below the 28–35% target. Apply 15 mm during the next irrigation window.', { n: selected.moisture })}
                </div>
              )}
              <div className="kv">
                <div><div className="k">{t('Soil moisture')}</div><div className="v">{selected.moisture}%</div></div>
                <div><div className="k">{t('Soil pH')}</div><div className="v">{selected.ph}</div></div>
                <div><div className="k">{t('Soil temperature')}</div><div className="v">{selected.soilTemp}°C</div></div>
                <div><div className="k">{t('Crop health (NDVI)')}</div><div className="v">{selected.ndvi}</div></div>
              </div>
              <div className="page-actions" style={{ marginTop: 14 }}>
                <Link to="/soil" className="btn primary">{t('View soil analysis')}</Link>
                <Link to="/crops" className="btn">{t('Crop monitoring')}</Link>
              </div>
            </Card>
          )}

          <Card title={t('Field comparison')} sub={t('Latest sensor readings · moisture at 0–30 cm')}
            action={<button className="link" onClick={exportCsv}>{t('Export CSV')}</button>}>
            <div className="table-wrap">
              <table className="t">
                <thead><tr><th>{t('Field / crop')}</th><th>{t('Area')}</th><th>{t('Moisture')}</th><th>pH</th><th>NDVI</th><th>{t('Status')}</th></tr></thead>
                <tbody>
                  {fields.map(f => (
                    <tr key={f.id} className="click" onClick={() => select(f.id)}>
                      <td>{td(f.name)} · {td(f.crop)}</td><td>{f.areaHa} {ha}</td>
                      <td className={fieldStatus(f) === 'low' ? 'warn' : ''}>{f.moisture}%</td>
                      <td>{f.ph}</td><td>{f.ndvi}</td>
                      <td><Badge kind={fieldStatus(f) === 'low' ? 'warn' : undefined}>{td(f.note)}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
      {adding && <AddFieldModal onClose={() => setAdding(false)} />}
    </>
  );
}
