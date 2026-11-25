import { createContext, Fragment, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import ky from './ky';
import ru from './ru';

// Ключ перевода = английский текст. Для en возвращается как есть, для ru/ky берётся из словаря.
// t()  — тексты интерфейса (пропуски логируются в dev).
// td() — пользовательские/демо-данные (названия полей, тексты рекомендаций): если перевода нет, молча возвращает оригинал.

export type Lang = 'en' | 'ru' | 'ky';
export const LANGS: { id: Lang; short: string; name: string }[] = [
  { id: 'en', short: 'EN', name: 'English' },
  { id: 'ru', short: 'RU', name: 'Русский' },
  { id: 'ky', short: 'КЫ', name: 'Кыргызча' },
];
const LOCALES: Record<Lang, string> = { en: 'en-US', ru: 'ru-RU', ky: 'ky-KG' };
const STORAGE_KEY = 'cago.lang';
const DICT: Record<Exclude<Lang, 'en'>, Record<string, string>> = { ru, ky };

function detect(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'ru' || saved === 'ky') return saved;
  } catch { /* приватный режим */ }
  const n = (typeof navigator !== 'undefined' ? navigator.language : 'en').toLowerCase();
  return n.startsWith('ru') ? 'ru' : n.startsWith('ky') ? 'ky' : 'en';
}

let current: Lang = detect();
if (typeof document !== 'undefined') document.documentElement.lang = current;

type Params = Record<string, string | number>;
const fill = (s: string, p?: Params) => (p ? s.replace(/\{(\w+)\}/g, (_, k) => String(p[k] ?? `{${k}}`)) : s);

declare global { interface Window { __i18nMissing?: Record<string, Set<string>> } }
function miss(kind: 't' | 'td', key: string) {
  if (!import.meta.env.DEV && !window.__i18nMissing) return;
  const w = (window.__i18nMissing ??= { t: new Set(), td: new Set() });
  w[kind].add(`${current}|${key}`);
  if (import.meta.env.DEV && kind === 't') console.warn(`[i18n:${current}] нет перевода: "${key}"`);
}

export function t(key: string, params?: Params): string {
  if (current === 'en') return fill(key, params);
  const v = DICT[current][key];
  if (v === undefined) miss('t', key);
  return fill(v ?? key, params);
}

export function td(text: string): string {
  if (current === 'en') return text;
  const v = DICT[current][text];
  if (v === undefined) miss('td', text);
  return v ?? text;
}

export const getLang = () => current;

// Даты: для кыргызского форматируем вручную (в части браузеров нет данных локали ky).
const KY_MONTHS = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const KY_DAYS = ['Жек', 'Дүй', 'Шей', 'Шар', 'Бей', 'Жум', 'Ише'];
export function fmtDay(d: Date, o: { weekday?: boolean; year?: boolean } = {}): string {
  if (current === 'ky') {
    return `${o.weekday ? KY_DAYS[d.getDay()] + ', ' : ''}${d.getDate()}-${KY_MONTHS[d.getMonth()]}${o.year ? ' ' + d.getFullYear() : ''}`;
  }
  return d.toLocaleDateString(LOCALES[current], {
    weekday: o.weekday ? 'short' : undefined, month: 'short', day: 'numeric', year: o.year ? 'numeric' : undefined,
  });
}
export function fmtDateTime(d: Date): string {
  const hm = d.toLocaleTimeString(LOCALES[current] === 'ky-KG' ? 'en-GB' : LOCALES[current], { hour: '2-digit', minute: '2-digit' });
  return current === 'ky' ? `${fmtDay(d, { year: true })} ${hm}` : d.toLocaleString(LOCALES[current]);
}
export const locale = () => LOCALES[current];

// ---------- React ----------
interface Ctx { lang: Lang; setLang: (l: Lang) => void }
const LangCtx = createContext<Ctx>({ lang: 'en', setLang: () => {} });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(current);
  const setLang = useCallback((l: Lang) => {
    current = l;
    try { localStorage.setItem(STORAGE_KEY, l); } catch { /* ignore */ }
    document.documentElement.lang = l;
    setLangState(l);
  }, []);
  const value = useMemo(() => ({ lang, setLang }), [lang, setLang]);
  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}

export const useLang = () => useContext(LangCtx);

// Перемонтирует дерево страниц при смене языка (t() — обычная функция, не хук).
// Состояние провайдеров выше (ферма, выбранное поле) сохраняется.
export function LangBoundary({ children }: { children: ReactNode }) {
  const { lang } = useLang();
  return <Fragment key={lang}>{children}</Fragment>;
}
