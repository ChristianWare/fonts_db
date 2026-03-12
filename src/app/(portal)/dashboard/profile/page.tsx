import { auth } from "../../../../../auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { clientProfile: true },
  });

  if (!user?.clientProfile) redirect("/login");

  const profile = user.clientProfile;

  return (
    <ProfileClient
      name={user.name ?? ""}
      email={user.email ?? ""}
      phone={profile.phone ?? ""}
      businessName={profile.businessName}
      city={profile.city ?? ""}
      state={profile.state ?? ""}
      website={profile.website ?? ""}
      createdAt={profile.createdAt}
      onboardingStage={profile.onboardingStage}
    />
  );
}
