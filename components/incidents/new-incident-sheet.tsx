"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import { useFormStatus } from "react-dom";

import { createManualIncidentAction } from "@/app/dashboard/incidents/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Creating..." : "Create Incident"}
    </Button>
  );
}

export function NewIncidentSheet() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)} type="button">
        <Plus className="size-4" />
        New Incident
      </Button>

      {isOpen ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/50"
            aria-label="Sheet schliessen"
          />

          <aside className="absolute inset-y-0 right-0 z-10 w-full max-w-md border-l border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">New Incident</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pflichtfelder: Title und Severity.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Schliessen"
              >
                <X className="size-4" />
              </Button>
            </div>

            <form action={createManualIncidentAction} className="mt-6 space-y-4">
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">
                  Title
                </label>
                <input
                  id="title"
                  name="title"
                  required
                  maxLength={180}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring"
                  placeholder="Kurzer Incident-Titel"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="severity" className="text-sm font-medium">
                  Severity
                </label>
                <select
                  id="severity"
                  name="severity"
                  required
                  defaultValue="medium"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring"
                >
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                  <option value="critical">critical</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="impact" className="text-sm font-medium">
                  Impact (optional)
                </label>
                <Textarea
                  id="impact"
                  name="impact"
                  maxLength={1200}
                  placeholder="Kurze Beschreibung des Impacts"
                  className="min-h-24"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
                <SubmitButton />
              </div>
            </form>
          </aside>
        </div>
      ) : null}
    </>
  );
}
