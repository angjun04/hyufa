import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "./prisma";
import { SUPERADMIN_ID } from "./adminConst";

export { SUPERADMIN_ID };

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username = String(credentials?.username ?? "").trim();
        const password = String(credentials?.password ?? "");
        if (!username || !password) return null;

        // 슈퍼어드민 (env 기반)
        const adminUsername = process.env.ADMIN_USERNAME;
        const adminHash = process.env.ADMIN_PASSWORD_HASH;
        if (adminUsername && adminHash && username === adminUsername) {
          const ok = await compare(password, adminHash);
          if (!ok) return null;
          return { id: SUPERADMIN_ID, name: adminUsername };
        }

        // 일반 회원
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) return null;

        const isValid = await compare(password, user.password);
        if (!isValid) return null;

        return { id: user.id, name: user.username };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
  },
});
