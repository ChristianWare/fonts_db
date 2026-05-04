"use client";

import { useState } from "react";
import { questionnaireSections } from "@/lib/questionnaire.config";
import { saveQuestionnaire } from "@/actions/client/saveQuestionnaire";
import { useRouter } from "next/navigation";
import styles from "./QuestionnaireClient.module.css";

type Answers = Record<string, string | string[]>;

// Questions that should only show based on another answer
const conditionalRules: Record<
  string,
  { dependsOn: string; showWhen: string | string[] }
> = {
  service_types_other: {
    dependsOn: "service_types",
    showWhen: "Other",
  },
  operating_hours: {
    dependsOn: "operates_247",
    showWhen: "No, set hours",
  },
  current_website_url: {
    dependsOn: "current_website",
    showWhen: "Yes",
  },
  deposit_amount: {
    dependsOn: "deposit_required",
    showWhen: ["Yes — fixed deposit amount", "Yes — percentage of total fare"],
  },
  damage_fee_amount: {
    dependsOn: "damage_fee",
    showWhen: "Yes — fixed amount",
  },
  out_of_state_details: {
    dependsOn: "out_of_state",
    showWhen: "Yes",
  },
  physical_address: {
    dependsOn: "show_address",
    showWhen: "Yes — display full address",
  },
  partnership_names: {
    dependsOn: "partnerships",
    showWhen: [
      "Hotels",
      "Casinos",
      "Golf Resorts",
      "Wedding Venues",
      "Corporate Campuses",
      "Hospitals / Medical Centers",
      "Sports Venues",
      "Concert / Entertainment Venues",
      "Travel Agencies",
    ],
  },
};

function shouldShowQuestion(questionId: string, answers: Answers): boolean {
  const rule = conditionalRules[questionId];
  if (!rule) return true;

  const dependentAnswer = answers[rule.dependsOn];

  if (Array.isArray(rule.showWhen)) {
    if (Array.isArray(dependentAnswer)) {
      return rule.showWhen.some((v) =>
        (dependentAnswer as string[]).includes(v),
      );
    }
    return rule.showWhen.includes(dependentAnswer as string);
  }

  if (Array.isArray(dependentAnswer)) {
    return (dependentAnswer as string[]).includes(rule.showWhen as string);
  }

  return (dependentAnswer as string) === (rule.showWhen as string);
}

// Returns the label of the first unanswered required visible question, or null if all good
function validateSection(
  sectionIndex: number,
  answers: Answers,
): string | null {
  const section = questionnaireSections[sectionIndex];
  const visibleRequired = section.questions.filter(
    (q) => q.required && shouldShowQuestion(q.id, answers),
  );
  for (const q of visibleRequired) {
    const answer = answers[q.id];
    if (!answer || (Array.isArray(answer) && answer.length === 0)) {
      return `Please answer: ${q.label}`;
    }
  }
  return null;
}

export default function QuestionnaireClient({
  isSubmitted,
  isLocked,
  savedAnswers,
}: {
  isSubmitted: boolean;
  isLocked: boolean;
  savedAnswers: Answers;
}) {
  const router = useRouter();
  const [currentSection, setCurrentSection] = useState(0);
  const [answers, setAnswers] = useState<Answers>(savedAnswers);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(!isSubmitted);

  const totalSections = questionnaireSections.length;
  const section = questionnaireSections[currentSection];
  const isLast = currentSection === totalSections - 1;
  const progress = ((currentSection + 1) / totalSections) * 100;

  const handleText = (id: string, value: string) =>
    setAnswers((prev) => ({ ...prev, [id]: value }));

  const handleSelect = (id: string, value: string) =>
    setAnswers((prev) => ({ ...prev, [id]: value }));

  const handleRadio = (id: string, value: string) =>
    setAnswers((prev) => ({ ...prev, [id]: value }));

  const handleMultiselect = (id: string, value: string) => {
    setAnswers((prev) => {
      const current = (prev[id] as string[]) ?? [];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [id]: updated };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    await saveQuestionnaire(answers, false);
    setSaving(false);
  };

  const handleNext = async () => {
    const validationError = validateSection(currentSection, answers);
    if (validationError) {
      setError(validationError);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setError(null);
    setSaving(true);
    await saveQuestionnaire(answers, false);
    setSaving(false);
    setCurrentSection((prev) => Math.min(prev + 1, totalSections - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setError(null);
    setCurrentSection((prev) => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    const validationError = validateSection(currentSection, answers);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSubmitting(true);
    const result = await saveQuestionnaire(answers, true);

    if (result?.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    setIsEditing(false);
    setSubmitting(false);
    router.refresh();
  };

  const handleStartEdit = () => {
    setCurrentSection(0);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── READ-ONLY VIEW ────────────────────────────────────────────────
  if (isSubmitted && !isEditing) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <div>
              <h1 className={`${styles.heading} h2`}>Questionnaire</h1>
              <p className={styles.subheading}>
                {isLocked
                  ? "Your responses are locked while your site is in progress."
                  : "Your responses have been submitted. You can edit them until your site build begins."}
              </p>
            </div>
            {!isLocked && (
              <button onClick={handleStartEdit} className={styles.editBtn}>
                Edit responses
              </button>
            )}
          </div>
        </div>

        {isLocked && (
          <div className={styles.lockedBanner}>
            <svg
              width='16'
              height='16'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <rect x='3' y='11' width='18' height='11' rx='2' ry='2' />
              <path d='M7 11V7a5 5 0 0 1 10 0v4' />
            </svg>
            Your questionnaire is locked — your site build is underway. Contact
            support if you need to make a correction.
          </div>
        )}

        <div className={styles.readOnlyList}>
          {questionnaireSections.map((sec) => {
            const sectionAnswers = sec.questions.filter(
              (q) =>
                shouldShowQuestion(q.id, answers) &&
                answers[q.id] !== undefined &&
                answers[q.id] !== "",
            );
            if (sectionAnswers.length === 0) return null;

            return (
              <div key={sec.title} className={styles.readOnlySection}>
                <h2 className={styles.readOnlySectionTitle}>{sec.title}</h2>
                <div className={styles.readOnlyAnswers}>
                  {sectionAnswers.map((q) => {
                    const val = answers[q.id];
                    if (!val || (Array.isArray(val) && val.length === 0))
                      return null;
                    return (
                      <div key={q.id} className={styles.readOnlyRow}>
                        <span className={styles.readOnlyLabel}>{q.label}</span>
                        <span className={styles.readOnlyValue}>
                          {Array.isArray(val) ? val.join(", ") : val}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── EDIT / FILL FORM ─────────────────────────────────────────────
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h1 className={`${styles.heading} h2`}>
              {isSubmitted ? "Edit Questionnaire" : "Intake Questionnaire"}
            </h1>
            <p className={styles.subheading}>
              Section {currentSection + 1} of {totalSections} — {section.title}
            </p>
          </div>
          {isSubmitted && (
            <button
              onClick={() => setIsEditing(false)}
              className={styles.cancelEditBtn}
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Validation error — shown between progress bar and section */}
      {error && <div className={styles.errorBanner}>{error}</div>}

      {/* Section */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{section.title}</h2>
          {section.description && (
            <p className={styles.sectionDesc}>{section.description}</p>
          )}
        </div>

        <div className={styles.questions}>
          {section.questions.map((question) => {
            // Conditional visibility
            if (!shouldShowQuestion(question.id, answers)) return null;

            return (
              <div key={question.id} className={styles.question}>
                <label className={styles.questionLabel}>
                  {question.label}
                  {question.required && (
                    <span className={styles.required}>*</span>
                  )}
                </label>

                {question.helpText && (
                  <p className={styles.helpText}>{question.helpText}</p>
                )}

                {question.type === "text" && (
                  <input
                    type='text'
                    className={styles.input}
                    placeholder={question.placeholder}
                    value={(answers[question.id] as string) ?? ""}
                    onChange={(e) => handleText(question.id, e.target.value)}
                  />
                )}

                {question.type === "textarea" && (
                  <textarea
                    className={styles.textarea}
                    placeholder={question.placeholder}
                    value={(answers[question.id] as string) ?? ""}
                    onChange={(e) => handleText(question.id, e.target.value)}
                    rows={4}
                  />
                )}

                {question.type === "select" && (
                  <select
                    className={styles.select}
                    value={(answers[question.id] as string) ?? ""}
                    onChange={(e) => handleSelect(question.id, e.target.value)}
                  >
                    <option value=''>Select an option</option>
                    {question.options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                )}

                {question.type === "radio" && (
                  <div className={styles.radioGroup}>
                    {question.options?.map((opt) => (
                      <label key={opt} className={styles.radioLabel}>
                        <input
                          type='radio'
                          className={styles.radio}
                          name={question.id}
                          value={opt}
                          checked={(answers[question.id] as string) === opt}
                          onChange={() => handleRadio(question.id, opt)}
                        />
                        <span className={styles.radioText}>{opt}</span>
                      </label>
                    ))}
                  </div>
                )}

                {question.type === "multiselect" && (
                  <div className={styles.checkboxGroup}>
                    {question.options?.map((opt) => {
                      const selected = (
                        (answers[question.id] as string[]) ?? []
                      ).includes(opt);
                      return (
                        <label key={opt} className={styles.checkboxLabel}>
                          <input
                            type='checkbox'
                            className={styles.checkbox}
                            checked={selected}
                            onChange={() => handleMultiselect(question.id, opt)}
                          />
                          <span className={styles.checkboxText}>{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className={styles.navRow}>
        <div className={styles.navLeft}>
          {currentSection > 0 && (
            <button onClick={handleBack} className={styles.backBtn}>
              Back
            </button>
          )}
        </div>
        <div className={styles.navRight}>
          <button
            onClick={handleSave}
            className={styles.saveBtn}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save progress"}
          </button>
          {isLast ? (
            <button
              onClick={handleSubmit}
              className={styles.submitBtn}
              disabled={submitting}
            >
              {submitting
                ? "Submitting..."
                : isSubmitted
                  ? "Save changes"
                  : "Submit questionnaire"}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className={styles.nextBtn}
              disabled={saving}
            >
              Next section
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
