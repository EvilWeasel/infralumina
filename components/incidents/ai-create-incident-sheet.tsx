"use client";

import { Loader2, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import {
  analyzeIncidentIntakeAction,
  createAiIncidentAction,
} from "@/app/dashboard/incidents/ai-actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Database } from "@/lib/supabase/database.types";

type IncidentSeverity = Database["public"]["Enums"]["incident_severity"];

type DraftState = {
  title: string;
  severity: IncidentSeverity | "";
  impact: string;
  startedAt: string;
  missingFields: Array<{
    field: "title" | "severity";
    question: string;
  }>;
};

function toGermanDateTimeValue(value: string | undefined) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${day}.${month}.${year}, ${hour}:${minute}`;
}

function parseGermanDateTimeToIso(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const match = trimmedValue.match(
    /^(\d{2})\.(\d{2})\.(\d{4}),\s*(\d{2}):(\d{2})$/,
  );

  if (!match) {
    return null;
  }

  const [, dayRaw, monthRaw, yearRaw, hourRaw, minuteRaw] = match;
  const day = Number(dayRaw);
  const month = Number(monthRaw);
  const year = Number(yearRaw);
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);

  const date = new Date(year, month - 1, day, hour, minute);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== hour ||
    date.getMinutes() !== minute
  ) {
    return null;
  }

  return date.toISOString();
}

function getNowDateTimeLocalValue() {
  return toGermanDateTimeValue(new Date().toISOString());
}

function createDefaultDraftState(): DraftState {
  return {
    title: "",
    severity: "",
    impact: "",
    startedAt: getNowDateTimeLocalValue(),
    missingFields: [],
  };
}

export function AiCreateIncidentSheet({ disabled }: { disabled?: boolean }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [sourceText, setSourceText] = useState("");
  const [followUpText, setFollowUpText] = useState("");
  const [draft, setDraft] = useState<DraftState>(() => createDefaultDraftState());
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [isAnalyzing, startAnalyzeTransition] = useTransition();
  const [isCreating, startCreateTransition] = useTransition();

  const canCreateIncident = useMemo(
    () => draft.title.trim().length > 0 && draft.severity.length > 0,
    [draft.severity, draft.title],
  );

  function resetSheetState() {
    setSourceText("");
    setFollowUpText("");
    setDraft(createDefaultDraftState());
    setAnalyzeError(null);
    setCreateError(null);
    setHasAnalyzed(false);
  }

  function closeSheet() {
    setIsOpen(false);
    resetSheetState();
  }

  function runAnalyze(appendFollowUp: boolean) {
    setAnalyzeError(null);
    setCreateError(null);

    const trimmedSource = sourceText.trim();

    if (!trimmedSource) {
      setAnalyzeError("Bitte Beschreibungstext einfuegen.");
      return;
    }

    const trimmedFollowUp = followUpText.trim();
    const nextSourceText =
      appendFollowUp && trimmedFollowUp
        ? `${trimmedSource}\n\nNachtrag des Users:\n${trimmedFollowUp}`
        : trimmedSource;

    startAnalyzeTransition(async () => {
      const result = await analyzeIncidentIntakeAction({
        sourceText: nextSourceText,
      });

      if (result.status === "error") {
        setAnalyzeError(result.message);
        return;
      }

      setSourceText(nextSourceText);
      setFollowUpText("");
      setHasAnalyzed(true);
      setDraft((previousDraft) => ({
        title: result.data.title ?? previousDraft.title,
        severity: result.data.severity ?? previousDraft.severity,
        impact: result.data.impact ?? previousDraft.impact,
        startedAt: result.data.startedAt
          ? toGermanDateTimeValue(result.data.startedAt)
          : previousDraft.startedAt || getNowDateTimeLocalValue(),
        missingFields: result.data.missingFields,
      }));
    });
  }

  function createIncident() {
    setCreateError(null);
    setAnalyzeError(null);

    if (!canCreateIncident) {
      setCreateError("Title und Severity sind erforderlich.");
      return;
    }

    startCreateTransition(async () => {
      const startedAtIso = parseGermanDateTimeToIso(draft.startedAt);

      if (!startedAtIso && draft.startedAt.trim().length > 0) {
        setCreateError("Started At muss im Format DD.MM.YYYY, HH:mm sein.");
        return;
      }

      const result = await createAiIncidentAction({
        sourceText,
        title: draft.title,
        severity: draft.severity,
        impact: draft.impact,
        startedAt: startedAtIso ?? undefined,
      });

      if (result.status === "error") {
        setCreateError(result.message);
        return;
      }

      closeSheet();
      router.push(result.redirectTo);
      router.refresh();
    });
  }

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setIsOpen(true)} disabled={disabled}>
        <Sparkles className="size-4" />
        AI Create
      </Button>

      {isOpen ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            onClick={closeSheet}
            className="absolute inset-0 bg-black/50"
            aria-label="Sheet schliessen"
          />

          <aside className="absolute inset-y-0 right-0 z-10 flex h-dvh w-full max-w-2xl flex-col border-l border-border bg-card px-5 py-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">AI Create Incident</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Fuege Freitext ein, analysiere Felder und erstelle danach den Incident.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                type="button"
                onClick={closeSheet}
                aria-label="Schliessen"
              >
                <X className="size-4" />
              </Button>
            </div>

            <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
              <div className="space-y-2">
                <label htmlFor="ai-source-text" className="text-sm font-medium">
                  Beschreibungstext
                </label>
                <Textarea
                  id="ai-source-text"
                  value={sourceText}
                  onChange={(event) => setSourceText(event.target.value)}
                  className="min-h-28"
                  placeholder="E-Mail, Slack Thread oder Rohnotizen einfuegen ..."
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  Analyse extrahiert `title` und `severity`; fehlende Pflichtfelder werden nachgefragt.
                </p>
                <Button
                  type="button"
                  onClick={() => runAnalyze(false)}
                  disabled={isAnalyzing || sourceText.trim().length === 0}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Analyze
                    </>
                  ) : (
                    "Analyze"
                  )}
                </Button>
              </div>

              {analyzeError ? (
                <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {analyzeError}
                </p>
              ) : null}

              {hasAnalyzed ? (
                <div className="space-y-3 rounded-xl border border-border p-3">
                  {draft.missingFields.length > 0 ? (
                    <div className="space-y-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
                      <p className="text-sm font-medium text-amber-300">
                        Fehlende Pflichtfelder:
                      </p>
                      <ul className="space-y-1 text-sm text-amber-200">
                        {draft.missingFields.map((field) => (
                          <li key={field.field}>• {field.question}</li>
                        ))}
                      </ul>

                      <div className="space-y-2 pt-1">
                        <label htmlFor="ai-follow-up" className="text-xs font-medium text-amber-200">
                          Follow-up Antwort
                        </label>
                        <Textarea
                          id="ai-follow-up"
                          value={followUpText}
                          onChange={(event) => setFollowUpText(event.target.value)}
                          className="min-h-20 border-amber-500/30"
                          placeholder="Antwort auf die fehlenden Felder ..."
                        />
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => runAnalyze(true)}
                            disabled={isAnalyzing || followUpText.trim().length === 0}
                          >
                            {isAnalyzing ? (
                              <>
                                <Loader2 className="size-4 animate-spin" />
                                Analyze
                              </>
                            ) : (
                              "Analyze erneut"
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                      Pflichtfelder gefunden. Du kannst jetzt den Incident erstellen.
                    </p>
                  )}

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <label htmlFor="ai-title" className="text-sm font-medium">
                        Title
                      </label>
                      <input
                        id="ai-title"
                        value={draft.title}
                        maxLength={180}
                        onChange={(event) =>
                          setDraft((previousDraft) => ({
                            ...previousDraft,
                            title: event.target.value,
                          }))
                        }
                        className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="ai-severity" className="text-sm font-medium">
                        Severity
                      </label>
                      <select
                        id="ai-severity"
                        value={draft.severity}
                        onChange={(event) =>
                          setDraft((previousDraft) => ({
                            ...previousDraft,
                            severity: event.target.value as IncidentSeverity | "",
                          }))
                        }
                        className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring"
                      >
                        <option value="">Bitte waehlen</option>
                        <option value="low">low</option>
                        <option value="medium">medium</option>
                        <option value="high">high</option>
                        <option value="critical">critical</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="ai-started-at" className="text-sm font-medium">
                        Started At (optional)
                      </label>
                      <input
                        id="ai-started-at"
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        value={draft.startedAt}
                        onChange={(event) =>
                          setDraft((previousDraft) => ({
                            ...previousDraft,
                            startedAt: event.target.value,
                          }))
                        }
                        placeholder="TT.MM.JJJJ, HH:mm"
                        className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="ai-impact" className="text-sm font-medium">
                      Impact (optional)
                    </label>
                    <Textarea
                      id="ai-impact"
                      value={draft.impact}
                      onChange={(event) =>
                        setDraft((previousDraft) => ({
                          ...previousDraft,
                          impact: event.target.value,
                        }))
                      }
                      className="min-h-20"
                    />
                  </div>

                  {createError ? (
                    <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {createError}
                    </p>
                  ) : null}

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button type="button" variant="outline" onClick={closeSheet}>
                      Cancel
                    </Button>
                    <Button type="button" onClick={createIncident} disabled={!canCreateIncident || isCreating}>
                      {isCreating ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Incident"
                      )}
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
