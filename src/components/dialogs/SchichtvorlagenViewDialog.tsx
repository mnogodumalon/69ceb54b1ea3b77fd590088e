import type { Schichtvorlagen } from '@/types/app';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { IconPencil } from '@tabler/icons-react';

interface SchichtvorlagenViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Schichtvorlagen | null;
  onEdit: (record: Schichtvorlagen) => void;
}

export function SchichtvorlagenViewDialog({ open, onClose, record, onEdit }: SchichtvorlagenViewDialogProps) {
  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schichtvorlagen anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Schichtname</Label>
            <p className="text-sm">{record.fields.schicht_name ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Beginn (Uhrzeit)</Label>
            <p className="text-sm">{record.fields.schicht_beginn ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Ende (Uhrzeit)</Label>
            <p className="text-sm">{record.fields.schicht_ende ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Schichttyp</Label>
            <Badge variant="secondary">{record.fields.schicht_typ?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Beschreibung</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.schicht_beschreibung ?? '—'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}