// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export interface Mitarbeiter {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    vorname?: string;
    nachname?: string;
    personalnummer?: string;
    qualifikation?: LookupValue;
    beschaeftigungsumfang?: LookupValue;
    wochenstunden?: number;
    telefon?: string;
    email?: string;
    verfuegbare_tage?: LookupValue[];
    anmerkungen_mitarbeiter?: string;
  };
}

export interface Schichtvorlagen {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    schicht_name?: string;
    schicht_beginn?: string;
    schicht_ende?: string;
    schicht_typ?: LookupValue;
    schicht_beschreibung?: string;
  };
}

export interface Patienten {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    patient_vorname?: string;
    patient_nachname?: string;
    geburtsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    pflegegrad?: LookupValue;
    strasse?: string;
    hausnummer?: string;
    plz?: string;
    ort?: string;
    standort?: GeoLocation; // { lat, long, info }
    telefon_patient?: string;
    leistungsarten?: LookupValue[];
    hinweise_patient?: string;
  };
}

export interface Einsatzplanung {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    einsatz_datum?: string; // Format: YYYY-MM-DD oder ISO String
    mitarbeiter_auswahl?: string; // applookup -> URL zu 'Mitarbeiter' Record
    patient_auswahl?: string; // applookup -> URL zu 'Patienten' Record
    schicht_auswahl?: string; // applookup -> URL zu 'Schichtvorlagen' Record
    einsatz_status?: LookupValue;
    einsatz_dauer?: number;
    einsatz_notizen?: string;
  };
}

export const APP_IDS = {
  MITARBEITER: '69ceb52d96e330096c48597b',
  SCHICHTVORLAGEN: '69ceb53214acd954594fe260',
  PATIENTEN: '69ceb53225f253045a9822ae',
  EINSATZPLANUNG: '69ceb5338bb9fc220f75985f',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'mitarbeiter': {
    qualifikation: [{ key: "pflegehelfer", label: "Pflegehelfer/in" }, { key: "altenpfleger", label: "Altenpfleger/in" }, { key: "krankenpfleger", label: "Krankenpfleger/in" }, { key: "pflegeassistenz", label: "Pflegeassistenz" }, { key: "hauswirtschaft", label: "Hauswirtschaftskraft" }, { key: "pflegefachkraft", label: "Pflegefachkraft" }],
    beschaeftigungsumfang: [{ key: "vollzeit", label: "Vollzeit" }, { key: "teilzeit", label: "Teilzeit" }, { key: "minijob", label: "Minijob" }],
    verfuegbare_tage: [{ key: "montag", label: "Montag" }, { key: "dienstag", label: "Dienstag" }, { key: "mittwoch", label: "Mittwoch" }, { key: "donnerstag", label: "Donnerstag" }, { key: "freitag", label: "Freitag" }, { key: "samstag", label: "Samstag" }, { key: "sonntag", label: "Sonntag" }],
  },
  'schichtvorlagen': {
    schicht_typ: [{ key: "fruehschicht", label: "Frühschicht" }, { key: "spaetschicht", label: "Spätschicht" }, { key: "nachtschicht", label: "Nachtschicht" }, { key: "tagschicht", label: "Tagschicht" }, { key: "sonderschicht", label: "Sonderschicht" }],
  },
  'patienten': {
    pflegegrad: [{ key: "pg1", label: "Pflegegrad 1" }, { key: "pg2", label: "Pflegegrad 2" }, { key: "pg3", label: "Pflegegrad 3" }, { key: "pg4", label: "Pflegegrad 4" }, { key: "pg5", label: "Pflegegrad 5" }],
    leistungsarten: [{ key: "grundpflege", label: "Grundpflege" }, { key: "behandlungspflege", label: "Behandlungspflege" }, { key: "hauswirtschaft", label: "Hauswirtschaft" }, { key: "betreuung", label: "Betreuung" }, { key: "medikamentengabe", label: "Medikamentengabe" }, { key: "wundversorgung", label: "Wundversorgung" }, { key: "mobilisation", label: "Mobilisation" }],
  },
  'einsatzplanung': {
    einsatz_status: [{ key: "geplant", label: "Geplant" }, { key: "bestaetigt", label: "Bestätigt" }, { key: "durchgefuehrt", label: "Durchgeführt" }, { key: "abgesagt", label: "Abgesagt" }, { key: "vertretung", label: "Vertretung erforderlich" }],
  },
};

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'mitarbeiter': {
    'vorname': 'string/text',
    'nachname': 'string/text',
    'personalnummer': 'string/text',
    'qualifikation': 'lookup/select',
    'beschaeftigungsumfang': 'lookup/radio',
    'wochenstunden': 'number',
    'telefon': 'string/tel',
    'email': 'string/email',
    'verfuegbare_tage': 'multiplelookup/checkbox',
    'anmerkungen_mitarbeiter': 'string/textarea',
  },
  'schichtvorlagen': {
    'schicht_name': 'string/text',
    'schicht_beginn': 'string/text',
    'schicht_ende': 'string/text',
    'schicht_typ': 'lookup/select',
    'schicht_beschreibung': 'string/textarea',
  },
  'patienten': {
    'patient_vorname': 'string/text',
    'patient_nachname': 'string/text',
    'geburtsdatum': 'date/date',
    'pflegegrad': 'lookup/select',
    'strasse': 'string/text',
    'hausnummer': 'string/text',
    'plz': 'string/text',
    'ort': 'string/text',
    'standort': 'geo',
    'telefon_patient': 'string/tel',
    'leistungsarten': 'multiplelookup/checkbox',
    'hinweise_patient': 'string/textarea',
  },
  'einsatzplanung': {
    'einsatz_datum': 'date/datetimeminute',
    'mitarbeiter_auswahl': 'applookup/select',
    'patient_auswahl': 'applookup/select',
    'schicht_auswahl': 'applookup/select',
    'einsatz_status': 'lookup/select',
    'einsatz_dauer': 'number',
    'einsatz_notizen': 'string/textarea',
  },
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateMitarbeiter = StripLookup<Mitarbeiter['fields']>;
export type CreateSchichtvorlagen = StripLookup<Schichtvorlagen['fields']>;
export type CreatePatienten = StripLookup<Patienten['fields']>;
export type CreateEinsatzplanung = StripLookup<Einsatzplanung['fields']>;