"use client";

import dynamic from "next/dynamic";

type IncidentDocumentEditorClientProps = {
  incidentId: string;
  initialContentJson: unknown;
  initialDocumentUpdatedAt: string | null;
  canWrite: boolean;
};

const IncidentDocumentEditorNoSsr = dynamic<IncidentDocumentEditorClientProps>(
  () =>
    import("@/components/incidents/incident-document-editor").then(
      (module) => module.IncidentDocumentEditor,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[260px] items-center justify-center text-sm text-muted-foreground">
        Editor wird geladen ...
      </div>
    ),
  },
);

export function IncidentDocumentEditorClient(props: IncidentDocumentEditorClientProps) {
  return <IncidentDocumentEditorNoSsr {...props} />;
}
