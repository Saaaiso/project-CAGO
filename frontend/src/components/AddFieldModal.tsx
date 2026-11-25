import { useState } from 'react';
import { t, td } from '../i18n';
import { useFarm } from '../state/FarmContext';
import type { LatLng } from '../types';
import { polygonAreaHa } from '../utils';
import FieldMap from './FieldMap';
import { useToast } from './Toast';
import { Modal } from './Ui';

const CROPS = ['Corn', 'Soybeans', 'Winter wheat', 'Spring wheat', 'Barley', 'Alfalfa', 'Sunflower', 'Cotton', 'Apples', 'Other'];

export default function AddFieldModal({ onClose }: { onClose: () => void }) {
  const { fields, addField } = useFarm();
  const toast = useToast();
  const [name, setName] = useState('');
  const [crop, setCrop] = useState(CROPS[0]);
  const [draft, setDraft] = useState<LatLng[]>([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const area = polygonAreaHa(draft);
  const valid = name.trim().length > 0 && draft.length >= 3;

  async function save() {
    if (!valid) { setErr(name.trim() ? t('Mark at least 3 boundary points on the map') : t('Enter a field name')); return; }
    setSaving(true);
    try {
      const f = await addField({ name: name.trim(), crop, polygon: draft, areaHa: Math.round(area * 10) / 10 });
      toast(t('Field "{name}" added', { name: f.name }));
      onClose();
    } catch (e) {
      setErr((e as Error).message);
      setSaving(false);
    }
  }

  return (
    <Modal
      wide title={t('Add field')} onClose={onClose}
      footer={<>
        <button className="btn" onClick={onClose}>{t('Cancel')}</button>
        <button className="btn primary" disabled={saving} onClick={save}>{saving ? t('Saving…') : t('Save field')}</button>
      </>}
    >
      <div className="form-grid">
        <div className="form-row">
          <label>{t('Field name')}
            <input className="field-input" value={name} placeholder={t('e.g. North Ridge')} onChange={e => { setName(e.target.value); setErr(''); }} autoFocus />
          </label>
          <label>{t('Crop')}
            <select className="field-input" value={crop} onChange={e => setCrop(e.target.value)}>
              {CROPS.map(c => <option key={c} value={c}>{td(c)}</option>)}
            </select>
          </label>
        </div>

        <div>
          <div className="row-between" style={{ marginBottom: 6 }}>
            <span className="card-sub">{t('Click the map to outline the field boundary (min. 3 points)')}</span>
            <span style={{ display: 'flex', gap: 6 }}>
              <button className="btn" style={{ padding: '4px 10px' }} onClick={() => setDraft(d => d.slice(0, -1))} disabled={!draft.length}>{t('Undo')}</button>
              <button className="btn" style={{ padding: '4px 10px' }} onClick={() => setDraft([])} disabled={!draft.length}>{t('Clear')}</button>
            </span>
          </div>
          <FieldMap fields={fields} drawing draft={draft} onDraftChange={setDraft} satellite height={320} />
          <div className="card-sub" style={{ marginTop: 6 }}>
            {t('Points')}: <b>{draft.length}</b> · {t('Area')}: <b>{draft.length >= 3 ? `${area.toFixed(1)} ${t('ha')}` : '—'}</b>
          </div>
        </div>
        {err && <div className="alert err" role="alert">{err}</div>}
      </div>
    </Modal>
  );
}
