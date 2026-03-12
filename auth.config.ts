/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextAuthConfig } from "next-auth";

export type AppRole = "CLIENT" | "ADMIN";

const authConfig = {
  providers: [],
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/login",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = (user as any).id as string | undefined;

        const rolesFromUser = (user as any).roles as AppRole[] | undefined;

        token.roles =
          Array.isArray(rolesFromUser) && rolesFromUser.length > 0
            ? rolesFromUser
            : (["CLIENT"] as AppRole[]);

        token.emailVerified = (user as any).emailVerified ?? null;
      }

      return token;
    },

    async session({ session, token }) {
      (session.user as any) = {
        ...session.user,
        id: token.userId as string,
        userId: token.userId as string,
        roles: token.roles as AppRole[],
        emailVerified: (token.emailVerified as string | null) ?? null,
      };

      return session;
    },
  },
} satisfies NextAuthConfig;

export default authConfig;
