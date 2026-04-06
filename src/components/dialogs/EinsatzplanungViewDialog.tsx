import type { Einsatzplanung, Mitarbeiter, Patienten, Schichtvorlagen } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { IconPencil } from '@tabler/icons-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

function formatDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd.MM.yyyy', { locale: de }); } catch { return d; }
}

interface EinsatzplanungViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Einsatzplanung | null;
  onEdit: (record: Einsatzplanung) => void;
  mitarbeiterList: Mitarbeiter[];
  patientenList: Patienten[];
  schichtvorlagenList: Schichtvorlagen[];
}

export function EinsatzplanungViewDialog({ open, onClose, record, onEdit, mitarbeiterList, patientenList, schichtvorlagenList }: EinsatzplanungViewDialogProps) {
  function getMitarbeiterDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return mitarbeiterList.find(r => r.record_id === id)?.fields.vorname ?? '—';
  }

  function getPatientenDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return patientenList.find(r => r.record_id === id)?.fields.patient_vorname ?? '—';
  }

  function getSchichtvorlagenDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return schichtvorlagenList.find(r => r.record_id === id)?.fields.schicht_name ?? '—';
  }

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Einsatzplanung anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Einsatzdatum und -uhrzeit</Label>
            <p className="text-sm">{formatDate(record.fields.einsatz_datum)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Mitarbeiter</Label>
            <p className="text-sm">{getMitarbeiterDisplayName(record.fields.mitarbeiter_auswahl)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Patient</Label>
            <p className="text-sm">{getPatientenDisplayName(record.fields.patient_auswahl)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Schicht</Label>
            <p className="text-sm">{getSchichtvorlagenDisplayName(record.fields.schicht_auswahl)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Badge variant="secondary">{record.fields.einsatz_status?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Geplante Dauer (Minuten)</Label>
            <p className="text-sm">{record.fields.einsatz_dauer ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Notizen zum Einsatz</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.einsatz_notizen ?? '—'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}