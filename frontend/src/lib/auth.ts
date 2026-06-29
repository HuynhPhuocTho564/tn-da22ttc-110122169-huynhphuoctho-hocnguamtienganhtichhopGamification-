import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import crypto from "node:crypto"
import { authConfig } from "./auth.config"
import { getGoogleOAuthConfig } from "./auth-providers"

const googleOAuthConfig = getGoogleOAuthConfig();

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function buildUsernameFromEmail(email: string) {
  const baseName = email.split("@")[0]?.replace(/[^a-zA-Z0-9_-]/g, "_") || "google_user";
  return baseName.slice(0, 24) || "google_user";
}

async function getUniqueUsername(email: string, preferredName?: string | null) {
  const preferred = preferredName?.trim().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "");
  const baseName = (preferred || buildUsernameFromEmail(email)).slice(0, 24) || "google_user";
  let candidate = baseName;
  let suffix = 1;

  while (await prisma.user.findUnique({ where: { username: candidate }, select: { id: true } })) {
    const suffixText = `_${suffix}`;
    candidate = `${baseName.slice(0, Math.max(1, 30 - suffixText.length))}${suffixText}`;
    suffix += 1;
  }

  return candidate;
}

async function findOrCreateOAuthUser(email: string, name?: string | null, image?: string | null) {
  const normalizedEmail = normalizeEmail(email);
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: { role: true },
  });

  if (existingUser) {
    if (image && existingUser.avatarUrl !== image) {
      return prisma.user.update({
        where: { id: existingUser.id },
        data: { avatarUrl: image },
        include: { role: true },
      });
    }

    return existingUser;
  }

  const defaultRole = await prisma.role.upsert({
    where: { name: "User" },
    update: {},
    create: { name: "User" },
  });

  const username = await getUniqueUsername(normalizedEmail, name);
  const passwordHash = await bcrypt.hash(`google-oauth:${crypto.randomUUID()}`, 10);

  return prisma.user.create({
    data: {
      username,
      email: normalizedEmail,
      avatarUrl: image || null,
      passwordHash,
      roleId: defaultRole.id,
    },
    include: { role: true },
  });
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    ...(googleOAuthConfig
      ? [
          Google({
            clientId: googleOAuthConfig.clientId,
            clientSecret: googleOAuthConfig.clientSecret,
          }),
        ]
      : []),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = normalizeEmail(credentials.email as string);
        const user = await prisma.user.findUnique({
          where: { email },
          include: { role: true }
        });

        if (!user) return null;

        const isPasswordValid = await bcrypt.compare(credentials.password as string, user.passwordHash);

        if (!isPasswordValid) return null;

        return {
          id: user.id,
          name: user.username,
          email: user.email,
          role: user.role.name
        };
      }
    })
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ account, profile }) {
      if (account?.provider === "google") {
        return Boolean(profile?.email && profile.email_verified !== false);
      }

      return true;
    },
    async jwt(params) {
      const { token, user, account, profile } = params;

      if (account?.provider === "google") {
        const email = profile?.email || user?.email;

        if (email) {
          const dbUser = await findOrCreateOAuthUser(email, profile?.name || user?.name, profile?.picture || user?.image);
          token.id = dbUser.id;
          token.role = dbUser.role.name;
          token.name = dbUser.username;
          token.email = dbUser.email;
          token.picture = dbUser.avatarUrl;
          return token;
        }
      }

      if (authConfig.callbacks?.jwt) {
        return authConfig.callbacks.jwt(params);
      }

      return token;
    },
    async session(params) {
      const session = await authConfig.callbacks!.session!(params);

      if (!session.user.id) {
        return session;
      }

      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          role: { select: { name: true } },
        },
      });

      session.user.role = dbUser?.role.name;
      return session;
    },
  },
});
