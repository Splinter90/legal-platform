import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { getIpFromHeaders, rateLimit } from "./rate-limit";
import { verifyTotp } from "./totp";

const ADMIN_INACTIVITY_MS = 60 * 60 * 1000;

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
      id: "admin-login",
      name: "Admin",
      credentials: {
        username: { label: "Usuario", type: "text" },
        password: { label: "Contraseña", type: "password" },
        totp: { label: "Codigo 2FA", type: "text" },
      },
      async authorize(credentials, req) {
        if (!credentials?.username || !credentials?.password) return null;

        const ip = getIpFromHeaders(req?.headers as Record<string, string | string[] | undefined> | undefined);
        const windowMs = 15 * 60 * 1000;

        const ipLimit = rateLimit({
          key: `admin-login:ip:${ip}`,
          limit: 10,
          windowMs,
        });
        if (!ipLimit.ok) throw new Error("RateLimitExceeded");

        const userLimit = rateLimit({
          key: `admin-login:user:${credentials.username.toLowerCase()}`,
          limit: 5,
          windowMs,
        });
        if (!userLimit.ok) throw new Error("RateLimitExceeded");

        const admin = await prisma.admin.findUnique({
          where: { username: credentials.username },
        });
        if (!admin) return null;
        const valid = await bcrypt.compare(credentials.password, admin.password);
        if (!valid) return null;

        if (admin.totpEnabled && admin.totpSecret) {
          if (!credentials.totp) throw new Error("TwoFactorRequired");
          if (!verifyTotp(admin.totpSecret, credentials.totp)) {
            throw new Error("TwoFactorInvalid");
          }
        }

        return {
          id: admin.id,
          name: admin.username,
          image: admin.image ?? null,
          role: "admin",
        } as any;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        const email = user.email!;
        const intent =
          (cookies().get("signin_intent")?.value as "lawyer" | "client" | undefined) ||
          "client";

        const googleProfile = profile as
          | { given_name?: string; family_name?: string; name?: string }
          | undefined;
        const fullName = googleProfile?.name || user.name || "";
        const firstName =
          googleProfile?.given_name || fullName.split(" ").slice(0, -1).join(" ") || fullName;
        const lastName =
          googleProfile?.family_name || fullName.split(" ").slice(-1).join(" ") || "";

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
          if (lawyer.status === "incomplete") {
            return "/register-lawyer/complete";
          }
          return true;
        }

        const existingClient = await prisma.client.findUnique({ where: { email } });

        if (intent === "lawyer") {
          if (existingClient) {
            return "/login?error=email_already_client";
          }
          const params = new URLSearchParams({
            email,
            firstName,
            lastName,
          });
          return `/register-lawyer?${params.toString()}`;
        }

        if (!existingClient) {
          await prisma.client.create({
            data: {
              email,
              name: user.name || "Cliente",
              image: user.image,
              googleId: account.providerAccountId,
            },
          });
        } else if (!existingClient.googleId) {
          await prisma.client.update({
            where: { email },
            data: { googleId: account.providerAccountId, image: user.image },
          });
        }
        return true;
      }
      return true;
    },
    async jwt({ token, user, account, trigger, session }) {
      if (user) {
        token.role = (user as any).role || "client";
        token.id = user.id;
        if ((user as any).lawyerStatus) {
          token.lawyerStatus = (user as any).lawyerStatus;
        }
        if (token.role === "admin") {
          token.lastActivity = Date.now();
          token.picture = (user as any).image ?? null;
        }
      }

      if (trigger === "update" && session && typeof session === "object") {
        const s = session as { name?: string; image?: string | null };
        if (typeof s.name === "string") token.name = s.name;
        if (s.image !== undefined) token.picture = s.image ?? null;
      }

      if (token.role === "admin") {
        const lastActivity = (token.lastActivity as number | undefined) ?? 0;
        const inactivityMs = ADMIN_INACTIVITY_MS;
        if (lastActivity && Date.now() - lastActivity > inactivityMs) {
          return {} as any;
        }
        token.lastActivity = Date.now();
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
            select: { status: true, firstName: true, lastName: true, profilePhoto: true },
          });
          if (lawyer) {
            token.lawyerStatus = lawyer.status;
            const fullName = `${lawyer.firstName} ${lawyer.lastName}`.trim();
            if (fullName) token.name = fullName;
            if (lawyer.profilePhoto !== undefined) token.picture = lawyer.profilePhoto;
          }
          token.lawyerStatusCheckedAt = Date.now();
        }
      }

      if (!user && !account && token.role === "admin" && token.id) {
        const lastCheck = (token.adminCheckedAt as number | undefined) ?? 0;
        const stale = Date.now() - lastCheck > 5 * 60 * 1000;
        if (stale) {
          const admin = await prisma.admin.findUnique({
            where: { id: token.id as string },
            select: { username: true, image: true },
          });
          if (!admin) {
            return {} as any;
          }
          if (admin.username) token.name = admin.username;
          token.picture = admin.image ?? null;
          token.adminCheckedAt = Date.now();
        }
      }

      // Soft-delete check + refresh de name/image para clientes. Corre solo en
      // token refresh (no en sign-in inicial, donde token.id es el de Google y
      // todavía no se mapeó al Client).
      if (!user && !account && token.role === "client" && token.id) {
        const lastCheck = (token.clientCheckedAt as number | undefined) ?? 0;
        const stale = Date.now() - lastCheck > 5 * 60 * 1000;
        if (stale) {
          const c = await prisma.client.findUnique({
            where: { id: token.id as string },
            select: { deletedAt: true, name: true, image: true },
          });
          if (!c || c.deletedAt) {
            return {} as any;
          }
          if (c.name) token.name = c.name;
          token.picture = c.image ?? null;
          token.clientCheckedAt = Date.now();
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
      if (!token || !token.id) {
        return { expires: new Date(0).toISOString() } as any;
      }
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
        (session.user as any).lawyerStatus = token.lawyerStatus;
        if (typeof token.name === "string") session.user.name = token.name;
        if (token.picture !== undefined) session.user.image = (token.picture as string | null) ?? null;
      }
      (session as any).accessToken = token.accessToken;
      (session as any).error = token.error;
      if (token.role === "admin") {
        (session as any).expires = new Date(
          ((token.lastActivity as number | undefined) ?? Date.now()) + ADMIN_INACTIVITY_MS
        ).toISOString();
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};
