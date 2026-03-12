import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email({ message: "Valid email required" }),
  password: z.string().min(1, { message: "Password required" }),
});

export type LoginSchemaType = z.infer<typeof LoginSchema>;
