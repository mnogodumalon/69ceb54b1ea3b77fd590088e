import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Mitarbeiter, Schichtvorlagen, Patienten, Einsatzplanung } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

export function useDashboardData() {
  const [mitarbeiter, setMitarbeiter] = useState<Mitarbeiter[]>([]);
  const [schichtvorlagen, setSchichtvorlagen] = useState<Schichtvorlagen[]>([]);
  const [patienten, setPatienten] = useState<Patienten[]>([]);
  const [einsatzplanung, setEinsatzplanung] = useState<Einsatzplanung[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [mitarbeiterData, schichtvorlagenData, patientenData, einsatzplanungData] = await Promise.all([
        LivingAppsService.getMitarbeiter(),
        LivingAppsService.getSchichtvorlagen(),
        LivingAppsService.getPatienten(),
        LivingAppsService.getEinsatzplanung(),
      ]);
      setMitarbeiter(mitarbeiterData);
      setSchichtvorlagen(schichtvorlagenData);
      setPatienten(patientenData);
      setEinsatzplanung(einsatzplanungData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Silent background refresh (no loading state change → no flicker)
  useEffect(() => {
    async function silentRefresh() {
      try {
        const [mitarbeiterData, schichtvorlagenData, patientenData, einsatzplanungData] = await Promise.all([
          LivingAppsService.getMitarbeiter(),
          LivingAppsService.getSchichtvorlagen(),
          LivingAppsService.getPatienten(),
          LivingAppsService.getEinsatzplanung(),
        ]);
        setMitarbeiter(mitarbeiterData);
        setSchichtvorlagen(schichtvorlagenData);
        setPatienten(patientenData);
        setEinsatzplanung(einsatzplanungData);
      } catch {
        // silently ignore — stale data is better than no data
      }
    }
    function handleRefresh() { void silentRefresh(); }
    window.addEventListener('dashboard-refresh', handleRefresh);
    return () => window.removeEventListener('dashboard-refresh', handleRefresh);
  }, []);

  const mitarbeiterMap = useMemo(() => {
    const m = new Map<string, Mitarbeiter>();
    mitarbeiter.forEach(r => m.set(r.record_id, r));
    return m;
  }, [mitarbeiter]);

  const schichtvorlagenMap = useMemo(() => {
    const m = new Map<string, Schichtvorlagen>();
    schichtvorlagen.forEach(r => m.set(r.record_id, r));
    return m;
  }, [schichtvorlagen]);

  const patientenMap = useMemo(() => {
    const m = new Map<string, Patienten>();
    patienten.forEach(r => m.set(r.record_id, r));
    return m;
  }, [patienten]);

  return { mitarbeiter, setMitarbeiter, schichtvorlagen, setSchichtvorlagen, patienten, setPatienten, einsatzplanung, setEinsatzplanung, loading, error, fetchAll, mitarbeiterMap, schichtvorlagenMap, patientenMap };
}