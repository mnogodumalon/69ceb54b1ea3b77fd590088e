// AUTOMATICALLY GENERATED SERVICE
import { APP_IDS, LOOKUP_OPTIONS, FIELD_TYPES } from '@/types/app';
import type { Mitarbeiter, Schichtvorlagen, Patienten, Einsatzplanung, CreateMitarbeiter, CreateSchichtvorlagen, CreatePatienten, CreateEinsatzplanung } from '@/types/app';

// Base Configuration
const API_BASE_URL = 'https://my.living-apps.de/rest';

// --- HELPER FUNCTIONS ---
export function extractRecordId(url: unknown): string | null {
  if (!url) return null;
  if (typeof url !== 'string') return null;
  const match = url.match(/([a-f0-9]{24})$/i);
  return match ? match[1] : null;
}

export function createRecordUrl(appId: string, recordId: string): string {
  return `https://my.living-apps.de/rest/apps/${appId}/records/${recordId}`;
}

async function callApi(method: string, endpoint: string, data?: any) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',  // Nutze Session Cookies für Auth
    body: data ? JSON.stringify(data) : undefined
  });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) window.dispatchEvent(new Event('auth-error'));
    throw new Error(await response.text());
  }
  // DELETE returns often empty body or simple status
  if (method === 'DELETE') return true;
  return response.json();
}

/** Upload a file to LivingApps. Returns the file URL for use in record fields. */
export async function uploadFile(file: File | Blob, filename?: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file, filename ?? (file instanceof File ? file.name : 'upload'));
  const res = await fetch(`${API_BASE_URL}/files`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) window.dispatchEvent(new Event('auth-error'));
    throw new Error(`File upload failed: ${res.status}`);
  }
  const data = await res.json();
  return data.url;
}

function enrichLookupFields<T extends { fields: Record<string, unknown> }>(
  records: T[], entityKey: string
): T[] {
  const opts = LOOKUP_OPTIONS[entityKey];
  if (!opts) return records;
  return records.map(r => {
    const fields = { ...r.fields };
    for (const [fieldKey, options] of Object.entries(opts)) {
      const val = fields[fieldKey];
      if (typeof val === 'string') {
        const m = options.find(o => o.key === val);
        fields[fieldKey] = m ?? { key: val, label: val };
      } else if (Array.isArray(val)) {
        fields[fieldKey] = val.map(v => {
          if (typeof v === 'string') {
            const m = options.find(o => o.key === v);
            return m ?? { key: v, label: v };
          }
          return v;
        });
      }
    }
    return { ...r, fields } as T;
  });
}

/** Normalize fields for API writes: strip lookup objects to keys, fix date formats. */
export function cleanFieldsForApi(
  fields: Record<string, unknown>,
  entityKey: string
): Record<string, unknown> {
  const clean: Record<string, unknown> = { ...fields };
  for (const [k, v] of Object.entries(clean)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && 'key' in v) clean[k] = (v as any).key;
    if (Array.isArray(v)) clean[k] = v.map((item: any) => item && typeof item === 'object' && 'key' in item ? item.key : item);
  }
  const types = FIELD_TYPES[entityKey];
  if (types) {
    for (const [k, ft] of Object.entries(types)) {
      if (!(k in clean)) continue;
      const val = clean[k];
      // applookup fields: undefined → null (clear single reference)
      if ((ft === 'applookup/select' || ft === 'applookup/choice') && val === undefined) { clean[k] = null; continue; }
      // multipleapplookup fields: undefined/null → [] (clear multi reference)
      if ((ft === 'multipleapplookup/select' || ft === 'multipleapplookup/choice') && (val === undefined || val === null)) { clean[k] = []; continue; }
      // lookup fields: undefined → null (clear single lookup)
      if ((ft.startsWith('lookup/')) && val === undefined) { clean[k] = null; continue; }
      // multiplelookup fields: undefined/null → [] (clear multi lookup)
      if ((ft.startsWith('multiplelookup/')) && (val === undefined || val === null)) { clean[k] = []; continue; }
      if (typeof val !== 'string' || !val) continue;
      if (ft === 'date/datetimeminute') clean[k] = val.slice(0, 16);
      else if (ft === 'date/date') clean[k] = val.slice(0, 10);
    }
  }
  return clean;
}

let _cachedUserProfile: Record<string, unknown> | null = null;

export async function getUserProfile(): Promise<Record<string, unknown>> {
  if (_cachedUserProfile) return _cachedUserProfile;
  const raw = await callApi('GET', '/user');
  const skip = new Set(['id', 'image', 'lang', 'gender', 'title', 'fax', 'menus', 'initials']);
  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v != null && !skip.has(k)) data[k] = v;
  }
  _cachedUserProfile = data;
  return data;
}

export interface HeaderProfile {
  firstname: string;
  surname: string;
  email: string;
  image: string | null;
  company: string | null;
}

let _cachedHeaderProfile: HeaderProfile | null = null;

export async function getHeaderProfile(): Promise<HeaderProfile> {
  if (_cachedHeaderProfile) return _cachedHeaderProfile;
  const raw = await callApi('GET', '/user');
  _cachedHeaderProfile = {
    firstname: raw.firstname ?? '',
    surname: raw.surname ?? '',
    email: raw.email ?? '',
    image: raw.image ?? null,
    company: raw.company ?? null,
  };
  return _cachedHeaderProfile;
}

export interface AppGroupInfo {
  id: string;
  name: string;
  image: string | null;
  createdat: string;
  /** Resolved link: /objects/{id}/ if the dashboard exists, otherwise /gateway/apps/{firstAppId}?template=list_page */
  href: string;
}

let _cachedAppGroups: AppGroupInfo[] | null = null;

export async function getAppGroups(): Promise<AppGroupInfo[]> {
  if (_cachedAppGroups) return _cachedAppGroups;
  const raw = await callApi('GET', '/appgroups?with=apps');
  const groups: AppGroupInfo[] = Object.values(raw)
    .map((g: any) => {
      const firstAppId = Object.keys(g.apps ?? {})[0] ?? g.id;
      return {
        id: g.id,
        name: g.name,
        image: g.image ?? null,
        createdat: g.createdat ?? '',
        href: `/gateway/apps/${firstAppId}?template=list_page`,
        _firstAppId: firstAppId,
      };
    })
    .sort((a, b) => b.createdat.localeCompare(a.createdat));

  // Check which appgroups have a deployed dashboard via app params
  const paramChecks = await Promise.allSettled(
    groups.map(g => callApi('GET', `/apps/${(g as any)._firstAppId}/params/la_page_header_additional_url`))
  );
  paramChecks.forEach((result, i) => {
    if (result.status !== 'fulfilled' || !result.value) return;
    const url = result.value.value;
    if (typeof url === 'string' && url.length > 0) {
      try { groups[i].href = new URL(url).pathname; } catch { groups[i].href = url; }
    }
  });

  // Clean up internal helper property
  groups.forEach(g => delete (g as any)._firstAppId);

  _cachedAppGroups = groups;
  return _cachedAppGroups;
}

export class LivingAppsService {
  // --- MITARBEITER ---
  static async getMitarbeiter(): Promise<Mitarbeiter[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.MITARBEITER}/records`);
    const records = Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    })) as Mitarbeiter[];
    return enrichLookupFields(records, 'mitarbeiter');
  }
  static async getMitarbeiterEntry(id: string): Promise<Mitarbeiter | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.MITARBEITER}/records/${id}`);
    const record = { record_id: data.id, ...data } as Mitarbeiter;
    return enrichLookupFields([record], 'mitarbeiter')[0];
  }
  static async createMitarbeiterEntry(fields: CreateMitarbeiter) {
    return callApi('POST', `/apps/${APP_IDS.MITARBEITER}/records`, { fields: cleanFieldsForApi(fields as any, 'mitarbeiter') });
  }
  static async updateMitarbeiterEntry(id: string, fields: Partial<CreateMitarbeiter>) {
    return callApi('PATCH', `/apps/${APP_IDS.MITARBEITER}/records/${id}`, { fields: cleanFieldsForApi(fields as any, 'mitarbeiter') });
  }
  static async deleteMitarbeiterEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.MITARBEITER}/records/${id}`);
  }

  // --- SCHICHTVORLAGEN ---
  static async getSchichtvorlagen(): Promise<Schichtvorlagen[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.SCHICHTVORLAGEN}/records`);
    const records = Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    })) as Schichtvorlagen[];
    return enrichLookupFields(records, 'schichtvorlagen');
  }
  static async getSchichtvorlagenEntry(id: string): Promise<Schichtvorlagen | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.SCHICHTVORLAGEN}/records/${id}`);
    const record = { record_id: data.id, ...data } as Schichtvorlagen;
    return enrichLookupFields([record], 'schichtvorlagen')[0];
  }
  static async createSchichtvorlagenEntry(fields: CreateSchichtvorlagen) {
    return callApi('POST', `/apps/${APP_IDS.SCHICHTVORLAGEN}/records`, { fields: cleanFieldsForApi(fields as any, 'schichtvorlagen') });
  }
  static async updateSchichtvorlagenEntry(id: string, fields: Partial<CreateSchichtvorlagen>) {
    return callApi('PATCH', `/apps/${APP_IDS.SCHICHTVORLAGEN}/records/${id}`, { fields: cleanFieldsForApi(fields as any, 'schichtvorlagen') });
  }
  static async deleteSchichtvorlagenEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.SCHICHTVORLAGEN}/records/${id}`);
  }

  // --- PATIENTEN ---
  static async getPatienten(): Promise<Patienten[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.PATIENTEN}/records`);
    const records = Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    })) as Patienten[];
    return enrichLookupFields(records, 'patienten');
  }
  static async getPatientenEntry(id: string): Promise<Patienten | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.PATIENTEN}/records/${id}`);
    const record = { record_id: data.id, ...data } as Patienten;
    return enrichLookupFields([record], 'patienten')[0];
  }
  static async createPatientenEntry(fields: CreatePatienten) {
    return callApi('POST', `/apps/${APP_IDS.PATIENTEN}/records`, { fields: cleanFieldsForApi(fields as any, 'patienten') });
  }
  static async updatePatientenEntry(id: string, fields: Partial<CreatePatienten>) {
    return callApi('PATCH', `/apps/${APP_IDS.PATIENTEN}/records/${id}`, { fields: cleanFieldsForApi(fields as any, 'patienten') });
  }
  static async deletePatientenEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.PATIENTEN}/records/${id}`);
  }

  // --- EINSATZPLANUNG ---
  static async getEinsatzplanung(): Promise<Einsatzplanung[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.EINSATZPLANUNG}/records`);
    const records = Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    })) as Einsatzplanung[];
    return enrichLookupFields(records, 'einsatzplanung');
  }
  static async getEinsatzplanungEntry(id: string): Promise<Einsatzplanung | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.EINSATZPLANUNG}/records/${id}`);
    const record = { record_id: data.id, ...data } as Einsatzplanung;
    return enrichLookupFields([record], 'einsatzplanung')[0];
  }
  static async createEinsatzplanungEntry(fields: CreateEinsatzplanung) {
    return callApi('POST', `/apps/${APP_IDS.EINSATZPLANUNG}/records`, { fields: cleanFieldsForApi(fields as any, 'einsatzplanung') });
  }
  static async updateEinsatzplanungEntry(id: string, fields: Partial<CreateEinsatzplanung>) {
    return callApi('PATCH', `/apps/${APP_IDS.EINSATZPLANUNG}/records/${id}`, { fields: cleanFieldsForApi(fields as any, 'einsatzplanung') });
  }
  static async deleteEinsatzplanungEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.EINSATZPLANUNG}/records/${id}`);
  }

}