import { LANGS, useLang } from '../i18n';

export default function LangSwitch({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useLang();
  return (
    <div className={`seg lang-switch ${compact ? 'compact' : ''}`} role="group" aria-label="Language">
      {LANGS.map(l => (
        <button key={l.id} className={l.id === lang ? 'on' : ''} title={l.name} aria-pressed={l.id === lang} onClick={() => setLang(l.id)}>
          {l.short}
        </button>
      ))}
    </div>
  );
}
