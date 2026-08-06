import { format } from "date-fns";
import type { Question, QuestionSection } from "@/lib/questionnaire.config";

export type QuestionnaireAnswers = Record<string, unknown>;

export type QuestionnaireMarkdownInput = {
  /** Business name — used in the title and the filename. */
  businessName: string;
  contactName?: string | null;
  contactEmail?: string | null;
  /** The resolved question set (custom or default) from resolveQuestionnaireSections(). */
  sections: QuestionSection[];
  /** Flat answers object keyed by question id. */
  answers: QuestionnaireAnswers | null;
  submittedAt?: Date | string | null;
  lastSavedAt?: Date | string | null;
  /** True when this client is on a custom question set rather than the default. */
  isCustomSet?: boolean;
  /** Overridable for tests. */
  exportedAt?: Date;
};

// ── Small helpers ───────────────────────────────────────────────────────────

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function fmtDateTime(d: Date): string {
  return format(d, "MMMM d, yyyy 'at' h:mm a");
}

/**
 * An answer counts as empty if it was never given, was cleared, or is an
 * empty multiselect. Mirrors the filter used in the admin responses view.
 */
function isEmptyAnswer(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) {
    return value.filter((v) => String(v ?? "").trim() !== "").length === 0;
  }
  return false;
}

function normalizeText(value: string): string {
  return value.replace(/\r\n/g, "\n").trim();
}

/**
 * Renders one question + answer pair.
 *
 * - Empty              → `**Label:** _Not answered_`
 * - Arrays             → label, then a bullet per selection
 * - Multi-line strings → label, then the text verbatim in its own block
 * - Everything else    → `**Label:** value` on one line
 */
function renderAnswer(
  label: string,
  value: unknown,
  required: boolean,
): string {
  const heading = `**${label}**`;

  if (isEmptyAnswer(value)) {
    return `${heading} ${required ? "_Not answered — required_" : "_Not answered_"}`;
  }

  if (Array.isArray(value)) {
    const items = value
      .map((v) => normalizeText(String(v ?? "")))
      .filter((v) => v !== "");
    return `${heading}\n\n${items.map((v) => `- ${v}`).join("\n")}`;
  }

  if (typeof value === "object") {
    // Defensive — answers is a Json column, so a nested object is possible.
    return `${heading}\n\n\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\``;
  }

  const text = normalizeText(String(value));
  if (text.includes("\n")) {
    return `${heading}\n\n${text}`;
  }
  return `${heading} ${text}`;
}

/** `Elite Black Car Service` → `elite-black-car-service-questionnaire-2026-08-05.md` */
export function questionnaireMarkdownFileName(
  businessName: string,
  date: Date = new Date(),
): string {
  const slug = businessName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${slug || "client"}-questionnaire-${format(date, "yyyy-MM-dd")}.md`;
}

// ── The serializer ──────────────────────────────────────────────────────────

export function buildQuestionnaireMarkdown({
  businessName,
  contactName,
  contactEmail,
  sections,
  answers,
  submittedAt,
  lastSavedAt,
  isCustomSet = false,
  exportedAt = new Date(),
}: QuestionnaireMarkdownInput): string {
  const a: QuestionnaireAnswers = answers ?? {};
  const submitted = toDate(submittedAt);
  const lastSaved = toDate(lastSavedAt);

  const allQuestions: Question[] = sections.flatMap((s) => s.questions);
  const totalCount = allQuestions.length;
  const answeredCount = allQuestions.filter(
    (q) => !isEmptyAnswer(a[q.id]),
  ).length;
  const sectionCount = sections.length;

  const lines: string[] = [];

  // ── Header ────────────────────────────────────────────────────────────────
  lines.push(`# ${businessName} — Intake Questionnaire`);
  lines.push("");

  const contact = [contactName, contactEmail].filter(Boolean).join(" · ");
  if (contact) lines.push(`- **Contact:** ${contact}`);

  if (submitted) {
    lines.push(`- **Status:** Submitted ${fmtDateTime(submitted)}`);
  } else {
    lines.push(
      `- **Status:** Draft — not submitted${
        lastSaved ? ` (last saved ${fmtDateTime(lastSaved)})` : ""
      }`,
    );
  }

  lines.push(
    `- **Question set:** ${
      isCustomSet ? "Custom" : "Default black car set"
    } — ${sectionCount} section${sectionCount === 1 ? "" : "s"}, ${totalCount} question${totalCount === 1 ? "" : "s"}`,
  );
  lines.push(`- **Answered:** ${answeredCount} of ${totalCount}`);
  lines.push(`- **Exported:** ${fmtDateTime(exportedAt)}`);
  lines.push("");
  lines.push("---");
  lines.push("");

  // ── Sections ──────────────────────────────────────────────────────────────
  for (const section of sections) {
    lines.push(`## ${section.title}`);
    lines.push("");

    if (section.description) {
      lines.push(`_${normalizeText(section.description)}_`);
      lines.push("");
    }

    for (const q of section.questions) {
      lines.push(renderAnswer(q.label, a[q.id], q.required));
      lines.push("");
    }
  }

  // ── Answers to questions no longer in this client's set ───────────────────
  const knownIds = new Set(allQuestions.map((q) => q.id));
  const orphaned = Object.entries(a).filter(
    ([id, value]) => !knownIds.has(id) && !isEmptyAnswer(value),
  );

  if (orphaned.length > 0) {
    lines.push("## Other Answers");
    lines.push("");
    lines.push(
      "_Answers to questions that are no longer part of this client's questionnaire._",
    );
    lines.push("");
    for (const [id, value] of orphaned) {
      lines.push(renderAnswer(id, value, false));
      lines.push("");
    }
  }

  // Collapse any run of blank lines down to one, and end with a single newline.
  return (
    lines
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trimEnd() + "\n"
  );
}
