import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import { PageHead } from '../components/Ui';
import { t } from '../i18n';
import { NAV } from '../layout/nav';

// Мобильный экран «More»: все разделы, которых нет в нижней навигации
export default function More() {
  return (
    <>
      <PageHead title={t('More')} sub={t('All sections of your farm workspace.')} />
      <div className="list">
        {NAV.filter(n => !n.mobile).map(n => (
          <Link key={n.path} to={n.path} className="list-item row-between">
            <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}><Icon name={n.icon} /><b style={{ display: 'inline' }}>{t(n.label)}</b></span>
            <span>›</span>
          </Link>
        ))}
      </div>
    </>
  );
}
