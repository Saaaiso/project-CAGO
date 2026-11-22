import { useEffect, useState } from 'react';
import { USE_MOCK } from '../api/client';
import { useToast } from '../components/Toast';
import { Badge, Card, PageHead, Switch } from '../components/Ui';
import { LANGS, t, td, useLang } from '../i18n';
import { TEAM } from '../mocks/data';
import { useFarm } from '../state/FarmContext';

type Tab = 'profile' | 'notifications' | 'team' | 'integrations';
const KEY = 'cago.settings.v1';

interface S {
  farmName: string; location: string; units: 'metric' | 'imperial'; depth: string;
  notify: Record<string, boolean>;
}
const DEFAULTS: S = {
  farmName: '', location: '', units: 'metric', depth: '0-30',
  notify: { critical: true, weather: true, sensors: true, product: false },
};

function load(): S {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }; } catch { return DEFAULTS; }
}

export default function Settings() {
  const { farm } = useFarm();
  const { lang, setLang } = useLang();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('profile');
  const [s, setS] = useState<S>(load);
  const [dirty, setDirty] = useState(false);

  const TABS: { id: Tab; label: string }[] = [
    { id: 'profile', label: t('Farm profile') }, { id: 'notifications', label: t('Notifications') },
    { id: 'team', label: t('Team & access') }, { id: 'integrations', label: t('Integrations') },
  ];

  useEffect(() => {
    if (farm) setS(p => ({ ...p, farmName: p.farmName || td(farm.name), location: p.location || td(farm.location) }));
  }, [farm]);

  const upd = <K extends keyof S>(k: K, v: S[K]) => { setS(p => ({ ...p, [k]: v })); setDirty(true); };
  const save = () => {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* приватный режим */ }
    setDirty(false); toast(t('Settings saved'));
  };
  const cancel = () => { setS(load()); setDirty(false); };

  return (
    <>
      <PageHead title={t('Settings')} sub={t('Close the gap between how you work and how the app works.')}
        action={<><button className="btn" onClick={cancel} disabled={!dirty}>{t('Cancel')}</button><button className="btn primary" onClick={save} disabled={!dirty}>{t('Save changes')}</button></>} />

      <div className="tabs" role="tablist">
        {TABS.map(x => <button key={x.id} role="tab" aria-selected={tab === x.id} className={tab === x.id ? 'on' : ''} onClick={() => setTab(x.id)}>{x.label}</button>)}
      </div>

      {tab === 'profile' && (
        <div className="grid cols-1-1" style={{ alignItems: 'start' }}>
          <Card title={t('Farm profile')} sub={t("Your farm's identity and contact information")}>
            <div className="form-grid">
              <label>{t('Farm name')}<input className="field-input" value={s.farmName} onChange={e => upd('farmName', e.target.value)} /></label>
              <label>{t('Location')}<input className="field-input" value={s.location} onChange={e => upd('location', e.target.value)} /></label>
              <div className="form-row">
                <label>{t('Units')}
                  <select className="field-input" value={s.units} onChange={e => upd('units', e.target.value as S['units'])}>
                    <option value="metric">{t('Metric (ha, mm, mg/kg)')}</option><option value="imperial">{t('Imperial')}</option>
                  </select></label>
                <label>{t('Language')}
                  <select className="field-input" value={lang} onChange={e => setLang(e.target.value as typeof lang)}>
                    {LANGS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select></label>
              </div>
              <label>{t('Default soil depth')}
                <select className="field-input" value={s.depth} onChange={e => upd('depth', e.target.value)}>
                  <option value="0-30">0–30 {t('cm')}</option><option value="30-60">30–60 {t('cm')}</option><option value="60-90">60–90 {t('cm')}</option>
                </select></label>
            </div>
          </Card>
          <Card title={t('Data & privacy')} sub={t("You control your farm's data")}>
            <p className="dev-note" style={{ marginBottom: 12 }}>{t('Data mode')}: <b>{USE_MOCK ? t('demo data (mock)') : t('live backend')}</b></p>
            <button className="btn" onClick={() => toast(t('Data export will appear once the backend contracts are in'))}>{t('Download all data')}</button>
          </Card>
        </div>
      )}

      {tab === 'notifications' && (
        <Card title={t('Alert preferences')} sub={t('Choose what you hear about, and how')}>
          {([
            ['critical', 'Critical field alerts', 'Low moisture, frost, disease risk'],
            ['weather', 'Weather warnings', 'Rain, wind and temperature extremes'],
            ['sensors', 'Device & sensor status', 'Offline sensors and low batteries'],
            ['product', 'Product updates', 'New features and tips'],
          ] as const).map(([k, title, desc]) => (
            <div className="toggle-row" key={k}>
              <div><b>{t(title)}</b><span>{t(desc)}</span></div>
              <Switch label={t(title)} checked={s.notify[k]} onChange={v => { setS(p => ({ ...p, notify: { ...p.notify, [k]: v } })); setDirty(true); }} />
            </div>
          ))}
        </Card>
      )}

      {tab === 'team' && (
        <Card title={t('Team members')} sub={t('People with access to this farm')}
          action={<button className="link" onClick={() => toast(t('Invitations will appear once the backend contracts are in'))}>{t('Invite member')} +</button>}>
          <div className="table-wrap">
            <table className="t">
              <thead><tr><th>{t('Name')}</th><th>Email</th><th>{t('Role')}</th></tr></thead>
              <tbody>{TEAM.map(m => <tr key={m.id}><td>{td(m.name)}</td><td>{m.email}</td><td><Badge kind="mute">{t(m.role)}</Badge></td></tr>)}</tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'integrations' && (
        <Card title={t('Connected services')} sub={t('Data sources feeding your farm')}>
          {[
            ['Sentinel-2 imagery', 'Satellite NDVI via Python workers · MinIO storage'],
            ['Weather service', 'Forecast and precipitation data'],
            ['Farm sensor network', 'LoRaWAN gateway GW-01'],
          ].map(([title, desc]) => (
            <div className="toggle-row" key={title}>
              <div><b>{t(title)}</b><span>{t(desc)}</span></div>
              <Badge>{t('Connected')}</Badge>
            </div>
          ))}
        </Card>
      )}
    </>
  );
}
