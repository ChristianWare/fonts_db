"use server";

import { auth } from "../../../auth";
import { db } from "@/lib/db";
import { z } from "zod";

const UpdateProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  businessName: z.string().min(1, "Business name is required"),
  city: z.string().optional(),
  state: z.string().optional(),
  website: z.string().optional(),
});

export const updateProfile = async (
  values: z.infer<typeof UpdateProfileSchema>,
) => {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const validated = UpdateProfileSchema.safeParse(values);
  if (!validated.success) return { error: "Invalid fields" };

  const { name, phone, businessName, city, state, website } = validated.data;

  await db.user.update({
    where: { id: session.user.id },
    data: { name },
  });

  await db.clientProfile.update({
    where: { userId: session.user.id },
    data: {
      phone: phone || null,
      businessName,
      city: city || null,
      state: state || null,
      website: website || null,
    },
  });

  return { success: true };
};
