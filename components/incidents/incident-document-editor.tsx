"use client";

import type { PartialBlock } from "@blocknote/core";
import { filterSuggestionItems } from "@blocknote/core/extensions";
import { de as coreDictionaryDe } from "@blocknote/core/locales";
import {
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
  useCreateBlockNote,
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import {
  aiDocumentFormats,
  AIExtension,
  AIMenuController,
  getAISlashMenuItems,
} from "@blocknote/xl-ai";
import { de as aiDictionaryDe } from "@blocknote/xl-ai/locales";
import { DefaultChatTransport } from "ai";
import { Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { saveIncidentDocumentAction } from "@/app/dashboard/incidents/[id]/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type IncidentDocumentEditorProps = {
  incidentId: string;
  initialContentJson: unknown;
  initialDocumentUpdatedAt: string | null;
  canWrite: boolean;
};

type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

const fallbackDocument: PartialBlock[] = [
  {
    type: "paragraph",
    content: "",
  },
];

function normalizeInitialContent(value: unknown): PartialBlock[] {
  if (!Array.isArray(value) || value.length === 0) {
    return fallbackDocument;
  }

  return value as PartialBlock[];
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function IncidentDocumentEditor(props: IncidentDocumentEditorProps) {
  if (typeof window === "undefined") {
    return (
      <div className="flex min-h-[260px] items-center justify-center text-sm text-muted-foreground">
        Editor wird geladen ...
      </div>
    );
  }

  return <IncidentDocumentEditorInner {...props} />;
}

function IncidentDocumentEditorInner({
  incidentId,
  initialContentJson,
  initialDocumentUpdatedAt,
  canWrite,
}: IncidentDocumentEditorProps) {
  const router = useRouter();
  const normalizedInitialContent = useMemo(
    () => normalizeInitialContent(initialContentJson),
    [initialContentJson],
  );
  const streamToolsProvider = useMemo(
    () =>
      aiDocumentFormats.html.getStreamToolsProvider({
        defaultStreamTools: {
          add: true,
          update: true,
          delete: true,
        },
      }),
    [],
  );
  const editorDictionary = useMemo(
    () => ({
      ...coreDictionaryDe,
      ai: aiDictionaryDe,
    }),
    [],
  );

  const editor = useCreateBlockNote(
    {
      initialContent: normalizedInitialContent,
      dictionary: editorDictionary,
      extensions: [
        AIExtension({
          transport: new DefaultChatTransport({
            api: "/api/ai/blocknote",
          }),
          streamToolsProvider,
        }),
      ],
    },
    [incidentId, editorDictionary, streamToolsProvider],
  );

  const { resolvedTheme } = useTheme();

  const initialSnapshot = useMemo(
    () => JSON.stringify(normalizedInitialContent),
    [normalizedInitialContent],
  );

  const lastSavedSnapshotRef = useRef(initialSnapshot);
  const currentSnapshotRef = useRef(initialSnapshot);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSavePromiseRef = useRef<Promise<boolean> | null>(null);
  const isAiRunningRef = useRef(false);

  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(initialDocumentUpdatedAt);
  const [isAiRunning, setIsAiRunning] = useState(false);

  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [pendingNavigationHref, setPendingNavigationHref] = useState<string | null>(null);
  const [isPreparingLeave, setIsPreparingLeave] = useState(false);
  const [isLeaveReady, setIsLeaveReady] = useState(false);
  const [leaveErrorMessage, setLeaveErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    isAiRunningRef.current = isAiRunning;
  }, [isAiRunning]);

  const saveSnapshot = useCallback(
    async (snapshot: string): Promise<boolean> => {
      if (!canWrite) {
        return true;
      }

      if (pendingSavePromiseRef.current) {
        return pendingSavePromiseRef.current;
      }

      const saveTask = (async () => {
        if (snapshot === lastSavedSnapshotRef.current) {
          setSaveState((previousState) => (previousState === "idle" ? previousState : "saved"));
          return true;
        }

        setSaveState("saving");

        try {
          const result = await saveIncidentDocumentAction({
            incidentId,
            contentJson: JSON.parse(snapshot),
          });

          if (result.status === "error") {
            throw new Error(result.message);
          }

          lastSavedSnapshotRef.current = snapshot;
          currentSnapshotRef.current = snapshot;
          if (result.updatedAt) {
            setLastSavedAt(result.updatedAt);
          }
          setSaveState("saved");
          return true;
        } catch {
          setSaveState("error");
          return false;
        }
      })();

      pendingSavePromiseRef.current = saveTask;
      const saveResult = await saveTask;
      pendingSavePromiseRef.current = null;
      return saveResult;
    },
    [canWrite, incidentId],
  );

  const prepareLeave = useCallback(async () => {
    setIsPreparingLeave(true);
    setLeaveErrorMessage(null);

    const didSaveSucceed = await saveSnapshot(currentSnapshotRef.current);

    setIsPreparingLeave(false);

    if (didSaveSucceed) {
      setIsLeaveReady(true);
      return;
    }

    setLeaveErrorMessage("Speichern fehlgeschlagen");
  }, [saveSnapshot]);

  useEffect(() => {
    lastSavedSnapshotRef.current = initialSnapshot;
    currentSnapshotRef.current = initialSnapshot;
    setSaveState("idle");
    setLastSavedAt(initialDocumentUpdatedAt);

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
  }, [initialSnapshot, incidentId, initialDocumentUpdatedAt]);

  useEffect(() => {
    if (!canWrite) {
      return;
    }

    const unsubscribe = editor.onChange(() => {
      const snapshot = JSON.stringify(editor.document);
      currentSnapshotRef.current = snapshot;

      if (isAiRunningRef.current) {
        setSaveState("dirty");
        return;
      }

      if (snapshot === lastSavedSnapshotRef.current) {
        setSaveState("saved");
        return;
      }

      setSaveState((previousState) => (previousState === "saving" ? previousState : "dirty"));

      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }

      autosaveTimerRef.current = setTimeout(() => {
        void saveSnapshot(currentSnapshotRef.current);
      }, 3000);
    });

    return () => {
      unsubscribe();
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
    };
  }, [canWrite, editor, saveSnapshot]);

  useEffect(() => {
    if (!canWrite) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (currentSnapshotRef.current === lastSavedSnapshotRef.current) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [canWrite]);

  useEffect(() => {
    if (!canWrite) {
      return;
    }

    const handleDocumentClick = (event: MouseEvent) => {
      if (currentSnapshotRef.current === lastSavedSnapshotRef.current) {
        return;
      }

      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const targetElement = event.target as HTMLElement | null;
      const anchorElement = targetElement?.closest("a[href]") as HTMLAnchorElement | null;

      if (!anchorElement) {
        return;
      }

      if (anchorElement.target && anchorElement.target !== "_self") {
        return;
      }

      const hrefAttribute = anchorElement.getAttribute("href");

      if (!hrefAttribute) {
        return;
      }

      const targetUrl = new URL(hrefAttribute, window.location.href);

      if (targetUrl.origin !== window.location.origin) {
        return;
      }

      const currentUrl = new URL(window.location.href);

      if (
        targetUrl.pathname === currentUrl.pathname &&
        targetUrl.search === currentUrl.search &&
        targetUrl.hash === currentUrl.hash
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      setPendingNavigationHref(`${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`);
      setIsLeaveReady(false);
      setLeaveErrorMessage(null);
      setLeaveDialogOpen(true);

      void prepareLeave();
    };

    document.addEventListener("click", handleDocumentClick, true);

    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, [canWrite, prepareLeave]);

  const headerStatus = (() => {
    if (saveState === "saving") {
      return (
        <span className="inline-flex items-center gap-1">
          <Loader2 className="size-3 animate-spin" />
          <span>Speichert</span>
        </span>
      );
    }

    if (saveState === "dirty") {
      return <span>Ungespeichert</span>;
    }

    if (saveState === "error") {
      return <span className="text-destructive">Speichern fehlgeschlagen</span>;
    }

    return <span>Letztes Dokument-Update: {formatDateTime(lastSavedAt)}</span>;
  })();

  const runAiImproveDocument = useCallback(async () => {
    if (!canWrite || isAiRunning) {
      return;
    }

    const ai = editor.getExtension(AIExtension);

    if (!ai) {
      return;
    }

    const firstRootBlock = editor.document[0];

    if (!firstRootBlock) {
      return;
    }

    ai.openAIMenuAtBlock(firstRootBlock.id);

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }

    setIsAiRunning(true);

    try {
      await ai.invokeAI({
        userPrompt:
          [
            "Ueberarbeite die Incident-Dokumentation als EIN konsistentes Dokument.",
            "Wichtig: Keine zweite, parallele Struktur einfuegen.",
            "Konsolidiere bestehende Inhalte, entferne Duplikate und ersetze Platzhaltertexte.",
            "Nutze nur vorhandene Fakten aus dem Dokument; fehlende Informationen als offene Punkte markieren.",
            "Bevorzugte Struktur: Summary, Impact, Timeline, Investigation, Mitigation/Resolution, Follow-ups.",
            "Metadaten (Titel, Severity, Startzeit, Impact) nur einmal und sinnvoll eingebettet darstellen.",
            "Den Eingangstext genau einmal als Quelle beibehalten.",
          ].join(" "),
        useSelection: false,
        streamToolsProvider,
      });
    } finally {
      setIsAiRunning(false);
    }
  }, [canWrite, editor, isAiRunning, streamToolsProvider]);

  return (
    <>
      <div className="flex h-full min-h-0 flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold">Dokumentation</h2>
          <div className="flex items-center gap-2">
            {canWrite ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void runAiImproveDocument()}
                disabled={isAiRunning}
              >
                {isAiRunning ? (
                  <>
                    <Loader2 className="size-3 animate-spin" />
                    <span>AI aktiv</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="size-3" />
                    <span>AI verbessern</span>
                  </>
                )}
              </Button>
            ) : null}
            <p className="text-xs text-muted-foreground">{headerStatus}</p>
          </div>
        </div>

        <div className="incident-editor-surface min-h-0 flex-1 overflow-auto rounded-lg border border-border/60 bg-card [&_.bn-container]:min-h-full [&_.bn-editor]:min-h-full">
          <BlockNoteView
            editor={editor}
            editable={canWrite}
            theme={resolvedTheme === "dark" ? "dark" : "light"}
            slashMenu={false}
            className="h-full"
          >
            <SuggestionMenuController
              triggerCharacter="/"
              getItems={async (query) =>
                filterSuggestionItems(
                  [...getDefaultReactSlashMenuItems(editor), ...getAISlashMenuItems(editor)],
                  query,
                )
              }
            />
            <AIMenuController />
          </BlockNoteView>
        </div>
      </div>

      <AlertDialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ungespeicherte Aenderungen</AlertDialogTitle>
            <AlertDialogDescription>
              {isPreparingLeave
                ? "Aenderungen werden gespeichert..."
                : isLeaveReady
                  ? "Aenderungen gespeichert. Du kannst jetzt die Seite verlassen."
                  : "Vor dem Verlassen muessen die Aenderungen gespeichert werden."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Bleiben</AlertDialogCancel>

            {!isLeaveReady ? (
              <Button
                type="button"
                onClick={() => void prepareLeave()}
                disabled={isPreparingLeave}
              >
                {isPreparingLeave ? (
                  <span className="inline-flex items-center gap-1">
                    <Loader2 className="size-3 animate-spin" />
                    <span>Speichern</span>
                  </span>
                ) : (
                  "Erneut speichern"
                )}
              </Button>
            ) : null}

            <AlertDialogAction
              disabled={!isLeaveReady || !pendingNavigationHref}
              onClick={() => {
                if (!pendingNavigationHref || !isLeaveReady) {
                  return;
                }

                router.push(pendingNavigationHref);
              }}
            >
              Seite verlassen
            </AlertDialogAction>
          </AlertDialogFooter>

          {leaveErrorMessage ? (
            <p className="px-4 pb-3 text-xs text-destructive">{leaveErrorMessage}</p>
          ) : null}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
