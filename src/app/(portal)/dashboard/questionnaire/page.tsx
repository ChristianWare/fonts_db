import { getClientProfile } from "@/actions/client/getClientProfile";
import { redirect } from "next/navigation";
import QuestionnaireClient from "./QuestionnaireClient";

export default async function QuestionnairePage() {
  const profile = await getClientProfile();

  if (!profile) redirect("/login");

  const isSubmitted = !!profile.questionnaire?.submittedAt;
  const savedAnswers =
    (profile.questionnaire?.answers as Record<string, string | string[]>) ?? {};

  return (
    <QuestionnaireClient
      isSubmitted={isSubmitted}
      isLocked={false}
      savedAnswers={savedAnswers}
    />
  );
}
