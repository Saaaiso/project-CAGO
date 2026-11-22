import { NavLink, Outlet, useLocation } from 'react-router-dom';
import Icon from '../components/Icon';
import LangSwitch from '../components/LangSwitch';
import { t, td } from '../i18n';
import { useFarm } from '../state/FarmContext';
import { fmtDate } from '../utils';
import { NAV } from './nav';

export default function AppLayout() {
  const { pathname } = useLocation();
  const current = NAV.find(n => (n.path === '/' ? pathname === '/' : pathname.startsWith(n.path)));
  const { farm, alerts } = useFarm();
  const today = fmtDate();

  return (
    <div className="shell">
      {/* Desktop sidebar / tablet icon rail */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo"><Icon name="logo" size={16} /></div>
          <span>CAGO</span>
        </div>
        <div className="farm-switch">
          <b>{farm ? td(farm.name) : '—'}</b>
          <span>{farm ? `${td(farm.type)} · ${farm.areaHa} ${t('ha')}` : ''}</span>
        </div>
        <nav className="nav">
          {NAV.map(n => (
            <NavLink key={n.path} to={n.path} end={n.path === '/'} title={t(n.label)}>
              <Icon name={n.icon} />
              <span>{t(n.label)}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="avatar">JM</div>
          <span><b>James Miller</b><br />{t('Farm manager')}</span>
        </div>
      </aside>

      <div className="main">
        {/* Mobile header */}
        <div className="mobile-top">
          <span className="mobile-farm">{farm ? td(farm.name) : 'CAGO'}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <LangSwitch compact />
            <span style={{ position: 'relative', display: 'inline-flex' }}><Icon name="bell" />{alerts.length > 0 && <i className="bell-dot" />}</span>
          </span>
        </div>

        {/* Tablet / desktop header */}
        <header className="topbar">
          <div className="crumbs">{t('Workspace')} / <b>{current ? t(current.label) : ''}</b></div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <LangSwitch />
            <span>{today}</span>
            <span style={{ position: 'relative', display: 'inline-flex' }}><Icon name="bell" size={16} />{alerts.length > 0 && <i className="bell-dot" />}</span>
          </div>
        </header>

        <div className="banner">{t('Sample data workspace · Illustrative farm, readings and recommendations')}</div>

        <main className="content">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="bottom-nav">
        {NAV.filter(n => n.mobile).map(n => (
          <NavLink key={n.path} to={n.path} end={n.path === '/'}>
            <Icon name={n.icon} />
            {t(n.short ?? n.label)}
          </NavLink>
        ))}
        <NavLink to="/more">
          <Icon name="more" />
          {t('More')}
        </NavLink>
      </nav>
    </div>
  );
}
