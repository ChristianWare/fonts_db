/* eslint-disable @typescript-eslint/no-explicit-any */
import NextAuth, { type DefaultSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcryptjs from "bcryptjs";

import authConfig, { type AppRole } from "./auth.config";
import { db } from "@/lib/db";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      userId?: string;
      roles?: AppRole[];
      emailVerified?: Date | null;
    } & DefaultSession["user"];
  }

  interface JWT {
    userId?: string;
    roles?: AppRole[];
    emailVerified?: Date | null;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),

  providers: [
    Credentials({
      name: "Credentials",
      authorize: async (credentials) => {
        const { email, password } = credentials as {
          email: string;
          password: string;
        };

        if (!email || !password) return null;

        const user = await db.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) return null;

        const isValid = await bcryptjs.compare(password, user.password);
        return isValid ? user : null;
      },
    }),
  ],

  events: {
    async linkAccount({ user }) {
      await db.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    },
  },

  callbacks: {
    async jwt({ token }) {
      const userId = token.sub;

      const user = userId
        ? await db.user.findUnique({
            where: { id: userId },
            select: { id: true, roles: true, emailVerified: true },
          })
        : token.email
          ? await db.user.findUnique({
              where: { email: token.email },
              select: { id: true, roles: true, emailVerified: true },
            })
          : null;

      if (!user) return token;

      const roles =
        Array.isArray(user.roles) && user.roles.length > 0
          ? (user.roles as unknown as AppRole[])
          : (["CLIENT"] as AppRole[]);

      token.userId = user.id;
      token.roles = roles;
      token.emailVerified = user.emailVerified ?? null;

      return token;
    },

    async session({ session, token }: { session: any; token: any }) {
      if (token.userId) {
        session.user.id = token.userId;
        session.user.userId = token.userId;
      }
      if (token.roles) session.user.roles = token.roles as AppRole[];
      if ("emailVerified" in token) {
        session.user.emailVerified = (token.emailVerified as Date) ?? null;
      }
      return session;
    },
  },

  pages: { signIn: "/login" },
});
