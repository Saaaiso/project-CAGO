import { Link } from 'react-router-dom';
import { PageHead } from '../components/Ui';
import { t } from '../i18n';

export default function NotFound() {
  return (
    <>
      <PageHead title={t('Page not found')} sub={t('This page does not exist.')} />
      <Link className="btn primary" to="/">{t('Go to dashboard')}</Link>
    </>
  );
}
