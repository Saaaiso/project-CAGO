import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { createField, getAlerts, getFarm, getFields } from '../api/services';
import type { Alert, Farm, Field } from '../types';

interface Ctx {
  farm: Farm | null;
  fields: Field[];
  alerts: Alert[];
  loading: boolean;
  error: string | null;
  selectedId: string;
  selected: Field | null;
  select: (id: string) => void;
  addField: (input: Pick<Field, 'name' | 'crop' | 'polygon' | 'areaHa'>) => Promise<Field>;
  reload: () => void;
}

const FarmCtx = createContext<Ctx | null>(null);

export function FarmProvider({ children }: { children: ReactNode }) {
  const [farm, setFarm] = useState<Farm | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState('');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setLoading(true);
    Promise.all([getFarm(), getFields(), getAlerts()])
      .then(([fa, fi, al]) => {
        setFarm(fa); setFields(fi); setAlerts(al); setError(null);
        setSelectedId(id => id || fi[0]?.id || '');
      })
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [tick]);

  const addField = useCallback(async (input: Pick<Field, 'name' | 'crop' | 'polygon' | 'areaHa'>) => {
    const f = await createField(input);
    setFields(prev => [...prev, f]);
    setSelectedId(f.id);
    return f;
  }, []);

  const value = useMemo<Ctx>(() => ({
    farm, fields, alerts, loading, error, selectedId,
    selected: fields.find(f => f.id === selectedId) ?? fields[0] ?? null,
    select: setSelectedId, addField, reload: () => setTick(t => t + 1),
  }), [farm, fields, alerts, loading, error, selectedId, addField]);

  return <FarmCtx.Provider value={value}>{children}</FarmCtx.Provider>;
}

export function useFarm() {
  const c = useContext(FarmCtx);
  if (!c) throw new Error('useFarm must be used inside FarmProvider');
  return c;
}
