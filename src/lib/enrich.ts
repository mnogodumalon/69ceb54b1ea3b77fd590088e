import type { EnrichedEinsatzplanung } from '@/types/enriched';
import type { Einsatzplanung, Mitarbeiter, Patienten, Schichtvorlagen } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: unknown, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface EinsatzplanungMaps {
  mitarbeiterMap: Map<string, Mitarbeiter>;
  patientenMap: Map<string, Patienten>;
  schichtvorlagenMap: Map<string, Schichtvorlagen>;
}

export function enrichEinsatzplanung(
  einsatzplanung: Einsatzplanung[],
  maps: EinsatzplanungMaps
): EnrichedEinsatzplanung[] {
  return einsatzplanung.map(r => ({
    ...r,
    mitarbeiter_auswahlName: resolveDisplay(r.fields.mitarbeiter_auswahl, maps.mitarbeiterMap, 'vorname', 'nachname'),
    patient_auswahlName: resolveDisplay(r.fields.patient_auswahl, maps.patientenMap, 'patient_vorname'),
    schicht_auswahlName: resolveDisplay(r.fields.schicht_auswahl, maps.schichtvorlagenMap, 'schicht_name'),
  }));
}
