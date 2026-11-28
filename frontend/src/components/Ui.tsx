import { ReactNode, useEffect } from 'react';
import { locale, t } from '../i18n';
import type { SeriesPoint } from '../types';

export function StatCard({ label, value, unit, note, tone, onClick }: {
  label: string; value: ReactNode; unit?: string; note?: string; tone?: 'warn' | 'bad'; onClick?: () => void;
}) {
  return (
    <div className={`card stat ${onClick ? 'clickable' : ''}`} onClick={onClick}>
      <div className="label">{label}</div>
      <div className="value">{value}{unit && <small>{unit}</small>}</div>
      {note && <div className={`note ${tone ?? ''}`}>{note}</div>}
    </div>
  );
}

export function Card({ title, sub, action, children, className, style }: {
  title?: string; sub?: string; action?: ReactNode; children: ReactNode; className?: string; style?: React.CSSProperties;
}) {
  return (
    <section className={`card ${className ?? ''}`} style={style}>
      {(title || action) && (
        <div className="card-head">
          <div>
            {title && <h3 className="card-title">{title}</h3>}
            {sub && <div className="card-sub">{sub}</div>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Segmented<T extends string>({ options, value, onChange }: {
  options: { value: T; label: string }[]; value: T; onChange: (v: T) => void;
}) {
  return (
    <div className="seg" role="tablist">
      {options.map(o => (
        <button key={o.value} role="tab" aria-selected={o.value === value} className={o.value === value ? 'on' : ''} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Badge({ kind, children }: { kind?: 'warn' | 'bad' | 'info' | 'mute'; children: ReactNode }) {
  return <span className={`badge ${kind ?? ''}`}>{children}</span>;
}

export function PageHead({ title, sub, action }: { title: string; sub: string; action?: ReactNode }) {
  return (
    <div className="page-head">
      <div><h1>{title}</h1><p>{sub}</p></div>
      {action && <div className="page-actions">{action}</div>}
    </div>
  );
}

export function Loading({ label }: { label?: string }) {
  return <div className="loading" role="status"><span className="spinner" />{label ?? t('Loading…')}</div>;
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="alert err" role="alert">
      <b>{t('Could not load data')}</b>{message}
      {onRetry && <div style={{ marginTop: 8 }}><button className="btn" onClick={onRetry}>{t('Retry')}</button></div>}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} className={`switch ${checked ? 'on' : ''}`} onClick={() => onChange(!checked)}>
      <i />
    </button>
  );
}

export function Modal({ title, onClose, children, footer, wide }: {
  title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div className="modal-back" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head"><h3>{title}</h3><button className="icon-btn" onClick={onClose} aria-label={t('Close')}>✕</button></div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

// ---------- Charts ----------
export function LineChart({ data, height = 170, target, unit = '', color = 'var(--green-600)', decimals = 0 }: {
  data: SeriesPoint[]; height?: number; target?: number; unit?: string; color?: string; decimals?: number;
}) {
  if (data.length < 2) return <Empty>{t('Not enough data')}</Empty>;
  const W = 600, padL = 34, padR = 8, padT = 8, padB = 22;
  const vals = data.map(d => d.value);
  let lo = Math.min(...vals, target ?? Infinity), hi = Math.max(...vals, target ?? -Infinity);
  const span = hi - lo || 1; lo -= span * 0.15; hi += span * 0.15;
  const x = (i: number) => padL + (i / (data.length - 1)) * (W - padL - padR);
  const y = (v: number) => padT + (1 - (v - lo) / (hi - lo)) * (height - padT - padB);
  const line = data.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(' ');
  const ticks = [lo + (hi - lo) * 0.1, (lo + hi) / 2, hi - (hi - lo) * 0.1];
  const step = Math.max(1, Math.ceil(data.length / 6));
  return (
    <svg viewBox={`0 0 ${W} ${height}`} width="100%" role="img" aria-label={t('Line chart')} style={{ display: 'block' }}>
      {ticks.map(t => (
        <g key={t}>
          <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke="var(--line)" />
          <text x={padL - 6} y={y(t) + 3} fontSize="10" textAnchor="end" fill="var(--muted)">{t.toFixed(decimals)}{unit}</text>
        </g>
      ))}
      {target != null && (
        <g>
          <line x1={padL} x2={W - padR} y1={y(target)} y2={y(target)} stroke="#8a9a8e" strokeDasharray="5 4" />
          <text x={W - padR} y={y(target) - 4} fontSize="10" textAnchor="end" fill="var(--muted)">{t('target')} {target}{unit}</text>
        </g>
      )}
      <path d={`${line} L${x(data.length - 1)},${height - padB} L${padL},${height - padB} Z`} fill={color} opacity=".09" />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <circle cx={x(data.length - 1)} cy={y(data[data.length - 1].value)} r="3.5" fill={color} />
      {data.map((d, i) => i % step === 0 && (
        <text key={d.label} x={x(i)} y={height - 6} fontSize="10" textAnchor="middle" fill="var(--muted)">{d.label}</text>
      ))}
    </svg>
  );
}

export function BarChart({ data, height = 150, unit = '', color = '#4f7f93' }: {
  data: SeriesPoint[]; height?: number; unit?: string; color?: string;
}) {
  const W = 600, padB = 20, padT = 16;
  const max = Math.max(...data.map(d => d.value), 1);
  const bw = (W / data.length) * 0.55;
  return (
    <svg viewBox={`0 0 ${W} ${height}`} width="100%" role="img" aria-label={t('Bar chart')} style={{ display: 'block' }}>
      {data.map((d, i) => {
        const h = (d.value / max) * (height - padB - padT);
        const cx = (i + 0.5) * (W / data.length);
        return (
          <g key={d.label}>
            <rect x={cx - bw / 2} y={height - padB - h} width={bw} height={Math.max(h, 1)} rx="3" fill={color} opacity={d.value ? 1 : 0.25} />
            <text x={cx} y={height - padB - h - 4} fontSize="10.5" textAnchor="middle" fill="var(--ink)">{d.value}{unit}</text>
            <text x={cx} y={height - 5} fontSize="10" textAnchor="middle" fill="var(--muted)">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function HBars({ rows, unit = '' }: { rows: { name: string; value: number }[]; unit?: string }) {
  const max = Math.max(...rows.map(r => r.value), 1);
  return (
    <div className="stack" style={{ gap: 10 }}>
      {rows.map(r => (
        <div key={r.name}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
            <span>{r.name}</span><b>{r.value.toLocaleString(locale())}{unit}</b>
          </div>
          <div className="bar"><i style={{ width: `${(r.value / max) * 100}%` }} /></div>
        </div>
      ))}
    </div>
  );
}
