import { useDashboardData } from '@/hooks/useDashboardData';
import { enrichEinsatzplanung } from '@/lib/enrich';
import type { EnrichedEinsatzplanung } from '@/types/enriched';
import type { Einsatzplanung } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { formatDate } from '@/lib/formatters';
import { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/StatCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EinsatzplanungDialog } from '@/components/dialogs/EinsatzplanungDialog';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import {
  IconAlertCircle, IconTool, IconRefresh, IconCheck,
  IconChevronLeft, IconChevronRight, IconPlus, IconPencil,
  IconTrash, IconCalendar, IconUsers, IconUser, IconClock
} from '@tabler/icons-react';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

const APPGROUP_ID = '69ceb54b1ea3b77fd590088e';
const REPAIR_ENDPOINT = '/claude/build/repair';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  geplant:       { label: 'Geplant',              color: 'text-blue-700',   bg: 'bg-blue-100' },
  bestaetigt:    { label: 'Bestätigt',             color: 'text-green-700',  bg: 'bg-green-100' },
  durchgefuehrt: { label: 'Durchgeführt',          color: 'text-gray-700',   bg: 'bg-gray-100' },
  abgesagt:      { label: 'Abgesagt',              color: 'text-red-700',    bg: 'bg-red-100' },
  vertretung:    { label: 'Vertretung erf.',       color: 'text-orange-700', bg: 'bg-orange-100' },
};

export default function DashboardOverview() {
  const {
    mitarbeiter, schichtvorlagen, patienten, einsatzplanung,
    mitarbeiterMap, schichtvorlagenMap, patientenMap,
    loading, error, fetchAll,
  } = useDashboardData();

  const enrichedEinsatzplanung = enrichEinsatzplanung(einsatzplanung, { mitarbeiterMap, patientenMap, schichtvorlagenMap });

  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<EnrichedEinsatzplanung | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EnrichedEinsatzplanung | null>(null);
  const [prefillDate, setPrefillDate] = useState<string | undefined>(undefined);
  const [selectedFilter, setSelectedFilter] = useState<string>('alle');

  const weekDays = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i)),
    [currentWeekStart]
  );

  const einsaetzeByDay = useMemo(() => {
    const map = new Map<string, EnrichedEinsatzplanung[]>();
    weekDays.forEach(day => map.set(format(day, 'yyyy-MM-dd'), []));
    enrichedEinsatzplanung.forEach(e => {
      if (!e.fields.einsatz_datum) return;
      const dayKey = e.fields.einsatz_datum.slice(0, 10);
      if (map.has(dayKey)) {
        const arr = map.get(dayKey)!;
        if (selectedFilter === 'alle' || e.fields.einsatz_status?.key === selectedFilter) {
          arr.push(e);
        }
      }
    });
    return map;
  }, [enrichedEinsatzplanung, weekDays, selectedFilter]);

  const stats = useMemo(() => {
    const total = einsatzplanung.length;
    const thisWeek = enrichedEinsatzplanung.filter(e => {
      if (!e.fields.einsatz_datum) return false;
      const d = parseISO(e.fields.einsatz_datum);
      return d >= currentWeekStart && d <= addDays(currentWeekStart, 6);
    }).length;
    const offen = einsatzplanung.filter(e => e.fields.einsatz_status?.key === 'geplant').length;
    const vertretung = einsatzplanung.filter(e => e.fields.einsatz_status?.key === 'vertretung').length;
    return { total, thisWeek, offen, vertretung };
  }, [einsatzplanung, enrichedEinsatzplanung, currentWeekStart]);

  const handleEdit = (e: EnrichedEinsatzplanung) => {
    setEditRecord(e);
    setPrefillDate(undefined);
    setDialogOpen(true);
  };

  const handleCreate = (dayDate?: Date) => {
    setEditRecord(null);
    if (dayDate) {
      setPrefillDate(format(dayDate, "yyyy-MM-dd'T'08:00"));
    } else {
      setPrefillDate(undefined);
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (fields: Einsatzplanung['fields']) => {
    if (editRecord) {
      await LivingAppsService.updateEinsatzplanungEntry(editRecord.record_id, fields);
    } else {
      await LivingAppsService.createEinsatzplanungEntry(fields);
    }
    fetchAll();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await LivingAppsService.deleteEinsatzplanungEntry(deleteTarget.record_id);
    setDeleteTarget(null);
    fetchAll();
  };

  const buildDefaultValues = () => {
    if (editRecord) return editRecord.fields;
    if (prefillDate) return { einsatz_datum: prefillDate };
    return undefined;
  };

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  const today = new Date();

  return (
    <div className="space-y-5 pb-8">
      {/* KPI-Leiste */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Einsätze gesamt"
          value={String(stats.total)}
          description="Alle erfassten Einsätze"
          icon={<IconCalendar size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Diese Woche"
          value={String(stats.thisWeek)}
          description="Einsätze in der aktuellen Woche"
          icon={<IconClock size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Offen / Geplant"
          value={String(stats.offen)}
          description="Noch nicht bestätigt"
          icon={<IconUser size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Mitarbeiter"
          value={String(mitarbeiter.length)}
          description={`${patienten.length} Patienten`}
          icon={<IconUsers size={18} className="text-muted-foreground" />}
        />
      </div>

      {/* Wochenplaner */}
      <div className="rounded-2xl border bg-card overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentWeekStart(w => subWeeks(w, 1))}>
              <IconChevronLeft size={16} />
            </Button>
            <span className="font-semibold text-sm min-w-[180px] text-center">
              {format(currentWeekStart, 'd. MMM', { locale: de })} – {format(addDays(currentWeekStart, 6), 'd. MMM yyyy', { locale: de })}
            </span>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentWeekStart(w => addWeeks(w, 1))}>
              <IconChevronRight size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground h-8"
              onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
            >
              Heute
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Statusfilter */}
            <div className="flex flex-wrap gap-1">
              {[{ key: 'alle', label: 'Alle' }, ...Object.entries(STATUS_CONFIG).map(([k, v]) => ({ key: k, label: v.label }))].map(f => (
                <button
                  key={f.key}
                  onClick={() => setSelectedFilter(f.key)}
                  className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                    selectedFilter === f.key
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-muted-foreground border-border hover:border-primary/50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <Button size="sm" onClick={() => handleCreate()}>
              <IconPlus size={14} className="mr-1 shrink-0" />
              <span>Neuer Einsatz</span>
            </Button>
          </div>
        </div>

        {/* Wochentage */}
        <div className="overflow-x-auto">
          <div className="grid grid-cols-7 min-w-[700px]">
            {weekDays.map((day, idx) => {
              const dayKey = format(day, 'yyyy-MM-dd');
              const isToday = isSameDay(day, today);
              const dayEinsaetze = einsaetzeByDay.get(dayKey) || [];

              return (
                <div key={idx} className={`border-r last:border-r-0 min-h-[280px] flex flex-col ${isToday ? 'bg-primary/5' : ''}`}>
                  {/* Tageskopf */}
                  <div
                    className={`text-center py-2 px-1 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                      isToday ? 'bg-primary/10' : ''
                    }`}
                    onClick={() => handleCreate(day)}
                    title="Neuen Einsatz für diesen Tag anlegen"
                  >
                    <div className={`text-xs font-medium uppercase tracking-wide ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                      {format(day, 'EEE', { locale: de })}
                    </div>
                    <div className={`text-lg font-bold leading-tight ${isToday ? 'text-primary' : 'text-foreground'}`}>
                      {format(day, 'd')}
                    </div>
                    <div className="text-xs text-muted-foreground">{format(day, 'MM/yy')}</div>
                  </div>

                  {/* Einsätze des Tages */}
                  <div className="flex-1 p-1.5 space-y-1 overflow-y-auto max-h-64">
                    {dayEinsaetze.length === 0 ? (
                      <button
                        onClick={() => handleCreate(day)}
                        className="w-full h-16 flex items-center justify-center border-2 border-dashed border-border/50 rounded-lg text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
                      >
                        <IconPlus size={16} />
                      </button>
                    ) : (
                      dayEinsaetze.map(einsatz => {
                        const statusKey = einsatz.fields.einsatz_status?.key ?? 'geplant';
                        const cfg = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.geplant;
                        const uhrzeit = einsatz.fields.einsatz_datum
                          ? einsatz.fields.einsatz_datum.slice(11, 16)
                          : '';
                        return (
                          <div
                            key={einsatz.record_id}
                            className={`rounded-lg p-1.5 text-xs ${cfg.bg} border border-transparent hover:border-current/20 transition-colors`}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <div className="min-w-0 flex-1">
                                {uhrzeit && (
                                  <div className={`font-bold ${cfg.color} text-[10px] leading-tight`}>{uhrzeit} Uhr</div>
                                )}
                                <div className={`font-semibold truncate ${cfg.color}`}>
                                  {einsatz.mitarbeiter_auswahlName || '–'}
                                </div>
                                <div className="text-muted-foreground truncate">
                                  {einsatz.patient_auswahlName || '–'}
                                </div>
                                {einsatz.schicht_auswahlName && (
                                  <div className="text-muted-foreground truncate text-[10px]">
                                    {einsatz.schicht_auswahlName}
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col gap-0.5 shrink-0">
                                <button
                                  onClick={() => handleEdit(einsatz)}
                                  className={`p-0.5 rounded hover:bg-black/10 ${cfg.color}`}
                                  title="Bearbeiten"
                                >
                                  <IconPencil size={12} />
                                </button>
                                <button
                                  onClick={() => setDeleteTarget(einsatz)}
                                  className="p-0.5 rounded hover:bg-black/10 text-red-600"
                                  title="Löschen"
                                >
                                  <IconTrash size={12} />
                                </button>
                              </div>
                            </div>
                            <div className="mt-1">
                              <span className={`text-[10px] font-medium ${cfg.color}`}>{cfg.label}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Fußzeile mit Anzahl */}
                  {dayEinsaetze.length > 0 && (
                    <div className="px-1.5 pb-1.5">
                      <button
                        onClick={() => handleCreate(day)}
                        className="w-full flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-primary py-0.5 transition-colors"
                      >
                        <IconPlus size={12} /> Hinzufügen
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Vertretungen-Warnung */}
      {stats.vertretung > 0 && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 flex items-center gap-3">
          <IconAlertCircle size={18} className="text-orange-600 shrink-0" />
          <p className="text-sm text-orange-800">
            <span className="font-semibold">{stats.vertretung} Einsatz{stats.vertretung > 1 ? 'e' : ''}</span> benötig{stats.vertretung > 1 ? 'en' : 't'} eine Vertretung.
          </p>
        </div>
      )}

      {/* Legende */}
      <div className="flex flex-wrap gap-3 px-1">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-full ${cfg.bg}`} />
            <span className="text-xs text-muted-foreground">{cfg.label}</span>
          </div>
        ))}
      </div>

      {/* Einsatz-Dialog */}
      <EinsatzplanungDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditRecord(null); setPrefillDate(undefined); }}
        onSubmit={handleSubmit}
        defaultValues={buildDefaultValues()}
        mitarbeiterList={mitarbeiter}
        patientenList={patienten}
        schichtvorlagenList={schichtvorlagen}
        enablePhotoScan={AI_PHOTO_SCAN['Einsatzplanung']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Einsatzplanung']}
      />

      {/* Löschen-Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Einsatz löschen"
        description={deleteTarget
          ? `Soll der Einsatz von ${deleteTarget.mitarbeiter_auswahlName || 'unbekannt'} am ${formatDate(deleteTarget.fields.einsatz_datum)} wirklich gelöscht werden?`
          : 'Wirklich löschen?'
        }
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <Skeleton className="h-96 rounded-2xl" />
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const [repairing, setRepairing] = useState(false);
  const [repairStatus, setRepairStatus] = useState('');
  const [repairDone, setRepairDone] = useState(false);
  const [repairFailed, setRepairFailed] = useState(false);

  const handleRepair = async () => {
    setRepairing(true);
    setRepairStatus('Reparatur wird gestartet...');
    setRepairFailed(false);

    const errorContext = JSON.stringify({
      type: 'data_loading',
      message: error.message,
      stack: (error.stack ?? '').split('\n').slice(0, 10).join('\n'),
      url: window.location.href,
    });

    try {
      const resp = await fetch(REPAIR_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ appgroup_id: APPGROUP_ID, error_context: errorContext }),
      });

      if (!resp.ok || !resp.body) {
        setRepairing(false);
        setRepairFailed(true);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith('data: ')) continue;
          const content = line.slice(6);
          if (content.startsWith('[STATUS]')) {
            setRepairStatus(content.replace(/^\[STATUS]\s*/, ''));
          }
          if (content.startsWith('[DONE]')) {
            setRepairDone(true);
            setRepairing(false);
          }
          if (content.startsWith('[ERROR]') && !content.includes('Dashboard-Links')) {
            setRepairFailed(true);
          }
        }
      }
    } catch {
      setRepairing(false);
      setRepairFailed(true);
    }
  };

  if (repairDone) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
          <IconCheck size={22} className="text-green-500" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-foreground mb-1">Dashboard repariert</h3>
          <p className="text-sm text-muted-foreground max-w-xs">Das Problem wurde behoben. Bitte laden Sie die Seite neu.</p>
        </div>
        <Button size="sm" onClick={() => window.location.reload()}>
          <IconRefresh size={14} className="mr-1" />Neu laden
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <IconAlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {repairing ? repairStatus : error.message}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onRetry} disabled={repairing}>Erneut versuchen</Button>
        <Button size="sm" onClick={handleRepair} disabled={repairing}>
          {repairing
            ? <span className="inline-block w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-1" />
            : <IconTool size={14} className="mr-1" />}
          {repairing ? 'Reparatur läuft...' : 'Dashboard reparieren'}
        </Button>
      </div>
      {repairFailed && <p className="text-sm text-destructive">Automatische Reparatur fehlgeschlagen. Bitte kontaktieren Sie den Support.</p>}
    </div>
  );
}
