import type { Einsatzplanung } from './app';

export type EnrichedEinsatzplanung = Einsatzplanung & {
  mitarbeiter_auswahlName: string;
  patient_auswahlName: string;
  schicht_auswahlName: string;
};
