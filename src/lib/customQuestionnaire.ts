import { z } from "zod";
import {
  questionnaireSections,
  type QuestionSection,
} from "@/lib/questionnaire.config";

const OPTION_TYPES = ["select", "multiselect", "radio"] as const;

const questionSchema = z
  .object({
    id: z
      .string()
      .min(1)
      .max(64)
      .regex(
        /^[a-z0-9_]+$/,
        "Question ids must be lowercase letters, numbers, and underscores only",
      ),
    label: z.string().min(1, "Every question needs a label"),
    type: z.enum(["text", "textarea", "select", "multiselect", "radio"]),
    placeholder: z.string().optional(),
    options: z.array(z.string().min(1)).optional(),
    required: z.boolean(),
    helpText: z.string().optional(),
  })
  .refine(
    (q) =>
      !OPTION_TYPES.includes(q.type as (typeof OPTION_TYPES)[number]) ||
      (q.options && q.options.length >= 2),
    {
      message: "select / multiselect / radio questions need at least 2 options",
    },
  );

const sectionSchema = z.object({
  title: z.string().min(1, "Every section needs a title"),
  description: z.string().optional(),
  questions: z.array(questionSchema).min(1, "Sections can't be empty"),
});

export const customQuestionnaireSchema = z
  .array(sectionSchema)
  .min(1, "The questionnaire needs at least one section");

/**
 * Strict parse for admin uploads. Returns typed sections or a single
 * human-readable error message.
 */
export function parseCustomQuestionnaire(
  input: unknown,
): { sections: QuestionSection[] } | { error: string } {
  const result = customQuestionnaireSchema.safeParse(input);
  if (!result.success) {
    const first = result.error.issues[0];
    const path = first.path.length ? ` (at ${first.path.join(" → ")})` : "";
    return { error: `${first.message}${path}` };
  }

  // Ids must be unique across the WHOLE questionnaire — answers are stored
  // as one flat JSON object keyed by question id.
  const seen = new Set<string>();
  for (const section of result.data) {
    for (const q of section.questions) {
      if (seen.has(q.id)) {
        return { error: `Duplicate question id: "${q.id}"` };
      }
      seen.add(q.id);
    }
  }

  return { sections: result.data as QuestionSection[] };
}

/**
 * Read-time resolver: the question set a given client should see.
 * Falls back to the default black-car questionnaire when nothing custom is
 * set, or if the stored value somehow fails to parse.
 */
export function resolveQuestionnaireSections(
  custom: unknown,
): QuestionSection[] {
  if (!custom) return questionnaireSections;
  const parsed = parseCustomQuestionnaire(custom);
  return "sections" in parsed ? parsed.sections : questionnaireSections;
}
