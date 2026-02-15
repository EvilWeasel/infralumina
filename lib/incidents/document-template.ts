import type { PartialBlock } from "@blocknote/core";

export const DOCUMENT_PLACEHOLDER = "Noch zu ergaenzen";

type IncidentDocumentTemplateInput = {
  title: string;
  userStatement: string;
  impact: string;
  timelineEvents: string[];
  investigationItems: string[];
  resolutionItems: string[];
  followUpItems: string[];
};

function normalizeText(value: string | null | undefined, maxLength = 6000) {
  const trimmedValue = (value ?? "").trim();

  if (!trimmedValue) {
    return DOCUMENT_PLACEHOLDER;
  }

  if (trimmedValue.length <= maxLength) {
    return trimmedValue;
  }

  return `${trimmedValue.slice(0, maxLength)}...`;
}

function normalizeList(
  values: string[] | null | undefined,
  maxItems = 8,
  maxItemLength = 700,
) {
  const uniqueValues = new Set<string>();

  for (const rawValue of values ?? []) {
    const normalizedValue = normalizeText(rawValue, maxItemLength);

    if (normalizedValue && normalizedValue !== DOCUMENT_PLACEHOLDER) {
      uniqueValues.add(normalizedValue);
    }
  }

  const normalizedList = Array.from(uniqueValues).slice(0, maxItems);

  if (normalizedList.length === 0) {
    return [DOCUMENT_PLACEHOLDER];
  }

  return normalizedList;
}

function listToBlocks(values: string[]) {
  return values.map((value) => ({
    type: "bulletListItem" as const,
    content: value,
  }));
}

export function formatTimelineDateTime(value: Date) {
  const day = value.getDate();
  const month = value.getMonth() + 1;
  const year = value.getFullYear();
  const hour = String(value.getHours()).padStart(2, "0");
  const minute = String(value.getMinutes()).padStart(2, "0");

  return `${day}.${month}.${year} ${hour}:${minute}`;
}

export function buildIncidentTemplateBlocks(
  input: IncidentDocumentTemplateInput,
): PartialBlock[] {
  return [
    {
      type: "heading",
      props: { level: 1 },
      content: "Title",
    },
    {
      type: "paragraph",
      content: normalizeText(input.title, 180),
    },
    {
      type: "paragraph",
      content: normalizeText(input.userStatement),
    },
    {
      type: "heading",
      props: { level: 2 },
      content: "Impact",
    },
    {
      type: "paragraph",
      content: normalizeText(input.impact),
    },
    {
      type: "heading",
      props: { level: 2 },
      content: "Timeline",
    },
    ...listToBlocks(normalizeList(input.timelineEvents)),
    {
      type: "heading",
      props: { level: 2 },
      content: "Investigation",
    },
    ...listToBlocks(normalizeList(input.investigationItems)),
    {
      type: "heading",
      props: { level: 2 },
      content: "Resolution",
    },
    ...listToBlocks(normalizeList(input.resolutionItems)),
    {
      type: "heading",
      props: { level: 2 },
      content: "Follow-ups",
    },
    ...listToBlocks(normalizeList(input.followUpItems)),
  ];
}
