import { getRainfall, getWeather } from '../api/services';
import Icon from '../components/Icon';
import { Badge, BarChart, Card, ErrorBox, Loading, PageHead, StatCard } from '../components/Ui';
import { useAsync } from '../hooks/useAsync';
import { t, td } from '../i18n';
import { useFarm } from '../state/FarmContext';

export default function Weather() {
  const { farm } = useFarm();
  const w = useAsync(getWeather, []);
  const rain = useAsync(getRainfall, []);

  if (w.loading) return <Loading />;
  if (w.error || !w.data) return <ErrorBox message={w.error ?? t('No data')} onRetry={w.reload} />;
  const d = w.data;
  const total = d.days.reduce((s, x) => s + x.rain, 0);
  const kmh = t('km/h');
  const mm = t('mm');

  return (
    <>
      <PageHead title={t('Weather')} sub={t('Forecast, rainfall outlook and fieldwork windows.')} />

      <div className="grid cols-2-1" style={{ marginBottom: 'var(--gap)' }}>
        <div className="card hero">
          <div className="card-sub" style={{ color: '#c9e0cf' }}>{farm ? td(farm.location) : ''}</div>
          <div style={{ fontSize: 44, fontWeight: 600, letterSpacing: '-.02em' }}>{d.tempNow}°C</div>
          <div>{td(d.summary)} · {t('wind {n} km/h', { n: d.wind })}</div>
          <div style={{ marginTop: 10, fontSize: 12.5, opacity: .85 }}>{t('On track for irrigation and spraying windows over the next 48 hours.')}</div>
        </div>
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <StatCard label={t('Humidity')} value={d.humidity} unit="%" note={t('Relative')} />
          <StatCard label={t('Wind')} value={d.wind} unit={kmh} note={t('Light breeze')} />
          <StatCard label={t('Rain today')} value={d.precipToday} unit={mm} note={t('None expected')} />
          <StatCard label={t('Evapotranspiration')} value={d.evapotranspiration} unit={t('mm/d')} note={t('Crop water demand')} />
        </div>
      </div>

      <Card title={t('7-day forecast')} sub={t('Expected rainfall: {n} mm', { n: total })}>
        <div className="wx">
          {d.days.map((x, i) => (
            <div key={x.d} className={i === 0 ? 'today' : ''}>
              <small>{t(x.d)}</small><Icon name={x.icon} size={20} />
              <b style={{ display: 'block' }}>{x.hi}°</b><small>{x.lo}°</small><small>{x.rain} {mm}</small>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid cols-1-1 mt">
        <Card title={t('Rainfall outlook')} sub={t('Expected precipitation, mm/day')}>
          {rain.loading ? <Loading /> : <BarChart data={rain.data ?? []} height={170} />}
          <div className="alert" style={{ marginTop: 10 }}>
            <b>{t("Rain won't arrive soon enough for North Ridge")}</b>{t("Friday's 11 mm will not cover the current deficit. Irrigate today.")}
          </div>
        </Card>

        <Card title={t('Fieldwork windows')} sub={t('Based on rain, wind and soil moisture')}>
          <div className="stack">
            {d.windows.map(x => (
              <div className="list-item row-between" key={x.task}>
                <div><b>{t(x.task)}</b><span>{td(x.when)}</span></div>
                <Badge kind={x.verdict === 'Avoid' ? 'bad' : x.verdict === 'Acceptable' ? 'warn' : undefined}>{t(x.verdict)}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title={t('Field watch')} sub={t('Weather risks that need attention')} className="mt">
        <div className="grid cols-1-1">
          {d.watch.map(x => <div className="alert" key={x.title}><b>{td(x.title)}</b>{td(x.text)}</div>)}
        </div>
      </Card>
    </>
  );
}
