import { getClientProfile } from "@/actions/client/getClientProfile";
import { resolveQuestionnaireSections } from "@/lib/customQuestionnaire";
import { QUESTIONNAIRE_LOCKED_STAGES } from "@/lib/questionnaire.config";
import { redirect } from "next/navigation";
import QuestionnaireClient from "./QuestionnaireClient";

export default async function QuestionnairePage() {
  const profile = await getClientProfile();

  if (!profile) redirect("/login");

  const isSubmitted = !!profile.questionnaire?.submittedAt;
  const isLocked = QUESTIONNAIRE_LOCKED_STAGES.includes(
    profile.onboardingStage,
  );
  const savedAnswers =
    (profile.questionnaire?.answers as Record<string, string | string[]>) ?? {};

  const sections = resolveQuestionnaireSections(
    (profile as { customQuestionnaire?: unknown }).customQuestionnaire,
  );

  return (
    <QuestionnaireClient
      isSubmitted={isSubmitted}
      isLocked={isLocked}
      savedAnswers={savedAnswers}
      sections={sections}
    />
  );
}
