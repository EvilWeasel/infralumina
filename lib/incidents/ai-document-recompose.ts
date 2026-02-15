import type { PartialBlock } from "@blocknote/core";
import { generateText } from "ai";

import { getDefaultAiModel } from "@/lib/ai/provider";
import {
  buildIncidentTemplateBlocks,
  DOCUMENT_PLACEHOLDER,
  formatTimelineDateTime,
} from "@/lib/incidents/document-template";

type RecomposeIncidentDocumentInput = {
  incidentTitle: string;
  incidentSeverity: "low" | "medium" | "high" | "critical";
  incidentImpact: string | null;
  incidentStartedAt: Date | null;
  sourceText: string;
};

type SectionKey =
  | "title"
  | "impact"
  | "timeline"
  | "investigation"
  | "resolution"
  | "followUps";

function clipSourceText(sourceText: string, maxLength = 9000) {
  const normalizedText = sourceText.trim();

  if (normalizedText.length <= maxLength) {
    return normalizedText;
  }

  return `${normalizedText.slice(0, maxLength)}\n\n[gekuerzt]`;
}

function getFirstContentLine(sourceText: string) {
  const lines = sourceText.split("\n");
  const ignoredLinePatterns = [
    /^incident intake/i,
    /^summary$/i,
    /^title\b/i,
    /^titel$/i,
    /^betreff:/i,
    /^impact$/i,
    /^timeline$/i,
    /^investigation$/i,
    /^mitigation\/resolution$/i,
    /^resolution$/i,
    /^follow-ups?$/i,
    /^titel:\s*/i,
    /^severity:\s*/i,
    /^startzeit:\s*/i,
    /^impact:\s*/i,
  ];

  for (const rawLine of lines) {
    const line = rawLine
      .replace(/^#{1,6}\s+/, "")
      .replace(/^[-*]\s+/, "")
      .replace(/^\d+\.\s+/, "")
      .trim();

    if (ignoredLinePatterns.some((pattern) => pattern.test(line))) {
      continue;
    }

    if (line.length >= 12) {
      return line;
    }
  }

  return DOCUMENT_PLACEHOLDER;
}

function mapHeadingToSection(heading: string): SectionKey | null {
  const normalizedHeading = heading.trim().toLowerCase();

  if (
    normalizedHeading === "title" ||
    normalizedHeading === "titel" ||
    normalizedHeading.startsWith("title ") ||
    normalizedHeading.startsWith("titel ")
  ) {
    return "title";
  }

  if (
    normalizedHeading === "impact" ||
    normalizedHeading === "auswirkungen" ||
    normalizedHeading.startsWith("impact ")
  ) {
    return "impact";
  }

  if (
    normalizedHeading === "timeline" ||
    normalizedHeading === "zeitachse" ||
    normalizedHeading.startsWith("timeline ")
  ) {
    return "timeline";
  }

  if (
    normalizedHeading === "investigation" ||
    normalizedHeading === "analyse" ||
    normalizedHeading.startsWith("investigation ")
  ) {
    return "investigation";
  }

  if (
    normalizedHeading === "resolution" ||
    normalizedHeading === "mitigation" ||
    normalizedHeading === "mitigation/resolution"
  ) {
    return "resolution";
  }

  if (
    normalizedHeading === "follow-ups" ||
    normalizedHeading === "follow ups" ||
    normalizedHeading === "next steps" ||
    normalizedHeading.startsWith("follow-ups") ||
    normalizedHeading.startsWith("follow ups")
  ) {
    return "followUps";
  }

  return null;
}

function parseSections(rawText: string) {
  const sections: Record<SectionKey, string[]> = {
    title: [],
    impact: [],
    timeline: [],
    investigation: [],
    resolution: [],
    followUps: [],
  };

  const lines = rawText.split("\n");
  let activeSection: SectionKey | null = null;

  for (const line of lines) {
    const headingMatch = line.match(/^\s*#{1,6}\s+(.+?)\s*$/);

    if (headingMatch) {
      activeSection = mapHeadingToSection(headingMatch[1]);
      continue;
    }

    if (!activeSection) {
      continue;
    }

    sections[activeSection].push(line);
  }

  return sections;
}

function normalizeTextLines(lines: string[]) {
  return lines
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join(" ");
}

function normalizeListLines(lines: string[]) {
  const values = lines
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => line.replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, "").trim())
    .filter((line) => line.length > 0);

  return Array.from(new Set(values)).slice(0, 10);
}

function isPlaceholderList(values: string[]) {
  if (values.length === 0) {
    return true;
  }

  return values.every((value) => /noch zu ergaenzen|unbekannt/i.test(value));
}

function buildSystemPrompt() {
  return [
    "Du restrukturierst Incident-Dokumente in ein festes Zieltemplate.",
    "Gib nur reinen Text im Markdown-Template aus (kein JSON, kein Codeblock).",
    "Nutze exakt diese Headings:",
    "# Title",
    "# Impact",
    "# Timeline",
    "# Investigation",
    "# Resolution",
    "# Follow-ups",
    "Timeline, Investigation, Resolution und Follow-ups als Listenpunkte.",
    "Erfinde keine Fakten; fehlende Informationen als 'Noch zu ergaenzen' markieren.",
  ].join("\n");
}

function buildPrompt(input: RecomposeIncidentDocumentInput) {
  const incidentStartedAt = input.incidentStartedAt
    ? formatTimelineDateTime(input.incidentStartedAt)
    : "nicht bekannt";

  return [
    `Incident title: ${input.incidentTitle}`,
    `Incident severity: ${input.incidentSeverity}`,
    `Incident impact meta: ${input.incidentImpact ?? "nicht gesetzt"}`,
    `Incident started_at: ${incidentStartedAt}`,
    "",
    "Aktueller Dokumentinhalt:",
    clipSourceText(input.sourceText),
  ].join("\n");
}

export async function recomposeIncidentDocument(
  input: RecomposeIncidentDocumentInput,
): Promise<PartialBlock[]> {
  const { text } = await generateText({
    model: getDefaultAiModel(),
    temperature: 0,
    maxRetries: 2,
    system: buildSystemPrompt(),
    prompt: buildPrompt(input),
  });

  const parsedSections = parseSections(text);
  const sourceSections = parseSections(input.sourceText);
  const hasParsedContent = Object.values(parsedSections).some((lines) => lines.length > 0);

  if (!hasParsedContent) {
    parsedSections.investigation = text.split("\n");
  }

  const titleSection = normalizeTextLines(parsedSections.title);
  const impactSection = normalizeTextLines(parsedSections.impact);
  const timelineSection = normalizeListLines(parsedSections.timeline);
  let investigationSection = normalizeListLines(parsedSections.investigation);
  let resolutionSection = normalizeListLines(parsedSections.resolution);
  let followUpsSection = normalizeListLines(parsedSections.followUps);

  // Fallback for weaker local models: if AI returns placeholders only,
  // re-use meaningful appended notes from source document sections.
  const sourceFollowUpCandidates = normalizeListLines(sourceSections.followUps).filter(
    (value) => !/noch zu ergaenzen|unbekannt/i.test(value),
  );

  if (isPlaceholderList(investigationSection) && sourceFollowUpCandidates[0]) {
    investigationSection = [sourceFollowUpCandidates[0]];
  }

  if (isPlaceholderList(resolutionSection) && sourceFollowUpCandidates[1]) {
    resolutionSection = [sourceFollowUpCandidates[1]];
  }

  if (isPlaceholderList(followUpsSection) && sourceFollowUpCandidates.length > 2) {
    followUpsSection = sourceFollowUpCandidates.slice(2);
  }

  const timelineEvents = [...timelineSection];

  if (timelineEvents.length === 0 && input.incidentStartedAt) {
    timelineEvents.push(
      `${formatTimelineDateTime(input.incidentStartedAt)} - Incident gestartet`,
    );
  }

  return buildIncidentTemplateBlocks({
    title: titleSection || input.incidentTitle,
    userStatement: getFirstContentLine(input.sourceText),
    impact: impactSection || input.incidentImpact || DOCUMENT_PLACEHOLDER,
    timelineEvents,
    investigationItems: investigationSection,
    resolutionItems: resolutionSection,
    followUpItems: followUpsSection,
  });
}
