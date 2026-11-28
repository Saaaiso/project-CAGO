import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getRecommendations } from '../api/services';
import { useToast } from '../components/Toast';
import { Badge, Card, Empty, ErrorBox, Loading, PageHead, Segmented } from '../components/Ui';
import { useAsync } from '../hooks/useAsync';
import { t, td } from '../i18n';
import { useFarm } from '../state/FarmContext';
import type { Recommendation } from '../types';

type Filter = 'all' | 'To do' | 'In progress' | 'Done';
const kind = (p: Recommendation['priority']) => (p === 'High priority' ? 'bad' : p === 'Medium' ? 'warn' : 'mute');

export default function Recommendations() {
  const { fields } = useFarm();
  const { data, loading, error, reload } = useAsync(getRecommendations, []);
  const loc = useLocation();
  const toast = useToast();
  const [statuses, setStatuses] = useState<Record<string, Recommendation['status']>>({});
  const [filter, setFilter] = useState<Filter>('all');
  const [selId, setSelId] = useState<string>((loc.state as { id?: string } | null)?.id ?? '');

  const items = useMemo(() => (data ?? []).map(r => ({ ...r, status: statuses[r.id] ?? r.status })), [data, statuses]);
  const shown = items.filter(r => filter === 'all' || r.status === filter);
  const sel = items.find(r => r.id === selId) ?? shown[0];
  useEffect(() => { if (!selId && items[0]) setSelId(items[0].id); }, [items, selId]);

  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const set = (r: Recommendation, s: Recommendation['status']) => {
    setStatuses(p => ({ ...p, [r.id]: s }));
    toast(s === 'Done' ? t('Marked as done') : s === 'In progress' ? t('Task started') : t('Status updated'));
  };
  const fieldName = (id: string) => { const f = fields.find(x => x.id === id); return f ? td(f.name) : '—'; };

  return (
    <>
      <PageHead title={t('Recommendations')} sub={t('Your next best steps, ranked by field data.')}
        action={<Segmented<Filter> value={filter} onChange={setFilter}
          options={[{ value: 'all', label: t('All') }, { value: 'To do', label: t('To do') }, { value: 'In progress', label: t('In progress') }, { value: 'Done', label: t('Done') }]} />} />

      <div className="grid cols-2-1" style={{ alignItems: 'start' }}>
        <div className="stack" style={{ gap: 10 }}>
          {shown.length === 0 && <Empty>{t('No tasks in this category')}</Empty>}
          {shown.map(r => (
            <button key={r.id} className={`rec ${sel?.id === r.id ? 'sel' : ''}`} onClick={() => setSelId(r.id)}>
              <div className="row-between">
                <b style={r.status === 'Done' ? { textDecoration: 'line-through', opacity: .6 } : undefined}>{td(r.title)}</b>
                <Badge kind={kind(r.priority)}>{t(r.priority)}</Badge>
              </div>
              <p>{td(r.summary)}</p>
              <div className="row-between card-sub"><span>{fieldName(r.fieldId)} · {t(r.category)}</span><span>{t(r.status)} · {td(r.due)}</span></div>
            </button>
          ))}
        </div>

        {sel && (
          <Card title={t('Why: {title}', { title: td(sel.title) })} sub={t('{field} · due {due}', { field: fieldName(sel.fieldId), due: td(sel.due) })}>
            <div className="kv" style={{ marginBottom: 12 }}>
              {sel.reasons.map(x => <div key={x.label}><div className="k">{t(x.label)}</div><div className="v" style={{ fontSize: 17 }}>{td(x.value)}</div></div>)}
            </div>
            <div className="alert ok"><b>{t('Recommended action')}</b>{td(sel.action)}</div>
            <div className="page-actions" style={{ marginTop: 14 }}>
              {sel.status === 'To do' && <button className="btn primary" onClick={() => set(sel, 'In progress')}>{t('Start task')}</button>}
              {sel.status !== 'Done' && <button className="btn" onClick={() => set(sel, 'Done')}>{t('Mark done')}</button>}
              {sel.status === 'Done' && <button className="btn" onClick={() => set(sel, 'To do')}>{t('Reopen')}</button>}
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
