import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

async function refreshAccessToken(token: any) {
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
    });

    const refreshed = await response.json();

    if (!response.ok) throw refreshed;

    return {
      ...token,
      accessToken: refreshed.access_token,
      accessTokenExpires: Date.now() + refreshed.expires_in * 1000,
      refreshToken: refreshed.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    console.error("Error refreshing access token:", error);
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            authorization: {
              params: {
                scope: "openid email profile https://www.googleapis.com/auth/calendar",
                access_type: "offline",
                prompt: "consent",
              },
            },
          }),
        ]
      : []),
    CredentialsProvider({
      id: "client-login",
      name: "Cliente",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const client = await prisma.client.findUnique({
          where: { email: credentials.email },
        });
        if (!client || !client.password) return null;
        const valid = await bcrypt.compare(credentials.password, client.password);
        if (!valid) return null;
        return {
          id: client.id,
          name: client.name,
          email: client.email,
          image: client.image,
          role: "client",
        } as any;
      },
    }),
    CredentialsProvider({
      id: "admin-login",
      name: "Admin",
      credentials: {
        username: { label: "Usuario", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;
        const admin = await prisma.admin.findUnique({
          where: { username: credentials.username },
        });
        if (!admin) return null;
        const valid = await bcrypt.compare(credentials.password, admin.password);
        if (!valid) return null;
        return { id: admin.id, name: admin.username, role: "admin" } as any;
      },
    }),
    CredentialsProvider({
      id: "lawyer-login",
      name: "Abogado",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const lawyer = await prisma.lawyer.findUnique({
          where: { email: credentials.email },
        });
        if (!lawyer || !lawyer.password) return null;
        const valid = await bcrypt.compare(credentials.password, lawyer.password);
        if (!valid) return null;
        return {
          id: lawyer.id,
          name: `${lawyer.firstName} ${lawyer.lastName}`,
          email: lawyer.email,
          role: "lawyer",
          lawyerStatus: lawyer.status,
        } as any;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const email = user.email!;

        const lawyer = await prisma.lawyer.findUnique({ where: { email } });
        if (lawyer) {
          const updateData: any = {};
          if (account.refresh_token) {
            updateData.googleRefreshToken = account.refresh_token;
          }
          if (!lawyer.googleId) {
            updateData.googleId = account.providerAccountId;
          }
          if (Object.keys(updateData).length > 0) {
            await prisma.lawyer.update({ where: { email }, data: updateData });
          }
          if (lawyer.status !== "approved") {
            return `/login?error=lawyer_${lawyer.status}`;
          }
          return true;
        }

        const existing = await prisma.client.findUnique({ where: { email } });
        if (!existing) {
          await prisma.client.create({
            data: {
              email,
              name: user.name || "Cliente",
              image: user.image,
              googleId: account.providerAccountId,
            },
          });
        } else if (!existing.googleId) {
          await prisma.client.update({
            where: { email },
            data: { googleId: account.providerAccountId, image: user.image },
          });
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.role = (user as any).role || "client";
        token.id = user.id;
        if ((user as any).lawyerStatus) {
          token.lawyerStatus = (user as any).lawyerStatus;
        }
      }

      if (account?.provider === "google") {
        const email = token.email!;
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.accessTokenExpires = account.expires_at
          ? account.expires_at * 1000
          : Date.now() + 3600 * 1000;

        const lawyer = await prisma.lawyer.findUnique({ where: { email } });
        if (lawyer) {
          token.role = "lawyer";
          token.id = lawyer.id;
          token.lawyerStatus = lawyer.status;
          return token;
        }

        token.role = "client";
        const client = await prisma.client.findUnique({ where: { email } });
        if (client) token.id = client.id;

        return token;
      }

      if (token.role === "lawyer" && token.id) {
        const lastCheck = (token.lawyerStatusCheckedAt as number | undefined) ?? 0;
        const stale = Date.now() - lastCheck > 5 * 60 * 1000;
        if (stale) {
          const lawyer = await prisma.lawyer.findUnique({
            where: { id: token.id as string },
            select: { status: true },
          });
          if (lawyer) token.lawyerStatus = lawyer.status;
          token.lawyerStatusCheckedAt = Date.now();
        }
      }

      if (token.accessTokenExpires && Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      if (token.refreshToken) {
        return refreshAccessToken(token);
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
        (session.user as any).lawyerStatus = token.lawyerStatus;
      }
      (session as any).accessToken = token.accessToken;
      (session as any).error = token.error;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};
