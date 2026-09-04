"use client";

import { useState } from "react";
import { CalendarClock, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useScheduleArticle } from "@/features/articles/hooks";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import type { Article } from "@/types/models";

/** Nilai <input type="datetime-local"> (YYYY-MM-DDTHH:mm) dalam waktu lokal. */
function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function preset(fn: (now: Date) => Date): string {
  return toLocalInputValue(fn(new Date()));
}

const MIN_OFFSET_MS = 2 * 60_000;

interface ScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  article: Article;
  /** Dipanggil setelah jadwal tersimpan/dibatalkan (mis. tutup state pending). */
  onDone?: () => void;
}

/**
 * Dialog jadwal publikasi (scheduled publish): pilih waktu atau preset cepat.
 * Backend scheduler yang mem-publish saat jatuh tempo — browser boleh tertutup.
 */
export function ScheduleDialog({ open, onOpenChange, article, onDone }: ScheduleDialogProps) {
  const schedule = useScheduleArticle();
  // Nilai awal dihitung sekali saat mount (dialog di-mount saat dibuka) —
  // bukan dihitung ulang setiap render (react-hooks/purity).
  const [value, setValue] = useState(() =>
    article.scheduled_at
      ? toLocalInputValue(new Date(article.scheduled_at))
      : toLocalInputValue(nextHour(new Date())),
  );
  const [min] = useState(() => toLocalInputValue(new Date(Date.now() + MIN_OFFSET_MS)));
  const [error, setError] = useState<string | null>(null);

  function confirm(scheduledAt: string | null) {
    schedule.mutate(
      { id: article.id, scheduledAt },
      {
        onSuccess: () => {
          onOpenChange(false);
          onDone?.();
        },
      },
    );
  }

  function onSubmitSchedule() {
    const parsed = value ? new Date(value) : null;
    if (!parsed || Number.isNaN(parsed.getTime()) || parsed.getTime() <= Date.now()) {
      setError("Pilih waktu di masa depan.");
      return;
    }
    setError(null);
    confirm(parsed.toISOString());
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="size-4" /> Jadwalkan Publikasi
          </DialogTitle>
          <DialogDescription>
            Artikel “{article.title}” akan dipublikasikan otomatis oleh server saat jatuh
            tempo — Anda boleh menutup browser. Butuh kategori valid sebelum dijadwalkan.
          </DialogDescription>
        </DialogHeader>

        {article.scheduled_at && (
          <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2 text-sm">
            <span className="text-muted-foreground">
              Terjadwal: <span className="font-medium text-foreground">{formatDate(article.scheduled_at)}</span>
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="kk-transition h-7 gap-1 text-xs text-muted-foreground"
              disabled={schedule.isPending}
              onClick={() => confirm(null)}
            >
              <X className="size-3.5" /> Batalkan jadwal
            </Button>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="schedule-at">Waktu publikasi</Label>
          <Input
            id="schedule-at"
            type="datetime-local"
            value={value}
            min={min}
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
            }}
            aria-invalid={Boolean(error)}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {(
              [
                { label: "1 jam lagi", at: preset((d) => new Date(d.getTime() + 60 * 60_000)) },
                { label: "Malam ini 19:00", at: preset(todayAt(19)) },
                { label: "Besok 09:00", at: preset(tomorrowAt(9)) },
                { label: "Senin 09:00", at: preset(nextWeekdayAt(1, 9)) },
              ] as { label: string; at: string }[]
            ).map((p) => (
              <Button
                key={p.label}
                type="button"
                variant="outline"
                size="sm"
                className={cn(
                  "kk-transition h-7 text-xs",
                  value === p.at && "border-primary text-primary",
                )}
                onClick={() => setValue(p.at)}
              >
                {p.label}
              </Button>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={schedule.isPending}>
            Tutup
          </Button>
          <Button onClick={onSubmitSchedule} disabled={schedule.isPending}>
            {schedule.isPending ? <Loader2 className="animate-spin" /> : <CalendarClock />}
            {article.scheduled_at ? "Ubah jadwal" : "Jadwalkan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Jam penuh berikutnya (dibulatkan ke atas) — default input yang masuk akal. */
function nextHour(now: Date): Date {
  const d = new Date(now.getTime() + 60 * 60_000);
  d.setMinutes(0, 0, 0);
  return d;
}

function todayAt(hour: number): (now: Date) => Date {
  return (now) => {
    const d = new Date(now);
    d.setHours(hour, 0, 0, 0);
    if (d.getTime() <= now.getTime()) return tomorrowAt(hour)(now);
    return d;
  };
}

function tomorrowAt(hour: number): (now: Date) => Date {
  return (now) => {
    const d = new Date(now.getTime() + 24 * 60 * 60_000);
    d.setHours(hour, 0, 0, 0);
    return d;
  };
}

/** Hari (0=Minggu..6=Sabtu) berikutnya pada jam tertentu. */
function nextWeekdayAt(weekday: number, hour: number): (now: Date) => Date {
  return (now) => {
    const d = new Date(now);
    const delta = (weekday - d.getDay() + 7) % 7 || 7;
    d.setDate(d.getDate() + delta);
    d.setHours(hour, 0, 0, 0);
    return d;
  };
}
